import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { VerificationBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Search, DollarSign, Calendar, Wallet, CheckCircle2, XCircle, FileText, Image, File } from 'lucide-react'

export default function AdminTherapists() {
  const [therapists, setTherapists] = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all') // all | pending | verified | rejected
  const [selected, setSelected]     = useState(null)
  const [acting, setActing]         = useState(false)
  const [toggling, setToggling]     = useState(null)
  const [credentials, setCredentials] = useState([])
  const [loadingCreds, setLoadingCreds] = useState(false)

  useEffect(() => { fetchTherapists() }, [])

  const fetchTherapists = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('therapist_profiles')
      .select(`
        *,
        profile:profiles!therapist_profiles_user_id_fkey(id, full_name, avatar_url, created_at, is_active)
      `)
      .order('created_at', { ascending: false })

    if (error) console.error('fetchTherapists error:', error)

    // Obtener stats de sesiones por terapeuta
    const { data: sessionStats } = await supabase
      .from('sessions')
      .select('therapist_id, status, price')

    setTherapists((data ?? []).map(t => {
      const tSessions = (sessionStats ?? []).filter(s => s.therapist_id === t.user_id)
      return {
        ...t,
        is_active: t.profile?.is_active ?? true,
        totalSessions: tSessions.length,
        totalRevenue: tSessions.filter(s => s.status === 'completed').reduce((a, s) => a + (s.price ?? 0), 0),
      }
    }))
    setLoading(false)
  }

  const toggleActive = async (t) => {
    const newState = !t.is_active
    setToggling(t.user_id)
    const { data: { session: authSession } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-toggle-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authSession?.access_token}`,
      },
      body: JSON.stringify({ userId: t.user_id, activate: newState }),
    })
    if (!res.ok) { toast.error('Error al cambiar estado'); setToggling(null); return }
    toast.success(newState ? 'Cuenta reactivada' : 'Cuenta desactivada')
    setToggling(null)
    fetchTherapists()
  }

  const openDetail = async (t) => {
    setSelected(t)
    setLoadingCreds(true)
    setCredentials([])
    const { data } = await supabase
      .from('therapist_credentials')
      .select('id, document_url, status, created_at')
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

  const updateStatus = async (therapistId, userId, status) => {
    setActing(true)
    const verified = status === 'verified'
    const { error } = await supabase
      .from('therapist_profiles')
      .update({ verification_status: status, verified })
      .eq('user_id', userId)

    if (error) { toast.error('Error actualizando estado'); setActing(false); return }

    toast.success(
      status === 'verified' ? 'Terapeuta verificado' :
      status === 'rejected' ? 'Terapeuta rechazado' : 'Estado actualizado'
    )
    setSelected(null)
    setActing(false)
    fetchTherapists()
  }

  const filtered = therapists.filter(t =>
    filter === 'all' ? true : t.verification_status === filter
  )

  const counts = {
    all:      therapists.length,
    pending:  therapists.filter(t => t.verification_status === 'pending').length,
    verified: therapists.filter(t => t.verification_status === 'verified').length,
    rejected: therapists.filter(t => t.verification_status === 'rejected').length,
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Terapeutas</h1>
        <p className="text-warm-500 text-sm mt-1">Gestión y verificación de terapeutas</p>
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
                        onClick={() => toggleActive(t)}
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
              ) : credentials.length === 0 ? (
                <div className="bg-warm-50 rounded-xl p-4 text-center text-sm text-warm-400">
                  No ha subido documentos aún
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {credentials.map((doc, i) => {
                    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(doc.document_url)
                    const isPDF   = /\.pdf$/i.test(doc.document_url)
                    return (
                      <div key={doc.id} className="bg-warm-50 rounded-xl p-3 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                          {isPDF ? <FileText size={16} className="text-warm-500" /> : isImage ? <Image size={16} className="text-warm-500" /> : <File size={16} className="text-warm-500" />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-warm-700 truncate">
                            Documento {i + 1}
                          </p>
                          <p className="text-xs text-warm-400">
                            {new Date(doc.created_at).toLocaleDateString('es-DO', { dateStyle: 'medium' })}
                          </p>
                        </div>
                        {doc.signedUrl && (
                          <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-100 transition-colors"
                          >
                            Ver →
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button fullWidth loading={acting}
                onClick={() => updateStatus(selected.id, selected.user_id, 'verified')}>
                <CheckCircle2 size={13} strokeWidth={1.8} className="mr-1.5" />Verificar
              </Button>
              <Button fullWidth variant="outline" loading={acting}
                onClick={() => updateStatus(selected.id, selected.user_id, 'rejected')}>
                <XCircle size={13} strokeWidth={1.8} className="mr-1.5" />Rechazar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
