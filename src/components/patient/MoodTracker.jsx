import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, subDays, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart2 } from 'lucide-react'

// ── Escala de ánimo ────────────────────────────────────────────────────────────
const MOODS = [
  { value: 1, emoji: '😞', label: 'Muy mal',  color: '#ef4444' },
  { value: 2, emoji: '😕', label: 'Mal',      color: '#f97316' },
  { value: 3, emoji: '😐', label: 'Regular',  color: '#f59e0b' },
  { value: 4, emoji: '🙂', label: 'Bien',     color: '#10b981' },
  { value: 5, emoji: '😊', label: 'Muy bien', color: '#2d6a9f' },
]

const getMoodConfig = (value) => MOODS.find(m => m.value === value) ?? MOODS[2]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const mood = getMoodConfig(payload[0]?.value)
  return (
    <div className="bg-white border border-warm-200 rounded-xl p-2.5 shadow-lg text-sm">
      <p className="text-warm-500 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-warm-800">{mood.emoji} {mood.label}</p>
    </div>
  )
}

export default function MoodTracker({ userId }) {
  const [todayMood, setTodayMood] = useState(null)
  const [selected, setSelected]   = useState(null)
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [weekData, setWeekData]   = useState([])
  const [showChart, setShowChart] = useState(false)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (userId) fetchData()
  }, [userId])

  const fetchData = async () => {
    setLoading(true)
    const since = subDays(new Date(), 6).toISOString()

    const { data } = await supabase
      .from('mood_entries')
      .select('mood, note, created_at')
      .eq('patient_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    // ¿Ya registró hoy?
    const todayStart = startOfDay(new Date())
    const todayEntry = (data ?? []).find(
      e => parseISO(e.created_at) >= todayStart
    )
    if (todayEntry) setTodayMood(todayEntry.mood)

    // Últimos 7 días
    const days = Array.from({ length: 7 }, (_, i) => {
      const d     = subDays(new Date(), 6 - i)
      const key   = format(d, 'yyyy-MM-dd')
      const label = format(d, 'EEE d', { locale: es })
      const entry = (data ?? []).find(
        e => format(parseISO(e.created_at), 'yyyy-MM-dd') === key
      )
      return { label, mood: entry?.mood ?? null, date: key }
    })
    setWeekData(days)
    setLoading(false)
  }

  const saveMood = async () => {
    if (!selected || !userId) return
    setSaving(true)
    const { error } = await supabase.from('mood_entries').insert({
      patient_id: userId,
      mood: selected,
      note: note.trim() || null,
    })
    if (!error) {
      setTodayMood(selected)
      fetchData()
    }
    setSaving(false)
  }

  // ── Ya registró hoy ────────────────────────────────────────────────────────
  if (!loading && todayMood) {
    const mc = getMoodConfig(todayMood)
    const daysWithData = weekData.filter(d => d.mood !== null)
    const avg = daysWithData.length
      ? (daysWithData.reduce((s, d) => s + d.mood, 0) / daysWithData.length).toFixed(1)
      : null

    return (
      <div className="bg-white rounded-2xl border border-warm-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-warm-800 text-sm flex items-center gap-1.5"><BarChart2 size={14} strokeWidth={1.8} />Estado de ánimo</p>
          <button
            onClick={() => setShowChart(v => !v)}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            {showChart ? 'Ocultar gráfica' : 'Ver semana →'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{mc.emoji}</span>
          <div>
            <p className="font-semibold text-warm-900">{mc.label}</p>
            <p className="text-xs text-warm-400">Registrado hoy</p>
          </div>
          {avg && (
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-primary-600">{avg}/5</p>
              <p className="text-xs text-warm-400">Promedio sem.</p>
            </div>
          )}
        </div>

        {showChart && (
          <div className="mt-3 pt-3 border-t border-warm-100 animate-fade-in">
            <p className="text-xs text-warm-400 mb-3">Últimos 7 días</p>
            <div className="flex justify-between mb-3">
              {weekData.map(d => {
                const mc2    = d.mood ? getMoodConfig(d.mood) : null
                const isToday = d.date === format(new Date(), 'yyyy-MM-dd')
                return (
                  <div key={d.date} className="flex flex-col items-center gap-0.5">
                    <span className="text-lg" title={mc2?.label ?? 'Sin registro'}>
                      {mc2 ? mc2.emoji : '○'}
                    </span>
                    <span className={`text-[10px] ${isToday ? 'font-bold text-primary-600' : 'text-warm-400'}`}>
                      {d.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart
                data={weekData.filter(d => d.mood !== null)}
                margin={{ top: 5, right: 5, left: -30, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2d6a9f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2d6a9f" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mood"
                  stroke="#2d6a9f" strokeWidth={2.5}
                  fill="url(#moodGrad)"
                  dot={{ r: 4, fill: '#2d6a9f', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    )
  }

  // ── Registro del día ───────────────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-primary-50 to-calm-50 rounded-2xl border border-primary-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 size={18} strokeWidth={1.8} className="text-primary-500" />
        <p className="font-semibold text-primary-800 text-sm">¿Cómo te sientes hoy?</p>
      </div>

      {loading ? (
        <div className="flex gap-2 justify-center py-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-10 h-10 bg-primary-100 rounded-full animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex justify-between gap-1 mb-3">
            {MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => setSelected(m.value)}
                title={m.label}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  selected === m.value
                    ? 'bg-white shadow-md scale-110 border-2 border-primary-300'
                    : 'hover:bg-white/60 border-2 border-transparent'
                }`}
              >
                <span className={`text-2xl ${selected === m.value ? 'animate-pop' : ''}`}>{m.emoji}</span>
                <span className="text-[10px] text-warm-500 hidden sm:block">{m.label}</span>
              </button>
            ))}
          </div>

          {selected && (
            <div className="animate-fade-in mb-3">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Añade una nota opcional..."
                rows={2}
                className="w-full text-sm bg-white/70 border border-primary-100 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-primary-300 text-warm-700 placeholder-warm-400"
              />
            </div>
          )}

          <button
            onClick={saveMood}
            disabled={!selected || saving}
            className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
          >
            {saving ? 'Guardando...' : 'Registrar estado de ánimo'}
          </button>
        </>
      )}
    </div>
  )
}
