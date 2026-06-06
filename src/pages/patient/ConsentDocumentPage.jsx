/**
 * ConsentDocumentPage — Muestra el consentimiento firmado y permite descargarlo.
 * Ruta: /patient/consent/:signatureId
 *
 * Al hacer clic en "Descargar PDF" se abre el diálogo de impresión del navegador
 * con estilos optimizados para guardar como PDF.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { CONSENT_TEXT } from '@/components/patient/ConsentModal'
import Button from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Spinner'
import { Download, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ConsentDocumentPage() {
  const { signatureId } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [signature, setSignature] = useState(null)
  const [therapist, setTherapist] = useState(null)
  const [patient, setPatient]     = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => { if (user && signatureId) fetchSignature() }, [user, signatureId])

  const fetchSignature = async () => {
    const { data: sig } = await supabase
      .from('consent_signatures')
      .select('*')
      .eq('id', signatureId)
      .eq('patient_id', user.id)
      .single()

    if (!sig) { navigate('/patient/appointments'); return }
    setSignature(sig)

    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', sig.therapist_id).single(),
      supabase.from('profiles').select('full_name').eq('id', sig.patient_id).single(),
    ])
    setTherapist(t)
    setPatient(p)
    setLoading(false)
  }

  const handlePrint = () => window.print()

  if (loading) return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96" />
    </div>
  )

  const signedDate = signature
    ? new Date(signature.signed_at).toLocaleDateString('es-DO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

  return (
    <>
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto py-6 px-4 print-container">

        {/* Barra de acciones — oculta al imprimir */}
        <div className="no-print flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-warm-500 hover:text-warm-800 transition-colors">
            <ArrowLeft size={16} strokeWidth={1.8} /> Volver
          </button>
          <Button size="sm" onClick={handlePrint}>
            <Download size={14} strokeWidth={1.8} className="mr-1.5" /> Descargar PDF
          </Button>
        </div>

        {/* Documento */}
        <div className="bg-white border border-warm-100 rounded-2xl p-8 shadow-sm">

          {/* Cabecera del documento */}
          <div className="text-center border-b border-warm-100 pb-6 mb-6">
            <p className="text-2xl font-bold text-warm-900 font-serif">Psiconecta</p>
            <p className="text-sm text-warm-500 mt-1">Plataforma de Psicoterapia en Línea</p>
            <h1 className="text-lg font-bold text-warm-800 mt-4">
              Consentimiento Informado para Servicios de Psicoterapia
            </h1>
            <p className="text-xs text-warm-400 mt-1">Documento {signature?.document_version}</p>
          </div>

          {/* Datos de la firma */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" strokeWidth={1.8} />
            <div>
              <p className="text-sm font-semibold text-green-800">Documento firmado digitalmente</p>
              <p className="text-xs text-green-700 mt-0.5">
                <strong>Paciente:</strong> {patient?.full_name}<br />
                <strong>Terapeuta:</strong> {therapist?.full_name}<br />
                <strong>Fecha y hora:</strong> {signedDate}<br />
                <strong>ID de firma:</strong> {signature?.id}
              </p>
            </div>
          </div>

          {/* Texto del consentimiento */}
          <div className="text-xs text-warm-700 leading-relaxed whitespace-pre-line">
            {CONSENT_TEXT}
          </div>

          {/* Firma al pie */}
          <div className="mt-8 pt-6 border-t border-warm-100">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs text-warm-500 mb-1">Firma del paciente</p>
                <p className="font-semibold text-warm-800">{patient?.full_name}</p>
                <p className="text-xs text-warm-400 mt-1">Firma digital — {signedDate}</p>
              </div>
              <div>
                <p className="text-xs text-warm-500 mb-1">Terapeuta</p>
                <p className="font-semibold text-warm-800">{therapist?.full_name}</p>
              </div>
            </div>
            <p className="text-[10px] text-warm-300 mt-6 text-center">
              Documento generado por Psiconecta · psiconecta.app · ID: {signature?.id}
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
