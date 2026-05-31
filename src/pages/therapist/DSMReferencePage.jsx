/**
 * DSMReferencePage — Consulta del DSM-5-TR para terapeutas.
 * Búsqueda global + filtro por capítulo + vista expandida de criterios.
 */
import { useState, useMemo } from 'react'
import { DSM5TR, searchDSM } from '@/data/dsm5tr'
import Input from '@/components/ui/Input'
import { Lightbulb, AlertTriangle, Search } from 'lucide-react'

// ── Colores por capítulo ──────────────────────────────────────────────────────
const CHAPTER_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-red-100 text-red-700 border-red-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-lime-100 text-lime-700 border-lime-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-warm-100 text-warm-700 border-warm-200',
  'bg-slate-100 text-slate-700 border-slate-200',
]

const chapterColorMap = Object.fromEntries(
  DSM5TR.map((ch, i) => [ch.chapterId, CHAPTER_COLORS[i % CHAPTER_COLORS.length]])
)

// ── Componente: tarjeta de diagnóstico ────────────────────────────────────────
function DiagnosisCard({ diagnosis, chapterId, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const chipColor = chapterColorMap[chapterId] ?? 'bg-warm-100 text-warm-700 border-warm-200'

  const criteriaEntries = Object.entries(diagnosis.criteria ?? {})

  return (
    <div className="border border-warm-100 rounded-2xl overflow-hidden bg-white">
      {/* Cabecera */}
      <button
        className="w-full text-left px-4 py-3.5 hover:bg-warm-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-warm-900">{diagnosis.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${chipColor}`}>
                {diagnosis.icd10}
              </span>
              {diagnosis.dsm && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-100 text-warm-500 font-mono">
                  DSM {diagnosis.dsm}
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

          {/* Criterios */}
          {criteriaEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">Criterios diagnósticos</p>
              <div className="space-y-2">
                {criteriaEntries.map(([key, value]) => (
                  <div key={key} className="bg-white rounded-xl border border-warm-100 px-4 py-3">
                    <span className="inline-block text-xs font-bold text-primary-600 mb-1">
                      {key.length <= 2 ? `Criterio ${key}` : key}
                    </span>
                    <p className="text-sm text-warm-700 leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Especificadores */}
          {diagnosis.specifiers?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-2">Especificadores</p>
              <div className="flex flex-wrap gap-1.5">
                {diagnosis.specifiers.map((s, i) => (
                  <span key={i} className="text-xs bg-primary-50 text-primary-700 border border-primary-100 rounded-lg px-2.5 py-1">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notas clínicas */}
          {diagnosis.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1"><Lightbulb className="inline" size={12} strokeWidth={1.8} /> Nota clínica</p>
              <p className="text-sm text-amber-800 leading-relaxed">{diagnosis.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DSMReferencePage() {
  const [search, setSearch]           = useState('')
  const [filterChapter, setFilterChapter] = useState('all')

  const totalDiagnoses = DSM5TR.reduce((sum, ch) => sum + ch.diagnoses.length, 0)

  const filtered = useMemo(() => {
    const q = search.trim()
    if (q) {
      // Búsqueda global — agrupa resultados por capítulo
      const results = searchDSM(q)
      if (filterChapter !== 'all') return results.filter(d => d.chapterId === filterChapter)
      return results
    }
    // Sin búsqueda — filtrar por capítulo
    if (filterChapter !== 'all') {
      const ch = DSM5TR.find(c => c.chapterId === filterChapter)
      return (ch?.diagnoses ?? []).map(d => ({ ...d, chapterId: ch.chapterId }))
    }
    return null // null = mostrar vista agrupada por capítulo
  }, [search, filterChapter])

  // Cuando hay búsqueda o filtro por capítulo → lista plana
  // Cuando no hay nada → vista agrupada por capítulo
  const isGrouped = !filtered

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-warm-900">DSM-5-TR</h1>
            <p className="text-warm-500 text-sm mt-0.5">
              {DSM5TR.length} capítulos · {totalDiagnoses} diagnósticos · Edición 2022
            </p>
          </div>
          <div className="bg-primary-50 border border-primary-100 rounded-xl px-3 py-2 text-center shrink-0">
            <p className="text-lg font-bold text-primary-700">{totalDiagnoses}</p>
            <p className="text-[10px] text-primary-500 font-medium">diagnósticos</p>
          </div>
        </div>
        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700 leading-relaxed flex items-start gap-1.5">
          <AlertTriangle className="shrink-0 mt-0.5" size={12} strokeWidth={1.8} />
          <span>Referencia clínica resumida. Los criterios están parafraseados con fines educativos. Consulta el manual oficial (APA, 2022) para uso diagnóstico formal.</span>
        </div>
      </div>

      {/* Búsqueda */}
      <Input
        placeholder="Buscar diagnóstico, código ICD-10, criterio..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        prefix={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />

      {/* Filtro por capítulo */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterChapter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
            filterChapter === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
          }`}
        >
          Todos los capítulos
        </button>
        {DSM5TR.map(ch => (
          <button
            key={ch.chapterId}
            onClick={() => setFilterChapter(ch.chapterId)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              filterChapter === ch.chapterId ? 'bg-primary-600 text-white shadow-sm' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
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
                  defaultOpen={!!search}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Vista agrupada por capítulo (sin búsqueda, sin filtro) */}
      {isGrouped && (
        <div className="flex flex-col gap-8">
          {DSM5TR.map(chapter => (
            <div key={chapter.chapterId}>
              {/* Encabezado de capítulo */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${chapterColorMap[chapter.chapterId]}`}>
                  {chapter.diagnoses.length} diagnósticos
                </div>
                <h2 className="font-serif text-base font-bold text-warm-800">{chapter.chapter}</h2>
              </div>
              <div className="flex flex-col gap-2">
                {chapter.diagnoses.map(d => (
                  <DiagnosisCard key={d.id} diagnosis={d} chapterId={chapter.chapterId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
