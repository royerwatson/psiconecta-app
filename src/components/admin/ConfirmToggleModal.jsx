/**
 * ConfirmToggleModal — confirmación para activar/desactivar cuentas.
 * Evita baneos por clic accidental y exige motivo al desactivar
 * (queda registrado en audit_log, best-effort).
 */
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { ShieldAlert, ShieldCheck } from 'lucide-react'

export default function ConfirmToggleModal({ target, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  if (!target) return null
  const deactivating = target.is_active !== false // estado actual activo → se va a desactivar

  const handleConfirm = async () => {
    if (deactivating && !reason.trim()) return
    setBusy(true)
    await onConfirm(reason.trim())
    setBusy(false)
    setReason('')
  }

  return (
    <Modal isOpen={!!target} onClose={onClose} title={deactivating ? 'Desactivar cuenta' : 'Reactivar cuenta'}>
      <div className="flex flex-col gap-4">
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          deactivating ? 'border-red-100 bg-red-50' : 'border-emerald-100 bg-emerald-50'
        }`}>
          {deactivating
            ? <ShieldAlert size={18} strokeWidth={1.8} className="text-red-500 shrink-0 mt-0.5" />
            : <ShieldCheck size={18} strokeWidth={1.8} className="text-emerald-500 shrink-0 mt-0.5" />}
          <p className={`text-xs leading-relaxed ${deactivating ? 'text-red-700' : 'text-emerald-700'}`}>
            {deactivating ? (
              <>Vas a desactivar la cuenta de <span className="font-bold">{target.name}</span>.
              No podrá iniciar sesión y dejará de aparecer en la plataforma.
              {target.role === 'therapist' && ' Si tiene citas agendadas, deberás gestionarlas manualmente.'}</>
            ) : (
              <>Vas a reactivar la cuenta de <span className="font-bold">{target.name}</span>.
              Recuperará el acceso de inmediato.</>
            )}
          </p>
        </div>

        {deactivating && (
          <Textarea
            label="Motivo (obligatorio — queda en el registro de actividad)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Ej: documentación fraudulenta, reporte de conducta, solicitud del usuario..."
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button
            variant={deactivating ? 'danger' : 'primary'}
            fullWidth
            loading={busy}
            disabled={deactivating && !reason.trim()}
            onClick={handleConfirm}
          >
            {deactivating ? 'Desactivar' : 'Reactivar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
