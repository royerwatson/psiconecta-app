/**
 * AssessmentReportPage — Reporte completo post-pago.
 * Ruta: /patient/evaluaciones/:sessionId
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Download, ArrowRight, RefreshCw, AlertCircle, CheckCircle, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { ASSESSMENT_TESTS } from '@/data/assessmentTests'

/* ── Gauge animado ────────────────────────────────────────── */
function ScoreGauge({ score, maxScore, hex }) {
  const [animated, setAnimated] = useState(false)
  const R = 70
  const halfCirc = Math.PI * R
  const pct = Math.min(score / maxScore, 1)
  const filled = animated ? halfCirc * pct : 0

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <svg viewBox="0 0 160 100" className="w-full max-w-[260px] mx-auto">
      <path d="M 15,88 A 70,70 0 0 1 145,88" fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M 15,88 A 70,70 0 0 1 145,88"
        fill="none"
        stroke={hex}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${halfCirc}`}
        style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
      />
      <text x="80" y="77" textAnchor="middle" fontSize="32" fontWeight="900" fill="#0f172a">{score}</text>
      <text x="80" y="90" textAnchor="middle" fontSize="10" fill="#94a3b8">de {maxScore}</text>
    </svg>
  )
}

/* ── Barra de dimensión ───────────────────────────────────── */
function DimBar({ name, pct, hex }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 400); return () => clearTimeout(t) }, [pct])
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-600 font-medium">{name}</span>
        <span className="font-bold text-slate-800">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${w}%`, backgroundColor: hex }} />
      </div>
    </div>
  )
}

/* ── Card de recomendación ────────────────────────────────── */
const REC_ICONS = [CheckCircle, AlertCircle, Users, ArrowRight]
function RecCard({ rec, index }) {
  const Icon = REC_ICONS[index % REC_ICONS.length]
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary-600" strokeWidth={1.8} />
      </div>
      <div>
        <p className="font-bold text-slate-800 text-sm mb-1">{rec.title}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{rec.description}</p>
      </div>
    </div>
  )
}

/* ── Generador de PDF ─────────────────────────────────────── */
async function downloadPDF(session, report, profile) {
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      s.onload = resolve; s.onerror = reject
      document.head.appendChild(s)
    })
  }

  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let y = 20

  const addText = (text, opts = {}) => {
    const { size = 11, bold = false, color = [30, 30, 30], maxW = W - 30 } = opts
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, maxW)
    doc.text(lines, 15, y)
    y += lines.length * (size * 0.45) + 3
  }

  const checkPage = () => { if (y > 270) { doc.addPage(); y = 20 } }

  // Header
  addText('PSICONECTA', { size: 9, bold: true, color: [79, 70, 229] })
  addText('Reporte de Evaluación Psicométrica', { size: 18, bold: true })
  addText(`${session.instrument_full}`, { size: 12, color: [100, 116, 139] })
  addText(`Generado: ${new Date(report.generated_at).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}`, { size: 10, color: [148, 163, 184] })
  y += 4

  // Score
  addText(`Puntuación: ${session.total_score} / ${session.max_score} — ${session.severity_label}`, { size: 13, bold: true })
  y += 4; checkPage()

  // Dimensiones
  if (session.dimension_scores?.length) {
    addText('Desglose dimensional', { size: 12, bold: true })
    session.dimension_scores.forEach(d => {
      addText(`• ${d.name}: ${d.pct}%`, { size: 11 })
    })
    y += 4; checkPage()
  }

  // Interpretación
  addText('Interpretación', { size: 13, bold: true })
  addText(report.interpretation, { size: 11 })
  y += 4; checkPage()

  // Contexto normativo
  addText('Contexto normativo', { size: 13, bold: true })
  addText(report.normative_context, { size: 11 })
  y += 4; checkPage()

  // Recomendaciones
  addText('Recomendaciones', { size: 13, bold: true })
  ;(report.recommendations ?? []).forEach((r, i) => {
    checkPage()
    addText(`${i + 1}. ${r.title}`, { size: 11, bold: true })
    addText(r.description, { size: 11 })
    y += 2
  })

  y += 8; checkPage()
  addText('Este reporte es confidencial y de uso personal. Compártelo con tu psicólogo.', { size: 9, color: [148, 163, 184] })
  addText('psiconecta.app', { size: 9, color: [79, 70, 229] })

  doc.save(`reporte_${session.slug}_${new Date().toISOString().slice(0, 10)}.pdf`)
}

/* ── Página principal ─────────────────────────────────────── */
export default function AssessmentReportPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()

  const [session, setSession] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const pollRef = useRef(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchReport()
    return () => clearInterval(pollRef.current)
  }, [sessionId, user])

  async function fetchReport() {
    setLoading(true)
    const { data: sess, error: sessErr } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessErr || !sess) { setError('Reporte no encontrado.'); setLoading(false); return }
    if (!sess.paid) { navigate(`/evaluaciones/resultado/${sess.slug}`); return }
    setSession(sess)

    const { data: rep } = await supabase
      .from('assessment_reports')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (rep) {
      setReport(rep)
      setLoading(false)
    } else {
      // Reporte aún generándose — hacer polling
      setPolling(true)
      setLoading(false)
      let attempts = 0
      pollRef.current = setInterval(async () => {
        attempts++
        const { data } = await supabase.from('assessment_reports').select('*').eq('session_id', sessionId).single()
        if (data) { setReport(data); setPolling(false); clearInterval(pollRef.current) }
        if (attempts > 20) { setError('Tiempo agotado generando el reporte. Recarga la página.'); clearInterval(pollRef.current) }
      }, 3000)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try { await downloadPDF(session, report, profile) }
    catch (e) { console.error(e) }
    setDownloading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-psiconecta">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Cargando tu reporte…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-psiconecta px-4">
        <div className="text-center max-w-sm">
          <p className="text-slate-700 font-semibold mb-4">{error}</p>
          <button onClick={fetchReport} className="btn-premium btn-primary-premium text-sm px-5 py-2.5">
            <RefreshCw size={15} /> Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (polling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-psiconecta px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-700 font-bold mb-1">Generando tu reporte…</p>
          <p className="text-slate-500 text-sm">Estamos analizando el patrón de tus respuestas. Esto toma unos segundos.</p>
        </div>
      </div>
    )
  }

  const test = ASSESSMENT_TESTS[session?.slug]
  const severity = test?.bands?.find(b => session.total_score >= b.min && session.total_score <= b.max) || test?.bands?.at(-1)

  return (
    <div className="min-h-screen bg-psiconecta">

      {/* Navbar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/patient/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">
            ← Dashboard
          </Link>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            {downloading ? 'Descargando…' : 'Descargar PDF'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Encabezado */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-500 rounded-3xl px-6 py-5 text-white">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Reporte de evaluación</p>
          <p className="font-extrabold text-xl">{session?.instrument_full || test?.instrumentFull}</p>
          <p className="text-white/70 text-xs mt-1">
            {new Date(session?.paid_at || session?.created_at).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* 1. Puntuación */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">Tu puntuación</p>
          <ScoreGauge score={session.total_score} maxScore={session.max_score} hex={severity?.hex ?? '#6366f1'} />
          <div className="text-center mt-4">
            <span className="inline-block px-5 py-1.5 rounded-full text-sm font-bold text-white" style={{ backgroundColor: severity?.hex }}>
              {session.severity_label}
            </span>
            <p className="text-xs text-slate-500 mt-2">{severity?.description}</p>
          </div>
        </div>

        {/* 2. Desglose dimensional */}
        {session.dimension_scores?.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Desglose por dimensión</p>
            <div className="space-y-4">
              {session.dimension_scores.map(d => (
                <DimBar key={d.name} name={d.name} pct={d.pct} hex={severity?.hex ?? '#6366f1'} />
              ))}
            </div>
          </div>
        )}

        {/* 3. Interpretación */}
        {report?.interpretation && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Interpretación</p>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3">
              {report.interpretation.split('\n\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* 4. Contexto */}
        {report?.normative_context && (
          <div className="bg-primary-50 rounded-3xl border border-primary-100 shadow-sm p-6">
            <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-4">Contexto</p>
            <p className="text-slate-700 text-sm leading-relaxed">{report.normative_context}</p>
          </div>
        )}

        {/* 5. Para tener en cuenta (frase_cierre) */}
        {report?.recommendations?.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Para tener en cuenta</p>
            <div className="space-y-3">
              {report.recommendations.map((rec, i) => (
                rec.title === 'Para tener en cuenta'
                  ? (
                    <div key={i} className="bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100 rounded-2xl p-5">
                      <p className="text-slate-700 text-sm leading-relaxed italic">"{rec.description}"</p>
                    </div>
                  )
                  : <RecCard key={i} rec={rec} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* 6. Próximos pasos */}
        <div className="bg-gradient-brand rounded-3xl p-6 text-white">
          <p className="font-extrabold text-lg mb-2">¿Quieres profundizar?</p>
          <p className="text-white/80 text-sm mb-5">Comparte este reporte con un psicólogo y llega a tu primera sesión con contexto concreto de cómo estás.</p>
          <Link
            to="/patient/find"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-bold rounded-2xl hover:bg-primary-50 transition-colors text-sm"
          >
            Buscar terapeuta <ArrowRight size={16} />
          </Link>
        </div>

        {/* PDF */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          {downloading ? 'Generando PDF…' : 'Descargar reporte en PDF'}
        </button>

      </main>
    </div>
  )
}
