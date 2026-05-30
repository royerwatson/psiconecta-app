import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'

// ── Banco de preguntas (5 sets × 4 preguntas) ─────────────────────
// Rota según el día del mes: día % 5 determina el set
const QUESTION_SETS = [
  // Set 0 — Sueño y energía
  [
    { q: '¿Cómo dormiste anoche?',              opts: ['Muy bien', 'Bien', 'Regular', 'Mal', 'Muy mal'] },
    { q: '¿Cuál es tu nivel de energía hoy?',   opts: ['Muy alta', 'Buena', 'Normal', 'Baja', 'Muy baja'] },
    { q: '¿Sientes tensión física en el cuerpo?', opts: ['Ninguna', 'Leve', 'Moderada', 'Bastante', 'Mucha'] },
    { q: '¿Pudiste descansar bien este fin de semana?', opts: ['Sí, totalmente', 'Más o menos', 'Poco', 'No mucho', 'Para nada'] },
  ],
  // Set 1 — Ansiedad y pensamientos
  [
    { q: '¿Sientes ansiedad o preocupación hoy?',   opts: ['Para nada', 'Un poco', 'Moderada', 'Bastante', 'Mucha'] },
    { q: '¿Has tenido pensamientos negativos?',      opts: ['Ninguno', 'Algunos leves', 'Varios', 'Muchos', 'Muy intensos'] },
    { q: '¿Te cuesta concentrarte en tus tareas?',  opts: ['Nada', 'Un poco', 'Regular', 'Bastante', 'Mucho'] },
    { q: '¿Te sientes abrumado/a con tus responsabilidades?', opts: ['No', 'Un poco', 'Moderadamente', 'Bastante', 'Completamente'] },
  ],
  // Set 2 — Relaciones y entorno
  [
    { q: '¿Cómo está tu relación con las personas cercanas?', opts: ['Muy bien', 'Bien', 'Regular', 'Tensa', 'Muy mal'] },
    { q: '¿Has tenido conflictos recientes con alguien?',     opts: ['Ninguno', 'Uno leve', 'Algunos', 'Varios', 'Muchos'] },
    { q: '¿Te sientes apoyado/a por tu entorno?',             opts: ['Siempre', 'Casi siempre', 'A veces', 'Poco', 'Nada'] },
    { q: '¿Pasaste tiempo de calidad con alguien hoy?',       opts: ['Sí, mucho', 'Un poco', 'Poco', 'No', 'Estoy solo/a'] },
  ],
  // Set 3 — Motivación y ánimo
  [
    { q: '¿Cómo calificarías tu motivación hoy?',        opts: ['Muy alta', 'Buena', 'Normal', 'Baja', 'Muy baja'] },
    { q: '¿Tienes ganas de realizar tus actividades?',   opts: ['Muchas ganas', 'Algo de ganas', 'Indiferente', 'Pocas ganas', 'Sin ganas'] },
    { q: '¿Disfrutaste algo durante el día de hoy?',     opts: ['Varias cosas', 'Algo', 'Poco', 'Casi nada', 'Nada'] },
    { q: '¿Te has sentido triste o desanimado/a?',       opts: ['Para nada', 'Un poco', 'Moderadamente', 'Bastante', 'Mucho'] },
  ],
  // Set 4 — Autocuidado y bienestar
  [
    { q: '¿Has comido bien y a tus horas hoy?',           opts: ['Sí, muy bien', 'Bien', 'Regular', 'Mal', 'No he comido'] },
    { q: '¿Has hecho algo de ejercicio o movimiento?',    opts: ['Sí, bastante', 'Un poco', 'Nada, pero quiero', 'No he podido', 'No me importa'] },
    { q: '¿Cómo te sientes contigo mismo/a hoy?',        opts: ['Muy bien', 'Bien', 'Regular', 'Mal', 'Muy mal'] },
    { q: '¿Has dedicado tiempo a algo que te gusta?',    opts: ['Sí, mucho', 'Un poco', 'Poco', 'No', 'No tuve oportunidad'] },
  ],
]

// Elige el set según el día del mes para que rote diariamente
function getTodaySet() {
  const day = new Date().getDate() // 1–31
  return QUESTION_SETS[day % QUESTION_SETS.length]
}

export default function AICheckin({ userId }) {
  const [step, setStep]               = useState(0)
  const [answers, setAnswers]         = useState([])
  const [done, setDone]               = useState(false)
  const [analyzing, setAnalyzing]     = useState(false)
  const [result, setResult]           = useState(null)
  const [checkedToday, setCheckedToday] = useState(false)

  const questions = getTodaySet()

  useEffect(() => {
    checkTodayCheckin()
  }, [userId])

  const checkTodayCheckin = async () => {
    if (!userId) return
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    const { data } = await supabase
      .from('ai_checkins')
      .select('id, risk_level, ai_message')
      .eq('patient_id', userId)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay)
      .limit(1)
    if (data?.length > 0) {
      setCheckedToday(true)
      if (data[0].ai_message) setResult({ risk_level: data[0].risk_level, message: data[0].ai_message })
    }
  }

  const selectAnswer = async (answer) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      setDone(true)
      setAnalyzing(true)
      await analyzeWithAI(newAnswers)
    }
  }

  const analyzeWithAI = async (finalAnswers) => {
    try {
      const qa = questions.map((q, i) => `${q.q}: ${finalAnswers[i]}`).join('\n')

      const { data, error } = await supabase.functions.invoke('ai-checkin', {
        body: { patient_id: userId, questions_answers: qa },
      })

      if (error) throw error
      setResult(data)

      if (data.risk_level === 'high') {
        toast.error('Hemos notificado a tu terapeuta sobre cómo te sientes', { duration: 6000 })
      }
    } catch {
      // Fallback si la Edge Function no está disponible
      const riskWords = ['Muchos', 'Muy intensos', 'Mucho', 'Muy mal', 'Muy baja',
                         'Completamente', 'Muchos', 'Para nada', 'No he comido', 'Sin ganas']
      const riskCount = finalAnswers.filter(a => riskWords.includes(a)).length
      setResult({
        risk_level: riskCount >= 2 ? 'medium' : 'low',
        message: riskCount >= 2
          ? 'Parece que puede ser un día difícil. Recuerda que tu terapeuta está aquí para apoyarte.'
          : 'Gracias por compartir cómo te sientes. Sigue adelante, lo estás haciendo muy bien.',
      })
    }
    setAnalyzing(false)
    setCheckedToday(true)
  }

  if (checkedToday) {
    const rl = result?.risk_level ?? 'low'
    return (
      <div className={`border rounded-2xl p-4 ${
        rl === 'high'   ? 'bg-red-50 border-red-100' :
        rl === 'medium' ? 'bg-amber-50 border-amber-100' :
                          'bg-green-50 border-green-100'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">
            {rl === 'high' ? '🔴' : rl === 'medium' ? '🟡' : '✅'}
          </span>
          <p className={`font-semibold text-sm ${
            rl === 'high' ? 'text-red-800' : rl === 'medium' ? 'text-amber-800' : 'text-green-800'
          }`}>
            Check-in diario completado
          </p>
        </div>
        {result?.message && (
          <p className={`text-xs mt-1 leading-relaxed ${
            rl === 'high' ? 'text-red-700' : rl === 'medium' ? 'text-amber-700' : 'text-green-700'
          }`}>
            {result.message}
          </p>
        )}
        <p className="text-xs text-warm-400 mt-1.5">Tu terapeuta recibe tu estado diariamente</p>
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-calm-50 border-primary-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🤖</span>
        <p className="font-semibold text-primary-800 text-sm">Check-in diario de bienestar</p>
      </div>

      {!done ? (
        <div className="animate-fade-in">
          {/* Barra de progreso */}
          <div className="flex gap-1 mb-4">
            {questions.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                i < step ? 'bg-primary-500' : i === step ? 'bg-primary-400' : 'bg-primary-100'
              }`} />
            ))}
          </div>

          <p className="text-xs text-warm-400 mb-1">{step + 1} de {questions.length}</p>
          <p className="text-sm font-medium text-warm-800 mb-3">{questions[step].q}</p>

          <div className="flex flex-col gap-2">
            {questions[step].opts.map((opt) => (
              <button key={opt} onClick={() => selectAnswer(opt)}
                className="text-left text-sm px-4 py-2.5 rounded-xl border border-primary-100 bg-white hover:border-primary-300 hover:bg-primary-50 transition-all text-warm-700 font-medium active:scale-[0.98]">
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : analyzing ? (
        <div className="text-center py-4 animate-fade-in">
          <div className="text-3xl animate-pulse mb-2">🤖</div>
          <p className="text-sm text-warm-600">Analizando tus respuestas...</p>
        </div>
      ) : result ? (
        <div className="animate-fade-in">
          <div className={`rounded-xl p-4 ${
            result.risk_level === 'high'   ? 'bg-red-50 border border-red-100' :
            result.risk_level === 'medium' ? 'bg-amber-50 border border-amber-100' :
            'bg-green-50 border border-green-100'
          }`}>
            <p className={`text-sm font-semibold mb-1 ${
              result.risk_level === 'high'   ? 'text-red-800' :
              result.risk_level === 'medium' ? 'text-amber-800' :
              'text-green-800'
            }`}>
              {result.risk_level === 'high'   ? '🔴 Necesitas apoyo hoy' :
               result.risk_level === 'medium' ? '🟡 Cuídate hoy'        : '🟢 Todo bien'}
            </p>
            <p className="text-xs text-warm-600">{result.message}</p>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
