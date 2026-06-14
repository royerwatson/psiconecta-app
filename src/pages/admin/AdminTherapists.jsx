import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { VerificationBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import ConfirmToggleModal from '@/components/admin/ConfirmToggleModal'
import toast from 'react-hot-toast'
import { Search, DollarSign, Calendar, Wallet, CheckCircle2, XCircle, FileText, Image, File, AlertCircle, Radio } from 'lucide-react'

const REQUIRED_DOCS = [
  { type: 'titulo_profesional', label: 'Título profesional' },
  { type: 'exequatur',          label: 'Exequátur' },
  { type: 'colegio_psicologico',label: 'Acreditación Colegio Psicológico' },
]

export default function AdminTherapists() {
  const [therapists, setTherapists] = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [selected, setSelected]     = useState(null)
  const [acting, setActing]         = useState(false)
  const [toggling, setToggling]     = useState(null)
  const [credentials, setCredentials] = useState([])
  const [loadingCreds, setLoadingCreds] = useState(false)
  const [rejectingDoc, setRejectingDoc] = useState(null)  // { credId, label }
  const [rejectReason, setRejectReason] = useState('')
  const [actingDoc, setActingDoc]       = useState(null)  // credId being processed

  const [newCredsBanner, setNewCredsBanner] = useState(false)

  // ── Realtime: nueva credencial subida ───────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('admin-therapist-creds-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'therapist_credentials' },
        async (payload) => {
          // Obtener nombre del terapeuta para el toast
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.therapist_id)
            .single()

          const name = profile?.full_name ?? 'Un terapeuta'
          toast(`📋 ${name} subió nuevas credenciales`, {
            duration: 7000,
            style: { background: '#eff6ff', color: '#1e40af', fontWeight: '600', border: '1px solid #bfdbfe' },
          })
          setNewCredsBanner(true)
          // Refresca la lista automáticamente
          fetchTherapists()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => { fetchTherapists() }, [])

  const fetchTherapists = async () => {
    setLoading(true)

    // Partir de profiles para incluir terapeutas que aún no completaron therapist_profiles
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, full_name, avatar_url, created_at, is_active,
        therapist_profile:therapist_profiles(*)
      `)
      .eq('role', 'therapist')
      .order('created_at', { ascending: false })

    if (error) console.error('fetchTherapists error:', error)

    // Obtener stats de sesiones por terapeuta
    const { data: sessionStats } = await supabase
      .from('sessions')
      .select('therapist_id, status, price')

    setTherapists((data ?? []).map(p => {
      const tp = Array.isArray(p.therapist_profile) ? p.therapist_profile[0] : p.therapist_profile
      const tSessions = (sessionStats ?? []).filter(s => s.therapist_id === p.id)
      return {
        // campos de therapist_profiles (pueden ser null si no completó perfil)
        ...(tp ?? {}),
        // siempre disponibles desde profiles
        user_id:             p.id,
        profile:             { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url, created_at: p.created_at, is_active: p.is_active },
        is_active:           p.is_active ?? true,
        verification_status: tp?.verification_status ?? 'incomplete',
        totalSessions:       tSessions.length,
        totalRevenue:        tSessions.filter(s => s.status === 'completed').reduce((a, s) => a + (s.price ?? 0), 0),
      }
    }))
    setLoading(false)
  }

  const [confirmTarget, setConfirmTarget] = useState(null)

  const toggleActive = async (t, reason) => {
    const newState = !t.is_active
    setToggling(t.user_id)
    const { data: { session: authSession } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-toggle-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authSession?.access_token}`,
      },
      body: JSON.stringify({ userId: t.user_id, activate: newState, reason }),
    })
    if (!res.ok) { toast.error('Error al cambiar estado'); setToggling(null); return }
    // Rastro de auditoría (best-effort)
    supabase.from('audit_log').insert({
      action: newState ? 'admin_activate_user' : 'admin_deactivate_user',
      detail: JSON.stringify({ user_id: t.user_id, reason }),
    }).then(() => {}, () => {})
    toast.success(newState ? 'Cuenta reactivada' : 'Cuenta desactivada')
    setToggling(null)
    setConfirmTarget(null)
    fetchTherapists()
  }

  const openDetail = async (t) => {
    setSelected(t)
    setLoadingCreds(true)
    setCredentials([])
    const { data } = await supabase
      .from('therapist_credentials')
      .select('id, document_url, document_type, status, rejection_reason, created_at')
      .eq('therapist_id', t.user_id)
      .order('created_at', { ascending: false })

    // Generar URLs firmadas para cada documento
    const withUrls = await Promise.all((data ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from('credentials')
        .createSignedUrl(doc.document_url, 3600)
      return { ...doc, signedUrl: signed?.signedUrl ?? null }
    }))
    setCredentials(withUrls)
    setLoadingCreds(false)
  }

  // Aprobar un documento individual
  const approveDoc = async (credId) => {
    setActingDoc(credId)
    const { error } = await supabase
      .from('therapist_credentials')
      .update({ status: 'verified', rejection_reason: null })
      .eq('id', credId)
    if (error) { toast.error('Error aprobando documento'); setActingDoc(null); return }
    toast.success('Documento aprobado')
    setActingDoc(null)
    await openDetail(selected)  // refrescar credenciales
  }

  // Rechazar un documento individual con motivo
  const rejectDoc = async () => {
    if (!rejectReason.trim()) { toast.error('Escribe el motivo del rechazo'); return }
    setActingDoc(rejectingDoc.credId)
    const { error } = await supabase
      .from('therapist_credentials')
      .update({ status: 'rejected', rejection_reason: rejectReason.trim() })
      .eq('id', rejectingDoc.credId)
    if (error) { toast.error('Error rechazando documento'); setActingDoc(null); return }
    toast.success('Documento rechazado')
    setRejectingDoc(null)
    setRejectReason('')
    setActingDoc(null)
    await openDetail(selected)
  }

  // Completar verificación — activa al terapeuta (todos los docs aprobados)
  const completeVerification = async () => {
    setActing(true)
    const { error } = await supabase
      .from('therapist_profiles')
      .update({ verification_status: 'verified', verified: true })
      .eq('user_id', selected.user_id)
    if (error) { toast.error('Error completando verificación'); setActing(false); return }
    toast.success('Terapeuta verificado y activado correctamente')
    setSelected(null)
    setActing(false)
    fetchTherapists()
  }

  // Rechazar toda la verificación
  const updateStatus = async (therapistId, userId, status) => {
    setActing(true)
    const { error } = await supabase
      .from('therapist_profiles')
      .update({ verification_status: status, verified: status === 'verified' })
      .eq('user_id', userId)
    if (error) { toast.error('Error actualizando estado'); setActing(false); return }
    toast.success(status === 'rejected' ? 'Verificación rechazada' : 'Estado actualizado')
    setSelected(null)
    setActing(false)
    fetchTherapists()
  }

  const [search, setSearch] = useState('')

  const filtered = therapists.filter(t => {
    if (filter === 'pending' && t.verification_status !== 'pending' && t.verification_status !== 'incomplete') return false
    if (filter !== 'all' && filter !== 'pending' && t.verification_status !== filter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (t.profile?.full_name ?? '').toLowerCase().includes(q)
      || (t.specialty ?? '').toLowerCase().includes(q)
      || (t.license_number ?? '').toLowerCase().includes(q)
  })

  const counts = {
    all:      therapists.length,
    pending:  therapists.filter(t => t.verification_status === 'pending' || t.verification_status === 'incomplete').length,
    verified: therapists.filter(t => t.verification_status === 'verified').length,
    rejected: therapists.filter(t => t.verification_status === 'rejected').length,
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Indicador realtime + banner de credenciales nuevas */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <Radio size={12} strokeWidth={2} className="animate-pulse" />
          En tiempo real
        </span>
        {newCredsBanner && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
            📋 Nuevas credenciales subidas — lista actualizada
          </span>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-warm-900">Terapeutas</h1>
        <p className="text-warm-500 text-sm mt-1">Gestión y verificación de terapeutas</p>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={15} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, especialidad o licencia..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all',      label: 'Todos' },
          { id: 'pending',  label: 'Pendientes' },
          { id: 'verified', label: 'Verificados' },
          { id: 'rejected', label: 'Rechazados' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === f.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
            }`}>
            {f.label} <span className="ml-1 opacity-70">({counts[f.id]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-warm-400">
          <Search size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
          <p>No hay terapeutas en esta categoría</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(t => (
            <div key={t.id} className={`bg-white rounded-2xl border border-warm-100 p-4 ${!t.is_active ? 'opacity-70' : ''}`}>
              <div className="flex items-start gap-3">
                <Avatar name={t.profile?.full_name ?? ''} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-warm-900">{t.profile?.full_name}</p>
                        {!t.is_active && <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">Desactivada</span>}
                      </div>
                      <p className="text-sm text-warm-500">{t.specialty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <VerificationBadge status={t.verification_status} />
                      <button
                        disabled={toggling === t.user_id}
                        onClick={() => setConfirmTarget({ ...t, name: t.profile?.full_name, role: 'therapist' })}
                        title={t.is_active ? 'Desactivar cuenta' : 'Reactivar cuenta'}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          t.is_active ? 'bg-emerald-500' : 'bg-warm-300'
                        } ${toggling === t.user_id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          t.is_active ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-warm-400">
                    <span className="flex items-center gap-1"><DollarSign size={11} /> {formatPrice(t.price_per_session)}/sesión</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {t.totalSessions} sesiones</span>
                    <span className="flex items-center gap-1"><Wallet size={11} /> {formatPrice(t.totalRevenue)} generados</span>
                  </div>
                  {t.license_number && (
                    <p className="text-xs text-warm-400 mt-1">Licencia: {t.license_number}</p>
                  )}
                </div>
              </div>

              {t.verification_status === 'incomplete' && (
                <div className="mt-3 pt-3 border-t border-warm-100">
                  <p className="text-xs text-warm-400 flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-amber-400" />
                    Perfil incompleto — el terapeuta aún no ha completado su registro.
                  </p>
                </div>
              )}

              {t.verification_status === 'pending' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-warm-100">
                  <Button size="sm" onClick={() => openDetail(t)} fullWidth variant="secondary">
                    Ver detalles
                  </Button>
                  <Button size="sm" onClick={() => updateStatus(t.id, t.user_id, 'verified')} fullWidth>
                    <CheckCircle2 size={13} className="mr-1" strokeWidth={1.8} />Verificar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, t.user_id, 'rejected')} fullWidth>
                    <XCircle size={13} className="mr-1" strokeWidth={1.8} />Rechazar
                  </Button>
                </div>
              )}

              {t.verification_status === 'verified' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-warm-100">
                  <Button size="sm" variant="outline"
                    onClick={() => updateStatus(t.id, t.user_id, 'rejected')} fullWidth>
                    Revocar verificación
                  </Button>
                </div>
              )}

              {t.verification_status === 'rejected' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-warm-100">
                  <Button size="sm" onClick={() => updateStatus(t.id, t.user_id, 'verified')} fullWidth>
                    <CheckCircle2 size={13} className="mr-1" strokeWidth={1.8} />Verificar ahora
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal detalles */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalles del terapeuta">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-warm-50 rounded-xl p-3">
              <Avatar name={selected.profile?.full_name ?? ''} size="lg" />
              <div>
                <p className="font-bold text-warm-900">{selected.profile?.full_name}</p>
                <p className="text-sm text-warm-500">{selected.specialty}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Licencia', selected.license_number || 'No proporcionada'],
                ['Precio', formatPrice(selected.price_per_session) + '/sesión'],
                ['Sesiones', selected.totalSessions],
                ['Ingresos', formatPrice(selected.totalRevenue)],
              ].map(([k, v]) => (
                <div key={k} className="bg-warm-50 rounded-xl p-3">
                  <p className="text-xs text-warm-400">{k}</p>
                  <p className="font-semibold text-warm-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {selected.bio && (
              <div className="bg-warm-50 rounded-xl p-3 text-sm text-warm-700">
                <p className="text-xs text-warm-400 mb-1">Biografía</p>
                {selected.bio}
              </div>
            )}

            {/* Documentos de credenciales */}
            <div>
              <p className="text-xs text-warm-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                <FileText size={12} />Documentos subidos
              </p>
              {loadingCreds ? (
                <div className="bg-warm-50 rounded-xl p-4 text-center text-sm text-warm-400 animate-pulse">
                  Cargando documentos...
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {REQUIRED_DOCS.map((req) => {
                    const doc = credentials.find(c => c.document_type === req.type)
                    const isBusy = actingDoc === doc?.id
                    return (
                      <div key={req.type} className={`rounded-xl border p-3 ${
                        !doc                      ? 'bg-warm-50 border-warm-200' :
                        doc.status === 'verified' ? 'bg-green-50 border-green-200' :
                        doc.status === 'rejected' ? 'bg-red-50 border-red-200' :
                        'bg-amber-50 border-amber-200'
                      }`}>
                        {/* Fila principal */}
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-warm-100">
                            <FileText size={14} className="text-warm-500" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-warm-800">{req.label}</p>
                            <p className={`text-[10px] font-medium ${
                              !doc                      ? 'text-warm-400' :
                              doc.status === 'verified' ? 'text-green-600' :
                              doc.status === 'rejected' ? 'text-red-600'  : 'text-amber-600'
                            }`}>
                              {!doc ? 'No subido aún' :
                               doc.status === 'verified' ? 'Aprobado' :
                               doc.status === 'rejected' ? 'Rechazado' : 'Pendiente de revisión'}
                            </p>
                          </div>
                          {/* Ver documento */}
                          {doc?.signedUrl && (
                            <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-warm-200 text-primary-600 hover:bg-primary-50 transition-colors font-medium shrink-0">
                              Ver →
                            </a>
                          )}
                        </div>

                        {/* Motivo de rechazo */}
                        {doc?.status === 'rejected' && doc.rejection_reason && (
                          <div className="flex items-start gap-1.5 mt-2 bg-red-100 rounded-lg px-2 py-1.5">
                            <AlertCircle size={11} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-red-700">{doc.rejection_reason}</p>
                          </div>
                        )}

                        {/* Acciones por documento (solo si fue subido y no está verificado aún) */}
                        {doc && doc.status !== 'verified' && (
                          <div className="flex gap-2 mt-2.5">
                            <button
                              disabled={isBusy}
                              onClick={() => approveDoc(doc.id)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                            >
                              {isBusy ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={12} strokeWidth={2} />}
                              Aprobar
                            </button>
                            <button
                              disabled={isBusy}
                              onClick={() => { setRejectingDoc({ credId: doc.id, label: req.label }); setRejectReason('') }}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-60"
                            >
                              <XCircle size={12} strokeWidth={2} />
                              Rechazar
                            </button>
                          </div>
                        )}
                        {doc?.status === 'verified' && (
                          <p className="text-[10px] text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle2 size={11} strokeWidth={2} /> Documento verificado
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Barra de progreso */}
              {credentials.length > 0 && (() => {
                const approved = REQUIRED_DOCS.filter(r => credentials.find(c => c.document_type === r.type && c.status === 'verified')).length
                return (
                  <div className="bg-warm-50 rounded-xl p-3 mt-1">
                    <div className="flex justify-between text-xs text-warm-500 mb-1.5">
                      <span>Documentos aprobados</span>
                      <span className="font-semibold text-warm-800">{approved} / 3</span>
                    </div>
                    <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${(approved / 3) * 100}%` }} />
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Botón de completar verificación — solo aparece cuando los 3 docs están aprobados */}
            {(() => {
              const allApproved = REQUIRED_DOCS.every(r =>
                credentials.find(c => c.document_type === r.type && c.status === 'verified')
              )
              const alreadyVerified = selected?.verification_status === 'verified'
              return allApproved && !alreadyVerified ? (
                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-4 text-center">
                  <CheckCircle2 size={28} strokeWidth={1.5} className="text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-800 text-sm mb-1">Los 3 documentos están aprobados</p>
                  <p className="text-xs text-green-600 mb-3">
                    Al completar la verificación el terapeuta quedará activo y visible para los pacientes.
                  </p>
                  <Button fullWidth loading={acting} onClick={completeVerification}
                    className="bg-green-600 hover:bg-green-700 text-white border-green-600">
                    <CheckCircle2 size={15} strokeWidth={2} className="mr-1.5" />
                    Completar verificación
                  </Button>
                </div>
              ) : alreadyVerified ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <p className="text-sm text-green-700 font-medium">Terapeuta verificado y activo</p>
                </div>
              ) : (
                <p className="text-xs text-warm-400 text-center">
                  Aprueba los 3 documentos para habilitar la verificación final.
                </p>
              )
            })()}

          </div>
        )}
      </Modal>

      {/* Modal de motivo de rechazo */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-warm-900 mb-1">Rechazar documento</h3>
            <p className="text-sm text-warm-500 mb-4">
              Indica el motivo para rechazar <strong>{rejectingDoc.label}</strong>.
              El terapeuta verá este mensaje y podrá corregirlo.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Ej: El documento está vencido, la firma no es legible, falta el sello oficial..."
              rows={3}
              className="w-full rounded-xl border border-warm-200 px-3 py-2.5 text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setRejectingDoc(null); setRejectReason('') }}
                className="flex-1 py-2.5 rounded-xl border border-warm-200 text-warm-600 text-sm font-medium hover:bg-warm-50 transition-colors">
                Cancelar
              </button>
              <button onClick={rejectDoc} disabled={!!actingDoc}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                {actingDoc ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación activar/desactivar con motivo */}
      <ConfirmToggleModal
        target={confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={(reason) => toggleActive(confirmTarget, reason)}
      />
    </div>
  )
}
