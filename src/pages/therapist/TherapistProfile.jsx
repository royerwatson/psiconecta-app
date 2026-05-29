import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import AvatarUpload from '@/components/ui/AvatarUpload'
import Button from '@/components/ui/Button'
import Input, { Textarea, Select } from '@/components/ui/Input'
import { VerificationBadge } from '@/components/ui/Badge'
import { RatingDisplay } from '@/components/ui/StarRating'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const SPECIALTIES = [
  'Psicología clínica', 'Psicología cognitivo-conductual', 'Psicoanálisis',
  'Terapia familiar y de pareja', 'Psicología infantil', 'Neuropsicología',
  'Psicología del deporte', 'Psicología organizacional', 'Otra',
]

export default function TherapistProfile() {
  const { profile, user, updateProfile } = useAuthStore()
  const navigate = useNavigate()
  const therapist = profile?.therapist_profiles
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    bio:       therapist?.bio ?? '',
    specialty: therapist?.specialty ?? '',
    price:     therapist?.price_per_session ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('therapist_profiles').update({
      bio: form.bio, specialty: form.specialty, price_per_session: Number(form.price),
    }).eq('user_id', user.id)
    if (error) { toast.error('Error guardando perfil'); setSaving(false); return }
    toast.success('Perfil actualizado')
    setEditing(false)
    setSaving(false)
  }

  const uploadCredential = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    const path = `credentials/${user.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('credentials').upload(path, file)
    if (error) { toast.error('Error subiendo documento'); setUploadingDoc(false); return }

    await supabase.from('therapist_credentials').insert({
      therapist_id: user.id, document_url: path, status: 'pending',
    })
    await supabase.from('therapist_profiles').update({ verification_status: 'pending' }).eq('user_id', user.id)
    toast.success('Documento enviado para verificación')
    setUploadingDoc(false)
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-warm-900">Mi perfil</h1>
        <Button size="sm" variant={editing ? 'outline' : 'secondary'}
          onClick={() => setEditing(!editing)}>
          {editing ? 'Cancelar' : '✏️ Editar'}
        </Button>
      </div>

      {/* Avatar y estado */}
      <Card>
        <div className="flex items-center gap-4">
          <AvatarUpload size="xl" />
          <div className="flex-1">
            <h2 className="font-serif text-xl font-bold text-warm-900">{profile?.full_name}</h2>
            <p className="text-warm-500 text-sm">{therapist?.specialty}</p>
            {editing && (
              <p className="text-xs text-warm-400 mt-1 italic">El nombre no se puede modificar por razones de profesionalismo.</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <VerificationBadge status={therapist?.verification_status ?? 'pending'} />
              {therapist?.rating > 0 && (
                <RatingDisplay value={therapist.rating} reviews={therapist.review_count ?? 0} />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Datos profesionales */}
      <Card>
        <CardHeader><CardTitle>Datos profesionales</CardTitle></CardHeader>
        {editing ? (
          <div className="flex flex-col gap-4">
            <Select label="Especialidad" name="specialty" value={form.specialty} onChange={handleChange}>
              {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
            </Select>
            <Textarea label="Biografía" name="bio" value={form.bio} onChange={handleChange} rows={4}
              placeholder="Describe tu enfoque terapéutico y experiencia..." />
            <Input label="Precio por sesión (USD)" name="price" type="number" value={form.price} onChange={handleChange} />
            <Button onClick={saveProfile} loading={saving} fullWidth>Guardar cambios</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <InfoRow label="Especialidad" value={therapist?.specialty ?? 'No configurada'} />
            <InfoRow label="Precio por sesión" value={formatPrice(therapist?.price_per_session ?? 0)} />
            <InfoRow label="Cédula profesional" value={therapist?.license_number ?? 'No registrada'} />
            {therapist?.bio && <div className="mt-2"><p className="text-xs text-warm-500 uppercase font-semibold mb-1">Sobre mí</p><p className="text-sm text-warm-700">{therapist.bio}</p></div>}
          </div>
        )}
      </Card>

      {/* Verificación de credenciales */}
      <Card>
        <CardHeader>
          <CardTitle>Verificación de credenciales</CardTitle>
        </CardHeader>
        <div className="flex flex-col gap-3">
          <div className={`rounded-xl p-4 ${
            therapist?.verification_status === 'verified' ? 'bg-green-50 border border-green-100' :
            therapist?.verification_status === 'rejected' ? 'bg-red-50 border border-red-100' :
            'bg-amber-50 border border-amber-100'
          }`}>
            <p className="font-medium text-sm">
              {therapist?.verification_status === 'verified' ? '✅ Credenciales verificadas' :
               therapist?.verification_status === 'rejected' ? '❌ Verificación rechazada' :
               '⏳ Verificación en proceso'}
            </p>
            <p className="text-xs mt-1 text-warm-600">
              {therapist?.verification_status === 'verified'
                ? 'Tu perfil está activo y visible para los pacientes.'
                : therapist?.verification_status === 'rejected'
                ? 'Por favor sube documentos actualizados.'
                : 'Estamos revisando tus documentos (24-48 horas).'}
            </p>
          </div>

          {therapist?.verification_status !== 'verified' && (
            <label className="cursor-pointer">
              <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png"
                onChange={uploadCredential} disabled={uploadingDoc} />
              <Button as="span" variant="secondary" fullWidth loading={uploadingDoc}>
                📄 {uploadingDoc ? 'Subiendo...' : 'Subir documento de credencial'}
              </Button>
            </label>
          )}
        </div>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-warm-100 last:border-0">
      <span className="text-sm text-warm-500">{label}</span>
      <span className="text-sm font-medium text-warm-800">{value}</span>
    </div>
  )
}
