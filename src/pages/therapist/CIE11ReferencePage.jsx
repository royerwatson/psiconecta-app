/**
 * CIE11ReferencePage — Consulta de la CIE-11 para terapeutas.
 * Búsqueda global + filtro por capítulo + vista expandida de características.
 */
import { useState, useMemo } from 'react'
import { useClinicalContent } from '@/hooks/useClinicalContent'
import { LoadingScreen } from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import { Lightbulb, AlertTriangle, Search } from 'lucide-react'

// ── Colores por capítulo ──────────────────────────────────────────────────────
const CHAPTER_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-lime-100 text-lime-700 border-lime-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-red-100 text-red-700 border-red-200',
]

// ── Novedades destacadas respecto CIE-10 ─────────────────────────────────────
const NEW_CODES = new Set([
  '6B41', // TEPT Complejo
  '6B42', // Duelo prolongado
  '6C51', // Videojuegos
  '6B22', // Referencia olfativa
  'HA60', // Incongruencia de género — adolescentes/adultos
  'HA61', // Incongruencia de género — infancia
])

// ── Componente: tarjeta de diagnóstico ────────────────────────────────────────
function DiagnosisCard({ diagnosis, chapterId, colorMap = {}, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const chipColor = colorMap[chapterId] ?? 'bg-warm-100 text-warm-700 border-warm-200'
  const isNew = NEW_CODES.has(diagnosis.code.split('.')[0])

  return (
    <div className={`border rounded-2xl overflow-hidden bg-white transition-shadow ${open ? 'shadow-sm border-warm-200' : 'border-warm-100'}`}>
      {/* Cabecera */}
      <button
        className="w-full text-left px-4 py-3.5 hover:bg-warm-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-warm-900">{diagnosis.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium ${chipColor}`}>
                {diagnosis.code}
              </span>
              {isNew && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold">
                  · Nuevo CIE-11
                </span>
              )}
            </div>
            {!open && (
              <p className="text-xs text-warm-500 mt-1 line-clamp-1">{diagnosis.description}</p>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-warm-300 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Contenido expandido */}
      {open && (
        <div className="border-t border-warm-100 px-4 py-4 bg-warm-50/30 space-y-4">
          {/* Descripción */}
          <p className="text-sm text-warm-700 leading-relaxed">{diagnosis.description}</p>

          {/* Características esenciales */}
          {diagnosis.features && (
            <div>
              <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-2">
                Características esenciales
              </p>
              <div className="bg-white rounded-xl border border-warm-100 px-4 py-3">
                <p className="text-sm text-warm-700 leading-relaxed whitespace-pre-line">
                  {diagnosis.features}
                </p>
              </div>
            </div>
          )}

          {/* Especificadores */}
          {diagnosis.specifiers?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-2">
                Especificadores / Subtipos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {diagnosis.specifiers.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs bg-primary-50 text-primary-700 border border-primary-100 rounded-lg px-2.5 py-1 font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notas clínicas */}
          {diagnosis.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1"><Lightbulb className="inline" size={12} strokeWidth={1.8} /> Nota clínica / CIE-11</p>
              <p className="text-sm text-blue-800 leading-relaxed">{diagnosis.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CIE11ReferencePage() {
  const [search, setSearch]               = useState('')
  const [filterChapter, setFilterChapter] = useState('all')

  // Contenido protegido server-side (Edge Function clinical-content)
  const { data, loading, error } = useClinicalContent('cie11')
  const CIE11 = data ?? []

  const chapterColorMap = useMemo(() => Object.fromEntries(
    CIE11.map((ch, i) => [ch.chapterId, CHAPTER_COLORS[i % CHAPTER_COLORS.length]])
  ), [CIE11])

  const allDiagnoses = useMemo(() => CIE11.flatMap(chapter =>
    chapter.diagnoses.map(d => ({
      ...d,
      chapter: chapter.chapter,
      chapterId: chapter.chapterId,
      block: chapter.block,
    }))
  ), [CIE11])

  const totalDiagnoses = CIE11.reduce((sum, ch) => sum + ch.diagnoses.length, 0)

  const filtered = useMemo(() => {
    const q = search.trim()
    if (q) {
      const lower = q.toLowerCase()
      const results = allDiagnoses.filter(d =>
        d.name.toLowerCase().includes(lower) ||
        d.code.toLowerCase().includes(lower) ||
        d.description.toLowerCase().includes(lower) ||
        d.features?.toLowerCase().includes(lower) ||
        d.notes?.toLowerCase().includes(lower)
      )
      if (filterChapter !== 'all') return results.filter(d => d.chapterId === filterChapter)
      return results
    }
    if (filterChapter !== 'all') {
      const ch = CIE11.find(c => c.chapterId === filterChapter)
      return (ch?.diagnoses ?? []).map(d => ({ ...d, chapterId: ch.chapterId }))
    }
    return null // null = vista agrupada
  }, [search, filterChapter, allDiagnoses, CIE11])

  if (loading) return <LoadingScreen />
  if (error) {
    return (
      <div className="flex flex-col items-center py-20 text-center animate-fade-in">
        <AlertTriangle className="text-warm-300 mb-3" size={40} strokeWidth={1.8} />
        <p className="font-semibold text-warm-700">No se pudo cargar la CIE-11</p>
        <p className="text-sm text-warm-500 mt-1">Verifica tu conexión o tu plan de suscripción e intenta de nuevo.</p>
      </div>
    )
  }

  const isGrouped = !filtered

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-warm-900">CIE-11</h1>
            <p className="text-warm-500 text-sm mt-0.5">
              {CIE11.length} capítulos · {totalDiagnoses} diagnósticos · OMS 2022
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-center shrink-0">
            <p className="text-lg font-bold text-emerald-700">{totalDiagnoses}</p>
            <p className="text-[10px] text-emerald-500 font-medium">diagnósticos</p>
          </div>
        </div>

        {/* Novedades CIE-11 */}
        <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-xs text-emerald-800 leading-relaxed">
          <span className="font-semibold">Novedades CIE-11 vs CIE-10:</span>{' '}
          TEPT Complejo (6B41) como diagnóstico independiente · Duelo prolongado (6B42) · Trastorno de videojuegos (6C51) ·
          Personalidad: modelo dimensional · Incongruencia de género despatologizada (cap. 17)
        </div>

        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700 leading-relaxed flex items-start gap-1.5">
          <AlertTriangle className="shrink-0 mt-0.5" size={12} strokeWidth={1.8} />
          <span>Referencia clínica resumida. Características parafraseadas con fines educativos. Consulta la versión oficial en{' '}
          <span className="font-mono">icd.who.int</span> para uso diagnóstico formal.</span>
        </div>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar diagnóstico, código CIE-11, característica..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        prefix={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />

      {/* Filtro por capítulo */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterChapter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
            filterChapter === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
          }`}
        >
          Todos los capítulos
        </button>
        {CIE11.map(ch => (
          <button
            key={ch.chapterId}
            onClick={() => setFilterChapter(ch.chapterId)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              filterChapter === ch.chapterId
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}
          >
            {ch.chapter.split(' ').slice(0, 3).join(' ')}
          </button>
        ))}
      </div>

      {/* Resultados de búsqueda — lista plana */}
      {!isGrouped && (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Search className="text-warm-300 mb-3" size={40} strokeWidth={1.8} />
              <p className="font-semibold text-warm-700">Sin resultados para "{search}"</p>
              <button
                onClick={() => { setSearch(''); setFilterChapter('all') }}
                className="mt-3 text-sm text-primary-600 font-medium"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-warm-400">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}{search ? ` para "${search}"` : ''}
              </p>
              {filtered.map(d => (
                <DiagnosisCard
                  key={d.id}
                  diagnosis={d}
                  chapterId={d.chapterId}
                  colorMap={chapterColorMap}
                  defaultOpen={!!search}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Vista agrupada por capítulo */}
      {isGrouped && (
        <div className="flex flex-col gap-8">
          {CIE11.map(chapter => (
            <div key={chapter.chapterId}>
              {/* Encabezado de capítulo */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${chapterColorMap[chapter.chapterId]}`}>
                  {chapter.diagnoses.length} diagnósticos
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-warm-800">{chapter.chapter}</h2>
                  <p className="text-[10px] text-warm-400 font-mono">{chapter.block}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {chapter.diagnoses.map(d => (
                  <DiagnosisCard key={d.id} diagnosis={d} chapterId={chapter.chapterId} colorMap={chapterColorMap} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
