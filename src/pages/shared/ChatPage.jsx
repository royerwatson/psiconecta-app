/**
 * Página de mensajería interna entre paciente y terapeuta.
 *
 * Arquitectura de conversaciones:
 *   - No existe una tabla "conversations". Las conversaciones se infieren
 *     agrupando las sesiones compartidas y deduplicando por interlocutor.
 *   - Cada conversación corresponde a un par (usuario_actual ↔ otro_usuario).
 *
 * Flujo de mensajes:
 *   1. fetchConversations — detecta interlocutores desde la tabla sessions
 *   2. fetchMessages      — carga hasta 100 mensajes del par activo (orden ASC)
 *   3. subscribeToMessages — suscripción Supabase Realtime (postgres_changes INSERT)
 *      · Filtra por receiver_id=eq.${user.id} y valida que sender_id sea el activo
 *      · Deduplica por ID para evitar duplicados ante reconexiones
 *   4. sendMessage — actualización optimista: muestra el mensaje con id temp-*
 *      antes del INSERT; si falla, revierte el estado y restaura el texto
 *
 * Parámetros URL:
 *   ?patient=<id>    → abre automáticamente la conversación con ese paciente
 *   ?therapist=<id>  → abre automáticamente la conversación con ese terapeuta
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { formatRelative } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { AlertTriangle, MessageCircle, Hand } from 'lucide-react'

export default function ChatPage() {
  const { user, role } = useAuthStore()
  const [params] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({}) // { [convId]: number }
  const [onlineUsers, setOnlineUsers] = useState(new Set()) // Set de user IDs en línea
  const bottomRef = useRef(null)
  const channelRef = useRef(null)
  const presenceRef = useRef(null)
  const inputRef = useRef(null)

  // Abrir conversación desde query param (?patient=id o ?therapist=id)
  const targetId = params.get('patient') ?? params.get('therapist')

  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  // Canal de presencia global — indica quién está en el chat ahora mismo
  useEffect(() => {
    if (!user) return

    const presence = supabase.channel('chat-presence', {
      config: { presence: { key: user.id } },
    })

    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState()
        const online = new Set(Object.keys(state))
        setOnlineUsers(online)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => { const s = new Set(prev); s.delete(key); return s })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presence.track({ user_id: user.id, online_at: new Date().toISOString() })
        }
      })

    presenceRef.current = presence
    return () => {
      presence.untrack()
      presence.unsubscribe()
    }
  }, [user?.id])

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv)
      subscribeToMessages(activeConv)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    return () => channelRef.current?.unsubscribe()
  }, [activeConv?.id])

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    setLoading(true)
    setError(null)
    try {
      // Determinar el campo y join según el rol del usuario actual
      const otherField = role === 'therapist' ? 'therapist_id' : 'patient_id'
      const profileJoin = role === 'therapist'
        ? 'patient:profiles!sessions_patient_id_fkey(id, full_name, avatar_url)'
        : 'therapist:profiles!sessions_therapist_id_fkey(id, full_name, avatar_url, therapist_profiles(specialty))'

      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select(`id, ${profileJoin}`)
        .eq(`${otherField}`, user.id)
        .order('scheduled_at', { ascending: false })

      if (fetchError) throw fetchError

      // Deduplicar: una conversación por persona
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
      fetchUnreadCounts(convs)

      // Auto-abrir: target desde query param o primera conversación
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

  const PAGE_SIZE = 40

  const fetchMessages = async (conv) => {
    setLoadingMessages(true)
    setHasMore(false)
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${conv.id}),` +
        `and(sender_id.eq.${conv.id},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (fetchError) {
      console.error('Error cargando mensajes:', fetchError)
    } else {
      const sorted = (data ?? []).reverse()  // mostrar cronológicamente
      setMessages(sorted)
      setHasMore((data ?? []).length === PAGE_SIZE)
      markAsRead(conv.id)
    }
    setLoadingMessages(false)
  }

  // Cargar mensajes anteriores (scroll infinito inverso)
  const fetchMoreMessages = async () => {
    if (!activeConv || loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)

    const oldest = messages[0]?.created_at
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${activeConv.id}),` +
        `and(sender_id.eq.${activeConv.id},receiver_id.eq.${user.id})`
      )
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (!error) {
      const sorted = (data ?? []).reverse()
      setMessages(prev => [...sorted, ...prev])
      setHasMore((data ?? []).length === PAGE_SIZE)
    }
    setLoadingMore(false)
  }

  const markAsRead = async (convId) => {
    // Intentar con RPC (requiere migration_messages_read_at.sql ejecutado)
    const { error } = await supabase.rpc('mark_messages_read', {
      p_sender_id:   convId,
      p_receiver_id: user.id,
    }).catch(() => ({ error: true }))

    if (error) {
      // Fallback: UPDATE directo (funciona sin la RPC; también actualiza campo 'read')
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString(), read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', convId)
        .is('read_at', null)
    }
    // Limpiar badge de no leídos para esta conversación
    setUnreadCounts(prev => ({ ...prev, [convId]: 0 }))
  }

  // Cargar conteo de no leídos por conversación
  // Usa read_at si existe (post-migración), si no usa read=false (esquema original)
  const fetchUnreadCounts = async (convs) => {
    const counts = {}
    await Promise.all(convs.map(async (conv) => {
      // Intentar con read_at primero
      let { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', conv.id)
        .is('read_at', null)

      if (error) {
        // Fallback al campo booleano original
        const res = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('sender_id', conv.id)
          .eq('read', false)
        count = res.count
      }
      counts[conv.id] = count ?? 0
    }))
    setUnreadCounts(counts)
  }

  /**
   * Suscripción realtime para mensajes entrantes.
   * Filtra solo los mensajes donde receiver_id = usuario actual y
   * sender_id = la persona del chat activo.
   */
  const subscribeToMessages = useCallback((conv) => {
    // Cancelar suscripción anterior antes de crear una nueva
    channelRef.current?.unsubscribe()

    const channel = supabase
      .channel(`chat-${user.id}-${conv.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const senderId = payload.new.sender_id
          if (senderId === conv.id) {
            // Mensaje del interlocutor activo: mostrar directamente
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
            // Marcar como leído inmediatamente (ya está viendo esta conv)
            supabase.from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', payload.new.id)
              .then()
          } else {
            // Mensaje de otra conversación: incrementar badge
            setUnreadCounts((prev) => ({
              ...prev,
              [senderId]: (prev[senderId] ?? 0) + 1,
            }))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.debug('Chat realtime conectado para conversación:', conv.id)
        }
      })

    channelRef.current = channel
  }, [user?.id])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv || sending) return
    setSending(true)

    const tempId = `temp-${Date.now()}`
    const msgContent = newMessage.trim()
    const msg = {
      sender_id:   user.id,
      receiver_id: activeConv.id,
      content:     msgContent,
      created_at:  new Date().toISOString(),
    }

    // Actualización optimista: mostrar de inmediato para el remitente
    setMessages((prev) => [...prev, { ...msg, id: tempId }])
    setNewMessage('')

    const { data: inserted, error: insertError } = await supabase
      .from('messages')
      .insert(msg)
      .select()
      .single()

    if (insertError) {
      // Revertir actualización optimista en caso de error
      console.error('Error enviando mensaje:', insertError)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setNewMessage(msgContent)
      toast.error('No se pudo enviar el mensaje. Intenta de nuevo.')
      setSending(false)
      return
    }

    // Reemplazar el mensaje temporal con el real (ID correcto del DB)
    if (inserted) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? inserted : m))
      )
    }

    // Notificar por email al destinatario (best-effort, no bloqueante)
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (!authSession?.access_token) return
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          recipientId:    activeConv.id,
          messagePreview: msgContent,
        }),
      }).catch(() => {}) // Silenciar errores de red
    })

    setSending(false)
  }

  /**
   * Enter envía, Shift+Enter inserta salto de línea.
   * Solo aplica cuando el input es un textarea o input de texto.
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  // ── Error state ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-[calc(100dvh-8rem)]">
        <AlertTriangle size={48} strokeWidth={1.8} className="text-warm-400" />
        <p className="font-medium text-warm-800">{error}</p>
        <Button onClick={fetchConversations} size="sm">Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] gap-0 animate-fade-in overflow-hidden">

      {/* ── Lista de conversaciones (sidebar) ── */}
      <div className={`${
        activeConv ? 'hidden sm:flex' : 'flex'
      } flex-col w-full sm:w-72 border-r border-warm-100 bg-white rounded-l-2xl overflow-hidden`}>

        <div className="px-4 py-4 border-b border-warm-100">
          <h2 className="font-serif text-lg font-semibold text-warm-900">Mensajes</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex flex-col gap-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-warm-400 text-sm">
              <div className="flex justify-center mb-2"><MessageCircle size={32} strokeWidth={1.8} className="text-warm-300" /></div>
              <p>No hay conversaciones aún</p>
              <p className="text-xs mt-2 text-warm-300">
                Reserva una sesión para comenzar a chatear
              </p>
            </div>
          ) : conversations.map((conv) => {
            const subtitle = role === 'therapist'
              ? 'Paciente'
              : (conv.therapist_profiles?.[0]?.specialty ?? 'Terapeuta')
            const isActive = activeConv?.id === conv.id
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-warm-50 transition-colors text-left border-b border-warm-50 last:border-b-0 ${
                  isActive ? 'bg-primary-50 border-r-2 border-r-primary-400' : ''
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={conv.full_name} size="md" />
                  {isActive && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${isActive ? 'text-primary-700' : 'text-warm-800'}`}>
                    {conv.full_name}
                  </p>
                  <p className="text-xs text-warm-400 truncate">{subtitle}</p>
                </div>
                {/* Badge de mensajes no leídos */}
                {!isActive && (unreadCounts[conv.id] ?? 0) > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                    {unreadCounts[conv.id] > 9 ? '9+' : unreadCounts[conv.id]}
                  </span>
                )}
                {isActive && <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Área de mensajes ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white rounded-r-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-warm-100 shrink-0">
            <button
              className="sm:hidden text-warm-400 hover:text-warm-600 p-1"
              onClick={() => setActiveConv(null)}
              aria-label="Volver a conversaciones"
            >
              ←
            </button>
            <Avatar name={activeConv.full_name} size="sm" />
            <div className="flex-1">
              <p className="font-semibold text-warm-900 text-sm">{activeConv.full_name}</p>
              {onlineUsers.has(activeConv.id) ? (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  En línea
                </p>
              ) : (
                <p className="text-xs text-warm-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-warm-300 inline-block" />
                  Desconectado
                </p>
              )}
            </div>
          </div>

          {/* Mensajes */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-warm-50"
            onScroll={(e) => {
              // Cargar más cuando el scroll llega al tope (mensajes anteriores)
              if (e.currentTarget.scrollTop < 60 && !loadingMore && hasMore) {
                fetchMoreMessages()
              }
            }}
          >
            {/* Indicador de carga de mensajes anteriores */}
            {loadingMore && (
              <div className="flex justify-center py-2">
                <div className="flex items-center gap-2 text-xs text-warm-400">
                  <div className="w-3 h-3 border-2 border-warm-300 border-t-primary-400 rounded-full animate-spin" />
                  Cargando mensajes anteriores...
                </div>
              </div>
            )}
            {!loadingMore && hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={fetchMoreMessages}
                  className="text-xs text-primary-500 hover:text-primary-700 font-medium py-1 px-3 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Ver mensajes anteriores
                </button>
              </div>
            )}
            {loadingMessages ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-warm-400 text-sm mt-10">
                <div className="flex justify-center mb-2"><Hand size={32} strokeWidth={1.8} className="text-warm-300" /></div>
                <p>Inicia la conversación</p>
                <p className="text-xs mt-1 text-warm-300">Los mensajes son privados y seguros</p>
              </div>
            ) : messages.map((msg) => {
              const isOwn = msg.sender_id === user.id
              const isTemp = String(msg.id).startsWith('temp-')
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? `bg-primary-600 text-white rounded-br-sm ${isTemp ? 'opacity-70' : ''}`
                        : 'bg-white text-warm-800 shadow-sm rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <p className="text-xs text-warm-400 px-1">
                      {isTemp ? 'Enviando...' : formatRelative(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input de mensaje */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 px-4 py-3 border-t border-warm-100 bg-white shrink-0"
          >
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje... (Enter para enviar)"
              disabled={sending}
              className="flex-1 rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-sm text-warm-800 placeholder:text-warm-400 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 disabled:opacity-60 transition-all"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || sending}
              loading={sending}
              aria-label="Enviar mensaje"
            >
              {!sending && (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </form>
        </div>
      ) : (
        /* Estado vacío en desktop cuando no hay conversación seleccionada */
        <div className="hidden sm:flex flex-1 items-center justify-center bg-warm-50 rounded-r-2xl">
          <div className="text-center text-warm-400">
            <div className="flex justify-center mb-3"><MessageCircle size={48} strokeWidth={1.8} className="text-warm-300" /></div>
            <p className="font-medium">Selecciona una conversación</p>
            <p className="text-sm mt-1 text-warm-300">Tus mensajes son privados y cifrados</p>
          </div>
        </div>
      )}
    </div>
  )
}
