/**
 * PeerConsultationPage — Chat de interconsultas entre terapeutas.
 *
 * Arquitectura:
 *  - Directorio: todos los terapeutas de la plataforma (excepto el usuario actual).
 *  - Mensajes: misma tabla `messages` que el chat paciente-terapeuta.
 *    Sender y receiver son ambos terapeutas — no se requiere tabla extra.
 *  - Realtime: suscripción Supabase Realtime por receiver_id.
 *  - Unread: gestionado con localStorage por par de IDs (igual que Layout.jsx).
 *  - Confidencialidad: aviso permanente para no compartir datos identificables.
 *
 * Parámetros URL:
 *  ?therapist=<id>  → abre automáticamente la conversación con ese terapeuta
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { formatRelative } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────
const lastSeenKey = (myId, peerId) => `peer_chat_seen_${myId}_${peerId}`

function getUnreadSince(myId, peerId) {
  return localStorage.getItem(lastSeenKey(myId, peerId)) ??
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
}

function markSeen(myId, peerId) {
  localStorage.setItem(lastSeenKey(myId, peerId), new Date().toISOString())
}

// ── Componente: fila de terapeuta en la lista ─────────────────────────────────
function TherapistRow({ therapist, isActive, unread, lastMsg, onClick }) {
  const specialty = therapist.therapist_profiles?.[0]?.specialty ?? null
  const verified  = therapist.therapist_profiles?.[0]?.verification_status === 'verified'

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-warm-50 last:border-b-0',
        isActive ? 'bg-primary-50 border-r-2 border-r-primary-400' : 'hover:bg-warm-50',
      )}
    >
      <div className="relative shrink-0">
        <Avatar name={therapist.full_name} size="md" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn('font-medium text-sm truncate', isActive ? 'text-primary-700' : 'text-warm-800')}>
            {therapist.full_name}
          </p>
          {verified && <span title="Credenciales verificadas" className="text-[10px]">✅</span>}
        </div>
        <p className="text-xs text-warm-400 truncate">
          {lastMsg ? lastMsg.content : (specialty ?? 'Terapeuta')}
        </p>
      </div>
      {unread > 0 && (
        <span className="bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}

// ── Burbuja de mensaje ────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }) {
  const isTemp = String(msg.id).startsWith('temp-')
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        {msg.is_interconsulta && (
          <span className="text-[10px] font-semibold text-amber-600 px-1">
            🩺 Interconsulta formal
          </span>
        )}
        <div className={cn(
          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isOwn
            ? cn('bg-primary-600 text-white rounded-br-sm', isTemp && 'opacity-70')
            : 'bg-white text-warm-800 shadow-sm rounded-bl-sm',
        )}>
          {msg.content}
        </div>
        <p className="text-xs text-warm-400 px-1">
          {isTemp ? 'Enviando…' : formatRelative(msg.created_at)}
        </p>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PeerConsultationPage() {
  const { user } = useAuthStore()
  const [params] = useSearchParams()

  const [therapists,      setTherapists]      = useState([])
  const [activeTherapist, setActiveTherapist] = useState(null)
  const [messages,        setMessages]        = useState([])
  const [newMessage,      setNewMessage]      = useState('')
  const [isInterconsulta, setIsInterconsulta] = useState(false)
  const [search,          setSearch]          = useState('')
  const [lastMsgs,        setLastMsgs]        = useState({})   // peerId → last message
  const [unreadMap,       setUnreadMap]       = useState({})   // peerId → count
  const [loading,         setLoading]         = useState(true)
  const [loadingMsgs,     setLoadingMsgs]     = useState(false)
  const [sending,         setSending]         = useState(false)

  const bottomRef  = useRef(null)
  const channelRef = useRef(null)
  const inputRef   = useRef(null)

  const targetId = params.get('therapist')

  // ── Cargar directorio de terapeutas ────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const fetchTherapists = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, therapist_profiles(specialty, verification_status)')
        .eq('role', 'therapist')
        .neq('id', user.id)
        .order('full_name')

      const list = data ?? []
      setTherapists(list)

      // Cargar último mensaje + no leídos por terapeuta
      if (list.length) {
        await Promise.all(list.map(t => loadLastAndUnread(t.id)))
      }

      // Auto-abrir si viene con ?therapist=id
      if (targetId) {
        const t = list.find(x => x.id === targetId)
        if (t) openConversation(t)
      }

      setLoading(false)
    }
    fetchTherapists()
  }, [user?.id])

  const loadLastAndUnread = async (peerId) => {
    // Último mensaje
    const { data: lastArr } = await supabase
      .from('messages')
      .select('id, content, created_at, sender_id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .limit(1)

    if (lastArr?.[0]) {
      setLastMsgs(prev => ({ ...prev, [peerId]: lastArr[0] }))
    }

    // No leídos: mensajes recibidos desde última vez que vi la conversación
    const since = getUnreadSince(user.id, peerId)
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', peerId)
      .gte('created_at', since)

    if (count) setUnreadMap(prev => ({ ...prev, [peerId]: count }))
  }

  // ── Lista ordenada: con mensajes recientes primero ─────────────────────────
  const sortedTherapists = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = q
      ? therapists.filter(t => t.full_name.toLowerCase().includes(q))
      : therapists
    return [...filtered].sort((a, b) => {
      const la = lastMsgs[a.id]?.created_at ?? ''
      const lb = lastMsgs[b.id]?.created_at ?? ''
      if (la && lb) return lb.localeCompare(la)
      if (la) return -1
      if (lb) return 1
      return a.full_name.localeCompare(b.full_name)
    })
  }, [therapists, lastMsgs, search])

  // ── Abrir conversación ─────────────────────────────────────────────────────
  const openConversation = useCallback((therapist) => {
    setActiveTherapist(therapist)
    setMessages([])
    setIsInterconsulta(false)
    markSeen(user.id, therapist.id)
    setUnreadMap(prev => ({ ...prev, [therapist.id]: 0 }))
    setTimeout(() => inputRef.current?.focus(), 150)
  }, [user?.id])

  // ── Cargar mensajes ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTherapist) return
    setLoadingMsgs(true)

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${activeTherapist.id}),` +
          `and(sender_id.eq.${activeTherapist.id},receiver_id.eq.${user.id})`
        )
        .order('created_at')
        .limit(150)
      setMessages(data ?? [])
      setLoadingMsgs(false)
    }
    fetchMessages()

    // Suscripción Realtime
    channelRef.current?.unsubscribe()
    const channel = supabase
      .channel(`peer-${user.id}-${activeTherapist.id}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new.sender_id === activeTherapist.id) {
          setMessages(prev =>
            prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]
          )
          markSeen(user.id, activeTherapist.id)
          setLastMsgs(prev => ({ ...prev, [activeTherapist.id]: payload.new }))
        }
      })
      .subscribe()
    channelRef.current = channel

    return () => channelRef.current?.unsubscribe()
  }, [activeTherapist?.id])

  // Suscripción global para actualizar no-leídos de conversaciones no abiertas
  useEffect(() => {
    if (!user) return
    const globalChannel = supabase
      .channel(`peer-global-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const senderId = payload.new.sender_id
        if (senderId === activeTherapist?.id) return // ya manejado
        setUnreadMap(prev => ({ ...prev, [senderId]: (prev[senderId] ?? 0) + 1 }))
        setLastMsgs(prev => ({ ...prev, [senderId]: payload.new }))
      })
      .subscribe()
    return () => globalChannel.unsubscribe()
  }, [user?.id, activeTherapist?.id])

  // Scroll al final
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeTherapist || sending) return
    setSending(true)

    const tempId  = `temp-${Date.now()}`
    const content = newMessage.trim()
    const payload = {
      sender_id:        user.id,
      receiver_id:      activeTherapist.id,
      content,
      is_interconsulta: isInterconsulta,
      created_at:       new Date().toISOString(),
    }

    setMessages(prev => [...prev, { ...payload, id: tempId }])
    setNewMessage('')

    const { data: inserted, error } = await supabase
      .from('messages')
      .insert(payload)
      .select()
      .single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
      toast.error('No se pudo enviar el mensaje.')
      setSending(false)
      return
    }

    if (inserted) {
      setMessages(prev => prev.map(m => m.id === tempId ? inserted : m))
      setLastMsgs(prev => ({ ...prev, [activeTherapist.id]: inserted }))
    }
    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const totalUnread = Object.values(unreadMap).reduce((s, c) => s + c, 0)

  return (
    <div className="flex h-[calc(100dvh-8rem)] gap-0 animate-fade-in overflow-hidden">

      {/* ── Panel izquierdo: directorio de terapeutas ─────────────────────── */}
      <div className={cn(
        'flex-col w-full sm:w-72 border-r border-warm-100 bg-white rounded-l-2xl overflow-hidden',
        activeTherapist ? 'hidden sm:flex' : 'flex',
      )}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-warm-100 shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-serif text-base font-semibold text-warm-900 flex-1">Colegas</h2>
            {totalUnread > 0 && (
              <span className="bg-primary-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                {totalUnread}
              </span>
            )}
          </div>
          {/* Búsqueda */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar terapeuta…"
            className="w-full text-sm border border-warm-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 flex flex-col gap-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : sortedTherapists.length === 0 ? (
            <div className="p-8 text-center text-warm-400 text-sm">
              <p className="text-3xl mb-2">👨‍⚕️</p>
              <p>{search ? 'Sin resultados' : 'No hay otros terapeutas aún'}</p>
            </div>
          ) : sortedTherapists.map(t => (
            <TherapistRow
              key={t.id}
              therapist={t}
              isActive={activeTherapist?.id === t.id}
              unread={unreadMap[t.id] ?? 0}
              lastMsg={lastMsgs[t.id] ?? null}
              onClick={() => openConversation(t)}
            />
          ))}
        </div>
      </div>

      {/* ── Panel derecho: chat ──────────────────────────────────────────── */}
      {activeTherapist ? (
        <div className="flex-1 flex flex-col bg-white rounded-r-2xl overflow-hidden">

          {/* Header del chat */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-warm-100 shrink-0">
            <button
              className="sm:hidden text-warm-400 hover:text-warm-600 p-1"
              onClick={() => setActiveTherapist(null)}
            >
              ←
            </button>
            <Avatar name={activeTherapist.full_name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-warm-900 text-sm truncate">{activeTherapist.full_name}</p>
                {activeTherapist.therapist_profiles?.[0]?.verification_status === 'verified' && (
                  <span className="text-xs" title="Credenciales verificadas">✅</span>
                )}
              </div>
              <p className="text-xs text-warm-400">
                {activeTherapist.therapist_profiles?.[0]?.specialty ?? 'Terapeuta'}
              </p>
            </div>
          </div>

          {/* Aviso de confidencialidad */}
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 shrink-0">
            <span className="text-sm shrink-0">🔒</span>
            <p className="text-[11px] text-amber-700 leading-snug">
              <span className="font-semibold">Canal de interconsulta clínica.</span> No compartas datos
              identificables del paciente. Usa iniciales, edad y síntomas generales.
            </p>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-warm-50">
            {loadingMsgs ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-warm-400 text-sm mt-16">
                <p className="text-3xl mb-3">👋</p>
                <p className="font-medium text-warm-600">Inicia la interconsulta</p>
                <p className="text-xs mt-1 text-warm-400 max-w-xs mx-auto">
                  Este canal es solo para comunicación entre colegas. Recuerda anonimizar los casos.
                </p>
              </div>
            ) : messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === user.id} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Toggle interconsulta formal */}
          <div className="px-4 pt-2 pb-1 flex items-center gap-2 border-t border-warm-50 bg-white shrink-0">
            <button
              onClick={() => setIsInterconsulta(v => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all',
                isInterconsulta
                  ? 'bg-amber-100 border-amber-300 text-amber-700 font-semibold'
                  : 'border-warm-200 text-warm-400 hover:border-warm-300',
              )}
            >
              🩺 {isInterconsulta ? 'Interconsulta formal activa' : 'Marcar como interconsulta formal'}
            </button>
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 px-4 py-3 bg-white shrink-0"
          >
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta… (Enter para enviar, Shift+Enter nueva línea)"
              rows={1}
              disabled={sending}
              className="flex-1 rounded-xl border border-warm-200 bg-warm-50 px-4 py-2.5 text-sm text-warm-800 placeholder:text-warm-400 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 disabled:opacity-60 transition-all resize-none min-h-[40px] max-h-[120px]"
              style={{ height: 'auto' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-700 transition-colors shrink-0"
            >
              {sending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden sm:flex flex-1 items-center justify-center bg-warm-50 rounded-r-2xl">
          <div className="text-center text-warm-400 max-w-xs px-4">
            <p className="text-5xl mb-4">👨‍⚕️</p>
            <p className="font-semibold text-warm-700">Interconsultas entre colegas</p>
            <p className="text-sm mt-2 text-warm-400 leading-relaxed">
              Selecciona un terapeuta para iniciar una consulta clínica.
              Recuerda anonimizar siempre los datos del paciente.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
