/**
 * AdminDeletionRequests — Gestión de solicitudes de eliminación de datos
 * (derecho de supresión, Ley 172-13 / RGPD).
 * Ejecuta la Edge Function delete-user-data, que borra datos clínicos,
 * anonimiza el perfil y bloquea la cuenta.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { Trash2, ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react'

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700'     },
  processing: { label: 'Procesando', color: 'bg-blue-50 text-blue-700'       },
  completed:  { label: 'Completada', color: 'bg-emerald-50 text-emerald-700' },
  rejected:   { label: 'Rechazada',  color: 'bg-red-50 text-red-700'         },
}

export default function AdminDeletionRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('pending')
  const [selected, setSelected] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [acting, setActing]     = useState(false)

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('deletion_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setRequests(data ?? [])
    setLoading(false)
  }

  const executeDeletion = async (request) => {
    setActing(true)
    const { data, error } = await supabase.functions.invoke('delete-user-data', {
      body: { user_id: request.user_id, request_id: request.id },
    })
    setActing(false)
    if (error || data?.error) {
      toast.error(data?.error ?? 'Error ejecutando la eliminación')
      return
    }
    toast.success('Datos eliminados y cuenta bloqueada')
    setSelected(null)
    fetchRequests()
  }

  const rejectRequest = async (request) => {
    if (!adminNote.trim()) {
      toast.error('Indica el motivo del rechazo')
      return
    }
    setActing(true)
    const { error } = await supabase
      .from('deletion_requests')
      .update({
        status: 'rejected',
        admin_note: adminNote.trim(),
        processed_at: new Date().toISOString(),
      })
      .eq('id', request.id)
    setActing(false)
    if (error) { toast.error('Error rechazando la solicitud'); return }
    toast.success('Solicitud rechazada')
    setSelected(null)
    setAdminNote('')
    fetchRequests()
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Eliminación de datos</h1>
        <p className="text-warm-500 text-sm mt-0.5">
          Solicitudes de supresión (Ley 172-13) · {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['pending', 'completed', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f ? 'bg-primary-600 text-white shadow-sm' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}
          >
            {f === 'all' ? 'Todas' : STATUS_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Trash2 className="text-warm-300 mb-3" size={40} strokeWidth={1.8} />
          <p className="font-semibold text-warm-700">Sin solicitudes {filter !== 'all' ? STATUS_CONFIG[filter]?.label.toLowerCase() + 's' : ''}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => {
            const st = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending
            return (
              <button
                key={r.id}
                onClick={() => { setSelected(r); setAdminNote('') }}
                className="text-left bg-white border border-warm-100 rounded-2xl px-4 py-3.5 hover:border-warm-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-warm-900">{r.user_name ?? 'Usuario'}</span>
                      <span className="text-xs text-warm-400">{r.user_email}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-100 text-warm-500 font-medium">
                        {r.user_role === 'therapist' ? 'Terapeuta' : 'Paciente'}
                      </span>
                    </div>
                    <p className="text-xs text-warm-500 mt-1">
                      Solicitada el {new Date(r.created_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {r.reason ? ` · "${r.reason.slice(0, 80)}${r.reason.length > 80 ? '…' : ''}"` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${st.color}`}>
                    {st.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal detalle */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Solicitud de eliminación">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="bg-warm-50 rounded-xl p-4 text-sm">
              <p className="font-semibold text-warm-900">{selected.user_name}</p>
              <p className="text-warm-500 text-xs mt-0.5">{selected.user_email} · {selected.user_role === 'therapist' ? 'Terapeuta' : 'Paciente'}</p>
              {selected.reason && (
                <p className="text-warm-600 text-xs mt-2 italic">"{selected.reason}"</p>
              )}
            </div>

            {selected.status === 'pending' ? (
              <>
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
                  <ShieldAlert size={18} strokeWidth={1.8} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-relaxed">
                    Al ejecutar: se eliminan mensajes, diario, check-ins, tests e historial clínico;
                    el perfil queda anonimizado y la cuenta bloqueada. Los registros financieros se
                    conservan de forma anónima. <span className="font-bold">Irreversible.</span>
                  </p>
                </div>

                <Textarea
                  label="Nota del admin (obligatoria para rechazar)"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Motivo de rechazo o nota interna"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="secondary" fullWidth loading={acting} onClick={() => rejectRequest(selected)}>
                    <XCircle size={15} strokeWidth={1.8} className="mr-1.5" /> Rechazar
                  </Button>
                  <Button variant="danger" fullWidth loading={acting} onClick={() => executeDeletion(selected)}>
                    <Trash2 size={15} strokeWidth={1.8} className="mr-1.5" /> Ejecutar eliminación
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-warm-600">
                {selected.status === 'completed'
                  ? <CheckCircle2 size={16} strokeWidth={1.8} className="text-emerald-500" />
                  : selected.status === 'rejected'
                    ? <XCircle size={16} strokeWidth={1.8} className="text-red-400" />
                    : <Clock size={16} strokeWidth={1.8} className="text-blue-400" />}
                <span>
                  {STATUS_CONFIG[selected.status].label}
                  {selected.processed_at ? ` el ${new Date(selected.processed_at).toLocaleDateString('es-DO')}` : ''}
                  {selected.admin_note ? ` — ${selected.admin_note}` : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
