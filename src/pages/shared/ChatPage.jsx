import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { formatRelative } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { user, role } = useAuthStore()
  const [params] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const channelRef = useRef(null)

  // Abrir conversación desde query param
  const targetId = params.get('patient') ?? params.get('therapist')

  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv)
      subscribeToMessages(activeConv)
    }
    return () => channelRef.current?.unsubscribe()
  }, [activeConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    setLoading(true)
    setError(null)
    try {
      // Traer todos los usuarios con quienes ha tenido sesiones
      const otherField = role === 'therapist' ? 'therapist_id' : 'patient_id'
      const profileJoin = role === 'therapist'
        ? 'patient:profiles!sessions_patient_id_fkey(id, full_name, avatar_url)'
        : 'therapist:profiles!sessions_therapist_id_fkey(id, full_name, avatar_url)'

      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`id, ${profileJoin}`)
        .eq(`${otherField}`, user.id)
        .order('scheduled_at', { ascending: false })

      if (fetchError) throw fetchError

      // Deduplicar por ID de la otra persona
      const seen = new Set()
      const convs = []
      for (const s of (data ?? [])) {
        const other = role === 'therapist' ? s.patient : s.therapist
        if (other && !seen.has(other.id)) {
          seen.add(other.id)
          convs.push({ id: other.id, ...other })
        }
      }
      setConversations(convs)

      // Auto-abrir si hay target en query param
      if (targetId) {
        const target = convs.find((c) => c.id === targetId)
        if (target) setActiveConv(target)
      } else if (convs.length > 0) {
        setActiveConv(convs[0])
      }
    } catch (err) {
      console.error('Error cargando conversaciones:', err)
      setError('No pudimos cargar tus mensajes. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conv) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conv.id}),and(sender_id.eq.${conv.id},receiver_id.eq.${user.id})`)
      .order('created_at')
      .limit(100)
    setMessages(data ?? [])
  }

  const subscribeToMessages = (conv) => {
    channelRef.current?.unsubscribe()
    const channel = supabase
      .channel(`chat-${user.id}-${conv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new.sender_id === conv.id) {
          setMessages((m) => [...m, payload.new])
        }
      })
      .subscribe()
    channelRef.current = channel
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv) return
    setSending(true)

    const tempId = 'temp-' + Date.now()
    const msg = {
      sender_id: user.id,
      receiver_id: activeConv.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    }

    // Actualización optimista: el mensaje aparece de inmediato para el remitente
    setMessages((m) => [...m, { ...msg, id: tempId }])
    setNewMessage('')

    const { error } = await supabase.from('messages').insert(msg)
    if (error) {
      // Si falla, eliminar el mensaje optimista y restaurar el input
      console.error('Error enviando mensaje:', error)
      setMessages((m) => m.filter((x) => x.id !== tempId))
      setNewMessage(msg.content)
      toast.error('No se pudo enviar el mensaje. Intenta de nuevo.')
      setSending(false)
      return
    }

    // Notificar al destinatario por email (best-effort, no bloquea la UI)
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (!authSession?.access_token) return
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          recipientId: activeConv.id,
          messagePreview: msg.content,
        }),
      }).catch(() => {}) // Silenciar errores de red — notificación es best-effort
    })

    setSending(false)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-[calc(100dvh-8rem)]">
        <span className="text-5xl">⚠️</span>
        <p className="font-medium text-warm-800">{error}</p>
        <Button onClick={fetchConversations} size="sm">Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] gap-0 animate-fade-in overflow-hidden">
      {/* Lista de conversaciones */}
      <div className={`${activeConv ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-72 border-r border-warm-100 bg-white rounded-l-2xl overflow-hidden`}>
        <div className="px-4 py-4 border-b border-warm-100">
          <h2 className="font-serif text-lg font-semibold text-warm-900">Mensajes</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex flex-col gap-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-warm-400 text-sm">
              <p className="text-3xl mb-2">💬</p>
              <p>No hay conversaciones aún</p>
            </div>
          ) : conversations.map((conv) => (
            <button key={conv.id} onClick={() => setActiveConv(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-50 transition-colors ${activeConv?.id === conv.id ? 'bg-primary-50' : ''}`}>
              <Avatar name={conv.full_name} size="md" online={true} />
              <div className="text-left flex-1 min-w-0">
                <p className="font-medium text-sm text-warm-800 truncate">{conv.full_name}</p>
                <p className="text-xs text-warm-400">Toca para chatear</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white rounded-r-2xl overflow-hidden">
          {/* Header del chat */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-warm-100 shrink-0">
            <button className="sm:hidden text-warm-400 hover:text-warm-600"
              onClick={() => setActiveConv(null)}>←</button>
            <Avatar name={activeConv.full_name} size="sm" online={true} />
            <div>
              <p className="font-semibold text-warm-900 text-sm">{activeConv.full_name}</p>
              <p className="text-xs text-success">En línea</p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-warm-50">
            {messages.length === 0 && (
              <div className="text-center text-warm-400 text-sm mt-10">
                <p className="text-3xl mb-2">👋</p>
                <p>Inicia la conversación</p>
              </div>
            )}
            {messages.map((msg) => {
              const isOwn = msg.sender_id === user.id
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-white text-warm-800 shadow-sm rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <p className="text-xs text-warm-400 px-1">{formatRelative(msg.created_at)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-warm-100 bg-white shrink-0">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </form>
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center bg-warm-50 rounded-r-2xl">
          <div className="text-center text-warm-400">
            <p className="text-5xl mb-3">💬</p>
            <p className="font-medium">Selecciona una conversación</p>
          </div>
        </div>
      )}
    </div>
  )
}
