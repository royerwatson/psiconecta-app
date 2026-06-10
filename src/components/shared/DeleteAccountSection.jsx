/**
 * DeleteAccountSection — Derecho de supresión (Ley 172-13 / RGPD).
 * El usuario solicita la eliminación de su cuenta y datos; un admin la
 * procesa vía Edge Function delete-user-data. Usado en el perfil del
 * paciente y del terapeuta.
 */
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Trash2, ShieldAlert, Clock } from 'lucide-react'

export default function DeleteAccountSection() {
  const { user, profile, role } = useAuthStore()
  const [showModal, setShowModal]   = useState(false)
  const [reason, setReason]         = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [sending, setSending]       = useState(false)
  const [pendingRequest, setPendingRequest] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('deletion_requests')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()
      .then(({ data }) => setPendingRequest(data))
  }, [user?.id])

  const submitRequest = async () => {
    if (confirmText.trim().toUpperCase() !== 'ELIMINAR') {
      toast.error('Escribe ELIMINAR para confirmar')
      return
    }
    setSending(true)
    const { data, error } = await supabase
      .from('deletion_requests')
      .insert({
        user_id: user.id,
        user_role: role,
        user_email: profile?.email ?? user.email,
        user_name: profile?.full_name,
        reason: reason.trim() || null,
        status: 'pending',
      })
      .select('id, status, created_at')
      .single()
    setSending(false)

    if (error) {
      if (error.code === '23505') {
        toast.error('Ya tienes una solicitud pendiente')
      } else {
        toast.error('No se pudo enviar la solicitud')
      }
      return
    }
    setPendingRequest(data)
    setShowModal(false)
    toast.success('Solicitud enviada. Te contactaremos por email.')
  }

  if (pendingRequest) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <Clock size={18} strokeWidth={1.8} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Solicitud de eliminación en proceso</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Recibimos tu solicitud el {new Date(pendingRequest.created_at).toLocaleDateString('es-DO')}.
            Nuestro equipo la procesará en un máximo de 30 días y te confirmaremos por correo.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-red-50 transition-colors w-full"
      >
        <div className="flex items-center gap-3">
          <Trash2 size={17} strokeWidth={1.8} className="text-red-400" />
          <span className="text-sm font-medium text-red-600">Eliminar mi cuenta y mis datos</span>
        </div>
        <span className="text-warm-300">›</span>
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Eliminar cuenta y datos">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-start gap-3">
            <ShieldAlert size={18} strokeWidth={1.8} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">
              Esta acción es <span className="font-bold">permanente</span>. Se eliminarán tus mensajes,
              diario, check-ins, resultados de tests e historial clínico, y tu perfil quedará
              anonimizado. Los registros de pago se conservan de forma anónima por obligación legal.
              Un miembro del equipo procesará tu solicitud en un máximo de 30 días (Ley 172-13).
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-warm-600 mb-1 block">
              Motivo (opcional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Cuéntanos por qué te vas — nos ayuda a mejorar"
              className="w-full rounded-xl border border-warm-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-warm-600 mb-1 block">
              Escribe <span className="font-mono font-bold">ELIMINAR</span> para confirmar
            </label>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              maxLength={20}
              className="w-full rounded-xl border border-warm-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" fullWidth onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={sending}
              disabled={confirmText.trim().toUpperCase() !== 'ELIMINAR'}
              onClick={submitRequest}
            >
              Solicitar eliminación
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
