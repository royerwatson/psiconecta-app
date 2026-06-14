/**
 * TherapeuticProtocolsPage
 * Guía de referencia de protocolos y técnicas terapéuticas para terapeutas.
 * Modalities: TCC · DBT · ACT · EMDR
 * Incluye búsqueda, filtro por modalidad, tarjetas expandibles con pasos detallados.
 */
import { useState, useMemo } from 'react'
import { PROTOCOLS, MODALITIES, MODALITY_MAP, MOD_COLOR, searchProtocols } from '@/data/therapeuticProtocols'
import { cn } from '@/lib/utils'
import { Timer, CheckCircle2, AlertTriangle, ClipboardList, Lightbulb, BookOpen, Search, Brain, Waves, Leaf, Eye } from 'lucide-react'

// ── Mapa de iconos de modalidad ───────────────────────────────────────────────
const MOD_ICON_MAP = { Brain, Waves, Leaf, Eye }
function ModalityIcon({ name, ...props }) {
  const Icon = MOD_ICON_MAP[name]
  return Icon ? <Icon {...props} /> : null
}

// ─── Helpers de color ────────────────────────────────────────────────────────

const MOD_BADGE = {
  TCC:  'bg-blue-100 text-blue-700 border border-blue-200',
  DBT:  'bg-teal-100 text-teal-700 border border-teal-200',
  ACT:  'bg-green-100 text-green-700 border border-green-200',
  EMDR: 'bg-purple-100 text-purple-700 border border-purple-200',
}

const DIFF_BADGE = {
  básico:        'bg-emerald-50 text-emerald-700',
  intermedio:    'bg-amber-50 text-amber-700',
  avanzado:      'bg-red-50 text-red-700',
  especializado: 'bg-purple-50 text-purple-700',
}

const MOD_STEP_COLOR = {
  TCC:  'bg-blue-600',
  DBT:  'bg-teal-600',
  ACT:  'bg-green-600',
  EMDR: 'bg-purple-600',
}

const MOD_STEP_LIGHT = {
  TCC:  'bg-blue-50 border-blue-100',
  DBT:  'bg-teal-50 border-teal-100',
  ACT:  'bg-green-50 border-green-100',
  EMDR: 'bg-purple-50 border-purple-100',
}

const MOD_HEADER = {
  TCC:  'from-blue-50 to-blue-100/50 border-blue-200',
  DBT:  'from-teal-50 to-teal-100/50 border-teal-200',
  ACT:  'from-green-50 to-green-100/50 border-green-200',
  EMDR: 'from-purple-50 to-purple-100/50 border-purple-200',
}

// ─── Componente de paso ──────────────────────────────────────────────────────

function StepItem({ step, index, modality }) {
  return (
    <div className={cn('flex gap-3 p-3.5 rounded-xl border', MOD_STEP_LIGHT[modality])}>
      <div className={cn(
        'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5',
        MOD_STEP_COLOR[modality]
      )}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-warm-800 text-sm mb-1">{step.title}</p>
        <p className="text-warm-600 text-sm leading-relaxed">{step.body}</p>
      </div>
    </div>
  )
}

// ─── Tarjeta de protocolo ─────────────────────────────────────────────────────

function ProtocolCard({ protocol, isOpen, onToggle }) {
  const mod = protocol.modality
  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-card overflow-hidden">

      {/* Cabecera (siempre visible) */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full text-left px-5 py-4 flex items-start gap-4 transition-colors',
          isOpen
            ? cn('bg-gradient-to-r border-b', MOD_HEADER[mod])
            : 'hover:bg-warm-50',
        )}
      >
        {/* Ícono de modalidad */}
        <div className="shrink-0 mt-0.5">
          <ModalityIcon name={MODALITY_MAP[mod]?.icon} size={22} strokeWidth={1.5} className="text-warm-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', MOD_BADGE[mod])}>
              {mod}
            </span>
            {protocol.difficulty && (
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', DIFF_BADGE[protocol.difficulty])}>
                {protocol.difficulty}
              </span>
            )}
            {protocol.sessions && (
              <span className="text-xs text-warm-400 bg-warm-50 border border-warm-100 px-2 py-0.5 rounded-full">
                <Timer size={11} strokeWidth={1.8} className="inline mr-0.5" />{protocol.sessions}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-warm-900 text-base leading-snug">{protocol.name}</h3>
          <p className="text-xs text-warm-500 mt-0.5 line-clamp-2">{protocol.indication}</p>
        </div>

        {/* Chevron */}
        <span className={cn(
          'shrink-0 text-warm-400 text-lg transition-transform duration-200 mt-1',
          isOpen && 'rotate-180'
        )}>
          ▾
        </span>
      </button>

      {/* Contenido expandido */}
      {isOpen && (
        <div className="px-5 py-5 flex flex-col gap-5 animate-fade-in">

          {/* Overview */}
          {protocol.overview && (
            <p className="text-warm-700 text-sm leading-relaxed">{protocol.overview}</p>
          )}

          {/* Indicaciones y contraindicaciones */}
          <div className="grid sm:grid-cols-2 gap-3">
            {protocol.indications && protocol.indications.length > 0 && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1"><CheckCircle2 size={11} strokeWidth={1.8} /> Indicado para</p>
                <ul className="flex flex-col gap-1">
                  {protocol.indications.map((ind, i) => (
                    <li key={i} className="text-xs text-green-800 flex items-start gap-1.5">
                      <span className="mt-1 shrink-0">•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {protocol.contraindications && protocol.contraindications.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1"><AlertTriangle size={11} strokeWidth={1.8} /> Precaución en</p>
                <ul className="flex flex-col gap-1">
                  {protocol.contraindications.map((c, i) => (
                    <li key={i} className="text-xs text-red-800 flex items-start gap-1.5">
                      <span className="mt-1 shrink-0">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pasos */}
          {protocol.steps && protocol.steps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                <ClipboardList size={13} strokeWidth={1.8} /> Protocolo paso a paso
              </p>
              <div className="flex flex-col gap-2">
                {protocol.steps.map((step, i) => (
                  <StepItem key={i} step={step} index={i} modality={mod} />
                ))}
              </div>
            </div>
          )}

          {/* Tips clínicos */}
          {protocol.tips && protocol.tips.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1"><Lightbulb size={12} strokeWidth={1.8} /> Tips clínicos</p>
              <ul className="flex flex-col gap-1.5">
                {protocol.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Referencia */}
          {protocol.reference && (
            <div className="flex items-start gap-2 pt-1 border-t border-warm-100">
              <BookOpen size={15} strokeWidth={1.8} className="text-warm-300 shrink-0" />
              <p className="text-xs text-warm-400 italic">{protocol.reference}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function TherapeuticProtocolsPage() {
  const [query, setQuery]             = useState('')
  const [activeModality, setMod]      = useState('all')
  const [openIds, setOpenIds]         = useState(new Set())

  const filtered = useMemo(() => {
    return searchProtocols(query, activeModality)
  }, [query, activeModality])

  const toggleCard = (id) => {
    setOpenIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => setOpenIds(new Set(filtered.map(p => p.id)))
  const collapseAll = () => setOpenIds(new Set())

  // Agrupar por modalidad para mostrar secciones separadas
  const grouped = useMemo(() => {
    if (activeModality !== 'all') return null
    const map = {}
    for (const p of filtered) {
      if (!map[p.modality]) map[p.modality] = []
      map[p.modality].push(p)
    }
    return map
  }, [filtered, activeModality])

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-8">

      {/* ── Encabezado ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-warm-900">Protocolos Terapéuticos</h1>
        <p className="text-warm-500 text-sm mt-1">
          Guías de aplicación clínica paso a paso · {PROTOCOLS.length} protocolos disponibles
        </p>
      </div>

      {/* ── Búsqueda ── */}
      <div className="relative mb-4">
        <Search size={15} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-300 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar protocolo, indicación o técnica…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-warm-200 bg-white text-sm text-warm-800 placeholder:text-warm-400 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-300 hover:text-warm-600 text-lg"
          >
            ×
          </button>
        )}
      </div>

      {/* ── Filtros por modalidad ── */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setMod('all')}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            activeModality === 'all'
              ? 'bg-warm-800 text-white shadow-sm'
              : 'bg-white border border-warm-200 text-warm-600 hover:border-warm-300'
          )}
        >
          Todos ({PROTOCOLS.length})
        </button>
        {MODALITIES.map(mod => (
          <button
            key={mod.id}
            onClick={() => setMod(mod.id)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              activeModality === mod.id
                ? `${MOD_COLOR[mod.color]?.tab ?? 'bg-warm-800 text-white'} shadow-sm`
                : 'bg-white border border-warm-200 text-warm-600 hover:border-warm-300'
            )}
          >
            <ModalityIcon name={mod.icon} size={13} strokeWidth={1.8} className="inline mr-1" />{mod.name} ({PROTOCOLS.filter(p => p.modality === mod.id).length})
          </button>
        ))}
      </div>

      {/* ── Controles expandir/contraer ── */}
      {filtered.length > 0 && (
        <div className="flex justify-end gap-3 mb-4">
          <button
            onClick={expandAll}
            className="text-xs text-warm-400 hover:text-primary-600 transition-colors"
          >
            Expandir todo
          </button>
          <span className="text-warm-200">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-warm-400 hover:text-primary-600 transition-colors"
          >
            Contraer todo
          </button>
        </div>
      )}

      {/* ── Sin resultados ── */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-warm-400">
          <Search size={40} strokeWidth={1.5} className="text-warm-300 mb-3 mx-auto" />
          <p className="font-medium">Sin resultados para "{query}"</p>
          <p className="text-sm mt-1 text-warm-300">Prueba con otro término o modalidad</p>
        </div>
      )}

      {/* ── Protocolos: vista filtrada por modalidad (lista plana) ── */}
      {activeModality !== 'all' && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(p => (
            <ProtocolCard
              key={p.id}
              protocol={p}
              isOpen={openIds.has(p.id)}
              onToggle={() => toggleCard(p.id)}
            />
          ))}
        </div>
      )}

      {/* ── Protocolos: vista "Todos" agrupada por modalidad ── */}
      {activeModality === 'all' && grouped && (
        <div className="flex flex-col gap-8">
          {MODALITIES.map(mod => {
            const list = grouped[mod.id] ?? []
            if (list.length === 0) return null
            return (
              <div key={mod.id}>
                {/* Separador de modalidad */}
                <div className="flex items-center gap-3 mb-3">
                  <ModalityIcon name={mod.icon} size={22} strokeWidth={1.5} className="text-warm-600" />
                  <div>
                    <h2 className="font-bold text-warm-800 text-lg">{mod.fullName}</h2>
                    <p className="text-xs text-warm-400">{mod.description}</p>
                  </div>
                  <div className="flex-1 h-px bg-warm-100 ml-2" />
                  <span className="text-xs text-warm-400 bg-warm-50 border border-warm-100 px-2 py-0.5 rounded-full shrink-0">
                    {list.length} protocolos
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {list.map(p => (
                    <ProtocolCard
                      key={p.id}
                      protocol={p}
                      isOpen={openIds.has(p.id)}
                      onToggle={() => toggleCard(p.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Nota al pie ── */}
      {filtered.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Nota clínica:</strong> Los protocolos aquí presentados son guías de referencia basadas en la literatura científica actualizada.
            Su aplicación debe adaptarse al caso individual, la alianza terapéutica y el juicio clínico del terapeuta.
            Se recomienda entrenamiento supervisado antes de implementar protocolos de alta complejidad (EMDR, DBT intensivo, EPR).
          </p>
        </div>
      )}
    </div>
  )
}
