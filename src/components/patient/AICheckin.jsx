import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Sparkles, AlertTriangle, CheckCircle, Brain } from 'lucide-react'

// ─── Emociones primarias ──────────────────────────────────────────────────────

const MOODS = [
  { value: 1, emoji: '😔', label: 'Muy mal',    color: '#ef4444', bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-600'   },
  { value: 2, emoji: '😟', label: 'Mal',         color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-600' },
  { value: 3, emoji: '😐', label: 'Regular',     color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200',text: 'text-yellow-600' },
  { value: 4, emoji: '😊', label: 'Bien',         color: '#22c55e', bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-600'  },
  { value: 5, emoji: '😄', label: 'Muy bien',    color: '#6366f1', bg: 'bg-primary-50',border: 'border-primary-200',text: 'text-primary-600'},
]

// ─── Preguntas complementarias (rotación diaria) ──────────────────────────────

const QUESTION_SETS = [
  [
    { q: '¿Cómo dormiste anoche?',              opts: ['Muy bien', 'Bien', 'Regular', 'Mal', 'Muy mal'] },
    { q: '¿Cuál es tu nivel de energía hoy?',   opts: ['Muy alta', 'Buena', 'Normal', 'Baja', 'Muy baja'] },
    { q: '¿Sientes tensión física en el cuerpo?', opts: ['Ninguna', 'Leve', 'Moderada', 'Bastante', 'Mucha'] },
  ],
  [
    { q: '¿Sientes ansiedad o preocupación hoy?', opts: ['Para nada', 'Un poco', 'Moderada', 'Bastante', 'Mucha'] },
    { q: '¿Has tenido pensamientos negativos?',   opts: ['Ninguno', 'Algunos', 'Varios', 'Muchos', 'Muy intensos'] },
    { q: '¿Te cuesta concentrarte en tus tareas?', opts: ['Nada', 'Un poco', 'Regular', 'Bastante', 'Mucho'] },
  ],
  [
    { q: '¿Cómo está tu relación con las personas cercanas?', opts: ['Muy bien', 'Bien', 'Regular', 'Tensa', 'Muy mal'] },
    { q: '¿Te sientes apoyado/a por tu entorno?',             opts: ['Siempre', 'Casi siempre', 'A veces', 'Poco', 'Nada'] },
    { q: '¿Has disfrutado de algo hoy?',                      opts: ['Varias cosas', 'Algo', 'Poco', 'Casi nada', 'Nada'] },
  ],
  [
    { q: '¿Cómo calificarías tu motivación hoy?',  opts: ['Muy alta', 'Buena', 'Normal', 'Baja', 'Muy baja'] },
    { q: '¿Tienes ganas de realizar tus actividades?', opts: ['Muchas ganas', 'Algo de ganas', 'Indiferente', 'Pocas ganas', 'Sin ganas'] },
    { q: '¿Te has sentido triste o desanimado/a?', opts: ['Para nada', 'Un poco', 'Moderadamente', 'Bastante', 'Mucho'] },
  ],
  [
    { q: '¿Has comido bien hoy?',              opts: ['Sí, muy bien', 'Bien', 'Regular', 'Mal', 'No he comido'] },
    { q: '¿Cómo te sientes contigo mismo/a?', opts: ['Muy bien', 'Bien', 'Regular', 'Mal', 'Muy mal'] },
    { q: '¿Has dedicado tiempo a algo que te gusta?', opts: ['Sí, mucho', 'Un poco', 'Poco', 'No', 'No tuve oportunidad'] },
  ],
]

function getTodaySet() {
  return QUESTION_SETS[new Date().getDate() % QUESTION_SETS.length]
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const m = MOODS.find(m => m.value === payload[0].value) ?? MOODS[2]
  return (
    <div className="bg-white border border-warm-100 rounded-xl px-3 py-2 shadow-card text-xs">
      <p className="text-warm-400">{label}</p>
      <p className="font-bold" style={{ color: m.color }}>{m.emoji} {m.label}</p>
    </div>
  )
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AICheckin({ userId }) {
  const [phase, setPhase]               = useState('emoji')   // emoji | questions | analyzing | done
  const [selectedMood, setSelectedMood] = useState(null)
  const [weekData, setWeekData]         = useState([])
  const [step, setStep]                 = useState(0)
  const [answers, setAnswers]           = useState([])
  const [result, setResult]             = useState(null)
  const [checkedToday, setCheckedToday] = useState(false)
  const [todayResult, setTodayResult]   = useState(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const questions = getTodaySet()

  useEffect(() => { if (userId) checkTodayAndHistory() }, [userId])

  const checkTodayAndHistory = async () => {
    if (!userId) return
    setLoadingHistory(true)
    const now       = new Date()
    const startDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const endDay    = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

    // Verificar si ya hizo check-in hoy
    const { data: todayData } = await supabase
      .from('ai_checkins')
      .select('id, risk_level, ai_message, mood_value')
      .eq('patient_id', userId)
      .gte('created_at', startDay).lt('created_at', endDay)
      .limit(1)

    if (todayData?.length > 0) {
      setCheckedToday(true)
      setTodayResult(todayData[0])
      const m = MOODS.find(m => m.value === todayData[0].mood_value) ?? null
      setSelectedMood(m)
    }

    // Historial de 7 días
    await loadWeekHistory()
    setLoadingHistory(false)
  }

  const loadWeekHistory = async () => {
    const since7 = subDays(new Date(), 6).toISOString()
    const { data } = await supabase
      .from('mood_entries')
      .select('mood, created_at')
      .eq('patient_id', userId)
      .gte('created_at', since7)
      .order('created_at', { ascending: true })

    // Construir array de 7 días
    const days = Array.from({ length: 7 }, (_, i) => {
      const d   = subDays(new Date(), 6 - i)
      const key = format(d, 'yyyy-MM-dd')
      const entry = (data ?? []).find(e => e.created_at.startsWith(key))
      return {
        day:  format(d, 'EEE', { locale: es }),
        mood: entry?.mood ?? null,
        date: key,
      }
    })
    setWeekData(days)
  }

  // ── Selección de estado de ánimo (fase 1) ────────────────────────────────────
  const selectMood = async (mood) => {
    setSelectedMood(mood)

    // Guardar en mood_entries — upsert del día actual usando DELETE+INSERT
    // (onConflict con cast no es soportado por el cliente JS; usamos fecha truncada)
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('mood_entries')
      .select('id')
      .eq('patient_id', userId)
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59')
      .maybeSingle()
    if (existing) {
      await supabase.from('mood_entries').update({ mood: mood.value }).eq('id', existing.id)
    } else {
      await supabase.from('mood_entries').insert({ patient_id: userId, mood: mood.value })
    }

    // Actualizar gráfico en tiempo real
    await loadWeekHistory()

    // Ir a preguntas complementarias
    setPhase('questions')
  }

  // ── Responder preguntas (fase 2) ─────────────────────────────────────────────
  const selectAnswer = async (answer) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      setPhase('analyzing')
      await analyzeWithAI(newAnswers)
    }
  }

  // ── Análisis IA ──────────────────────────────────────────────────────────────
  const analyzeWithAI = async (finalAnswers) => {
    try {
      const qa = questions.map((q, i) => `${q.q}: ${finalAnswers[i]}`).join('\n')
      const moodContext = `Estado de ánimo general: ${selectedMood?.label} (${selectedMood?.value}/5)`

      const { data, error } = await supabase.functions.invoke('ai-checkin', {
        body: {
          patient_id:        userId,
          questions_answers: `${moodContext}\n${qa}`,
          mood_value:        selectedMood?.value,
        },
      })

      if (error) throw error
      setResult(data)
      setCheckedToday(true)
      setTodayResult({ ...data, mood_value: selectedMood?.value })

      if (data.risk_level === 'high') {
        toast.error('Hemos notificado a tu terapeuta sobre cómo te sientes', { duration: 6000 })
      }
    } catch {
      const riskWords = ['Muchos', 'Muy intensos', 'Mucho', 'Muy mal', 'Muy baja', 'Sin ganas', 'No he comido']
      const riskCount = finalAnswers.filter(a => riskWords.includes(a)).length
      const fallback  = {
        risk_level: riskCount >= 2 ? 'medium' : 'low',
        message:    riskCount >= 2
          ? 'Parece que puede ser un día difícil. Recuerda que tu terapeuta está aquí para apoyarte.'
          : 'Gracias por compartir cómo te sientes. Sigue adelante, lo estás haciendo muy bien.',
      }
      setResult(fallback)
      setCheckedToday(true)
      setTodayResult({ ...fallback, mood_value: selectedMood?.value })
    }
    setPhase('done')
  }

  // ─── Render: ya hizo check-in hoy ────────────────────────────────────────────
  if (checkedToday && todayResult) {
    const rl = todayResult.risk_level ?? 'low'
    const m  = MOODS.find(m => m.value === todayResult.mood_value) ?? MOODS[2]
    return (
      <div className="bg-white border border-warm-100 rounded-3xl overflow-hidden shadow-card">
        {/* Header coloreado */}
        <div className={`px-4 py-3 flex items-center gap-3 ${
          rl === 'high' ? 'bg-red-50' : rl === 'medium' ? 'bg-amber-50' : 'bg-green-50'
        }`}>
          {rl === 'high'
            ? <AlertTriangle size={16} className="text-red-500 shrink-0" strokeWidth={2.5} />
            : rl === 'medium'
            ? <AlertTriangle size={16} className="text-amber-500 shrink-0" strokeWidth={2.5} />
            : <CheckCircle size={16} className="text-green-500 shrink-0" strokeWidth={2.5} />
          }
          <p className={`text-xs font-bold ${
            rl === 'high' ? 'text-red-700' : rl === 'medium' ? 'text-amber-700' : 'text-green-700'
          }`}>
            Check-in completado hoy · {m.emoji} {m.label}
          </p>
        </div>

        {/* Gráfico semanal */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-semibold text-warm-400 mb-2">Tu estado de ánimo esta semana</p>
          {loadingHistory ? (
            <div className="h-20 bg-warm-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={72}>
              <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[1, 5]} hide />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2}
                  fill="url(#moodGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {todayResult.message && (
          <div className="px-4 pb-4">
            <p className="text-xs text-warm-500 leading-relaxed">
              {todayResult.message}
            </p>
          </div>
        )}
      </div>
    )
  }

  // ─── Render: fase emoji ───────────────────────────────────────────────────────
  if (phase === 'emoji') {
    return (
      <div className="bg-white border border-warm-100 rounded-3xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
            <Brain size={14} className="text-primary-500" strokeWidth={2} />
          </div>
          <p className="text-sm font-bold text-warm-900">¿Cómo te sientes ahora mismo?</p>
        </div>
        <p className="text-xs text-warm-400 mb-5">Toca la emoción que más te represente hoy</p>

        <div className="flex justify-between gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              onClick={() => selectMood(mood)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 border-transparent hover:border-warm-200 active:scale-95 transition-all duration-200 hover:${mood.bg}`}
            >
              <span className="text-3xl leading-none" role="img" aria-label={mood.label}>
                {mood.emoji}
              </span>
              <span className="text-[10px] font-semibold text-warm-400 leading-tight text-center">
                {mood.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─── Render: fase preguntas ───────────────────────────────────────────────────
  if (phase === 'questions') {
    return (
      <div className="bg-white border border-warm-100 rounded-3xl p-5 shadow-card animate-fade-in">
        {/* Estado seleccionado + gráfico */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedMood?.emoji}</span>
            <div>
              <p className="text-xs font-bold text-warm-900">{selectedMood?.label}</p>
              <p className="text-[10px] text-warm-400">Registrado</p>
            </div>
          </div>
          {/* Mini gráfico inline */}
          <div className="w-28 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={selectedMood?.color ?? '#6366f1'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={selectedMood?.color ?? '#6366f1'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="mood" stroke={selectedMood?.color ?? '#6366f1'}
                  strokeWidth={1.5} fill="url(#miniGrad)" dot={false} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="flex gap-1 mb-4">
          {questions.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              i < step ? 'bg-primary-500' : i === step ? 'bg-primary-300' : 'bg-warm-100'
            }`} />
          ))}
        </div>

        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">
          Pregunta {step + 1} de {questions.length}
        </p>
        <p className="text-sm font-semibold text-warm-800 mb-3 leading-snug">
          {questions[step].q}
        </p>

        <div className="flex flex-col gap-2">
          {questions[step].opts.map((opt) => (
            <button key={opt} onClick={() => selectAnswer(opt)}
              className="text-left text-sm px-4 py-3 rounded-xl border border-warm-100 bg-warm-50 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all font-medium text-warm-700 active:scale-[0.98]">
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─── Render: analizando ───────────────────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <div className="bg-white border border-warm-100 rounded-3xl p-8 text-center shadow-card animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3 animate-pulse-soft">
          <Brain size={26} className="text-primary-500" strokeWidth={1.5} />
        </div>
        <p className="font-semibold text-warm-800 mb-1">Analizando tu estado</p>
        <p className="text-xs text-warm-400">La IA está procesando tus respuestas...</p>
      </div>
    )
  }

  // ─── Render: resultado ────────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const rl = result.risk_level ?? 'low'
    const m  = selectedMood ?? MOODS[2]
    return (
      <div className="bg-white border border-warm-100 rounded-3xl overflow-hidden shadow-card animate-fade-in">
        <div className={`px-4 py-3 flex items-center gap-3 ${
          rl === 'high' ? 'bg-red-50' : rl === 'medium' ? 'bg-amber-50' : 'bg-green-50'
        }`}>
          {rl === 'high'
            ? <AlertTriangle size={16} className="text-red-500" strokeWidth={2.5} />
            : rl === 'medium'
            ? <AlertTriangle size={16} className="text-amber-500" strokeWidth={2.5} />
            : <Sparkles size={16} className="text-green-500" strokeWidth={2.5} />
          }
          <p className={`text-xs font-bold ${
            rl === 'high' ? 'text-red-700' : rl === 'medium' ? 'text-amber-700' : 'text-green-700'
          }`}>
            {rl === 'high' ? 'Necesitas apoyo hoy' : rl === 'medium' ? 'Cuídate hoy' : '¡Todo bien!'} · {m.emoji} {m.label}
          </p>
        </div>

        <div className="px-4 pt-3 pb-1">
          <ResponsiveContainer width="100%" height={72}>
            <AreaChart data={weekData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} hide />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2}
                fill="url(#moodGrad2)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {result.message && (
          <div className="px-4 pb-4">
            <p className="text-xs text-warm-500 leading-relaxed">{result.message}</p>
          </div>
        )}
      </div>
    )
  }

  return null
}
