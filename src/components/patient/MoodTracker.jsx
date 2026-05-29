import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const MOODS = [
  { score: 1, emoji: '😞', label: 'Muy mal',  color: 'bg-red-50   ring-red-300'    },
  { score: 2, emoji: '😕', label: 'Mal',       color: 'bg-orange-50 ring-orange-300' },
  { score: 3, emoji: '😐', label: 'Regular',   color: 'bg-yellow-50 ring-yellow-300' },
  { score: 4, emoji: '🙂', label: 'Bien',      color: 'bg-green-50  ring-green-300'  },
  { score: 5, emoji: '😊', label: 'Muy bien',  color: 'bg-primary-50 ring-primary-300' },
]

const CONTEXT_TAGS = [
  { id: 'familia',     emoji: '👨‍👩‍👧', label: 'Familia'       },
  { id: 'trabajo',     emoji: '💼',    label: 'Trabajo'       },
  { id: 'pareja',      emoji: '💑',    label: 'Pareja'        },
  { id: 'amigos',      emoji: '👥',    label: 'Amigos'        },
  { id: 'salud',       emoji: '🏥',    label: 'Salud'         },
  { id: 'dinero',      emoji: '💰',    label: 'Finanzas'      },
  { id: 'soledad',     emoji: '🌧️',   label: 'Soledad'       },
  { id: 'logros',      emoji: '🏆',    label: 'Logros'        },
  { id: 'estres',      emoji: '😤',    label: 'Estrés'        },
  { id: 'descanso',    emoji: '😴',    label: 'Descanso'      },
  { id: 'ejercicio',   emoji: '🏃',    label: 'Ejercicio'     },
  { id: 'alimentacion',emoji: '🥗',   label: 'Alimentación'  },
]

export default function MoodTracker({ moodData = [], userId, onSave }) {
  const [step, setStep]           = useState('pick')   // 'pick' | 'context' | 'done'
  const [selected, setSelected]   = useState(null)
  const [tags, setTags]           = useState([])
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // ── Deduplicar por día (mantener el último registro de cada día) ──
  const byDay = {}
  moodData.forEach(m => {
    const key = new Date(m.created_at).toDateString()
    if (!byDay[key] || new Date(m.created_at) > new Date(byDay[key].created_at)) {
      byDay[key] = m
    }
  })

  const todayLogged = Object.keys(byDay).some(
    k => k === new Date().toDateString()
  )

  const chartData = Object.values(byDay)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-7)
    .map(m => ({
      day:   format(new Date(m.created_at), 'EEE', { locale: es }),
      score: m.mood_score,
    }))

  const toggleTag = (id) =>
    setTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const saveMood = async () => {
    if (!selected) return
    setSaving(true)
    const entry = {
      patient_id:    userId,
      mood_score:    selected,
      context_tags:  tags,
      note:          note.trim() || null,
      created_at:    new Date().toISOString(),
    }
    const { error } = await supabase.from('mood_logs').insert(entry)
    if (error) { toast.error('Error guardando estado de ánimo'); setSaving(false); return }
    toast.success('Estado de ánimo registrado 🌟')
    onSave?.(entry)
    setStep('done')
    setSaving(false)
  }

  const moodObj = MOODS.find(m => m.score === selected)

  // Full sorted history (deduped by day)
  const historyEntries = Object.values(byDay)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de ánimo</CardTitle>
        {historyEntries.length > 1 && (
          <button onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors ml-auto">
            {showHistory ? 'Ocultar historial ▲' : 'Ver historial ▼'}
          </button>
        )}
      </CardHeader>

      {todayLogged && step !== 'done' ? (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2 mb-3">
          <span>✓</span>
          <span>Estado de ánimo registrado hoy</span>
        </div>
      ) : step === 'pick' ? (
        /* ── Paso 1: elegir ánimo ── */
        <div className="animate-fade-in">
          <p className="text-sm text-warm-500 mb-3">¿Cómo te sientes hoy?</p>
          <div className="flex justify-between gap-1">
            {MOODS.map((m) => (
              <button key={m.score} onClick={() => setSelected(m.score)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all ${
                  selected === m.score
                    ? `${m.color} ring-2 scale-105`
                    : 'hover:bg-warm-50'
                }`}>
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs text-warm-600">{m.label}</span>
              </button>
            ))}
          </div>
          {selected && (
            <Button size="sm" fullWidth className="mt-3" onClick={() => setStep('context')}>
              Continuar →
            </Button>
          )}
        </div>
      ) : step === 'context' ? (
        /* ── Paso 2: contexto ── */
        <div className="animate-fade-in flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moodObj?.emoji}</span>
            <span className="text-sm font-medium text-warm-700">{moodObj?.label}</span>
            <button onClick={() => setStep('pick')} className="ml-auto text-xs text-warm-400 hover:text-warm-600">
              Cambiar
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-warm-500 uppercase mb-2">¿Qué lo provoca?</p>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_TAGS.map(t => (
                <button key={t.id} onClick={() => toggleTag(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    tags.includes(t.id)
                      ? 'bg-primary-100 border-primary-400 text-primary-700'
                      : 'bg-white border-warm-200 text-warm-600 hover:border-warm-300'
                  }`}>
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-warm-500 uppercase mb-2">Nota (opcional)</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="¿Quieres agregar algo más sobre cómo te sientes?"
              className="w-full text-sm rounded-xl border border-warm-200 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 text-warm-700 placeholder-warm-300"
            />
          </div>

          <Button size="sm" fullWidth loading={saving} onClick={saveMood}>
            Guardar registro
          </Button>
        </div>
      ) : (
        /* ── Paso 3: confirmación ── */
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2 mb-3 animate-fade-in">
          <span>✓</span>
          <span>Estado de ánimo registrado hoy</span>
        </div>
      )}

      {/* Gráfica semanal */}
      {chartData.length > 1 && (
        <div className="mt-4">
          <p className="text-xs text-warm-500 font-medium mb-3">Últimos 7 días</p>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[1, 5]} hide />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                formatter={(v) => [MOODS.find(m => m.score === v)?.label ?? v, 'Ánimo']}
              />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Historial detallado */}
      {showHistory && historyEntries.length > 0 && (
        <div className="mt-4 border-t border-warm-100 pt-4 flex flex-col gap-2 animate-fade-in">
          <p className="text-xs font-semibold text-warm-500 uppercase mb-1">Historial de registros</p>
          {historyEntries.map((entry) => {
            const mood = MOODS.find(m => m.score === entry.mood_score)
            const entryTags = Array.isArray(entry.context_tags) ? entry.context_tags : []
            return (
              <div key={entry.id ?? entry.created_at}
                className="flex items-start gap-3 bg-warm-50 rounded-xl p-3">
                <span className="text-xl shrink-0 mt-0.5">{mood?.emoji ?? '😐'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-warm-800">{mood?.label}</span>
                    <span className="text-xs text-warm-400 shrink-0">
                      {format(new Date(entry.created_at), "d 'de' MMM", { locale: es })}
                    </span>
                  </div>
                  {entryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {entryTags.map(tagId => {
                        const t = CONTEXT_TAGS.find(ct => ct.id === tagId)
                        return t ? (
                          <span key={tagId} className="text-xs bg-primary-50 text-primary-600 rounded-full px-2 py-0.5 border border-primary-100">
                            {t.emoji} {t.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                  {entry.note && (
                    <p className="text-xs text-warm-500 mt-1.5 italic">"{entry.note}"</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
