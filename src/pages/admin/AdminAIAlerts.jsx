import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { Bell, AlertCircle, AlertTriangle, CheckCircle2, Bot, Zap, Check } from 'lucide-react'

const RISK_CONFIG = {
  high:   { label: 'Riesgo alto',  color: 'bg-red-50 border-red-200 text-red-800',       badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500'    },
  medium: { label: 'Riesgo medio', color: 'bg-amber-50 border-amber-200 text-amber-800',  badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500'  },
  low:    { label: 'Sin riesgo',   color: 'bg-green-50 border-green-200 text-green-800',  badge: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
}

export default function AdminAIAlerts() {
  const [alerts, setAlerts]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('unreviewed') // unreviewed | high | medium | all
  const [expanded, setExpanded] = useState(null)
  const [marking, setMarking]   = useState(null)

  // Stats
  const [counts, setCounts] = useState({ high: 0, medium: 0, unreviewed: 0, total: 0 })

  useEffect(() => { fetchAlerts() }, [])

  const fetchAlerts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ai_checkins')
      .select(`
        id, risk_level, ai_message, questions_answers, created_at, notified,
        patient:profiles!ai_checkins_patient_id_fkey(id, full_name, avatar_url),
        therapist:profiles!ai_checkins_therapist_id_fkey(id, full_name)
      `)
      .in('risk_level', ['high', 'medium', 'low'])
      .order('created_at', { ascending: false })

    const all = data ?? []
    setAlerts(all)
    setCounts({
      high:       all.filter(a => a.risk_level === 'high').length,
      medium:     all.filter(a => a.risk_level === 'medium').length,
      unreviewed: all.filter(a => !a.notified && a.risk_level !== 'low').length,
      total:      all.length,
    })
    setLoading(false)
  }

  const markReviewed = async (id) => {
    setMarking(id)
    const { error } = await supabase
      .from('ai_checkins')
      .update({ notified: true })
      .eq('id', id)
    if (error) {
      toast.error('Error al marcar como revisado')
    } else {
      toast.success('Marcado como revisado')
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, notified: true } : a))
      setCounts(prev => ({ ...prev, unreviewed: Math.max(0, prev.unreviewed - 1) }))
    }
    setMarking(null)
  }

  const markAllReviewed = async () => {
    const unreviewed = alerts.filter(a => !a.notified && ['high', 'medium'].includes(a.risk_level))
    if (unreviewed.length === 0) return
    const ids = unreviewed.map(a => a.id)
    const { error } = await supabase
      .from('ai_checkins')
      .update({ notified: true })
      .in('id', ids)
    if (error) {
      toast.error('Error al marcar todas')
    } else {
      toast.success(`${ids.length} alertas marcadas como revisadas`)
      setAlerts(prev => prev.map(a => ids.includes(a.id) ? { ...a, notified: true } : a))
      setCounts(prev => ({ ...prev, unreviewed: 0 }))
    }
  }

  const filtered = alerts.filter(a => {
    if (filter === 'unreviewed') return !a.notified && ['high', 'medium'].includes(a.risk_level)
    if (filter === 'high')   return a.risk_level === 'high'
    if (filter === 'medium') return a.risk_level === 'medium'
    return true
  })

  // Parse Q&A text into pairs
  const parseQA = (text) => {
    if (!text) return []
    return text.split('\n').filter(Boolean).map(line => {
      const idx = line.indexOf(':')
      if (idx === -1) return { q: line, a: '' }
      return { q: line.slice(0, idx).trim(), a: line.slice(idx + 1).trim() }
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Alertas de bienestar IA</h1>
          <p className="text-warm-500 text-sm mt-1">Monitoreo del check-in diario de pacientes</p>
        </div>
        {counts.unreviewed > 0 && (
          <button
            onClick={markAllReviewed}
            className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Check size={13} className="inline mr-1" />Marcar todas revisadas ({counts.unreviewed})
          </button>
        )}
      </div>

      {/* Métricas */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Sin revisar',     value: counts.unreviewed, Icon: Bell,          color: 'bg-orange-50 border-orange-100 text-orange-700'   },
            { label: 'Riesgo alto',     value: counts.high,       Icon: AlertCircle,   color: 'bg-red-50 border-red-100 text-red-700'             },
            { label: 'Riesgo medio',    value: counts.medium,     Icon: AlertTriangle, color: 'bg-amber-50 border-amber-100 text-amber-700'       },
            { label: 'Total check-ins', value: counts.total,      Icon: Bot,           color: 'bg-primary-50 border-primary-100 text-primary-700' },
          ].map(m => (
            <div key={m.label} className={`rounded-2xl border p-4 ${m.color}`}>
              <m.Icon size={18} strokeWidth={1.8} className="mb-1 opacity-80" />
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'unreviewed', label: `Sin revisar (${counts.unreviewed})`  },
          { id: 'high',       label: `Riesgo alto (${counts.high})`     },
          { id: 'medium',     label: `Riesgo medio (${counts.medium})`  },
          { id: 'all',        label: `Todos (${counts.total})`           },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === f.id
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <CheckCircle2 size={48} className="text-green-300 mx-auto mb-3" />
          <p className="font-medium text-warm-600">No hay alertas pendientes</p>
          <p className="text-sm mt-1">Todos los check-ins han sido revisados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(alert => {
            const rc    = RISK_CONFIG[alert.risk_level] ?? RISK_CONFIG.low
            const isExp = expanded === alert.id
            const qa    = parseQA(alert.questions_answers)

            return (
              <div key={alert.id}
                className={`rounded-2xl border transition-all ${rc.color} ${alert.notified ? 'opacity-70' : ''}`}>

                {/* Cabecera */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={alert.patient?.full_name ?? ''} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-warm-900">{alert.patient?.full_name ?? 'Paciente'}</p>
                          {alert.therapist?.full_name && (
                            <p className="text-xs opacity-70 mt-0.5">Terapeuta: {alert.therapist.full_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${rc.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />{rc.label}
                          </span>
                          {alert.notified
                            ? <span className="text-xs text-warm-400 font-medium flex items-center gap-1"><Check size={11} /> Revisado</span>
                            : <span className="text-xs font-bold text-orange-600 animate-pulse">• Nuevo</span>
                          }
                        </div>
                      </div>

                      <p className="text-sm mt-2 line-clamp-2 opacity-90">{alert.ai_message}</p>

                      <p className="text-xs opacity-60 mt-1">
                        {new Date(alert.created_at).toLocaleDateString('es-DO', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}{' — '}
                        {new Date(alert.created_at).toLocaleTimeString('es-DO', { timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-current/10">
                    <button
                      onClick={() => setExpanded(isExp ? null : alert.id)}
                      className="flex-1 text-sm font-medium py-2 rounded-xl border border-current/20 hover:bg-white/30 transition-colors"
                    >
                      {isExp ? 'Ocultar respuestas' : 'Ver respuestas del paciente'}
                    </button>
                    {!alert.notified && (
                      <button
                        onClick={() => markReviewed(alert.id)}
                        disabled={marking === alert.id}
                        className="px-4 py-2 rounded-xl bg-white/40 hover:bg-white/60 transition-colors text-sm font-semibold border border-current/20 disabled:opacity-50"
                      >
                        {marking === alert.id ? '...' : <span className="flex items-center gap-1"><Check size={12} /> Revisado</span>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Respuestas expandidas */}
                {isExp && qa.length > 0 && (
                  <div className="border-t border-current/10 p-4 bg-white/30">
                    <p className="text-xs font-semibold opacity-70 mb-3 uppercase tracking-wider">
                      Respuestas del check-in
                    </p>
                    <div className="flex flex-col gap-3">
                      {qa.map((item, idx) => (
                        <div key={idx} className="bg-white/50 rounded-xl p-3">
                          <p className="text-xs font-medium opacity-70 mb-1">{item.q}</p>
                          <p className="text-sm font-semibold">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
