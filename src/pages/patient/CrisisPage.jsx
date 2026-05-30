/**
 * CrisisPage — Página de apoyo en crisis para el paciente.
 *
 * Secciones:
 *   1. Anclaje inmediato — ejercicio de respiración 4-7-8 animado
 *   2. Plan de seguridad personal (safety_plans del terapeuta, si existe)
 *   3. Líneas de crisis internacionales
 *   4. Acceso rápido al chat con terapeuta
 *
 * Diseño: tranquilizador, sin rojo agresivo, tonos azul-calma.
 * La página es accesible sin sesión activa de video — siempre disponible.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'

// ─── Líneas de crisis ─────────────────────────────────────────────────────────

const CRISIS_LINES = [
  { country: 'México',        flag: '🇲🇽', name: 'SAPTEL',                    number: '55 5259-8121',  available: '24/7' },
  { country: 'Colombia',      flag: '🇨🇴', name: 'Línea 106',                  number: '106',           available: '24/7' },
  { country: 'Argentina',     flag: '🇦🇷', name: 'Centro de Asistencia',       number: '135',           available: '24/7' },
  { country: 'España',        flag: '🇪🇸', name: 'Teléfono Esperanza',         number: '717 003 717',   available: '24/7' },
  { country: 'Venezuela',     flag: '🇻🇪', name: 'CEDHA',                      number: '0800-CEDHA00',  available: 'L-V' },
  { country: 'Chile',         flag: '🇨🇱', name: 'Salud Responde',             number: '600 360 7777',  available: '24/7' },
  { country: 'Perú',          flag: '🇵🇪', name: 'Línea 113',                  number: '113',           available: '24/7' },
  { country: 'Ecuador',       flag: '🇪🇨', name: 'Línea 171',                  number: '171',           available: '24/7' },
  { country: 'Internacional', flag: '🌐', name: 'Crisis Text Line (en inglés)', number: 'Text HOME → 741741', available: '24/7' },
]

// ─── Respiración 4-7-8 ───────────────────────────────────────────────────────

const BREATH_PHASES = [
  { label: 'Inhala', duration: 4,  color: 'from-calm-400 to-primary-500' },
  { label: 'Sostén',  duration: 7,  color: 'from-primary-500 to-calm-600' },
  { label: 'Exhala', duration: 8,  color: 'from-calm-600 to-calm-400'    },
]

function BreathingExercise() {
  const [active, setActive]     = useState(false)
  const [phase, setPhase]       = useState(0)
  const [seconds, setSeconds]   = useState(0)
  const [cycles, setCycles]     = useState(0)
  const intervalRef             = useRef(null)

  const stop = () => {
    clearInterval(intervalRef.current)
    setActive(false)
    setPhase(0)
    setSeconds(0)
  }

  const start = () => {
    setActive(true)
    setPhase(0)
    setSeconds(0)
    setCycles(0)
  }

  useEffect(() => {
    if (!active) return
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        const duration = BREATH_PHASES[phase].duration
        if (prev + 1 >= duration) {
          const nextPhase = (phase + 1) % BREATH_PHASES.length
          setPhase(nextPhase)
          if (nextPhase === 0) setCycles(c => c + 1)
          return 0
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [active, phase])

  useEffect(() => { if (cycles >= 4) stop() }, [cycles])

  const currentPhase = BREATH_PHASES[phase]
  const progress = active ? ((seconds + 1) / currentPhase.duration) * 100 : 0
  const scale = active
    ? phase === 0 ? 1 + (seconds / currentPhase.duration) * 0.4
      : phase === 1 ? 1.4
      : 1.4 - (seconds / currentPhase.duration) * 0.4
    : 1

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Círculo animado */}
      <div className="relative flex items-center justify-center w-40 h-40">
        {/* Anillo de progreso SVG */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="72" fill="none" stroke="#e8f0fe" strokeWidth="6" />
          {active && (
            <circle
              cx="80" cy="80" r="72"
              fill="none"
              stroke="#4f87f7"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 72}`}
              strokeDashoffset={`${2 * Math.PI * 72 * (1 - progress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          )}
        </svg>

        {/* Círculo interior con escala */}
        <div
          className={cn(
            'w-24 h-24 rounded-full flex flex-col items-center justify-center transition-transform duration-1000',
            active ? 'bg-gradient-to-br from-calm-400 to-primary-500' : 'bg-primary-100'
          )}
          style={{ transform: `scale(${scale})` }}
        >
          {active ? (
            <>
              <span className="text-white font-bold text-2xl leading-none">
                {currentPhase.duration - seconds}
              </span>
              <span className="text-white/80 text-xs font-medium mt-0.5">
                {currentPhase.label}
              </span>
            </>
          ) : (
            <span className="text-primary-400 text-3xl">🌬️</span>
          )}
        </div>
      </div>

      {!active ? (
        <div className="text-center">
          <p className="text-sm text-warm-600 mb-3">
            La respiración 4-7-8 activa tu sistema nervioso parasimpático y reduce la ansiedad en minutos.
          </p>
          <Button onClick={start} size="sm">
            Iniciar respiración guiada
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-medium text-warm-700">{currentPhase.label}…</p>
          <p className="text-xs text-warm-400 mt-1">Ciclo {cycles + 1} de 4</p>
          <button onClick={stop} className="text-xs text-warm-400 hover:text-warm-600 mt-3 transition-colors">
            Detener
          </button>
        </div>
      )}

      {cycles >= 4 && !active && (
        <p className="text-sm text-success font-medium text-center">
          ✅ ¡Bien hecho! Tu sistema nervioso está más regulado ahora.
        </p>
      )}
    </div>
  )
}

// ─── Sección del plan de seguridad ───────────────────────────────────────────

function SafetyPlanSection({ plan }) {
  const sections = [
    { key: 'warning_signs',   icon: '⚠️', label: 'Mis señales de alerta',           type: 'list'    },
    { key: 'internal_coping', icon: '🧘', label: 'Lo que puedo hacer solo/a',        type: 'list'    },
    { key: 'social_contacts', icon: '👥', label: 'Personas a quienes llamar',        type: 'contact' },
    { key: 'support_people',  icon: '🤝', label: 'Profesionales de apoyo',           type: 'contact' },
    { key: 'safe_environment',icon: '🏠', label: 'Cómo hacer mi entorno más seguro', type: 'list'    },
    { key: 'reasons_to_live', icon: '💙', label: 'Mis razones para seguir',          type: 'list'    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {sections.map(({ key, icon, label, type }) => {
        const value = plan[key]
        if (!value || (Array.isArray(value) && value.length === 0)) return null

        return (
          <div key={key} className="bg-white rounded-2xl border border-warm-100 p-4 shadow-card">
            <p className="text-sm font-semibold text-warm-800 mb-2">{icon} {label}</p>
            {type === 'list' && Array.isArray(value) && (
              <ul className="flex flex-col gap-1.5">
                {value.filter(Boolean).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-warm-700">
                    <span className="text-primary-400 mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {type === 'contact' && Array.isArray(value) && (
              <ul className="flex flex-col gap-2">
                {value.filter(v => v?.name).map((c, i) => (
                  <li key={i} className="flex items-center justify-between bg-warm-50 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-warm-800">{c.name}</p>
                      {c.relationship && <p className="text-xs text-warm-400">{c.relationship}</p>}
                    </div>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-1.5 bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        📞 {c.phone}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function CrisisPage() {
  const { user }  = useAuthStore()
  const navigate  = useNavigate()
  const [plan, setPlan]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [section, setSection]   = useState('breathe') // 'breathe' | 'plan' | 'lines'

  useEffect(() => { if (user) fetchPlan() }, [user])

  const fetchPlan = async () => {
    const { data } = await supabase
      .from('safety_plans')
      .select('*')
      .eq('patient_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setPlan(data ?? null)
    setLoading(false)
  }

  const TABS = [
    { id: 'breathe', label: '🌬️ Respirar',       show: true       },
    { id: 'plan',    label: '📋 Mi plan',          show: !!plan     },
    { id: 'lines',   label: '📞 Líneas de ayuda',  show: true       },
  ].filter(t => t.show)

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-10">

      {/* Banner de anclaje */}
      <div className="bg-gradient-to-br from-calm-500 to-primary-600 rounded-2xl p-6 mb-6 text-white text-center shadow-float">
        <p className="text-3xl mb-2">💙</p>
        <h1 className="font-serif text-2xl font-bold mb-1">Estás a salvo</h1>
        <p className="text-white/80 text-sm leading-relaxed">
          Estás dando el paso más importante: pedir ayuda.<br />
          Tómate un momento. Estamos aquí contigo.
        </p>
      </div>

      {/* Acceso rápido al chat */}
      <button
        onClick={() => navigate('/patient/chat')}
        className="w-full flex items-center gap-4 bg-white border-2 border-primary-200 rounded-2xl px-5 py-4 mb-6 hover:border-primary-400 hover:bg-primary-50 transition-all shadow-card"
      >
        <span className="text-3xl shrink-0">💬</span>
        <div className="flex-1 text-left">
          <p className="font-semibold text-warm-900 text-sm">Escríbele a tu terapeuta ahora</p>
          <p className="text-xs text-warm-500 mt-0.5">
            Puedes contactarle en cualquier momento por chat
          </p>
        </div>
        <svg className="w-5 h-5 text-primary-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-100 p-1 rounded-2xl mb-5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className={cn(
              'flex-1 text-xs font-semibold py-2.5 rounded-xl transition-all',
              section === t.id
                ? 'bg-white shadow-sm text-primary-700'
                : 'text-warm-500 hover:text-warm-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sección: Respiración */}
      {section === 'breathe' && (
        <div className="bg-white rounded-2xl border border-warm-100 shadow-card p-6 animate-fade-in">
          <h2 className="font-serif text-lg font-semibold text-warm-900 text-center mb-1">
            Respiración 4-7-8
          </h2>
          <p className="text-xs text-warm-500 text-center mb-5">
            Cuatro ciclos reducen la ansiedad aguda en minutos
          </p>
          <BreathingExercise />

          <div className="mt-6 pt-5 border-t border-warm-100">
            <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">
              También puedes probar
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '🧊', title: 'Técnica 5-4-3-2-1', desc: '5 cosas que ves, 4 que tocas, 3 que escuchas, 2 que hueles, 1 que saboreas' },
                { icon: '💧', title: 'Agua fría', desc: 'Pon tus muñecas bajo agua fría por 30 segundos para activar el reflejo de buceo' },
                { icon: '🦋', title: 'Abrazo mariposa', desc: 'Cruza los brazos sobre el pecho y alterna golpecitos suaves izquierda-derecha' },
                { icon: '🙏', title: 'TIPP (DBT)', desc: 'Temperatura fría · Ejercicio intenso corto · Respiración pausada · Relajación progresiva' },
              ].map((tip, i) => (
                <div key={i} className="bg-warm-50 border border-warm-100 rounded-xl p-3">
                  <p className="text-base mb-1">{tip.icon}</p>
                  <p className="text-xs font-semibold text-warm-800">{tip.title}</p>
                  <p className="text-xs text-warm-500 mt-0.5 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sección: Plan de seguridad */}
      {section === 'plan' && (
        <div className="animate-fade-in">
          {loading ? (
            <div className="bg-white rounded-2xl border border-warm-100 p-8 text-center text-warm-400">
              <p className="text-3xl mb-2">⏳</p>
              <p className="text-sm">Cargando tu plan…</p>
            </div>
          ) : plan ? (
            <>
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 mb-4 text-center">
                <p className="text-xs text-primary-700 font-medium">
                  📋 Plan elaborado con tu terapeuta · Sigue los pasos en orden
                </p>
              </div>
              <SafetyPlanSection plan={plan} />
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-warm-100 p-8 text-center shadow-card">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-semibold text-warm-800 mb-1">Aún no tienes un plan de seguridad</p>
              <p className="text-sm text-warm-500 mb-4">
                Pídele a tu terapeuta que creen uno juntos. Es una herramienta muy valiosa para momentos difíciles.
              </p>
              <Button size="sm" onClick={() => navigate('/patient/chat')}>
                Contactar terapeuta
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Sección: Líneas de ayuda */}
      {section === 'lines' && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-700 font-medium">
              ⚠️ Si estás en peligro inmediato llama al número de emergencias de tu país (911, 112, 119…)
            </p>
          </div>

          {CRISIS_LINES.map((line, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-warm-100 shadow-card px-4 py-4 flex items-center gap-3"
            >
              <span className="text-2xl shrink-0">{line.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-warm-800 text-sm">{line.name}</p>
                <p className="text-xs text-warm-400">{line.country} · {line.available}</p>
              </div>
              <a
                href={`tel:${line.number.replace(/[\s\-()]/g, '')}`}
                className="shrink-0 flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
              >
                📞 {line.number}
              </a>
            </div>
          ))}

          <p className="text-xs text-warm-400 text-center mt-2 leading-relaxed px-4">
            Si no aparece tu país, busca "línea de crisis salud mental" + tu país.
            También puedes escribirle a tu terapeuta en cualquier momento.
          </p>
        </div>
      )}

      {/* Mensaje de cierre */}
      <div className="mt-8 text-center">
        <p className="text-xs text-warm-400 leading-relaxed">
          Recuerda: los momentos de crisis son temporales.<br />
          No tienes que atravesar esto solo/a. 💙
        </p>
      </div>
    </div>
  )
}
