/**
 * SafetyPlanPage — Plan de Seguridad / Crisis para terapeutas.
 * Basado en el modelo Stanley-Brown Safety Planning Intervention (2012).
 * 6 pasos + razones para vivir + notas clínicas.
 * Guardado en Supabase · Impresión · Soporte para múltiples planes por paciente.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Zap, Wind, Users, Handshake, Stethoscope, Home, Shield, Phone, AlertTriangle } from 'lucide-react'

// ── Líneas de crisis de referencia ────────────────────────────────────────────
const CRISIS_LINES = [
  { country: 'México',       line: '800 290 0024',      name: 'SAPTEL (24 h)'           },
  { country: 'Colombia',     line: '106',               name: 'Línea 106'               },
  { country: 'Argentina',    line: '135',               name: 'Centro de Asistencia'    },
  { country: 'España',       line: '024',               name: 'Línea de atención crisis' },
  { country: 'Venezuela',    line: '0212-862-8835',     name: 'SOAR'                    },
  { country: 'Chile',        line: '600 360 7777',      name: 'ACHS Crisis'             },
  { country: 'Perú',         line: '113',               name: 'MINSA Salud Mental'      },
  { country: 'Internacional',line: 'findahelpline.com', name: 'Find A Helpline'         },
]

// ── Pasos del plan Stanley-Brown ──────────────────────────────────────────────
const STEPS = [
  {
    num: 1, key: 'warning_signs', color: 'amber',
    Icon: Zap, title: 'Señales de alerta',
    hint: 'Pensamientos, imágenes, estados de ánimo, situaciones o comportamientos que suelen preceder una crisis.',
    placeholder: 'p. ej. Pensar "nadie me necesita", aislarse, no dormir…',
    type: 'text',
  },
  {
    num: 2, key: 'internal_coping', color: 'blue',
    Icon: Wind, title: 'Estrategias internas de afrontamiento',
    hint: 'Cosas que el/la paciente puede hacer por sí solo/a para distraerse de los pensamientos de crisis.',
    placeholder: 'p. ej. Escuchar música, caminar, técnica 5-4-3-2-1…',
    type: 'text',
  },
  {
    num: 3, key: 'social_contacts', color: 'teal',
    Icon: Users, title: 'Contactos sociales para distracción',
    hint: 'Personas y lugares que pueden distraer al/la paciente de la crisis (no necesariamente conscientes del plan).',
    placeholder: 'Nombre',
    type: 'contact',
    fields: ['name', 'phone'],
    labels: ['Nombre', 'Teléfono'],
  },
  {
    num: 4, key: 'support_people', color: 'purple',
    Icon: Handshake, title: 'Personas a quienes pedir ayuda',
    hint: 'Familiares o amigos de confianza a quienes el/la paciente puede llamar cuando está en crisis.',
    placeholder: 'Nombre',
    type: 'contact',
    fields: ['name', 'phone', 'relation'],
    labels: ['Nombre', 'Teléfono', 'Relación'],
  },
  {
    num: 5, key: 'professionals', color: 'rose',
    Icon: Stethoscope, title: 'Profesionales y servicios de crisis',
    hint: 'Terapeuta, psiquiatra, líneas de crisis. Incluye el número de emergencias local.',
    placeholder: 'Nombre / Servicio',
    type: 'contact',
    fields: ['name', 'phone', 'role'],
    labels: ['Nombre / Servicio', 'Teléfono / Dirección', 'Rol'],
  },
  {
    num: 6, key: 'safe_environment', color: 'green',
    Icon: Home, title: 'Hacer el entorno seguro',
    hint: 'Pasos concretos para reducir el acceso a medios letales (medicamentos, armas, etc.).',
    placeholder: 'p. ej. Entregar los medicamentos a un familiar de confianza…',
    type: 'text',
  },
]

// ── Paleta de colores por paso ────────────────────────────────────────────────
const STEP_COLOR = {
  amber:  { border: 'border-amber-300',  bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-800',  num: 'bg-amber-400 text-white'  },
  blue:   { border: 'border-blue-300',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-800',    num: 'bg-blue-500 text-white'   },
  teal:   { border: 'border-teal-300',   bg: 'bg-teal-50',   badge: 'bg-teal-100 text-teal-800',    num: 'bg-teal-500 text-white'   },
  purple: { border: 'border-purple-300', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800', num: 'bg-purple-500 text-white' },
  rose:   { border: 'border-rose-300',   bg: 'bg-rose-50',   badge: 'bg-rose-100 text-rose-800',    num: 'bg-rose-500 text-white'   },
  green:  { border: 'border-green-300',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-800',  num: 'bg-green-500 text-white'  },
}

// ── Estado inicial del plan ───────────────────────────────────────────────────
const EMPTY_PLAN = {
  warning_signs:    [''],
  internal_coping:  [''],
  social_contacts:  [{ name: '', phone: '' }],
  support_people:   [{ name: '', phone: '', relation: '' }],
  professionals:    [{ name: '', phone: '', role: '' }],
  safe_environment: [''],
  reasons_to_live:  [''],
  notes:            '',
}

// ── Lista de texto dinámica ───────────────────────────────────────────────────
function DynamicTextList({ items, onChange, placeholder }) {
  const add    = () => onChange([...items, ''])
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i, val) => { const n = [...items]; n[i] = val; onChange(n) }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="w-5 h-5 rounded-full bg-warm-200 text-warm-500 text-[10px] font-bold flex items-center justify-center shrink-0">
            {i + 1}
          </span>
          <input
            value={item}
            onChange={e => update(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-sm border border-warm-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
          />
          {items.length > 1 && (
            <button onClick={() => remove(i)}
              className="p-1.5 text-warm-300 hover:text-red-400 transition-colors shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-800 mt-1 transition-colors">
        <span className="w-4 h-4 rounded-full border border-primary-400 flex items-center justify-center text-[10px]">+</span>
        Agregar ítem
      </button>
    </div>
  )
}

// ── Lista de contactos dinámica ───────────────────────────────────────────────
function DynamicContactList({ items, onChange, fields, labels }) {
  const empty = Object.fromEntries(fields.map(f => [f, '']))
  const add    = () => onChange([...items, { ...empty }])
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  const update = (i, field, val) => {
    const n = [...items]; n[i] = { ...n[i], [field]: val }; onChange(n)
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-warm-100 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-warm-400">Contacto {i + 1}</span>
            {items.length > 1 && (
              <button onClick={() => remove(i)}
                className="text-warm-300 hover:text-red-400 transition-colors text-xs">
                Eliminar
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fields.map((field, fi) => (
              <input
                key={field}
                value={item[field] ?? ''}
                onChange={e => update(i, field, e.target.value)}
                placeholder={labels[fi]}
                className={cn(
                  'text-sm border border-warm-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white',
                  fi === 0 && fields.length % 2 !== 0 ? 'sm:col-span-2' : '',
                )}
              />
            ))}
          </div>
        </div>
      ))}
      <button onClick={add}
        className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-800 transition-colors">
        <span className="w-4 h-4 rounded-full border border-primary-400 flex items-center justify-center text-[10px]">+</span>
        Agregar contacto
      </button>
    </div>
  )
}

// ── Sección de un paso ────────────────────────────────────────────────────────
function PlanStep({ step, value, onChange }) {
  const sc = STEP_COLOR[step.color]
  const StepIcon = step.Icon
  return (
    <div className={cn('border-l-4 rounded-r-2xl rounded-l-sm bg-white overflow-hidden', sc.border)}>
      <div className={cn('px-4 py-3', sc.bg)}>
        <div className="flex items-center gap-2">
          <span className={cn('w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0', sc.num)}>
            {step.num}
          </span>
          <StepIcon size={16} strokeWidth={1.8} />
          <h3 className="font-serif font-semibold text-warm-900 text-sm">{step.title}</h3>
        </div>
        <p className="text-xs text-warm-500 leading-relaxed mt-1 ml-8">{step.hint}</p>
      </div>
      <div className="px-4 py-4">
        {step.type === 'text' ? (
          <DynamicTextList
            items={value}
            onChange={onChange}
            placeholder={step.placeholder}
          />
        ) : (
          <DynamicContactList
            items={value}
            onChange={onChange}
            fields={step.fields}
            labels={step.labels}
          />
        )}
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function SafetyPlanPage() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const printRef = useRef()

  const [patients,        setPatients]        = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [existingPlans,   setExistingPlans]   = useState([])
  const [activePlanId,    setActivePlanId]    = useState(null)
  const [plan,            setPlan]            = useState(EMPTY_PLAN)
  const [saving,          setSaving]          = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadingPlan,     setLoadingPlan]     = useState(false)
  const [showCrisisLines, setShowCrisisLines] = useState(false)

  // ── Cargar pacientes activos ─────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      const { data: rels } = await supabase
        .from('therapeutic_relationships')
        .select('patient_id')
        .eq('therapist_id', user.id)
        .eq('status', 'active')

      if (!rels?.length) { setLoadingPatients(false); return }
      const ids = rels.map(r => r.patient_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', ids)
        .order('full_name')
      setPatients(profiles ?? [])
      setLoadingPatients(false)

      // Pre-seleccionar si viene con ?patientId=...
      const pid = searchParams.get('patientId')
      if (pid && profiles?.find(p => p.id === pid)) selectPatient(pid, profiles)
    }
    fetch()
  }, [user.id])

  // ── Seleccionar paciente ─────────────────────────────────────────────────
  const selectPatient = async (patientId, patientList = patients) => {
    const p = patientList.find(p => p.id === patientId)
    if (!p) return
    setSelectedPatient(p)
    setLoadingPlan(true)
    setActivePlanId(null)
    setPlan(EMPTY_PLAN)

    const { data } = await supabase
      .from('safety_plans')
      .select('*')
      .eq('patient_id', patientId)
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false })

    setExistingPlans(data ?? [])
    if (data?.length) {
      loadPlan(data[0])
    }
    setLoadingPlan(false)
  }

  // ── Cargar plan existente ────────────────────────────────────────────────
  const loadPlan = (row) => {
    setActivePlanId(row.id)
    setPlan({
      warning_signs:    row.warning_signs    ?? [''],
      internal_coping:  row.internal_coping  ?? [''],
      social_contacts:  row.social_contacts  ?? [{ name: '', phone: '' }],
      support_people:   row.support_people   ?? [{ name: '', phone: '', relation: '' }],
      professionals:    row.professionals    ?? [{ name: '', phone: '', role: '' }],
      safe_environment: row.safe_environment ?? [''],
      reasons_to_live:  row.reasons_to_live  ?? [''],
      notes:            row.notes            ?? '',
    })
  }

  // ── Actualizar campo del plan ────────────────────────────────────────────
  const updateField = useCallback((key, value) => {
    setPlan(prev => ({ ...prev, [key]: value }))
  }, [])

  // ── Guardar plan ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedPatient) return toast.error('Selecciona un paciente')
    setSaving(true)

    const payload = {
      therapist_id:    user.id,
      patient_id:      selectedPatient.id,
      warning_signs:   plan.warning_signs.filter(Boolean),
      internal_coping: plan.internal_coping.filter(Boolean),
      social_contacts: plan.social_contacts.filter(c => c.name || c.phone),
      support_people:  plan.support_people.filter(c => c.name || c.phone),
      professionals:   plan.professionals.filter(c => c.name || c.phone),
      safe_environment:plan.safe_environment.filter(Boolean),
      reasons_to_live: plan.reasons_to_live.filter(Boolean),
      notes:           plan.notes.trim() || null,
      updated_at:      new Date().toISOString(),
    }

    let error
    if (activePlanId) {
      ;({ error } = await supabase
        .from('safety_plans')
        .update(payload)
        .eq('id', activePlanId))
    } else {
      const { data, error: err } = await supabase
        .from('safety_plans')
        .insert(payload)
        .select()
        .single()
      error = err
      if (data) {
        setActivePlanId(data.id)
        setExistingPlans(prev => [data, ...prev])
      }
    }

    setSaving(false)
    if (error) {
      console.error(error)
      toast.error('Error al guardar. Verifica que la tabla "safety_plans" exista en Supabase.')
    } else {
      toast.success('Plan de seguridad guardado correctamente')
    }
  }

  // ── Nuevo plan ────────────────────────────────────────────────────────────
  const handleNewPlan = () => {
    setActivePlanId(null)
    setPlan(EMPTY_PLAN)
  }

  // ── Imprimir ─────────────────────────────────────────────────────────────
  const handlePrint = () => window.print()

  // ── Selector de pacientes ─────────────────────────────────────────────────
  if (!selectedPatient) {
    return (
      <div className="flex flex-col gap-6 animate-fade-in">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Plan de seguridad</h1>
          <p className="text-warm-500 text-sm mt-0.5">
            Intervención Stanley-Brown · Protocolo para pacientes de alto riesgo
          </p>
        </div>

        {/* Info del modelo */}
        <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-xs text-rose-800 leading-relaxed flex items-start gap-1.5">
          <Shield className="shrink-0 mt-0.5" size={12} strokeWidth={1.8} />
          <span><span className="font-semibold">Safety Planning Intervention (Stanley & Brown, 2012)</span> —
          Protocolo basado en evidencia para pacientes con ideación suicida activa o factores de riesgo
          elevados. Completa el plan en colaboración con el/la paciente durante o después de la sesión.</span>
        </div>

        {/* Selección de paciente */}
        <div className="bg-white border border-warm-100 rounded-2xl p-5">
          <p className="font-semibold text-warm-800 text-sm mb-3">Seleccionar paciente</p>
          {loadingPatients ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-warm-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : patients.length === 0 ? (
            <p className="text-sm text-warm-400 text-center py-6">
              No tienes pacientes activos actualmente.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {patients.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-warm-100 hover:border-primary-200 hover:bg-primary-50 transition-all text-left group"
                >
                  <Avatar name={p.full_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800">{p.full_name}</p>
                  </div>
                  <svg className="w-4 h-4 text-warm-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Líneas de crisis */}
        <div className="bg-white border border-warm-100 rounded-2xl p-5">
          <button
            onClick={() => setShowCrisisLines(v => !v)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Phone size={16} strokeWidth={1.8} className="text-warm-500" />
              <span className="font-semibold text-warm-800 text-sm">Líneas de crisis de referencia</span>
            </div>
            <svg className={cn('w-4 h-4 text-warm-400 transition-transform', showCrisisLines && 'rotate-180')}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCrisisLines && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CRISIS_LINES.map((cl, i) => (
                <div key={i} className="flex items-center gap-3 bg-warm-50 rounded-xl px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-warm-700">{cl.name}</p>
                    <p className="text-[10px] text-warm-400">{cl.country}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary-600">{cl.line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Formulario del plan ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 animate-fade-in" ref={printRef}>

      {/* Header */}
      <div className="bg-white border border-warm-100 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedPatient(null); setActivePlanId(null); setPlan(EMPTY_PLAN) }}
            className="p-1.5 rounded-lg hover:bg-warm-100 transition-colors shrink-0"
          >
            <svg className="w-4 h-4 text-warm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Avatar name={selectedPatient.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-warm-900 text-sm">{selectedPatient.full_name}</p>
            <p className="text-xs text-warm-400">Plan de seguridad · {activePlanId ? 'Editando plan existente' : 'Nuevo plan'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              title="Imprimir"
              className="p-2 rounded-xl border border-warm-200 hover:bg-warm-50 transition-colors text-warm-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Planes existentes */}
        {existingPlans.length > 1 && (
          <div className="mt-3 pt-3 border-t border-warm-100">
            <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider mb-2">Planes guardados</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleNewPlan}
                className={cn('text-xs px-3 py-1.5 rounded-full border transition-all',
                  !activePlanId ? 'bg-primary-600 text-white border-primary-600' : 'border-warm-200 text-warm-500 hover:border-warm-400'
                )}
              >
                + Nuevo
              </button>
              {existingPlans.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadPlan(p)}
                  className={cn('text-xs px-3 py-1.5 rounded-full border transition-all',
                    activePlanId === p.id ? 'bg-primary-600 text-white border-primary-600' : 'border-warm-200 text-warm-500 hover:border-warm-400'
                  )}
                >
                  {format(new Date(p.created_at), "d MMM yyyy", { locale: es })}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loadingPlan ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-warm-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Aviso clínico */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed flex items-start gap-1.5">
            <AlertTriangle className="shrink-0 mt-0.5" size={12} strokeWidth={1.8} />
            <span><span className="font-semibold">Completa este plan en colaboración con el/la paciente</span> —
            la participación activa aumenta significativamente su efectividad. Revísalo en cada sesión.</span>
          </div>

          {/* Los 6 pasos */}
          {STEPS.map(step => (
            <PlanStep
              key={step.key}
              step={step}
              value={plan[step.key]}
              onChange={val => updateField(step.key, val)}
            />
          ))}

          {/* Razones para vivir */}
          <div className="border-l-4 border-primary-400 rounded-r-2xl rounded-l-sm bg-white overflow-hidden">
            <div className="bg-primary-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">+</span>
                <h3 className="font-serif font-semibold text-warm-900 text-sm">Razones para vivir</h3>
              </div>
              <p className="text-xs text-warm-500 leading-relaxed mt-1 ml-8">
                Cosas, personas o metas que el/la paciente considera importantes y que hacen que la vida valga la pena.
                Este paso es fundamental — referirse a él durante los momentos de crisis.
              </p>
            </div>
            <div className="px-4 py-4">
              <DynamicTextList
                items={plan.reasons_to_live}
                onChange={val => updateField('reasons_to_live', val)}
                placeholder="p. ej. Mis hijos, terminar mi carrera, ver el mar otra vez…"
              />
            </div>
          </div>

          {/* Líneas de crisis de referencia */}
          <div className="bg-white border border-warm-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone size={14} strokeWidth={1.8} className="text-warm-400" />
              <p className="text-xs font-bold text-warm-500 uppercase tracking-wider">Líneas de crisis — referencia rápida</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CRISIS_LINES.slice(0, 4).map((cl, i) => (
                <div key={i} className="bg-warm-50 rounded-xl px-3 py-2 text-center">
                  <p className="text-xs font-mono font-bold text-primary-700">{cl.line}</p>
                  <p className="text-[10px] text-warm-400 mt-0.5">{cl.country}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCrisisLines(v => !v)}
              className="text-xs text-primary-600 mt-2 hover:text-primary-800 transition-colors">
              {showCrisisLines ? 'Ver menos' : 'Ver todas las líneas →'}
            </button>
            {showCrisisLines && (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CRISIS_LINES.slice(4).map((cl, i) => (
                  <div key={i} className="bg-warm-50 rounded-xl px-3 py-2 text-center">
                    <p className="text-xs font-mono font-bold text-primary-700">{cl.line}</p>
                    <p className="text-[10px] text-warm-400 mt-0.5">{cl.country}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas clínicas */}
          <div className="bg-white border border-warm-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-3">Notas clínicas adicionales</p>
            <textarea
              value={plan.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="Observaciones, próxima revisión del plan, acuerdos específicos con el/la paciente…"
              rows={3}
              className="w-full text-sm border border-warm-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          </div>

          {/* Guardar */}
          <div className="flex gap-3 pb-4">
            <button
              onClick={handleNewPlan}
              className="px-4 py-2.5 rounded-xl border border-warm-200 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando…' : activePlanId ? 'Actualizar plan' : 'Guardar plan'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
