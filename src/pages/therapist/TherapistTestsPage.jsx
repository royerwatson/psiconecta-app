/**
 * TherapistTestsPage — Centro de tests psicométricos del terapeuta.
 *
 * Tab 1 · CATÁLOGO
 *   - Todos los instrumentos activos en la BD (tabla `tests`)
 *   - Agrupados por categoría, con búsqueda por nombre y filtro de categoría
 *   - Cada tarjeta muestra: nombre, descripción, duración estimada,
 *     intervalo mínimo de reaplicación y número de ítems
 *
 * Tab 2 · APLICADOS
 *   - Todas las asignaciones que este terapeuta ha hecho a cualquier paciente
 *   - Join: test_assignments → therapeutic_relationships → patient profile
 *   - Filtros: texto (nombre paciente / test), estado, categoría
 *   - Clic en fila → PatientDetail del paciente
 *   - Clic en "Ver resultado" → TestResultPage
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Spinner'
import { formatDateTime } from '@/lib/utils'

// ── Constantes de dominio ─────────────────────────────────────────────────────
const CATEGORY_META = {
  sintomas:        { label: 'Síntomas',         color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400'    },
  personalidad:    { label: 'Personalidad',      color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-400'  },
  cognitivo:       { label: 'Cognitivo',         color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400'   },
  funcional:       { label: 'Funcional',         color: 'bg-green-100 text-green-700',    dot: 'bg-green-400'   },
  riesgo:          { label: 'Riesgo',            color: 'bg-red-100 text-red-700',        dot: 'bg-red-400'     },
  relacional:      { label: 'Relacional',        color: 'bg-pink-100 text-pink-700',      dot: 'bg-pink-400'    },
  neuropsicologia: { label: 'Neuropsicología',   color: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-400'  },
  infantil:        { label: 'Infantil',          color: 'bg-teal-100 text-teal-700',      dot: 'bg-teal-400'    },
}

const STATUS_META = {
  pending:     { label: 'Pendiente',   color: 'bg-amber-100 text-amber-700'  },
  in_progress: { label: 'En progreso', color: 'bg-blue-100 text-blue-700'    },
  completed:   { label: 'Completado',  color: 'bg-green-100 text-green-700'  },
  partial:     { label: 'Parcial',     color: 'bg-orange-100 text-orange-700'},
  expired:     { label: 'Vencido',     color: 'bg-red-100 text-red-700'      },
  cancelled:   { label: 'Cancelado',   color: 'bg-warm-100 text-warm-500'    },
}

// ── Chip de categoría ─────────────────────────────────────────────────────────
function CategoryChip({ category, small = false }) {
  const meta = CATEGORY_META[category] ?? { label: category, color: 'bg-warm-100 text-warm-600' }
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${
      small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
    } ${meta.color}`}>
      {meta.label}
    </span>
  )
}

// ── Tab: Catálogo ─────────────────────────────────────────────────────────────
function CatalogTab() {
  const [tests, setTests]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchTests() }, [])

  const fetchTests = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tests')
      .select('id, slug, name, description, category, estimated_minutes, min_reapplication_days, branches')
      .eq('is_active', true)
      .order('category')
      .order('name')
    setTests(data ?? [])
    setLoading(false)
  }

  const categories = useMemo(() => ['all', ...new Set((tests).map(t => t.category))], [tests])

  const filtered = useMemo(() => {
    let list = tests
    if (filterCat !== 'all') list = list.filter(t => t.category === filterCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }
    return list
  }, [tests, filterCat, search])

  // Agrupar por categoría para mostrar secciones
  const grouped = useMemo(() => {
    const map = {}
    for (const t of filtered) {
      if (!map[t.category]) map[t.category] = []
      map[t.category].push(t)
    }
    return map
  }, [filtered])

  const categoryOrder = ['sintomas', 'riesgo', 'personalidad', 'cognitivo', 'funcional', 'relacional', 'neuropsicologia', 'infantil']
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Búsqueda */}
      <Input
        placeholder="Buscar instrumento..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        prefix={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />

      {/* Filtros de categoría */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterCat === cat
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}
          >
            {cat === 'all' ? `Todos (${tests.length})` : `${CATEGORY_META[cat]?.label ?? cat} (${tests.filter(t=>t.category===cat).length})`}
          </button>
        ))}
      </div>

      {/* Resultados vacíos */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="font-semibold text-warm-700">Sin resultados</p>
          <p className="text-sm text-warm-400 mt-1">Prueba con otros términos o categoría</p>
          <button onClick={() => { setSearch(''); setFilterCat('all') }}
            className="mt-3 text-sm text-primary-600 font-medium">
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Grupos de categoría */}
      {sortedCategories.map(cat => (
        <div key={cat}>
          {/* Encabezado de categoría (solo cuando no hay filtro activo) */}
          {filterCat === 'all' && (
            <div className="flex items-center gap-2 mb-2 mt-2">
              <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_META[cat]?.dot ?? 'bg-warm-300'}`} />
              <h3 className="text-sm font-semibold text-warm-600 uppercase tracking-wide">
                {CATEGORY_META[cat]?.label ?? cat}
              </h3>
              <span className="text-xs text-warm-400">({grouped[cat].length})</span>
            </div>
          )}

          <div className="flex flex-col gap-2 stagger-children">
            {grouped[cat].map(test => {
              const isOpen = expanded === test.id
              return (
                <div key={test.id} className="border border-warm-100 rounded-2xl overflow-hidden bg-white">
                  <button
                    className="w-full text-left px-4 py-3.5 hover:bg-warm-50 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : test.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-warm-900">{test.name}</span>
                          <CategoryChip category={test.category} small />
                        </div>
                        {!isOpen && test.description && (
                          <p className="text-xs text-warm-500 mt-1 line-clamp-1">{test.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="text-xs text-warm-400">⏱ ~{test.estimated_minutes} min</span>
                          {test.min_reapplication_days && (
                            <span className="text-xs text-warm-400">🔄 Mín. {test.min_reapplication_days} días entre aplicaciones</span>
                          )}
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-warm-300 flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Panel expandido */}
                  {isOpen && (
                    <div className="border-t border-warm-100 px-4 py-4 bg-warm-50/40">
                      {test.description && (
                        <p className="text-sm text-warm-700 leading-relaxed mb-3">{test.description}</p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl p-3 border border-warm-100">
                          <p className="text-xs text-warm-400 uppercase font-semibold mb-1">Duración</p>
                          <p className="font-bold text-warm-800">~{test.estimated_minutes} min</p>
                        </div>
                        {test.min_reapplication_days && (
                          <div className="bg-white rounded-xl p-3 border border-warm-100">
                            <p className="text-xs text-warm-400 uppercase font-semibold mb-1">Reaplicación mín.</p>
                            <p className="font-bold text-warm-800">{test.min_reapplication_days} días</p>
                          </div>
                        )}
                        <div className="bg-white rounded-xl p-3 border border-warm-100">
                          <p className="text-xs text-warm-400 uppercase font-semibold mb-1">Categoría</p>
                          <CategoryChip category={test.category} small />
                        </div>
                      </div>
                      {test.branches && (
                        <p className="text-xs text-warm-400 mt-3 italic">
                          Este instrumento incluye ramificación condicional entre ítems.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Aplicados ────────────────────────────────────────────────────────────
function AppliedTab({ therapistId }) {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCat, setFilterCat]     = useState('all')

  useEffect(() => { fetchAll() }, [therapistId])

  const fetchAll = async () => {
    setLoading(true)

    // 1. Relaciones terapéuticas de este terapeuta
    const { data: rels } = await supabase
      .from('therapeutic_relationships')
      .select('id, patient_id')
      .eq('therapist_id', therapistId)

    if (!rels?.length) { setLoading(false); return }

    const relIds     = rels.map(r => r.id)
    const patientIds = [...new Set(rels.map(r => r.patient_id))]

    // 2. Perfiles de los pacientes involucrados
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', patientIds)

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

    // mapa relId → patient_id
    const relPatientMap = Object.fromEntries(rels.map(r => [r.id, r.patient_id]))

    // 3. Asignaciones de todas esas relaciones
    const { data } = await supabase
      .from('test_assignments')
      .select(`
        id, status, reason, assigned_at, due_at, completed_at, relationship_id,
        tests ( id, slug, name, category, estimated_minutes ),
        test_sessions ( id, status, completed_at )
      `)
      .in('relationship_id', relIds)
      .order('assigned_at', { ascending: false })

    // Enriquecer con datos del paciente
    const enriched = (data ?? []).map(a => ({
      ...a,
      patient: profileMap[relPatientMap[a.relationship_id]] ?? null,
    }))

    setAssignments(enriched)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let list = assignments
    if (filterStatus !== 'all') list = list.filter(a => a.status === filterStatus)
    if (filterCat !== 'all') list = list.filter(a => a.tests?.category === filterCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.patient?.full_name?.toLowerCase().includes(q) ||
        a.tests?.name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [assignments, filterStatus, filterCat, search])

  // Contar por estado para los badges del filtro
  const statusCounts = useMemo(() => {
    const c = {}
    for (const a of assignments) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [assignments])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-3">🧪</span>
        <p className="font-semibold text-warm-700">Aún no has asignado tests</p>
        <p className="text-sm text-warm-400 mt-1 max-w-xs leading-relaxed">
          Asigna instrumentos desde el perfil de cada paciente para verlos aquí.
        </p>
        <Button size="sm" className="mt-4" onClick={() => navigate('/therapist/patients')}>
          Ir a mis pacientes
        </Button>
      </div>
    )
  }

  const availableStatuses = [...new Set(assignments.map(a => a.status))]
  const availableCategories = [...new Set(assignments.map(a => a.tests?.category).filter(Boolean))]

  return (
    <div className="flex flex-col gap-4">

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { status: 'pending',     label: 'Pendientes',   bg: 'bg-amber-50  border-amber-100'  },
          { status: 'in_progress', label: 'En progreso',  bg: 'bg-blue-50   border-blue-100'   },
          { status: 'completed',   label: 'Completados',  bg: 'bg-green-50  border-green-100'  },
          { status: 'expired',     label: 'Vencidos',     bg: 'bg-red-50    border-red-100'    },
        ].map(({ status, label, bg }) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
            className={`border rounded-2xl p-3 text-center transition-all ${bg} ${
              filterStatus === status ? 'ring-2 ring-primary-400 ring-offset-1' : 'hover:shadow-sm'
            }`}
          >
            <p className="text-2xl font-bold text-warm-900">{statusCounts[status] ?? 0}</p>
            <p className="text-xs text-warm-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Búsqueda y filtros */}
      <Input
        placeholder="Buscar por paciente o instrumento..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        prefix={
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />

      <div className="flex gap-2 flex-wrap">
        {/* Filtro estado */}
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterStatus === 'all' ? 'bg-primary-600 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
          }`}
        >
          Todos los estados
        </button>
        {availableStatuses.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterStatus === s ? 'bg-primary-600 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}
          >
            {STATUS_META[s]?.label ?? s}
          </button>
        ))}
        {availableCategories.length > 1 && (
          <>
            <span className="text-warm-200 self-center">|</span>
            <button
              onClick={() => setFilterCat('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterCat === 'all' ? 'bg-primary-600 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              Todas las categorías
            </button>
            {availableCategories.map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterCat === c ? 'bg-primary-600 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
              >
                {CATEGORY_META[c]?.label ?? c}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Sin resultados tras filtrar */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="text-3xl mb-2">🔍</span>
          <p className="font-medium text-warm-700">Sin coincidencias</p>
          <button
            onClick={() => { setSearch(''); setFilterStatus('all'); setFilterCat('all') }}
            className="mt-2 text-sm text-primary-600 font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Lista de asignaciones */}
      <div className="flex flex-col gap-2 stagger-children">
        {filtered.map(a => {
          const session      = a.test_sessions?.[0] ?? null
          const statusMeta   = STATUS_META[a.status] ?? STATUS_META.pending
          const hasResult    = session?.status === 'completed'

          return (
            <Card key={a.id} padding={false}>
              <div className="flex items-center gap-4 px-4 py-3.5">
                {/* Avatar + nombre paciente */}
                <button
                  onClick={() => navigate(`/therapist/patients/${a.patient?.id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left group"
                >
                  <Avatar name={a.patient?.full_name ?? ''} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-warm-900 group-hover:text-primary-700 transition-colors truncate">
                      {a.patient?.full_name ?? 'Paciente'}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="font-medium text-xs text-warm-700 truncate">
                        {a.tests?.name}
                      </span>
                      <CategoryChip category={a.tests?.category} small />
                    </div>
                    <p className="text-xs text-warm-400 mt-0.5">
                      Asignado: {formatDateTime(a.assigned_at)}
                      {a.due_at && ` · Vence: ${formatDateTime(a.due_at)}`}
                    </p>
                  </div>
                </button>

                {/* Estado + acción */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusMeta.color}`}>
                    {statusMeta.label}
                  </span>
                  {hasResult && (
                    <button
                      onClick={() => navigate(`/therapist/test-result/${session.id}`)}
                      className="text-xs text-primary-600 font-semibold hover:text-primary-800 transition-colors"
                    >
                      Ver resultado →
                    </button>
                  )}
                </div>
              </div>

              {/* Razón clínica */}
              {a.reason && (
                <div className="px-4 pb-3 -mt-1">
                  <p className="text-xs text-warm-500 italic border-t border-warm-50 pt-2">
                    "{a.reason}"
                  </p>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function TherapistTestsPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState('catalog')

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Tests psicométricos</h1>
        <p className="text-warm-500 text-sm mt-1">
          Explora el catálogo de instrumentos o revisa los que has aplicado a tus pacientes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-warm-100 rounded-2xl p-1 gap-1">
        {[
          { key: 'catalog', label: '📚 Catálogo' },
          { key: 'applied', label: '🧪 Aplicados' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-warm-500 hover:text-warm-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido de tab */}
      {tab === 'catalog' ? (
        <CatalogTab />
      ) : (
        <AppliedTab therapistId={user?.id} />
      )}
    </div>
  )
}
