/**
 * LongitudinalAnalysis
 *
 * Análisis clínico longitudinal del paciente para el terapeuta.
 * Muestra:
 *   1. Gráfica de evolución de scores por test a lo largo del tiempo
 *   2. Tabla de resumen semanal de check-ins (mood) + riesgo
 *   3. Indicadores de cambio clínicamente significativo
 *
 * Props:
 *   patientId   — UUID del paciente
 *   therapistId — UUID del terapeuta
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { TrendingDown, TrendingUp, Minus, AlertTriangle, ChevronDown, ChevronUp, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'

// Paleta de colores para hasta 6 tests distintos
const LINE_COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

// Umbrales de referencia conocidos
const REFERENCE_LINES = {
  'PHQ-9':  [{ y: 10, label: 'Depresión moderada', color: '#f59e0b' }, { y: 20, label: 'Depresión grave', color: '#ef4444' }],
  'GAD-7':  [{ y: 10, label: 'Ansiedad moderada',  color: '#f59e0b' }, { y: 15, label: 'Ansiedad grave',  color: '#ef4444' }],
  'PCL-5':  [{ y: 33, label: 'PTSD probable',      color: '#ef4444' }],
  'AUDIT':  [{ y: 8,  label: 'Riesgo alcohol',     color: '#f59e0b' }, { y: 15, label: 'Dependencia',    color: '#ef4444' }],
  'PHQ-15': [{ y: 10, label: 'Moderado',            color: '#f59e0b' }],
  'ISI':    [{ y: 15, label: 'Insomnio moderado',   color: '#f59e0b' }],
}

// Etiqueta de severidad → color
const SEVERITY_COLOR = {
  minimal:  'text-emerald-600 bg-emerald-50',
  mild:     'text-amber-600 bg-amber-50',
  moderate: 'text-orange-600 bg-orange-50',
  severe:   'text-red-600 bg-red-50',
  low:      'text-emerald-600 bg-emerald-50',
  medium:   'text-amber-600 bg-amber-50',
  high:     'text-red-600 bg-red-50',
}

function TrendIcon({ delta }) {
  if (delta === null || delta === undefined) return <Minus size={14} className="text-slate-400" />
  if (delta < -2)  return <TrendingDown size={14} className="text-emerald-500" />
  if (delta > 2)   return <TrendingUp   size={14} className="text-red-500" />
  return <Minus size={14} className="text-slate-400" />
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-warm-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-warm-800 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-warm-600">{p.name}:</span>
          <span className="font-bold text-warm-900">{p.value}</span>
          {p.payload[`${p.dataKey}_severity`] && (
            <span className="text-warm-400">({p.payload[`${p.dataKey}_severity`]})</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function LongitudinalAnalysis({ patientId, therapistId }) {
  const [loading, setLoading]       = useState(true)
  const [testSeries, setTestSeries] = useState([])   // [{ name, key, color, data[], latestScore, latestSeverity, delta }]
  const [weeklyMood, setWeeklyMood] = useState([])   // [{ week, avg, high_risk }]
  const [activeTest, setActiveTest] = useState(null) // nombre del test seleccionado para filtrar
  const [expandMood, setExpandMood] = useState(false)

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadTestSeries(), loadWeeklyMood()])
    } finally {
      setLoading(false)
    }
  }

  const loadTestSeries = async () => {
    // 1. Obtener la relación terapéutica
    const { data: rel } = await supabase
      .from('therapeutic_relationships')
      .select('id')
      .eq('therapist_id', therapistId)
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .maybeSingle()

    if (!rel) return

    // 2. Obtener todos los test_sessions completados del paciente para este terapeuta
    const { data: assignments } = await supabase
      .from('test_assignments')
      .select('id, tests(id, name, category)')
      .eq('relationship_id', rel.id)

    if (!assignments?.length) return

    const assignmentIds = assignments.map(a => a.id)

    // 3. Obtener sesiones completadas con resultados
    const { data: sessions } = await supabase
      .from('test_sessions')
      .select(`
        id,
        assignment_id,
        completed_at,
        test_results(
          raw_score,
          adjusted_score,
          severity_label,
          severity_code,
          score_delta,
          is_clinically_significant,
          scoring_rules(name, scale_min, scale_max)
        )
      `)
      .in('assignment_id', assignmentIds)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true })

    if (!sessions?.length) return

    // 4. Agrupar por test name
    const byTest = {}
    for (const sess of sessions) {
      const assignment = assignments.find(a => a.id === sess.assignment_id)
      const testName   = assignment?.tests?.name
      if (!testName) continue

      for (const result of (sess.test_results ?? [])) {
        const ruleName = result.scoring_rules?.name ?? testName
        const key = `${testName}::${ruleName}`
        if (!byTest[key]) byTest[key] = { testName, ruleName, points: [], scaleMax: result.scoring_rules?.scale_max ?? null }
        byTest[key].points.push({
          date:        sess.completed_at,
          score:       result.adjusted_score ?? result.raw_score,
          severity:    result.severity_label ?? result.severity_code ?? '',
          delta:       result.score_delta,
          significant: result.is_clinically_significant,
        })
      }
    }

    // 5. Construir series ordenadas por frecuencia de aplicación
    const series = Object.entries(byTest)
      .filter(([, v]) => v.points.length >= 1)
      .sort(([, a], [, b]) => b.points.length - a.points.length)
      .map(([key, v], i) => {
        const sorted  = [...v.points].sort((a, b) => new Date(a.date) - new Date(b.date))
        const latest  = sorted[sorted.length - 1]
        const prev    = sorted.length > 1 ? sorted[sorted.length - 2] : null
        return {
          key,
          name:            v.testName,
          ruleName:        v.ruleName === v.testName ? null : v.ruleName,
          color:           LINE_COLORS[i % LINE_COLORS.length],
          scaleMax:        v.scaleMax,
          latestScore:     latest?.score,
          latestSeverity:  latest?.severity,
          delta:           latest?.delta ?? (prev ? latest.score - prev.score : null),
          significant:     latest?.significant,
          points:          sorted,
        }
      })

    setTestSeries(series)
    if (series.length > 0) setActiveTest(series[0].key)
  }

  const loadWeeklyMood = async () => {
    // Agregar check-ins por semana (últimas 12 semanas)
    const since = new Date()
    since.setDate(since.getDate() - 84)

    const { data: checkins } = await supabase
      .from('ai_checkins')
      .select('mood_score, risk_level, created_at')
      .eq('patient_id', patientId)
      .eq('therapist_id', therapistId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })

    if (!checkins?.length) return

    // Agrupar por semana ISO
    const byWeek = {}
    for (const c of checkins) {
      const d    = new Date(c.created_at)
      const mon  = new Date(d)
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // lunes
      const key  = mon.toISOString().split('T')[0]
      if (!byWeek[key]) byWeek[key] = { scores: [], highRisk: 0 }
      if (c.mood_score != null) byWeek[key].scores.push(c.mood_score)
      if (c.risk_level === 'high') byWeek[key].highRisk++
    }

    const weeks = Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, v]) => ({
        week:     week,
        label:    new Date(week + 'T12:00:00').toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }),
        avg:      v.scores.length ? Math.round(v.scores.reduce((a,b) => a+b, 0) / v.scores.length * 10) / 10 : null,
        highRisk: v.highRisk,
        count:    v.scores.length,
      }))

    setWeeklyMood(weeks)
  }

  // Construir datos de la gráfica para el test activo (todas las fechas como eje X)
  const chartData = (() => {
    const selected = testSeries.filter(s => !activeTest || s.key === activeTest)
    if (!selected.length) return []

    // Unión de todas las fechas
    const allDates = [...new Set(
      selected.flatMap(s => s.points.map(p => p.date.split('T')[0]))
    )].sort()

    return allDates.map(date => {
      const row = {
        date: new Date(date + 'T12:00:00').toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: '2-digit' }),
      }
      for (const s of selected) {
        const pt = s.points.find(p => p.date.startsWith(date))
        if (pt) {
          const safeKey = s.key.replace(/[^a-zA-Z0-9]/g, '_')
          row[safeKey]              = pt.score
          row[`${safeKey}_severity`] = pt.severity
          row[`${safeKey}_sig`]      = pt.significant
        }
      }
      return row
    })
  })()

  const selectedSeries = activeTest ? testSeries.filter(s => s.key === activeTest) : testSeries
  const refLines = (() => {
    if (!activeTest) return []
    const s = testSeries.find(t => t.key === activeTest)
    if (!s) return []
    return REFERENCE_LINES[s.name] ?? []
  })()

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-64" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24" /><Skeleton className="h-24" />
      </div>
    </div>
  )

  if (!testSeries.length && !weeklyMood.length) return (
    <div className="text-center py-16">
      <Activity size={40} className="text-warm-200 mx-auto mb-3" strokeWidth={1.5} />
      <p className="text-warm-500 font-medium">Sin datos longitudinales todavía</p>
      <p className="text-warm-400 text-sm mt-1">
        Asigna tests psicométricos al paciente y espera a que los complete para ver su evolución aquí.
      </p>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* ── Tarjetas resumen por test ─────────────────── */}
      {testSeries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {testSeries.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveTest(activeTest === s.key ? null : s.key)}
              className={`text-left rounded-2xl p-4 border-2 transition-all ${
                activeTest === s.key
                  ? 'border-primary-400 shadow-md'
                  : 'border-warm-100 bg-white hover:border-warm-200'
              }`}
              style={activeTest === s.key ? { borderColor: s.color, background: `${s.color}08` } : {}}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-warm-500 truncate">{s.name}</span>
                <TrendIcon delta={s.delta} />
              </div>
              <p className="text-2xl font-black text-warm-900">{s.latestScore ?? '—'}</p>
              {s.latestSeverity && (
                <span className={`mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  SEVERITY_COLOR[s.latestSeverity?.toLowerCase()] ?? 'bg-warm-100 text-warm-600'
                }`}>
                  {s.latestSeverity}
                </span>
              )}
              {s.significant && (
                <p className="text-[10px] text-primary-600 font-semibold mt-1">↓ Cambio significativo</p>
              )}
              <p className="text-[10px] text-warm-400 mt-1">{s.points.length} aplicación{s.points.length !== 1 ? 'es' : ''}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Gráfica de evolución ──────────────────────── */}
      {testSeries.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-warm-900 text-sm">
                Evolución de scores
                {activeTest && testSeries.find(s => s.key === activeTest) &&
                  <span className="ml-2 text-warm-400 font-normal">
                    — {testSeries.find(s => s.key === activeTest).name}
                  </span>
                }
              </h3>
              <p className="text-xs text-warm-400 mt-0.5">Haz clic en una tarjeta para filtrar por test</p>
            </div>
            {activeTest && (
              <button onClick={() => setActiveTest(null)} className="text-xs text-primary-600 hover:text-primary-800 transition-colors">
                Ver todos
              </button>
            )}
          </div>

          {chartData.length < 2 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-warm-400 text-sm">Se necesitan al menos 2 aplicaciones para trazar la evolución.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1ede8" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9b8ea0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9b8ea0' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {selectedSeries.length > 1 && (
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                )}
                {refLines.map(rl => (
                  <ReferenceLine key={rl.label} y={rl.y} stroke={rl.color} strokeDasharray="4 3" strokeWidth={1.5}
                    label={{ value: rl.label, position: 'insideTopRight', fontSize: 10, fill: rl.color }} />
                ))}
                {selectedSeries.map(s => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key.replace(/[^a-zA-Z0-9]/g, '_')}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: s.color, strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Resumen semanal de check-ins ─────────────── */}
      {weeklyMood.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-100 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-warm-50 transition-colors"
            onClick={() => setExpandMood(e => !e)}
          >
            <div>
              <h3 className="font-semibold text-warm-900 text-sm text-left">Resumen semanal de estado de ánimo</h3>
              <p className="text-xs text-warm-400 mt-0.5 text-left">Últimas {weeklyMood.length} semanas · Check-ins IA</p>
            </div>
            {expandMood ? <ChevronUp size={16} className="text-warm-400" /> : <ChevronDown size={16} className="text-warm-400" />}
          </button>

          {expandMood && (
            <div className="px-5 pb-5">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weeklyMood} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1ede8" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9b8ea0' }} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9b8ea0' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [v, 'Ánimo promedio']} labelStyle={{ fontSize: 11 }} contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid #f1ede8' }} />
                  <ReferenceLine y={4} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'Umbral alerta', position: 'insideTopRight', fontSize: 9, fill: '#f59e0b' }} />
                  <Line type="monotone" dataKey="avg" stroke="#7c3aed" strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#7c3aed', strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 5 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>

              {/* Tabla semanal */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-warm-100">
                      <th className="text-left py-2 text-warm-400 font-medium">Semana</th>
                      <th className="text-center py-2 text-warm-400 font-medium">Check-ins</th>
                      <th className="text-center py-2 text-warm-400 font-medium">Ánimo prom.</th>
                      <th className="text-center py-2 text-warm-400 font-medium">Alertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...weeklyMood].reverse().map(w => (
                      <tr key={w.week} className="border-b border-warm-50 hover:bg-warm-50 transition-colors">
                        <td className="py-2 text-warm-700">{w.label}</td>
                        <td className="py-2 text-center text-warm-600">{w.count}</td>
                        <td className="py-2 text-center">
                          {w.avg !== null ? (
                            <span className={`font-semibold ${w.avg < 4 ? 'text-red-500' : w.avg < 6 ? 'text-amber-500' : 'text-emerald-600'}`}>
                              {w.avg}/10
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2 text-center">
                          {w.highRisk > 0
                            ? <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                                <AlertTriangle size={11} /> {w.highRisk}
                              </span>
                            : <span className="text-warm-300">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
