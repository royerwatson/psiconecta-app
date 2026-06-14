/**
 * AdminRefunds — Panel de gestión de reembolsos.
 * Muestra todos los reembolsos, permite filtrar por estado
 * y resolver disputas con notas del administrador.
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import { RotateCcw, CheckCircle2, XCircle, AlertTriangle, DollarSign } from 'lucide-react'

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   color: 'bg-warm-100 text-warm-700'      },
  processing: { label: 'Procesando', color: 'bg-blue-50 text-blue-700'        },
  completed:  { label: 'Completado', color: 'bg-green-50 text-green-700'      },
  failed:     { label: 'Fallido',    color: 'bg-red-50 text-red-700'          },
  disputed:   { label: 'Disputado',  color: 'bg-amber-50 text-amber-700'      },
  resolved:   { label: 'Resuelto',   color: 'bg-emerald-50 text-emerald-700'  },
}

export default function AdminRefunds() {
  const [refunds, setRefunds]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [selected, setSelected]   = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [acting, setActing]       = useState(false)

  useEffect(() => { fetchRefunds() }, [])

  const fetchRefunds = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('refunds')
      .select(`
        *,
        patient:profiles!refunds_patient_id_fkey(full_name, avatar_url),
        therapist:profiles!refunds_therapist_id_fkey(full_name),
        session:sessions!refunds_session_id_fkey(scheduled_at, price)
      `)
      .order('created_at', { ascending: false })
    setRefunds(data ?? [])
    setLoading(false)
  }

  const resolve = async (refundId, newStatus) => {
    setActing(true)
    const { error } = await supabase
      .from('refunds')
      .update({ status: newStatus, admin_notes: adminNotes, processed_at: new Date().toISOString() })
      .eq('id', refundId)
    if (error) { toast.error('Error actualizando reembolso'); setActing(false); return }
    toast.success('Reembolso actualizado')
    setSelected(null)
    setAdminNotes('')
    setActing(false)
    fetchRefunds()
  }

  const markDisputed = async (refundId) => {
    const { error } = await supabase.from('refunds').update({ status: 'disputed' }).eq('id', refundId)
    if (error) { toast.error('Error'); return }
    toast.success('Marcado como disputado')
    fetchRefunds()
  }

  const [search, setSearch] = useState('')

  const filtered = refunds.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (r.patient?.full_name ?? '').toLowerCase().includes(q)
      || (r.therapist?.full_name ?? '').toLowerCase().includes(q)
  })

  // Métricas
  const totalRefunded = refunds.filter(r => r.status === 'completed').reduce((a, r) => a + (r.refund_amount ?? 0), 0)
  const pending       = refunds.filter(r => r.status === 'pending' || r.status === 'processing').length
  const disputed      = refunds.filter(r => r.status === 'disputed').length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Reembolsos</h1>
        <p className="text-warm-500 text-sm mt-1">Gestión de cancelaciones y reembolsos</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total reembolsado', value: formatPrice(totalRefunded), icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Pendientes',        value: pending,                    icon: RotateCcw,  color: 'text-blue-600 bg-blue-50'   },
          { label: 'Disputados',        value: disputed,                   icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-warm-100 rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <p className="text-2xl font-bold text-warm-900">{value}</p>
            <p className="text-xs text-warm-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por paciente o terapeuta..."
        className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
      />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'processing', 'completed', 'failed', 'disputed', 'resolved'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              filter === s ? 'bg-primary-500 text-white' : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}>
            {s === 'all' ? 'Todos' : STATUS_CONFIG[s]?.label ?? s}
            {s !== 'all' && (
              <span className="ml-1.5 opacity-70">
                {refunds.filter(r => r.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex flex-col gap-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <RotateCcw size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-200" />
          <p className="font-medium">Sin reembolsos en esta categoría</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(refund => {
            const sc = STATUS_CONFIG[refund.status] ?? STATUS_CONFIG.pending
            const sessionDate = refund.session?.scheduled_at
              ? new Date(refund.session.scheduled_at).toLocaleDateString('es-DO', { dateStyle: 'medium' })
              : '—'

            return (
              <div key={refund.id} className="bg-white border border-warm-100 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Avatar name={refund.patient?.full_name ?? ''} size="md" />
                    <div>
                      <p className="font-semibold text-warm-900">{refund.patient?.full_name}</p>
                      <p className="text-xs text-warm-500">
                        Sesión con {refund.therapist?.full_name} · {sessionDate}
                      </p>
                      {refund.reason && (
                        <p className="text-xs text-warm-400 mt-0.5 italic">"{refund.reason}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right">
                      <p className="font-bold text-warm-900">{formatPrice(refund.refund_amount)}</p>
                      <p className="text-xs text-warm-400">{refund.refund_percentage}% de {formatPrice(refund.original_amount)}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.color}`}>
                      {sc.label}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-warm-50">
                  {(refund.status === 'failed' || refund.status === 'pending') && (
                    <Button size="sm" variant="secondary" onClick={() => { setSelected(refund); setAdminNotes(refund.admin_notes ?? '') }}>
                      Gestionar
                    </Button>
                  )}
                  {refund.status === 'disputed' && (
                    <>
                      <Button size="sm" onClick={() => { setSelected(refund); setAdminNotes(refund.admin_notes ?? '') }}>
                        Resolver
                      </Button>
                    </>
                  )}
                  {refund.status === 'completed' && (
                    <Button size="sm" variant="outline" onClick={() => markDisputed(refund.id)}>
                      Marcar disputado
                    </Button>
                  )}
                  {refund.paypal_refund_id && (
                    <span className="text-xs text-warm-400 flex items-center gap-1 ml-auto">
                      PayPal: {refund.paypal_refund_id.slice(0, 12)}...
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal gestión/resolución */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setAdminNotes('') }}
        title={selected?.status === 'disputed' ? 'Resolver disputa' : 'Gestionar reembolso'}>
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="bg-warm-50 rounded-xl p-4 text-sm">
              <p><strong>Paciente:</strong> {selected.patient?.full_name}</p>
              <p><strong>Monto:</strong> {formatPrice(selected.refund_amount)} ({selected.refund_percentage}%)</p>
              <p><strong>Estado actual:</strong> {STATUS_CONFIG[selected.status]?.label}</p>
              {selected.paypal_capture_id && (
                <p className="text-xs text-warm-400 mt-1">Capture ID: {selected.paypal_capture_id}</p>
              )}
            </div>

            <Textarea
              label="Notas del administrador"
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Describe la acción tomada o el motivo de la resolución..."
              rows={3}
            />

            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => { setSelected(null); setAdminNotes('') }}>
                Cancelar
              </Button>
              <Button variant="secondary" fullWidth loading={acting}
                onClick={() => resolve(selected.id, 'failed')}>
                <XCircle size={14} className="mr-1" /> Marcar fallido
              </Button>
              <Button fullWidth loading={acting}
                onClick={() => resolve(selected.id, 'resolved')}>
                <CheckCircle2 size={14} className="mr-1" /> Resolver
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
