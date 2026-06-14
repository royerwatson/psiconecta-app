import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import AvatarUpload from '@/components/ui/AvatarUpload'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import DeleteAccountSection from '@/components/shared/DeleteAccountSection'
import toast from 'react-hot-toast'
import { Bell, Lock, ClipboardList, Hand, EyeOff, Gift, ChevronRight, Loader2, Check } from 'lucide-react'

// ── Toggle UI ──────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? 'bg-primary-600' : 'bg-warm-200'
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  )
}

const DEFAULT_PREFS = {
  email_session_confirmation: true,
  email_session_reminder:     true,
  email_new_message:          true,
  email_therapist_change:     true,
}

export default function PatientProfile() {
  const { profile, user, updateProfile, signOut } = useAuthStore()
  const navigate = useNavigate()

  // Modales
  const [notifModal, setNotifModal]   = useState(false)
  const [privModal, setPrivModal]     = useState(false)
  const [showLogout, setShowLogout]   = useState(false)

  // Anonimato
  const [isAnon, setIsAnon]           = useState(profile?.is_anonymous ?? false)
  const [savingAnon, setSavingAnon]   = useState(false)

  // Preferencias de notificaciones
  const [prefs, setPrefs]             = useState(DEFAULT_PREFS)
  const [loadingPrefs, setLoadingPrefs] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Gift cards / crédito
  const [creditBalance, setCreditBalance]   = useState(null)
  const [giftCode, setGiftCode]             = useState('')
  const [redeemStatus, setRedeemStatus]     = useState('idle') // idle | loading | success | error
  const [redeemMsg, setRedeemMsg]           = useState('')

  useEffect(() => {
    if (user) loadCreditBalance()
  }, [user])

  const loadCreditBalance = async () => {
    const { data } = await supabase.rpc('get_patient_credit_balance', { p_user_id: user.id })
    setCreditBalance(data ?? 0)
  }

  const handleRedeem = async () => {
    const code = giftCode.trim().toUpperCase()
    if (!code) { toast.error('Ingresa el código de regalo'); return }
    setRedeemStatus('loading')
    setRedeemMsg('')
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-gift-card`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authSession?.access_token}` },
          body: JSON.stringify({ code }),
        }
      )
      const data = await res.json()
      if (!res.ok) { setRedeemStatus('error'); setRedeemMsg(data.error ?? 'Error al canjear'); return }
      setCreditBalance(data.newBalance)
      setGiftCode('')
      setRedeemStatus('success')
      setRedeemMsg(`¡+$${Number(data.amountUsd).toFixed(2)} USD agregados a tu cuenta!`)
      setTimeout(() => setRedeemStatus('idle'), 4000)
    } catch {
      setRedeemStatus('error')
      setRedeemMsg('Error de conexión. Intenta de nuevo.')
    }
  }

  useEffect(() => {
    if (notifModal) fetchPrefs()
  }, [notifModal])

  const fetchPrefs = async () => {
    setLoadingPrefs(true)
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (data) setPrefs(data)
    setLoadingPrefs(false)
  }

  const savePrefs = async () => {
    setSavingPrefs(true)
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...prefs }, { onConflict: 'user_id' })
    if (error) { toast.error('Error guardando preferencias'); setSavingPrefs(false); return }
    toast.success('Preferencias guardadas')
    setSavingPrefs(false)
    setNotifModal(false)
  }

  const togglePref = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }))

  const toggleAnonymity = async () => {
    setSavingAnon(true)
    const next = !isAnon
    const { error } = await supabase
      .from('profiles')
      .update({ is_anonymous: next })
      .eq('id', user.id)
    if (error) {
      toast.error('Error al cambiar la configuración')
      setSavingAnon(false)
      return
    }
    setIsAnon(next)
    updateProfile({ is_anonymous: next })
    toast.success(next
      ? 'Modo anónimo activado — los terapeutas verán solo tus iniciales'
      : 'Modo anónimo desactivado — los terapeutas verán tu nombre completo'
    )
    setSavingAnon(false)
  }

  const SETTINGS = [
    { Icon: Bell,          label: 'Notificaciones',       action: () => setNotifModal(true) },
    { Icon: Lock,          label: 'Cambiar contraseña',   action: () => navigate('/forgot-password') },
    { Icon: ClipboardList, label: 'Política de privacidad', action: () => setPrivModal(true) },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-warm-900">Mi perfil</h1>

      {/* Foto + nombre */}
      <Card>
        <div className="flex flex-col items-center gap-4 py-4">
          <AvatarUpload size="2xl" />
          <div className="text-center">
            <h2 className="font-serif text-xl font-bold text-warm-900">{profile?.full_name}</h2>
            <p className="text-warm-500 text-sm mt-0.5">{profile?.email}</p>
          </div>

          {/* Toggle de anonimato */}
          <div className={`w-full rounded-2xl border-2 p-4 transition-all ${
            isAnon
              ? 'border-primary-200 bg-primary-50'
              : 'border-warm-100 bg-warm-50'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <EyeOff size={15} strokeWidth={1.8} className={isAnon ? 'text-primary-600' : 'text-warm-400'} />
                  <p className={`font-semibold text-sm ${isAnon ? 'text-primary-800' : 'text-warm-700'}`}>
                    Modo anónimo
                  </p>
                  {isAnon && (
                    <span className="text-[10px] font-bold bg-primary-500 text-white px-2 py-0.5 rounded-full">
                      Activo
                    </span>
                  )}
                </div>
                <p className="text-xs text-warm-500 leading-relaxed">
                  {isAnon
                    ? `Los terapeutas y otros usuarios solo ven tus iniciales: "${
                        (profile?.full_name ?? '').trim().split(/\s+/).slice(0,2).map(p => p[0]?.toUpperCase() + '.').join(' ')
                      }"`
                    : 'Activa el anonimato para que los terapeutas vean solo tus iniciales en lugar de tu nombre completo.'}
                </p>
              </div>
              <button
                onClick={toggleAnonymity}
                disabled={savingAnon}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 mt-0.5 ${
                  isAnon ? 'bg-primary-500' : 'bg-warm-200'
                } disabled:opacity-60`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  isAnon ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Gift Cards / Crédito ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift size={16} strokeWidth={1.8} className="text-primary-500" />
            Crédito de regalo
          </CardTitle>
        </CardHeader>

        {/* Balance */}
        <div className="flex items-center justify-between px-1 mb-4">
          <div>
            <p className="text-xs text-warm-400 font-medium">Tu saldo disponible</p>
            <p className="text-3xl font-black text-warm-900 leading-none mt-0.5">
              {creditBalance === null
                ? <span className="text-warm-200 text-lg">Cargando…</span>
                : `$${Number(creditBalance).toFixed(2)}`}
              {creditBalance !== null && <span className="text-warm-400 text-base font-medium ml-1">USD</span>}
            </p>
            {creditBalance > 0 && (
              <p className="text-xs text-primary-600 mt-1">Se descuenta automáticamente en tu próxima sesión</p>
            )}
          </div>
          {creditBalance > 0 && (
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Gift size={22} strokeWidth={1.6} className="text-primary-500" />
            </div>
          )}
        </div>

        {/* Formulario de canje */}
        <div className="border-t border-warm-100 pt-4">
          <p className="text-xs font-semibold text-warm-600 mb-3">Canjear código de regalo</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={giftCode}
              onChange={e => { setGiftCode(e.target.value.toUpperCase()); setRedeemStatus('idle') }}
              placeholder="PSICO-XXXX-XXXX"
              maxLength={14}
              className="flex-1 border border-warm-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest uppercase text-center focus:outline-none focus:ring-2 focus:ring-primary-300 text-warm-900 placeholder:text-warm-300 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
            />
            <button
              onClick={handleRedeem}
              disabled={redeemStatus === 'loading' || redeemStatus === 'success'}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                redeemStatus === 'success'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-60'
              }`}
            >
              {redeemStatus === 'loading' && <Loader2 size={14} className="animate-spin" />}
              {redeemStatus === 'success' && <Check size={14} />}
              {redeemStatus === 'success' ? '¡Canjeado!' : 'Canjear'}
            </button>
          </div>

          {/* Feedback */}
          {redeemStatus === 'success' && (
            <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              <Check size={12} /> {redeemMsg}
            </p>
          )}
          {redeemStatus === 'error' && (
            <p className="text-xs text-red-500 mt-2">{redeemMsg}</p>
          )}

          <p className="text-[11px] text-warm-400 mt-3 leading-relaxed">
            ¿No tienes un código? Pide a alguien que te regale sesiones desde{' '}
            <a href="/regalo" className="text-primary-500 hover:underline">psiconecta.app/regalo</a>
          </p>
        </div>
      </Card>

      {/* Configuración */}
      <Card>
        <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
        <div className="flex flex-col">
          {SETTINGS.map(({ Icon, label, action }) => (
            <button key={label} onClick={action}
              className="flex items-center justify-between py-3 border-b border-warm-100 last:border-0 hover:bg-warm-50 px-1 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Icon size={17} strokeWidth={1.8} className="text-warm-500" />
                <span className="text-sm font-medium text-warm-800">{label}</span>
              </div>
              <span className="text-warm-300">›</span>
            </button>
          ))}
          <div className="border-t border-warm-100">
            <DeleteAccountSection />
          </div>
        </div>
      </Card>

      <Button variant="danger" fullWidth onClick={() => setShowLogout(true)}>
        Cerrar sesión
      </Button>

      {/* ── Modal confirmación de salida ── */}
      <Modal isOpen={showLogout} onClose={() => setShowLogout(false)} title="">
        <div className="flex flex-col items-center gap-4 py-2">
          <Hand size={48} strokeWidth={1.5} className="text-warm-400" />
          <div className="text-center">
            <p className="font-serif text-lg font-semibold text-warm-900">¿Cerrar sesión?</p>
            <p className="text-sm text-warm-500 mt-1">Puedes volver cuando quieras.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full mt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowLogout(false)}>Cancelar</Button>
            <Button variant="danger" fullWidth onClick={() => { signOut(); navigate('/login') }}>Salir</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal notificaciones ── */}
      <Modal isOpen={notifModal} onClose={() => setNotifModal(false)} title="Notificaciones">
        {loadingPrefs ? (
          <div className="text-center py-6 text-warm-400 text-sm">Cargando preferencias...</div>
        ) : (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-warm-500">Elige qué notificaciones quieres recibir por correo electrónico.</p>

            {[
              { key: 'email_session_confirmation', label: 'Confirmación de cita',      desc: 'Cuando reservas o confirmas una sesión' },
              { key: 'email_session_reminder',     label: 'Recordatorio 24h antes',    desc: 'Un recordatorio el día anterior a tu sesión' },
              { key: 'email_new_message',          label: 'Nuevos mensajes del chat',  desc: 'Cuando tu terapeuta te escribe un mensaje' },
              { key: 'email_therapist_change',     label: 'Cambio de terapeuta',       desc: 'Confirmación cuando cambias de terapeuta' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-warm-800">{label}</p>
                  <p className="text-xs text-warm-400">{desc}</p>
                </div>
                <Toggle checked={!!prefs[key]} onChange={() => togglePref(key)} />
              </div>
            ))}

            <Button fullWidth loading={savingPrefs} onClick={savePrefs}>
              Guardar preferencias
            </Button>
          </div>
        )}
      </Modal>

      {/* ── Modal política de privacidad ── */}
      <Modal isOpen={privModal} onClose={() => setPrivModal(false)} title="Política de privacidad">
        <div className="flex flex-col gap-4 text-sm text-warm-700 max-h-[60vh] overflow-y-auto pr-1">
          <p className="font-semibold text-warm-900">Última actualización: enero 2026</p>

          <section>
            <h3 className="font-semibold text-warm-800 mb-1">1. Información que recopilamos</h3>
            <p className="text-warm-600 leading-relaxed">Recopilamos información que nos proporcionas directamente, como tu nombre, correo electrónico, y datos relacionados con tus sesiones de terapia. También recopilamos datos de uso anónimos para mejorar la plataforma.</p>
          </section>

          <section>
            <h3 className="font-semibold text-warm-800 mb-1">2. Cómo usamos tu información</h3>
            <p className="text-warm-600 leading-relaxed">Usamos tu información para facilitar las sesiones de terapia, enviarte notificaciones relevantes, mejorar nuestros servicios y garantizar la seguridad de la plataforma. Nunca vendemos tu información personal a terceros.</p>
          </section>

          <section>
            <h3 className="font-semibold text-warm-800 mb-1">3. Confidencialidad clínica</h3>
            <p className="text-warm-600 leading-relaxed">El contenido de tus sesiones, notas clínicas y registros de estado de ánimo está protegido con cifrado. Solo tu terapeuta asignado (y un terapeuta sustituto en caso necesario) puede acceder a tu historial clínico.</p>
          </section>

          <section>
            <h3 className="font-semibold text-warm-800 mb-1">4. Almacenamiento de datos</h3>
            <p className="text-warm-600 leading-relaxed">Tus datos se almacenan en servidores seguros provistos por Supabase, con cifrado en reposo y en tránsito. Seguimos las mejores prácticas de la industria para proteger tu información.</p>
          </section>

          <section>
            <h3 className="font-semibold text-warm-800 mb-1">5. Tus derechos</h3>
            <p className="text-warm-600 leading-relaxed">Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento. Para ejercer estos derechos, contáctanos en privacidad@psiconecta.app.</p>
          </section>

          <section>
            <h3 className="font-semibold text-warm-800 mb-1">6. Menores de edad</h3>
            <p className="text-warm-600 leading-relaxed">Psiconecta no está dirigido a personas menores de 18 años. Si eres menor de edad, necesitas el consentimiento de un tutor legal para utilizar la plataforma.</p>
          </section>

          <section>
            <h3 className="font-semibold text-warm-800 mb-1">7. Cambios a esta política</h3>
            <p className="text-warm-600 leading-relaxed">Podemos actualizar esta política periódicamente. Te notificaremos por correo electrónico ante cambios significativos. El uso continuado de la plataforma implica la aceptación de la política vigente.</p>
          </section>

          <Button variant="secondary" fullWidth onClick={() => setPrivModal(false)}>
            Entendido
          </Button>
        </div>
      </Modal>
    </div>
  )
}
