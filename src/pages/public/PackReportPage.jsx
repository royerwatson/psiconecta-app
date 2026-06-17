/**
 * PackReportPage — /evaluaciones/pack/:packSlug/reporte/:purchaseId
 * Muestra el reporte combinado cruzado generado por Claude para el pack.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Sparkles, CheckCircle2, ChevronRight, RotateCcw, Calendar, ArrowLeft } from 'lucide-react'
import { PsiconectaLogo } from '@/components/ui/Spinner'
import { ASSESSMENT_PACKS } from '@/data/assessmentPacks'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

const SEVERITY_COLOR = {
  'Mínima':    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hex: '#10b981' },
  'Leve':      { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   hex: '#22c55e' },
  'Moderada':  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   hex: '#f59e0b' },
  'Moderado-severa': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', hex: '#f97316' },
  'Severa':    { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     hex: '#ef4444' },
  'Subclínico': { bg: 'bg-sky-50',   text: 'text-sky-700',     border: 'border-sky-200',     hex: '#0ea5e9' },
  'Clínico':   { bg: 'bg-red-50',    text: 'text-red-700',     border: 'border-red-200',     hex: '#ef4444' },
  'Bajo':      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', hex: '#10b981' },
  'Moderado':  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   hex: '#f59e0b' },
  'Alto':      { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     hex: '#ef4444' },
}

function SeverityBadge({ label }) {
  const c = SEVERITY_COLOR[label] ?? { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {label}
    </span>
  )
}

function ScoreBar({ score, maxScore, hex }) {
  const pct = Math.min(Math.round((score / maxScore) * 100), 100)
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{score} / {maxScore}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: hex ?? '#6366f1' }}
        />
      </div>
    </div>
  )
}

export default function PackReportPage() {
  const { packSlug, purchaseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const pack = ASSESSMENT_PACKS[packSlug]

  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!user) {
      navigate(`/login?redirect=/evaluaciones/pack/${packSlug}/reporte/${purchaseId}`)
      return
    }
    if (!pack) { navigate('/evaluaciones'); return }

    loadReport()
  }, [user, pack])

  async function loadReport() {
    setLoading(true)
    setError(null)

    try {
      // Intentar cargar reporte existente
      const { data: existing } = await supabase
        .from('assessment_pack_reports')
        .select('*')
        .eq('purchase_id', purchaseId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        setReport(existing)
        setLoading(false)
        return
      }

      // No existe — llamar al Edge Function para generarlo
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const token = authSession?.access_token

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-pack-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ purchaseId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error generando reporte')

      setReport(data.report)
    } catch (err) {
      console.error('PackReportPage error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!pack) return null

  // ── Pantalla de carga ──────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-lg animate-pulse">
          <Sparkles size={28} color="white" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 mb-1">Analizando tus resultados…</p>
          <p className="text-sm text-slate-500">Nuestro motor clínico está generando tu reporte integrado.<br />Esto puede tomar unos segundos.</p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-500 text-sm">{error}</p>
        <button onClick={loadReport} className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:underline">
          <RotateCcw size={14} /> Reintentar
        </button>
        <Link to="/evaluaciones" className="text-xs text-slate-400 hover:underline">← Volver a evaluaciones</Link>
      </div>
    )
  }

  if (!report) return null

  // Parsear datos del reporte
  const parsed = report.parsed ?? {}
  const sessionResults = report.session_results ?? []
  const recommendations = report.recommendations ?? parsed.recomendaciones ?? []
  const patrones = parsed.patrones_clave ?? []
  const tituloReporte = parsed.titulo_reporte ?? report.pack_slug
  const resumenEjecutivo = parsed.resumen_ejecutivo ?? ''
  const analisisCruzado = parsed.analisis_cruzado ?? report.cross_analysis ?? ''
  const fraseCierre = parsed.frase_cierre ?? ''

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117]">

      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <PsiconectaLogo size={18} color="white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base">Psico<span className="text-primary-600">necta</span></span>
          </Link>
          <span className="text-xs font-semibold text-primary-500">{pack.icon} {pack.name}</span>
        </div>
      </header>

      <main className="pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* ── Header del reporte ── */}
          <div className="card p-6 sm:p-8 border-2 border-primary-200 dark:border-primary-800">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={20} strokeWidth={2} className="text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Evaluación completada</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              {tituloReporte || pack.reportTitle}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
              {pack.instruments} · {sessionResults.length} instrumentos analizados
            </p>

            {/* Resumen ejecutivo */}
            {resumenEjecutivo && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {resumenEjecutivo}
              </p>
            )}
          </div>

          {/* ── Resultados por test ── */}
          {sessionResults.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs text-primary-600 font-bold">1</span>
                Resultados individuales
              </h2>
              <div className="space-y-5">
                {sessionResults.map((s) => {
                  const c = SEVERITY_COLOR[s.severity_label] ?? {}
                  return (
                    <div key={s.slug} className="pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{s.instrument}</p>
                          <p className="text-xs text-slate-400">{s.slug}</p>
                        </div>
                        <SeverityBadge label={s.severity_label} />
                      </div>
                      <ScoreBar score={s.total_score} maxScore={s.max_score} hex={c.hex} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Análisis cruzado ── */}
          {analisisCruzado && (
            <div className="card p-6 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border border-primary-200 dark:border-primary-800">
              <h2 className="text-sm font-bold text-primary-800 dark:text-primary-300 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs text-primary-600 font-bold">2</span>
                Análisis cruzado integrado
              </h2>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {analisisCruzado}
              </p>
            </div>
          )}

          {/* ── Patrones clave ── */}
          {patrones.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs text-primary-600 font-bold">3</span>
                Patrones identificados
              </h2>
              <div className="space-y-4">
                {patrones.map((p, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-bold text-primary-600 shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-0.5">{p.titulo}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Recomendaciones ── */}
          {recommendations.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs text-primary-600 font-bold">4</span>
                Recomendaciones prioritarias
              </h2>
              <div className="space-y-4">
                {recommendations.map((r, i) => (
                  <div key={i} className="flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={13} strokeWidth={2} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-0.5">{r.titulo}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Frase de cierre ── */}
          {fraseCierre && (
            <div className="card p-6 text-center border border-primary-100 dark:border-primary-800">
              <Sparkles size={20} strokeWidth={1.5} className="text-primary-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                "{fraseCierre}"
              </p>
            </div>
          )}

          {/* ── Bonus si aplica ── */}
          {pack.bonus && (
            <div className="card p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <Sparkles size={18} strokeWidth={1.5} className="text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-0.5">Beneficio incluido</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">{pack.bonus}</p>
              </div>
            </div>
          )}

          {/* ── CTA: Agendar sesión ── */}
          <div className="card p-6 text-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">¿Quieres hablar con un especialista?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Conecta con un terapeuta verificado y comparte tu reporte en tu primera sesión.</p>
            <Link
              to="/terapeutas"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-brand rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
            >
              <Calendar size={16} strokeWidth={2} />
              Encontrar terapeuta
              <ChevronRight size={15} strokeWidth={2} />
            </Link>
            <p className="text-xs text-slate-400 mt-4">
              <Link to="/evaluaciones" className="hover:text-primary-600 transition-colors flex items-center justify-center gap-1">
                <ArrowLeft size={12} /> Ver todas las evaluaciones
              </Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
