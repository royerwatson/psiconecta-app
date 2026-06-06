/**
 * ConsentModal — Consentimiento informado digital.
 * Se muestra antes de la primera sesión con cada terapeuta.
 * El paciente debe desplazarse hasta el final para poder firmar.
 *
 * Props:
 *   therapistName  — nombre del terapeuta para personalizar el texto
 *   onAccept       — callback cuando el paciente firma (async)
 *   onClose        — callback para cerrar sin firmar
 *   loading        — estado de carga mientras se guarda la firma
 */
import { useState, useRef, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { ScrollText, CheckCircle } from 'lucide-react'

const DOCUMENT_VERSION = 'v1.0'

export const CONSENT_TEXT = `CONSENTIMIENTO INFORMADO PARA SERVICIOS DE PSICOTERAPIA EN LÍNEA

Versión ${DOCUMENT_VERSION} — Psiconecta

1. NATURALEZA DEL SERVICIO
Psiconecta es una plataforma digital que facilita la conexión entre pacientes y profesionales de la salud mental certificados. Los servicios terapéuticos son prestados directamente por el terapeuta seleccionado, quien actúa de forma independiente. Psiconecta no presta servicios terapéuticos directos ni es responsable del contenido clínico de las sesiones.

2. VOLUNTARIEDAD Y AUTONOMÍA
Entiendo que mi participación en la terapia es completamente voluntaria. Puedo interrumpir el tratamiento en cualquier momento, aunque se recomienda comunicarlo al terapeuta para una transición adecuada.

3. CONFIDENCIALIDAD
Toda la información compartida durante las sesiones es estrictamente confidencial. El terapeuta solo podrá romper esta confidencialidad en los siguientes casos: (a) cuando exista un riesgo grave e inminente para mi vida o la de terceros; (b) cuando lo exija una orden judicial; (c) cuando sea necesario para proteger a menores o personas vulnerables.

4. SERVICIOS DE EMERGENCIA
Comprendo que Psiconecta NO es un servicio de emergencias. En caso de crisis o emergencia psicológica, debo contactar los servicios de emergencia locales (911 u equivalente) o acudir al servicio de urgencias más cercano. El check-in diario de bienestar es una herramienta de seguimiento, no un sustituto de atención de emergencia.

5. FORMATO DE ATENCIÓN EN LÍNEA
La terapia se realiza por videollamada. Acepto las siguientes condiciones: (a) garantizar un espacio privado y con buena conexión a internet para mis sesiones; (b) informar al terapeuta si la calidad de la comunicación afecta la sesión; (c) las sesiones pueden ser suspendidas por fallas técnicas fuera del control de las partes.

6. PAGOS Y CANCELACIONES
Los honorarios son acordados con el terapeuta y procesados a través de PayPal. La política de cancelación establece: reembolso completo si cancela con más de 24 horas de anticipación, reembolso del 50% entre 2 y 24 horas, sin reembolso si cancela con menos de 2 horas de anticipación.

7. MENORES DE EDAD
Si soy menor de 18 años, declaro contar con el consentimiento de mi padre, madre o tutor legal para recibir servicios terapéuticos a través de esta plataforma.

8. PROTECCIÓN DE DATOS
Mis datos personales y clínicos serán tratados conforme a la Política de Privacidad de Psiconecta, en cumplimiento con el Reglamento General de Protección de Datos (RGPD) y las leyes aplicables en mi país. Puedo solicitar acceso, rectificación o eliminación de mis datos en cualquier momento escribiendo a privacidad@psiconecta.app.

9. ACEPTACIÓN
Al firmar digitalmente este documento, confirmo que: he leído y comprendido completamente su contenido; consiento voluntariamente recibir servicios de psicoterapia a través de Psiconecta; acepto los términos descritos anteriormente.`

export default function ConsentModal({ therapistName, onAccept, onClose, loading = false }) {
  const [hasScrolled, setHasScrolled] = useState(false)
  const [accepted, setAccepted]       = useState(false)
  const scrollRef = useRef(null)

  // Detectar cuando el usuario llega al final del documento
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40
    if (atBottom) setHasScrolled(true)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.addEventListener('scroll', handleScroll)
    return () => el?.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Header informativo */}
      <div className="flex items-start gap-3 bg-primary-50 border border-primary-100 rounded-xl p-3">
        <ScrollText size={18} className="text-primary-500 shrink-0 mt-0.5" strokeWidth={1.8} />
        <div>
          <p className="text-sm font-semibold text-primary-800">Firma requerida</p>
          <p className="text-xs text-primary-600 mt-0.5">
            Antes de tu primera sesión con <strong>{therapistName}</strong>, debes leer y aceptar el consentimiento informado.
          </p>
        </div>
      </div>

      {/* Texto del documento */}
      <div
        ref={scrollRef}
        className="h-72 overflow-y-auto bg-warm-50 border border-warm-100 rounded-xl p-4 text-xs text-warm-700 leading-relaxed whitespace-pre-line"
      >
        {CONSENT_TEXT}
        {!hasScrolled && (
          <div className="sticky bottom-0 pt-2 pb-1 text-center">
            <span className="text-[10px] text-warm-400 bg-warm-50 px-2 py-1 rounded-full border border-warm-100">
              Desplázate hasta el final para continuar
            </span>
          </div>
        )}
      </div>

      {/* Checkbox de aceptación */}
      {hasScrolled && (
        <label className="flex items-start gap-3 cursor-pointer group animate-fade-in">
          <div
            onClick={() => setAccepted(v => !v)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
              accepted ? 'bg-primary-600 border-primary-600' : 'border-warm-300 bg-white group-hover:border-primary-400'
            }`}
          >
            {accepted && <CheckCircle size={12} strokeWidth={3} className="text-white" />}
          </div>
          <span className="text-sm text-warm-700 leading-snug">
            He leído y comprendo el consentimiento informado. Acepto voluntariamente los términos para recibir servicios de psicoterapia con <strong>{therapistName}</strong> a través de Psiconecta.
          </span>
        </label>
      )}

      {/* Acciones */}
      <div className="flex gap-2 mt-1">
        <Button variant="outline" fullWidth onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          fullWidth
          disabled={!hasScrolled || !accepted}
          loading={loading}
          onClick={onAccept}
        >
          Firmar y continuar
        </Button>
      </div>

      <p className="text-xs text-warm-400 text-center">
        Tu firma digital queda registrada con fecha, hora e identificador de usuario.
        Puedes descargar una copia desde "Mis citas".
      </p>
    </div>
  )
}
