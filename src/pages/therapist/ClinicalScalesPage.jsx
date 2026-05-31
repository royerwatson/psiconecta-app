/**
 * ClinicalScalesPage — Escalas clínicas para terapeutas.
 * PHQ-9 · GAD-7 · AUDIT · PCL-5
 * Puntuación automática · Interpretación por bandas · Guardado opcional en historial
 */
import { useState, useMemo, useEffect, useCallback } from 'react'
import { CLINICAL_SCALES, getNormalizedQuestions, getBand, getPCL5ClusterAnalysis } from '@/data/clinicalScales'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { Frown, HeartPulse, Droplets, Brain, Timer, BarChart2, Lightbulb, Check, X, Search } from 'lucide-react'

const SCALE_ICON_MAP = { Frown, HeartPulse, Droplets, Brain }
function ScaleIcon({ name, size = 22, className = '' }) {
  const Icon = SCALE_ICON_MAP[name] ?? Brain
  return <Icon size={size} strokeWidth={1.8} className={className} />
}

// ── Estilos por tema ──────────────────────────────────────────────────────────
const THEME = {
  blue:   { pill: 'bg-blue-100 text-blue-700 border-blue-200',   ring: 'ring-blue-400',   active: 'bg-blue-600 text-white border-blue-600',   header: 'bg-blue-50 border-blue-100'   },
  purple: { pill: 'bg-purple-100 text-purple-700 border-purple-200', ring: 'ring-purple-400', active: 'bg-purple-600 text-white border-purple-600', header: 'bg-purple-50 border-purple-100' },
  amber:  { pill: 'bg-amber-100 text-amber-700 border-amber-200', ring: 'ring-amber-400',  active: 'bg-amber-600 text-white border-amber-600',  header: 'bg-amber-50 border-amber-100'   },
  rose:   { pill: 'bg-rose-100 text-rose-700 border-rose-200',   ring: 'ring-rose-400',   active: 'bg-rose-600 text-white border-rose-600',     header: 'bg-rose-50 border-rose-100'     },
}

const BAND_STYLE = {
  green:  { wrap: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  lime:   { wrap: 'bg-lime-50 border-lime-200',       text: 'text-lime-800',    badge: 'bg-lime-100 text-lime-800 border-lime-200',           dot: 'bg-lime-500'    },
  amber:  { wrap: 'bg-amber-50 border-amber-200',     text: 'text-amber-800',   badge: 'bg-amber-100 text-amber-800 border-amber-200',        dot: 'bg-amber-500'   },
  orange: { wrap: 'bg-orange-50 border-orange-200',   text: 'text-orange-800',  badge: 'bg-orange-100 text-orange-800 border-orange-200',     dot: 'bg-orange-500'  },
  red:    { wrap: 'bg-red-50 border-red-200',         text: 'text-red-800',     badge: 'bg-red-100 text-red-800 border-red-200',              dot: 'bg-red-500'     },
}

// ── Tarjeta selectora de escala ───────────────────────────────────────────────
function ScaleCard({ scale, onClick }) {
  const th = THEME[scale.themeClass]
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-warm-100 rounded-2xl p-4 hover:border-warm-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-warm-50 flex items-center justify-center shrink-0 mt-0.5">
            <ScaleIcon name={scale.icon} size={18} className="text-warm-600" />
          </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-warm-900 text-sm">{scale.name}</span>
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', th.pill)}>
              {scale.domain}
            </span>
          </div>
          <p className="text-xs text-warm-500 mt-1 leading-relaxed">{scale.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-warm-400 flex items-center gap-0.5"><Timer size={10} strokeWidth={1.8} /> {scale.duration}</span>
            <span className="text-[10px] text-warm-400 flex items-center gap-0.5"><BarChart2 size={10} strokeWidth={1.8} /> Máx. {scale.maxScore} pts</span>
            <span className="text-[10px] text-warm-400">{scale.questions.length} ítems</span>
          </div>
        </div>
        <svg className="w-4 h-4 text-warm-300 group-hover:text-warm-500 shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}

// ── Botones de opción de respuesta ────────────────────────────────────────────
function OptionButton({ label, value, selected, onClick, themeClass }) {
  const th = THEME[themeClass]
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 min-w-[72px] text-center text-xs font-medium px-2 py-2 rounded-xl border transition-all',
        selected
          ? th.active
          : 'border-warm-200 text-warm-600 hover:border-warm-400 hover:bg-warm-50 bg-white',
      )}
    >
      <span className="block font-bold text-sm">{value}</span>
      <span className="block leading-tight mt-0.5 opacity-80">{label}</span>
    </button>
  )
}

// ── Barra de progreso ─────────────────────────────────────────────────────────
function ProgressBar({ answered, total, themeClass }) {
  const pct = Math.round((answered / total) * 100)
  const barColor = {
    blue: 'bg-blue-500', purple: 'bg-purple-500',
    amber: 'bg-amber-500', rose: 'bg-rose-500',
  }[themeClass] ?? 'bg-primary-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-warm-400 shrink-0">{answered}/{total}</span>
    </div>
  )
}

// ── Panel de resultado ────────────────────────────────────────────────────────
function ResultPanel({ scale, score, answers, onReset, onSave }) {
  const band    = getBand(scale, score)
  const bs      = BAND_STYLE[band?.color ?? 'green']
  const pct     = Math.round((score / scale.maxScore) * 100)
  const clusters = scale.id === 'PCL5' ? getPCL5ClusterAnalysis(answers) : null

  return (
    <div className="flex flex-col gap-4 animate-fade-in">

      {/* Puntuación principal */}
      <div className={cn('rounded-2xl border p-5', bs.wrap)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-1">Resultado</p>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-5xl font-bold', bs.text)}>{score}</span>
              <span className={cn('text-lg', bs.text)}>/ {scale.maxScore}</span>
            </div>
            <span className={cn('inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full border', bs.badge)}>
              {band?.label ?? '—'}
            </span>
          </div>
          {/* Medidor circular */}
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="text-warm-200" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round"
                className={bs.dot.replace('bg-', 'text-')} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-sm font-bold', bs.text)}>{pct}%</span>
            </div>
          </div>
        </div>

        {/* Acción recomendada */}
        <div className="mt-3 pt-3 border-t border-warm-200/60">
          <p className="text-xs font-semibold text-warm-600 mb-1">Acción recomendada</p>
          <p className={cn('text-sm leading-relaxed', bs.text)}>{band?.action}</p>
        </div>
      </div>

      {/* Clusters PCL-5 */}
      {clusters && (
        <div className="bg-white border border-warm-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-3">Análisis por criterios DSM-5</p>
          <div className="flex flex-col gap-2">
            {clusters.map((cl, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                  cl.met ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                )}>
                  {cl.met ? <X size={11} strokeWidth={2.5} /> : <Check size={11} strokeWidth={2.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-warm-800">{cl.name}</p>
                  <p className="text-[10px] text-warm-400">{cl.positiveCount} positivo{cl.positiveCount !== 1 ? 's' : ''} · {cl.label}</p>
                </div>
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  cl.met ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                )}>
                  {cl.met ? 'Cumple' : 'No cumple'}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-warm-400 mt-3">* Ítem positivo = respuesta ≥ 2 (Moderadamente o más)</p>
        </div>
      )}

      {/* Nota clínica */}
      {scale.clinicalNote && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1"><Lightbulb size={12} strokeWidth={1.8} />Nota clínica</p>
          <p className="text-xs text-amber-800 leading-relaxed">{scale.clinicalNote}</p>
        </div>
      )}

      {/* Distribución de respuestas */}
      <div className="bg-white border border-warm-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-3">Respuestas por ítem</p>
        <div className="flex flex-col gap-1.5">
          {getNormalizedQuestions(scale).map((q, i) => {
            const val = answers[i] ?? 0
            const maxVal = Math.max(...q.options.map(o => o.value))
            const optLabel = q.options.find(o => o.value === val)?.label ?? val
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-warm-400 w-5 shrink-0 text-right">{i + 1}</span>
                <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-400 rounded-full transition-all"
                    style={{ width: `${maxVal > 0 ? (val / maxVal) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-warm-500 w-16 shrink-0 truncate">{optLabel}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-xl border border-warm-200 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
        >
          Nueva aplicación
        </button>
        <button
          onClick={onSave}
          className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          Guardar en historial
        </button>
      </div>
    </div>
  )
}

// ── Modal de guardado ─────────────────────────────────────────────────────────
function SaveModal({ scale, score, answers, therapistId, onClose, onSaved }) {
  const band = getBand(scale, score)
  const [patients, setPatients]   = useState([])
  const [selected, setSelected]   = useState(null)
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('therapeutic_relationships')
        .select('patient_id')
        .eq('therapist_id', therapistId)
        .eq('status', 'active')
      if (!data?.length) { setLoading(false); return }
      const ids = data.map(r => r.patient_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', ids)
      setPatients(profiles ?? [])
      setLoading(false)
    }
    fetchPatients()
  }, [therapistId])

  const handleSave = async () => {
    if (!selected) return toast.error('Selecciona un paciente')
    setSaving(true)
    const { error } = await supabase.from('clinical_assessments').insert({
      therapist_id:   therapistId,
      patient_id:     selected,
      scale_code:     scale.id,
      scale_name:     scale.name,
      answers:        answers,
      total_score:    score,
      interpretation: band?.label ?? '',
      notes:          notes.trim() || null,
    })
    setSaving(false)
    if (error) {
      console.error(error)
      toast.error('Error al guardar. Verifica que la tabla "clinical_assessments" exista en Supabase.')
      return
    }
    toast.success('Resultado guardado en el historial del paciente')
    onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-float border border-warm-100"
        onClick={e => e.stopPropagation()}
      >
        <p className="font-serif font-semibold text-warm-900 mb-1">Guardar resultado</p>
        <p className="text-xs text-warm-400 mb-4">
          {scale.name} · {score}/{scale.maxScore} pts · {band?.label}
        </p>

        {/* Selección de paciente */}
        <p className="text-xs font-semibold text-warm-600 mb-2">Paciente</p>
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <span className="text-sm text-warm-400">Cargando pacientes…</span>
          </div>
        ) : patients.length === 0 ? (
          <p className="text-sm text-warm-400 text-center py-4">No tienes pacientes activos.</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto mb-3">
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all',
                  selected === p.id
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'border-warm-100 hover:bg-warm-50',
                )}
              >
                <Avatar name={p.full_name} size="xs" />
                <span className="text-sm font-medium text-warm-800">{p.full_name}</span>
                {selected === p.id && <Check size={13} strokeWidth={2} className="ml-auto text-primary-600" />}
              </button>
            ))}
          </div>
        )}

        {/* Notas opcionales */}
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notas clínicas adicionales (opcional)…"
          rows={2}
          className="w-full text-sm border border-warm-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-warm-200 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ClinicalScalesPage() {
  const { user } = useAuthStore()
  const [activeScaleId, setActiveScaleId] = useState(null)
  const [answers, setAnswers]             = useState({})
  const [showSave, setShowSave]           = useState(false)

  const scale     = CLINICAL_SCALES.find(s => s.id === activeScaleId) ?? null
  const questions = useMemo(() => scale ? getNormalizedQuestions(scale) : [], [scale])
  const answered  = Object.keys(answers).length
  const isComplete = scale && answered === questions.length

  const score = useMemo(() =>
    Object.values(answers).reduce((sum, v) => sum + v, 0)
  , [answers])

  const th = scale ? THEME[scale.themeClass] : null

  const handleSelect = useCallback((id) => {
    setActiveScaleId(id)
    setAnswers({})
  }, [])

  const handleAnswer = useCallback((idx, value) => {
    setAnswers(prev => ({ ...prev, [idx]: value }))
  }, [])

  const handleReset = () => {
    setAnswers({})
    // Scroll al principio del formulario
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Selector de escalas ───────────────────────────────────────────────────
  if (!scale) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Escalas clínicas</h1>
          <p className="text-warm-500 text-sm mt-0.5">
            Herramientas de evaluación validadas con puntuación automática
          </p>
        </div>

        <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3 text-xs text-primary-700 leading-relaxed flex items-start gap-2">
          <Lightbulb size={14} strokeWidth={1.8} className="shrink-0 mt-0.5" />
          Estas escalas son auxiliares del juicio clínico y no sustituyen la evaluación diagnóstica formal.
          Los resultados se pueden guardar en el historial del paciente.
        </div>

        <div className="flex flex-col gap-3">
          {CLINICAL_SCALES.map(s => (
            <ScaleCard key={s.id} scale={s} onClick={() => handleSelect(s.id)} />
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-warm-400">
            Próximamente: Columbia C-SSRS · BDI-II · STAI · CAGE · BPRS
          </p>
        </div>
      </div>
    )
  }

  // ── Cuestionario activo ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      {/* Header con botón volver */}
      <div className={cn('rounded-2xl border px-4 py-3', th.header)}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScaleId(null)}
            className="p-1.5 rounded-lg hover:bg-white/60 transition-colors shrink-0"
          >
            <svg className="w-4 h-4 text-warm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{scale.icon}</span>
              <span className="font-serif font-bold text-warm-900">{scale.name}</span>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', th.pill)}>
                {scale.domain}
              </span>
            </div>
            <ProgressBar answered={answered} total={questions.length} themeClass={scale.themeClass} />
          </div>
          {isComplete && (
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-warm-900">{score}</p>
              <p className="text-[10px] text-warm-400">/ {scale.maxScore}</p>
            </div>
          )}
        </div>
      </div>

      {/* Instrucción */}
      <div className="bg-warm-50 border border-warm-100 rounded-xl px-4 py-3">
        <p className="text-xs text-warm-600 leading-relaxed italic">{scale.instruction}</p>
        {scale.id === 'AUDIT' && (
          <p className="text-[10px] text-warm-400 mt-1">
            Si el paciente responde "Nunca" en el ítem 1, finalice la escala y asigne 0 al total.
          </p>
        )}
      </div>

      {/* Resultado (si completado) */}
      {isComplete ? (
        <ResultPanel
          scale={scale}
          score={score}
          answers={answers}
          onReset={handleReset}
          onSave={() => setShowSave(true)}
        />
      ) : (
        /* Preguntas */
        <div className="flex flex-col gap-4">
          {questions.map((q, i) => {
            const isAnswered = answers[i] !== undefined
            return (
              <div
                key={i}
                className={cn(
                  'bg-white border rounded-2xl p-4 transition-all',
                  isAnswered ? 'border-warm-200' : 'border-warm-100',
                )}
              >
                {/* Número + texto */}
                <div className="flex items-start gap-3 mb-3">
                  <span className={cn(
                    'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    isAnswered ? cn(th.pill, 'border') : 'bg-warm-100 text-warm-400',
                  )}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-warm-800 leading-relaxed">{q.text}</p>
                </div>

                {/* Opciones */}
                <div className={cn(
                  'flex gap-2',
                  q.options.length > 4 ? 'flex-col' : 'flex-row flex-wrap',
                )}>
                  {q.options.map(opt => (
                    <OptionButton
                      key={opt.value}
                      label={opt.label}
                      value={opt.value}
                      selected={answers[i] === opt.value}
                      onClick={() => handleAnswer(i, opt.value)}
                      themeClass={scale.themeClass}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Recordatorio al final */}
          {answered > 0 && answered < questions.length && (
            <p className="text-center text-xs text-warm-400">
              Faltan {questions.length - answered} ítem{questions.length - answered !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Modal de guardado */}
      {showSave && (
        <SaveModal
          scale={scale}
          score={score}
          answers={answers}
          therapistId={user.id}
          onClose={() => setShowSave(false)}
          onSaved={() => { setShowSave(false); handleReset(); setActiveScaleId(null) }}
        />
      )}
    </div>
  )
}
