import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Bell, ClipboardList, Calendar, XCircle, FileText, MessageCircle, Bot, Pin } from 'lucide-react'

const TYPE_CONFIG = {
  new_task:          { Icon: ClipboardList, color: 'text-primary-600 bg-primary-50'  },
  session_confirmed: { Icon: Calendar,      color: 'text-emerald-600 bg-emerald-50'  },
  session_cancelled: { Icon: XCircle,       color: 'text-red-600 bg-red-50'          },
  notes_released:    { Icon: FileText,      color: 'text-violet-600 bg-violet-50'   },
  new_message:       { Icon: MessageCircle, color: 'text-calm-600 bg-calm-50'        },
  checkin_alert:     { Icon: Bot,           color: 'text-amber-600 bg-amber-50'      },
}
const DEFAULT_CONFIG = { Icon: Pin, color: 'text-warm-600 bg-warm-50' }

export default function NotificationBell({ userId }) {
  const [notifs, setNotifs]     = useState([])
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(true)
  const panelRef                = useRef(null)
  const navigate                = useNavigate()

  const unread = notifs.filter(n => !n.read).length

  useEffect(() => {
    if (!userId) return
    fetchNotifs()

    const channel = supabase
      .channel(`notifs-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setNotifs(prev => [payload.new, ...prev].slice(0, 30))
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [userId])

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifs(data ?? [])
    setLoading(false)
  }

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = async () => {
    const ids = notifs.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClick = async (notif) => {
    if (!notif.read) await markRead(notif.id)
    setOpen(false)
    if (notif.link) navigate(notif.link)
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'Ahora mismo'
    if (mins < 60) return `Hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `Hace ${hrs} h`
    return `Hace ${Math.floor(hrs / 24)} d`
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl hover:bg-warm-100 transition-colors"
        title="Notificaciones"
      >
        <Bell size={20} strokeWidth={1.8} className="text-warm-600" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-float border border-warm-100 z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-warm-100">
            <p className="font-semibold text-warm-900 text-sm">
              Notificaciones
              {unread > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-0">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3 px-4 py-3 border-b border-warm-50">
                    <div className="w-8 h-8 bg-warm-100 rounded-full animate-pulse shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-3 bg-warm-100 rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-warm-50 rounded animate-pulse w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifs.length === 0 ? (
              <div className="text-center py-10">
                <Bell size={32} className="text-warm-200 mx-auto mb-2" />
                <p className="text-warm-400 text-sm">No tienes notificaciones aún</p>
              </div>
            ) : (
              notifs.map(notif => {
                const tc = TYPE_CONFIG[notif.type] ?? DEFAULT_CONFIG
                const { Icon: NIcon, color } = tc
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full text-left flex gap-3 px-4 py-3 border-b border-warm-50 hover:bg-warm-50 transition-colors ${
                      !notif.read ? 'bg-primary-50/40' : ''
                    }`}
                  >
                    <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                      <NIcon size={15} strokeWidth={1.8} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${notif.read ? 'text-warm-600' : 'text-warm-900 font-medium'}`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-warm-400 mt-0.5 line-clamp-2">{notif.body}</p>
                      )}
                      <p className="text-xs text-warm-300 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <span className="shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1.5" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
