/**
 * Página de videollamada integrada con Daily.co.
 *
 * Flujo según rol:
 *   Terapeuta:
 *     1. fetchSession — carga los datos de la sesión por :sessionId
 *     2. createRoom   — llama a la API de Daily.co para crear una sala con:
 *          · exp: 2 horas desde ahora
 *          · max_participants: 2 (sesiones individuales)
 *     3. Guarda la URL en sessions.video_room_url y cambia status → 'in_progress'
 *     4. initCall     — carga @daily-co/daily-js de forma lazy y renderiza el iframe
 *
 *   Paciente:
 *     1. fetchSession — si video_room_url aún no existe inicia polling cada 3 s
 *     2. startPolling — consulta sessions.video_room_url hasta que el terapeuta cree la sala
 *     3. Al detectar URL válida: para el polling y llama a initCall
 *
 * Variables de entorno requeridas:
 *   VITE_SUPABASE_URL — para llamar a la Edge Function create-daily-room
 *   (VITE_DAILY_API_KEY ya no se usa — la key está en Supabase Secrets)
 *
 * Sesiones grupales: pasar ?type=group&max=N en la URL para salas de más de 2 participantes.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { XCircle, Video, Loader2, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react'

export default function VideoCall() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const isGroup = searchParams.get('type') === 'group'
  const groupMax = parseInt(searchParams.get('max') ?? '20', 10)
  const { user, role } = useAuthStore()
  const navigate = useNavigate()
  const [session, setSession]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [roomUrl, setRoomUrl]         = useState(null)
  const [callFrame, setCallFrame]     = useState(null)
  const [micOn, setMicOn]             = useState(true)
  const [camOn, setCamOn]             = useState(true)
  const [polling, setPolling]         = useState(false)
  const [netQuality, setNetQuality]   = useState('good')   // 'good' | 'low' | 'very-low' | 'lost'
  const [reconnecting, setReconnecting] = useState(false)
  const containerRef  = useRef(null)
  const pollTimerRef  = useRef(null)
  const callFrameRef  = useRef(null)

  useEffect(() => {
    fetchSession()
    return () => {
      clearInterval(pollTimerRef.current)
      callFrameRef.current?.destroy()
    }
  }, [sessionId])

  const fetchSession = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        therapist:profiles!sessions_therapist_id_fkey(id, full_name),
        patient:profiles!sessions_patient_id_fkey(id, full_name)
      `)
      .eq('id', sessionId)
      .single()

    // Si la sesión no existe (ej. ID de sesión grupal o ID inválido), mostrar error
    if (error || !data) {
      toast.error('Sesión no encontrada. Verifica el enlace.')
      setLoading(false)
      return
    }

    setSession(data)

    // URL válida: no nula y empieza con https
    const validUrl = data?.video_room_url?.startsWith('https://') ? data.video_room_url : null

    if (validUrl) {
      setRoomUrl(validUrl)
      setLoading(false)
    } else if (role === 'therapist') {
      await createRoom(data)
      setLoading(false)
    } else {
      // Paciente: polling hasta que el terapeuta cree la sala
      setLoading(false)
      setPolling(true)
      startPolling()
    }
  }

  const startPolling = () => {
    pollTimerRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('sessions')
        .select('video_room_url')
        .eq('id', sessionId)
        .single()

      const validUrl = data?.video_room_url?.startsWith('https://') ? data.video_room_url : null
      if (validUrl) {
        clearInterval(pollTimerRef.current)
        setPolling(false)
        setRoomUrl(validUrl)
      }
    }, 3000) // Reintenta cada 3 segundos
  }

  const createRoom = async (sessionData) => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const token = authSession?.access_token
      if (!token) throw new Error('No autenticado')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-daily-room`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId,
            isGroup,
            maxParticipants: isGroup ? groupMax : 2,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error creando sala')
      setRoomUrl(data.url)
    } catch (err) {
      toast.error('Error al crear la sala de video')
      console.error(err)
    }
  }

  useEffect(() => {
    if (roomUrl && containerRef.current && !callFrameRef.current) {
      initCall()
    }
  }, [roomUrl])

  const initCall = async () => {
    try {
      const DailyIframe = (await import('@daily-co/daily-js')).default
      const frame = DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100%', height: '100%',
          border: 0,
          borderRadius: '16px',
        },
        showLeaveButton: false,
        showFullscreenButton: true,
      })

      frame.on('left-meeting', handleLeave)
      frame.on('error', (e) => {
        console.error('Daily error:', e)
        toast.error('Error en la videollamada: ' + (e.errorMsg ?? 'intenta reconectar'))
      })

      // Monitoreo de calidad de red
      frame.on('network-quality-change', ({ threshold }) => {
        // threshold: 'good' | 'low' | 'very-low' | 'lost'
        setNetQuality(threshold)
        if (threshold === 'lost') {
          setReconnecting(true)
          toast.error('Conexión perdida. Intentando reconectar...', { id: 'net-lost', duration: 999999 })
        } else if (threshold !== 'good') {
          toast.dismiss('net-lost')
          setReconnecting(false)
        } else {
          toast.dismiss('net-lost')
          setReconnecting(false)
        }
      })

      // Reconexión automática cuando se restaura la red
      frame.on('network-connection', ({ event }) => {
        if (event === 'reconnected') {
          toast.dismiss('net-lost')
          setReconnecting(false)
          setNetQuality('good')
          toast.success('Conexión restaurada')
        }
      })

      await frame.join({ url: roomUrl, userName: user?.email })
      callFrameRef.current = frame
      setCallFrame(frame)
    } catch (err) {
      toast.error('No se pudo iniciar la videollamada')
      console.error(err)
    }
  }

  const handleLeave = useCallback(async () => {
    clearInterval(pollTimerRef.current)
    callFrameRef.current?.destroy()
    callFrameRef.current = null
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId)
    toast.success('Videollamada finalizada')
    navigate(role === 'therapist' ? '/therapist/dashboard' : '/patient/appointments')
  }, [sessionId, role, navigate])

  const toggleMic = () => {
    callFrameRef.current?.setLocalAudio(!micOn)
    setMicOn(!micOn)
  }

  const toggleCam = () => {
    callFrameRef.current?.setLocalVideo(!camOn)
    setCamOn(!camOn)
  }

  // Reconexión manual: destruye el frame actual y vuelve a crear la sala
  const handleReconnect = async () => {
    setReconnecting(true)
    toast.dismiss('net-lost')
    try {
      callFrameRef.current?.destroy()
      callFrameRef.current = null
      setCallFrame(null)
      // Pequeña pausa para que el DOM se limpie
      await new Promise(r => setTimeout(r, 600))
      await initCall()
      setNetQuality('good')
    } catch {
      toast.error('No se pudo reconectar. Verifica tu conexión a internet.')
    } finally {
      setReconnecting(false)
    }
  }

  const other = session
    ? (role === 'therapist' ? session.patient : session.therapist)
    : null

  // Si la sesión no se encontró mostrar pantalla de error
  if (!loading && !session) {
    return (
      <div className="fixed inset-0 bg-warm-900 flex flex-col items-center justify-center z-50 gap-4">
        <XCircle size={56} className="text-red-400" />
        <p className="text-white font-medium">Sesión no encontrada</p>
        <p className="text-warm-400 text-sm">El ID de sesión no es válido o la sesión fue eliminada</p>
        <Button onClick={() => navigate(-1)} variant="secondary">
          ← Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-warm-900 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-warm-900/80 backdrop-blur-sm z-10">
        <div className="text-white">
          <p className="text-xs text-warm-400">Sesión en curso con</p>
          <p className="font-semibold">{other?.full_name ?? '...'}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Indicador de calidad de red */}
          {callFrame && (
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full transition-colors ${
                netQuality === 'good'      ? 'bg-green-400' :
                netQuality === 'low'       ? 'bg-amber-400 animate-pulse' :
                netQuality === 'very-low'  ? 'bg-orange-500 animate-pulse' :
                'bg-red-500 animate-pulse'
              }`} />
              <span className="text-xs text-warm-400">
                {netQuality === 'good'     ? 'En vivo' :
                 netQuality === 'low'      ? 'Señal baja' :
                 netQuality === 'very-low' ? 'Señal muy baja' :
                 'Sin conexión'}
              </span>
            </div>
          )}
          {!callFrame && (
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${polling ? 'bg-amber-400' : 'bg-warm-600'}`} />
              <span className="text-xs text-warm-400">{polling ? 'Esperando...' : 'Conectando...'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Banner de red degradada / perdida */}
      {callFrame && netQuality !== 'good' && (
        <div className={`px-4 py-2.5 flex items-center justify-between transition-all ${
          netQuality === 'lost' ? 'bg-red-900/90' : 'bg-amber-900/80'
        }`}>
          <div className="flex items-center gap-2">
            <Loader2 size={14} className={`shrink-0 ${netQuality === 'lost' ? 'text-red-300 animate-spin' : 'text-amber-300'}`} />
            <p className="text-xs text-white font-medium">
              {netQuality === 'lost'
                ? 'Conexión perdida — intentando reconectar automáticamente'
                : netQuality === 'very-low'
                ? 'Señal muy baja — la calidad de video puede verse afectada'
                : 'Señal baja — verifica tu conexión a internet'}
            </p>
          </div>
          {netQuality === 'lost' && !reconnecting && (
            <button
              onClick={handleReconnect}
              className="text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg font-medium transition-colors shrink-0 ml-3"
            >
              Reconectar
            </button>
          )}
        </div>
      )}

      {/* Video container */}
      <div className="flex-1 relative mx-4 mb-4 rounded-2xl overflow-hidden bg-warm-800">
        {(!roomUrl || loading) && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <div className="flex items-center justify-center mb-4">
                {polling
                  ? <Loader2 size={48} className="text-warm-400 animate-spin" />
                  : <Video size={48} className="text-warm-400" />}
              </div>
              <p className="font-medium">
                {polling
                  ? 'Esperando que el terapeuta inicie la sala...'
                  : 'Preparando la sala...'}
              </p>
              <p className="text-sm text-warm-400 mt-1">
                {polling ? 'Esto puede tardar unos segundos' : 'Conectando con Daily.co'}
              </p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 bg-warm-900/80 backdrop-blur-sm">
        <ControlButton
          onClick={toggleMic}
          active={micOn}
          Icon={micOn ? Mic : MicOff}
          label={micOn ? 'Mutear' : 'Activar mic'}
          disabled={!callFrame}
        />
        <ControlButton
          onClick={toggleCam}
          active={camOn}
          Icon={camOn ? Video : VideoOff}
          label={camOn ? 'Ocultar cam' : 'Mostrar cam'}
          disabled={!callFrame}
        />
        <button
          onClick={handleLeave}
          className="flex flex-col items-center gap-1 bg-red-600 hover:bg-red-700 text-white rounded-2xl px-6 py-3 transition-colors"
        >
          <PhoneOff size={20} />
          <span className="text-xs font-medium">Finalizar</span>
        </button>
      </div>
    </div>
  )
}

function ControlButton({ onClick, active, Icon, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded-2xl px-5 py-3 transition-colors disabled:opacity-40 ${
        active ? 'bg-warm-700 hover:bg-warm-600 text-white' : 'bg-red-900/40 hover:bg-red-900/60 text-red-300'
      }`}
    >
      <Icon size={20} strokeWidth={1.8} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}
