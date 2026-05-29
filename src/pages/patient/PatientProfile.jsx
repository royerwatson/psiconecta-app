import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import AvatarUpload from '@/components/ui/AvatarUpload'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

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

  const [editing, setEditing]         = useState(false)
  const [form, setForm]               = useState({ full_name: profile?.full_name ?? '' })
  const [saving, setSaving]           = useState(false)

  // Modales
  const [notifModal, setNotifModal]   = useState(false)
  const [privModal, setPrivModal]     = useState(false)

  // Preferencias de notificaciones
  const [prefs, setPrefs]             = useState(DEFAULT_PREFS)
  const [loadingPrefs, setLoadingPrefs] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

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

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', user.id)
    if (error) { toast.error('Error guardando perfil'); setSaving(false); return }
    updateProfile({ full_name: form.full_name })
    toast.success('Perfil actualizado')
    setEditing(false)
    setSaving(false)
  }

  const SETTINGS = [
    { icon: '🔔', label: 'Notificaciones',       action: () => setNotifModal(true) },
    { icon: '🔒', label: 'Cambiar contraseña',   action: () => navigate('/forgot-password') },
    { icon: '📋', label: 'Política de privacidad', action: () => setPrivModal(true) },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-warm-900">Mi perfil</h1>

      {/* Foto + nombre */}
      <Card>
        <div className="flex flex-col items-center gap-4 py-4">
          <AvatarUpload size="2xl" />
          {editing ? (
            <div className="w-full flex flex-col gap-3">
              <Input label="Nombre completo" value={form.full_name}
                onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancelar</Button>
                <Button onClick={saveProfile} loading={saving} className="flex-1">Guardar</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="font-serif text-xl font-bold text-warm-900">{profile?.full_name}</h2>
                <p className="text-warm-500 text-sm mt-0.5">{profile?.email}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>✏️ Editar nombre</Button>
            </>
          )}
        </div>
      </Card>

      {/* Configuración */}
      <Card>
        <CardHeader><CardTitle>Configuración</CardTitle></CardHeader>
        <div className="flex flex-col">
          {SETTINGS.map(({ icon, label, action }) => (
            <button key={label} onClick={action}
              className="flex items-center justify-between py-3 border-b border-warm-100 last:border-0 hover:bg-warm-50 px-1 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <span>{icon}</span>
                <span className="text-sm font-medium text-warm-800">{label}</span>
              </div>
              <span className="text-warm-300">›</span>
            </button>
          ))}
        </div>
      </Card>

      <Button variant="danger" fullWidth onClick={() => { signOut(); navigate('/login') }}>
        Cerrar sesión
      </Button>

      {/* ── Modal notificaciones ── */}
      <Modal isOpen={notifModal} onClose={() => setNotifModal(false)} title="🔔 Notificaciones">
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
      <Modal isOpen={privModal} onClose={() => setPrivModal(false)} title="📋 Política de privacidad">
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
