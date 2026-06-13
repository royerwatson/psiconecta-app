import { useState, useEffect } from 'react'
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
import DeleteAccountSection from '@/components/shared/DeleteAccountSection'
import toast from 'react-hot-toast'
import { Pencil, CheckCircle2, XCircle, Clock, Upload, FileText, AlertCircle } from 'lucide-react'

// ── Documentos requeridos para verificación ────────────────────────────────
const REQUIRED_DOCS = [
  {
    type:        'titulo_profesional',
    label:       'Título profesional',
    description: 'Diploma universitario que acredita tu grado en Psicología',
  },
  {
    type:        'exequatur',
    label:       'Exequátur',
    description: 'Autorización emitida por el Estado para ejercer la profesión',
  },
  {
    type:        'colegio_psicologico',
    label:       'Acreditación del Colegio Psicológico',
    description: 'Certificado vigente de membresía en el colegio profesional',
  },
]

const SPECIALTIES = [
  'Psicología clínica', 'Psicología cognitivo-conductual', 'Psicoanálisis',
  'Terapia familiar y de pareja', 'Psicología infantil', 'Neuropsicología',
  'Psicología del deporte', 'Psicología organizacional', 'Otra',
]

export default function TherapistProfile() {
  const { profile, user, updateProfile } = useAuthStore()
  const navigate = useNavigate()
  // therapist_profiles viene como array (relación 1-a-muchos desde profiles)
  const therapist = profile?.therapist_profiles?.[0]
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    bio:       therapist?.bio ?? '',
    specialty: therapist?.specialty ?? SPECIALTIES[0],
    price:     therapist?.price_per_session ?? 0,
  })
  const [saving, setSaving]         = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(null)  // doc type being uploaded
  const [credentials, setCredentials]   = useState({})    // { type: credential }
  const [stats, setStats]           = useState({ sessions: 0, patients: 0, totalEarned: 0 })

  // ── Datos de pago ──────────────────────────────────────────────────────────
  const [editingPayment, setEditingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    payment_method:      therapist?.payment_method      ?? 'bank_transfer',
    paypal_email:        therapist?.paypal_email         ?? '',
    bank_name:           therapist?.bank_name            ?? '',
    bank_account_name:   therapist?.bank_account_name   ?? '',
    bank_account_number: therapist?.bank_account_number ?? '',
    bank_routing:        therapist?.bank_routing         ?? '',
  })
  const [savingPayment, setSavingPayment] = useState(false)
  const [payouts, setPayouts]             = useState([])
  const [loadingPayouts, setLoadingPayouts] = useState(false)

  useEffect(() => {
    if (user) { fetchStats(); fetchPayouts(); fetchCredentials() }
  }, [user])

  const fetchCredentials = async () => {
    const { data } = await supabase
      .from('therapist_credentials')
      .select('id, document_type, document_url, status, rejection_reason, created_at')
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false })

    // Quedarse con el más reciente por tipo
    const map = {}
    for (const c of (data ?? [])) {
      if (!map[c.document_type]) map[c.document_type] = c
    }
    setCredentials(map)
  }

  const fetchStats = async () => {
    const { data } = await supabase
      .from('sessions')
      .select('id, patient_id, status, price')
      .eq('therapist_id', user.id)
    if (!data) return
    const completed    = data.filter(s => s.status === 'completed')
    const patients     = new Set(data.map(s => s.patient_id)).size
    const totalEarned  = completed.reduce((a, s) => a + (s.price ?? 0), 0)
    setStats({ sessions: completed.length, patients, totalEarned })
  }

  const fetchPayouts = async () => {
    setLoadingPayouts(true)
    const { data } = await supabase
      .from('payouts')
      .select('id, amount, currency, status, payment_method, reference, paid_at, period_start, period_end, created_at')
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setPayouts(data ?? [])
    setLoadingPayouts(false)
  }

  const savePaymentInfo = async () => {
    setSavingPayment(true)
    const { error } = await supabase
      .from('therapist_profiles')
      .update({
        payment_method:      paymentForm.payment_method,
        paypal_email:        paymentForm.paypal_email || null,
        bank_name:           paymentForm.bank_name || null,
        bank_account_name:   paymentForm.bank_account_name || null,
        bank_account_number: paymentForm.bank_account_number || null,
        bank_routing:        paymentForm.bank_routing || null,
      })
      .eq('user_id', user.id)

    if (error) { toast.error('Error al guardar datos de pago'); setSavingPayment(false); return }
    toast.success('Datos de pago actualizados')
    setEditingPayment(false)
    setSavingPayment(false)
  }

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const saveProfile = async () => {
    // Validaciones
    if (!form.specialty) {
      toast.error('Selecciona una especialidad')
      return
    }
    if (Number(form.price) < 0) {
      toast.error('El precio no puede ser negativo')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('therapist_profiles').update({
      bio:               form.bio.trim(),
      specialty:         form.specialty,
      price_per_session: Number(form.price),
    }).eq('user_id', user.id)
    if (error) { toast.error('Error al guardar el perfil. Intenta de nuevo.'); setSaving(false); return }
    // Sincronizar el store local con los nuevos datos
    updateProfile({
      therapist_profiles: [{ ...therapist, bio: form.bio.trim(), specialty: form.specialty, price_per_session: Number(form.price) }],
    })
    toast.success('Perfil actualizado correctamente')
    setEditing(false)
    setSaving(false)
  }

  const uploadCredential = async (docType, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxSize) { toast.error('El archivo no puede superar 10 MB'); return }

    setUploadingDoc(docType)
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `${user.id}/${docType}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('credentials')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) {
      console.error('[credentials] upload error:', uploadError)
      toast.error('Error subiendo el documento. Verifica que el archivo sea PDF, JPG o PNG.')
      setUploadingDoc(null)
      return
    }

    const { error: dbError } = await supabase.from('therapist_credentials').insert({
      therapist_id:  user.id,
      document_type: docType,
      document_url:  path,
      status:        'pending',
    })
    if (dbError) { toast.error('Error registrando el documento'); setUploadingDoc(null); return }

    // Marcar perfil como pendiente de revisión
    await supabase.from('therapist_profiles')
      .update({ verification_status: 'pending' })
      .eq('user_id', user.id)

    toast.success('Documento enviado para revisión')
    setUploadingDoc(null)
    e.target.value = ''
    fetchCredentials()
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-warm-900">Mi perfil</h1>
        <Button size="sm" variant={editing ? 'outline' : 'secondary'}
          onClick={() => setEditing(!editing)}>
          {editing ? 'Cancelar' : <><Pencil size={13} strokeWidth={1.8} className="inline mr-1" />Editar</>}
        </Button>
      </div>

      {/* Avatar y estado */}
      <Card>
        <div className="flex items-center gap-4">
          <AvatarUpload size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl font-bold text-warm-900 leading-tight">{profile?.full_name}</h2>
            <p className="text-warm-500 text-sm mt-0.5">{therapist?.specialty}</p>
            {editing && (
              <p className="text-xs text-warm-400 mt-1 italic">El nombre se gestiona a través del administrador.</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <VerificationBadge status={therapist?.verification_status ?? 'pending'} />
              {therapist?.rating > 0 && (
                <RatingDisplay value={therapist.rating} reviews={therapist.review_count ?? 0} />
              )}
            </div>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-warm-100">
          <div className="bg-primary-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary-600">{stats.sessions}</p>
            <p className="text-xs text-primary-500 mt-0.5">Sesiones</p>
          </div>
          <div className="bg-calm-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-calm-600">{stats.patients}</p>
            <p className="text-xs text-calm-500 mt-0.5">Pacientes</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-emerald-600">{formatPrice(stats.totalEarned)}</p>
            <p className="text-xs text-emerald-500 mt-0.5">Generado</p>
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
        <div className="flex flex-col gap-4">

          {/* Estado general de verificación */}
          <div className={`rounded-xl p-4 flex items-start gap-3 ${
            therapist?.verification_status === 'verified' ? 'bg-green-50 border border-green-100' :
            therapist?.verification_status === 'rejected' ? 'bg-red-50 border border-red-100' :
            'bg-amber-50 border border-amber-100'
          }`}>
            {therapist?.verification_status === 'verified'
              ? <CheckCircle2 size={18} strokeWidth={1.8} className="text-green-600 shrink-0 mt-0.5" />
              : therapist?.verification_status === 'rejected'
              ? <XCircle size={18} strokeWidth={1.8} className="text-red-600 shrink-0 mt-0.5" />
              : <Clock size={18} strokeWidth={1.8} className="text-amber-600 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-sm text-warm-900">
                {therapist?.verification_status === 'verified' ? 'Credenciales verificadas' :
                 therapist?.verification_status === 'rejected' ? 'Verificación rechazada' :
                 'Verificación pendiente'}
              </p>
              <p className="text-xs text-warm-500 mt-0.5">
                {therapist?.verification_status === 'verified'
                  ? 'Tu perfil está activo y visible para los pacientes.'
                  : therapist?.verification_status === 'rejected'
                  ? 'Uno o más documentos fueron rechazados. Revisa el detalle y sube versiones actualizadas.'
                  : 'Sube los 3 documentos requeridos. El equipo los revisará en 24-48 horas.'}
              </p>
            </div>
          </div>

          {/* Los 3 documentos requeridos */}
          <div className="space-y-3">
            {REQUIRED_DOCS.map((doc) => {
              const cred     = credentials[doc.type]
              const status   = cred?.status ?? 'missing'
              const isUploading = uploadingDoc === doc.type

              return (
                <div key={doc.type} className={`rounded-xl border p-4 transition-all ${
                  status === 'verified' ? 'border-green-200 bg-green-50' :
                  status === 'rejected' ? 'border-red-200 bg-red-50' :
                  status === 'pending'  ? 'border-amber-200 bg-amber-50' :
                  'border-warm-200 bg-warm-50'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Ícono de estado */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        status === 'verified' ? 'bg-green-100' :
                        status === 'rejected' ? 'bg-red-100'   :
                        status === 'pending'  ? 'bg-amber-100' :
                        'bg-warm-100'
                      }`}>
                        {status === 'verified' ? <CheckCircle2 size={18} strokeWidth={1.8} className="text-green-600" /> :
                         status === 'rejected' ? <XCircle size={18} strokeWidth={1.8} className="text-red-600" /> :
                         status === 'pending'  ? <Clock size={18} strokeWidth={1.8} className="text-amber-600" /> :
                         <FileText size={18} strokeWidth={1.8} className="text-warm-400" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-warm-900">{doc.label}</p>
                        <p className="text-xs text-warm-500 mt-0.5">{doc.description}</p>
                        {status === 'rejected' && cred?.rejection_reason && (
                          <div className="flex items-start gap-1.5 mt-2 bg-red-100 rounded-lg px-2.5 py-1.5">
                            <AlertCircle size={12} strokeWidth={1.8} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700">{cred.rejection_reason}</p>
                          </div>
                        )}
                        {status !== 'missing' && (
                          <p className={`text-[10px] font-semibold mt-1.5 ${
                            status === 'verified' ? 'text-green-600' :
                            status === 'rejected' ? 'text-red-600'   :
                            'text-amber-600'
                          }`}>
                            {status === 'verified' ? 'Aprobado' :
                             status === 'rejected' ? 'Rechazado — sube un nuevo documento' :
                             'En revisión (24-48 horas)'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botón de subir */}
                    {status !== 'verified' && (
                      <label className="cursor-pointer shrink-0">
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={!!uploadingDoc}
                          onChange={(e) => uploadCredential(doc.type, e)}
                        />
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isUploading
                            ? 'bg-warm-200 text-warm-500 cursor-not-allowed'
                            : 'bg-primary-500 text-white hover:bg-primary-600 cursor-pointer'
                        }`}>
                          {isUploading ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          ) : (
                            <Upload size={12} strokeWidth={2} />
                          )}
                          {isUploading ? 'Subiendo...' : status === 'missing' ? 'Subir' : 'Actualizar'}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progreso: X de 3 documentos enviados */}
          {therapist?.verification_status !== 'verified' && (
            <div className="bg-warm-50 rounded-xl p-3">
              {(() => {
                const uploaded = REQUIRED_DOCS.filter(d => credentials[d.type]).length
                const verified = REQUIRED_DOCS.filter(d => credentials[d.type]?.status === 'verified').length
                return (
                  <>
                    <div className="flex justify-between text-xs text-warm-500 mb-2">
                      <span>Progreso de verificación</span>
                      <span className="font-semibold">{verified === 3 ? '¡Completado!' : `${uploaded}/3 enviados · ${verified}/3 aprobados`}</span>
                    </div>
                    <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${(verified / 3) * 100}%` }}
                      />
                    </div>
                  </>
                )
              })()}
            </div>
          )}

        </div>
      </Card>

      {/* ── Datos de pago ── */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardHeader className="mb-0 pb-0">
            <CardTitle>Datos de pago</CardTitle>
          </CardHeader>
          <Button size="sm" variant={editingPayment ? 'outline' : 'secondary'}
            onClick={() => setEditingPayment(!editingPayment)}>
            {editingPayment ? 'Cancelar' : <><Pencil size={13} strokeWidth={1.8} className="inline mr-1" />Editar</>}
          </Button>
        </div>

        {editingPayment ? (
          <div className="flex flex-col gap-4">
            {/* Método preferido */}
            <div>
              <label className="block text-xs font-medium text-warm-600 mb-2">
                Método de pago preferido
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'bank_transfer', label: 'Cuenta bancaria' },
                  { value: 'paypal',        label: 'PayPal'          },
                ].map(m => (
                  <button key={m.value}
                    onClick={() => setPaymentForm(f => ({ ...f, payment_method: m.value }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      paymentForm.payment_method === m.value
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campos según método */}
            {paymentForm.payment_method === 'bank_transfer' ? (
              <>
                <Input label="Nombre del banco" placeholder="Ej: Banco Popular, Scotiabank..."
                  value={paymentForm.bank_name}
                  onChange={e => setPaymentForm(f => ({ ...f, bank_name: e.target.value }))} />
                <Input label="Nombre del titular de la cuenta"
                  placeholder="Como aparece en el banco"
                  value={paymentForm.bank_account_name}
                  onChange={e => setPaymentForm(f => ({ ...f, bank_account_name: e.target.value }))} />
                <Input label="Número de cuenta / IBAN"
                  placeholder="Número completo de la cuenta"
                  value={paymentForm.bank_account_number}
                  onChange={e => setPaymentForm(f => ({ ...f, bank_account_number: e.target.value }))} />
                <Input label="Routing / SWIFT / CLABE (opcional)"
                  placeholder="Código de ruta bancaria"
                  value={paymentForm.bank_routing}
                  onChange={e => setPaymentForm(f => ({ ...f, bank_routing: e.target.value }))} />
              </>
            ) : (
              <Input label="Email de tu cuenta PayPal"
                type="email" placeholder="tu@correo.com"
                value={paymentForm.paypal_email}
                onChange={e => setPaymentForm(f => ({ ...f, paypal_email: e.target.value }))} />
            )}

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
              Tus datos bancarios son confidenciales y solo los utiliza Psiconecta para procesar tus pagos.
            </div>

            <Button onClick={savePaymentInfo} loading={savingPayment} fullWidth>
              Guardar datos de pago
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {therapist?.payment_method === 'paypal' ? (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-400 font-medium mb-1">PayPal</p>
                <p className="text-sm font-medium text-blue-800">
                  {therapist?.paypal_email ?? (
                    <span className="text-warm-400 italic">No configurado</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="bg-warm-50 rounded-xl p-3 space-y-1.5">
                <p className="text-xs text-warm-400 font-medium mb-1">Cuenta bancaria</p>
                {therapist?.bank_name && (
                  <InfoRow label="Banco" value={therapist.bank_name} />
                )}
                {therapist?.bank_account_name && (
                  <InfoRow label="Titular" value={therapist.bank_account_name} />
                )}
                {therapist?.bank_account_number ? (
                  <InfoRow label="Cuenta"
                    value={`••••${therapist.bank_account_number.slice(-4)}`} />
                ) : (
                  <p className="text-sm text-warm-400 italic">
                    No has configurado tus datos bancarios aún
                  </p>
                )}
                {therapist?.bank_routing && (
                  <InfoRow label="Routing/SWIFT" value={therapist.bank_routing} />
                )}
              </div>
            )}

            {!therapist?.bank_account_number && !therapist?.paypal_email && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700">
                Agrega tus datos de pago para recibir tus ganancias
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Historial de pagos recibidos ── */}
      <Card>
        <CardHeader><CardTitle>Mis pagos recibidos</CardTitle></CardHeader>
        {loadingPayouts ? (
          <div className="space-y-2">
            {[1,2].map(i => (
              <div key={i} className="h-14 bg-warm-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-8 text-warm-400">
            <div className="text-3xl mb-2 text-warm-300">—</div>
            <p className="text-sm">Aquí aparecerán tus liquidaciones cuando el admin las procese</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {payouts.map(p => {
              const statusConfig = {
                pending:    { label: 'Pendiente',  color: 'bg-warm-100 text-warm-500'       },
                processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-600'       },
                completed:  { label: 'Recibido',   color: 'bg-emerald-100 text-emerald-700' },
                failed:     { label: 'Fallido',    color: 'bg-red-100 text-red-600'         },
              }[p.status] ?? { label: p.status, color: 'bg-warm-100 text-warm-500' }
              return (
                <div key={p.id} className="flex items-center gap-3 bg-warm-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-warm-900">
                        {formatPrice(p.amount)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-warm-400 mt-0.5">
                      {p.period_start
                        ? `${new Date(p.period_start).toLocaleDateString('es-DO', { day:'2-digit', month:'short' })} — ${new Date(p.period_end).toLocaleDateString('es-DO', { day:'2-digit', month:'short', year:'numeric' })}`
                        : new Date(p.created_at).toLocaleDateString('es-DO', { day:'2-digit', month:'short', year:'numeric' })}
                    </p>
                    {p.reference && (
                      <p className="text-xs text-emerald-600 mt-0.5">Ref: {p.reference}</p>
                    )}
                  </div>
                  <p className="text-xs text-warm-300 shrink-0">
                    {p.payment_method === 'paypal' ? 'PP' : 'BC'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Privacidad y datos */}
      <Card>
        <CardHeader><CardTitle>Privacidad y datos</CardTitle></CardHeader>
        <DeleteAccountSection />
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
