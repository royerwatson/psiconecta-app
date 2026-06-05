/**
 * ProgressWidget — Widget de progreso terapéutico del paciente.
 *
 * Muestra:
 *   - Racha de accesos diarios a la plataforma
 *   - Sesiones completadas
 *   - Tareas completadas
 *   - Logros desbloqueados con animación
 *
 * Push notifications (browser) al:
 *   - Completar sesión → detectado por nueva sesión 'completed' en DB
 *   - Lograr meta de acceso (racha 3, 7, 14, 30 días)
 *   - Completar tarea
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Flame, CheckCircle2, Star, Trophy, Zap,
  TrendingUp, Clock, Target, Award,
} from 'lucide-react'
import {
  requestNotificationPermission,
  sendPush,
  sendAchievementNotification,
  sendSessionCompletionNotification,
  sendTaskCompletionNotification,
} from '@/lib/notifications'

// ─── Definición de logros ─────────────────────────────────────────────────────

const ACHIEVEMENTS = [
  { key: 'first_login',        label: 'Primera conexión',        desc: 'Te uniste a Psiconecta',           Icon: Star,         color: 'text-yellow-500', bg: 'bg-yellow-50',  border: 'border-yellow-200', xp: 10  },
  { key: 'first_session',      label: 'Primera sesión',          desc: 'Completaste tu primera sesión',    Icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  xp: 50  },
  { key: 'first_task',         label: 'Primer paso',             desc: 'Completaste tu primera tarea',     Icon: Target,       color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   xp: 20  },
  { key: 'streak_3',           label: 'Racha de 3 días',         desc: '3 días consecutivos en Psiconecta',Icon: Flame,        color: 'text-orange-500', bg: 'bg-orange-50',  border: 'border-orange-200', xp: 30  },
  { key: 'streak_7',           label: 'Semana completa',         desc: '7 días consecutivos',              Icon: Flame,        color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200', xp: 70  },
  { key: 'streak_14',          label: 'Dos semanas',             desc: '14 días de constancia',            Icon: Flame,        color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-200',    xp: 140 },
  { key: 'streak_30',          label: 'Mes comprometido',        desc: '30 días seguidos',                 Icon: Trophy,       color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-200', xp: 300 },
  { key: 'sessions_5',         label: '5 sesiones',              desc: 'Completaste 5 sesiones terapéuticas',Icon: Clock,      color: 'text-teal-600',   bg: 'bg-teal-50',    border: 'border-teal-200',   xp: 100 },
  { key: 'sessions_10',        label: '10 sesiones',             desc: 'Un gran avance terapéutico',       Icon: TrendingUp,   color: 'text-primary-600',bg: 'bg-primary-50', border: 'border-primary-200',xp: 200 },
  { key: 'tasks_5',            label: '5 tareas completadas',    desc: 'Tu dedicación es notable',         Icon: Award,        color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-200', xp: 80  },
  { key: 'tasks_10',           label: '10 tareas completadas',   desc: 'Compromiso total con tu proceso',  Icon: Award,        color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-200', xp: 150 },
]

function getAchievementDef(key) {
  return ACHIEVEMENTS.find(a => a.key === key)
}



// ─── Toast de logro ───────────────────────────────────────────────────────────

function AchievementToast({ achievement }) {
  const def = getAchievementDef(achievement.achievement_key)
  if (!def) return null
  const { Icon, color, bg, label, desc, xp } = def
  return (
    <div className="flex items-center gap-3 max-w-sm">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon size={20} strokeWidth={1.8} className={color} />
      </div>
      <div>
        <p className="font-semibold text-warm-900 text-sm">Logro: {label}</p>
        <p className="text-xs text-warm-500">{desc} · +{xp} XP</p>
      </div>
    </div>
  )
}

// ─── Barra de progreso XP ─────────────────────────────────────────────────────

function XPBar({ xp }) {
  const level      = Math.floor(xp / 100) + 1
  const xpInLevel  = xp % 100
  const nextLevelXP = 100

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
        <span className="text-white text-xs font-bold">{level}</span>
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-warm-700">Nivel {level}</span>
          <span className="text-xs text-warm-400">{xpInLevel}/{nextLevelXP} XP</span>
        </div>
        <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-calm-400 rounded-full transition-all duration-700"
            style={{ width: `${(xpInLevel / nextLevelXP) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white border border-warm-100 rounded-2xl p-3 flex-1">
      <Icon size={18} strokeWidth={1.8} className={color} />
      <p className="text-xl font-bold text-warm-900 leading-none">{value}</p>
      <p className="text-[10px] text-warm-400 text-center leading-snug">{label}</p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ProgressWidget() {
  const { user } = useAuthStore()
  const [progress, setProgress]           = useState(null)
  const [achievements, setAchievements]   = useState([])
  const [pendingNotifs, setPendingNotifs] = useState([])
  const [loading, setLoading]             = useState(true)

  // XP total calculado desde logros
  const totalXP = achievements.reduce((sum, a) => {
    const def = getAchievementDef(a.achievement_key)
    return sum + (def?.xp ?? 0)
  }, 0)

  // ── Registrar acceso diario ────────────────────────────────────────────────
  const registerDailyLogin = useCallback(async (userId) => {
    const today = new Date().toISOString().split('T')[0]

    const { data: prog } = await supabase
      .from('patient_progress')
      .select('*')
      .eq('patient_id', userId)
      .single()

    if (!prog) {
      // Primera vez — crear registro
      await supabase.from('patient_progress').insert({
        patient_id:   userId,
        total_logins: 1,
        login_streak: 1,
        longest_streak: 1,
        last_login_date: today,
      })
      // Logro: primera conexión
      await unlockAchievement(userId, 'first_login')
      return
    }

    if (prog.last_login_date === today) return // Ya registrado hoy

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().split('T')[0]

    const newStreak   = prog.last_login_date === yStr ? (prog.login_streak ?? 0) + 1 : 1
    const longestNew  = Math.max(prog.longest_streak ?? 0, newStreak)
    const newLogins   = (prog.total_logins ?? 0) + 1

    await supabase.from('patient_progress').update({
      login_streak:    newStreak,
      longest_streak:  longestNew,
      total_logins:    newLogins,
      last_login_date: today,
      updated_at:      new Date().toISOString(),
    }).eq('patient_id', userId)

    // Logros de racha
    const streakMilestones = [3, 7, 14, 30]
    for (const m of streakMilestones) {
      if (newStreak >= m) await unlockAchievement(userId, `streak_${m}`)
    }
  }, [])

  // ── Desbloquear logro ──────────────────────────────────────────────────────
  const unlockAchievement = async (userId, key) => {
    const def = getAchievementDef(key)
    if (!def) return

    const { error } = await supabase
      .from('patient_achievements')
      .insert({ patient_id: userId, achievement_key: key, notified: false })
      .select()

    if (!error) {
      // Notificación push del browser
      await requestNotificationPermission()
      sendPush(
        `¡Logro desbloqueado: ${def.label}!`,
        `${def.desc} +${def.xp} XP`
      )
      // Toast visual in-app
      toast.custom(
        <AchievementToast achievement={{ achievement_key: key }} />,
        { duration: 5000, position: 'top-right' }
      )
    }
  }

  // ── Cargar datos ───────────────────────────────────────────────────────────
  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    const [progResult, achResult] = await Promise.all([
      supabase.from('patient_progress').select('*').eq('patient_id', user.id).single(),
      supabase.from('patient_achievements').select('*').eq('patient_id', user.id).order('achieved_at', { ascending: false }),
    ])

    setProgress(progResult.data ?? null)
    setAchievements(achResult.data ?? [])
    setLoading(false)

    // Registrar acceso del día
    await registerDailyLogin(user.id)

    // Comprobar logros de sesiones y tareas
    if (progResult.data) {
      const { sessions_completed = 0, tasks_completed = 0 } = progResult.data
      if (sessions_completed >= 1)  await unlockAchievement(user.id, 'first_session')
      if (sessions_completed >= 5)  await unlockAchievement(user.id, 'sessions_5')
      if (sessions_completed >= 10) await unlockAchievement(user.id, 'sessions_10')
      if (tasks_completed >= 1)     await unlockAchievement(user.id, 'first_task')
      if (tasks_completed >= 5)     await unlockAchievement(user.id, 'tasks_5')
      if (tasks_completed >= 10)    await unlockAchievement(user.id, 'tasks_10')
    }
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  // ── Suscripción realtime a nuevas sesiones completadas ─────────────────────
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('progress-sessions')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `patient_id=eq.${user.id}`,
      }, async (payload) => {
        if (payload.new?.status === 'completed' && payload.old?.status !== 'completed') {
          // Sesión recién completada
          sendPush(
            '¡Sesión completada!',
            'Has concluido una sesión terapéutica. ¡Excelente trabajo!'
          )
          toast.success('¡Sesión completada! Recuerda registrar cómo te sentiste en tu diario.', {
            duration: 6000, icon: null,
          })
          fetchData() // Recargar progreso
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'patient_tasks',
        filter: `patient_id=eq.${user.id}`,
      }, async (payload) => {
        if (payload.new?.status === 'completed' && payload.old?.status !== 'completed') {
          sendPush(
            '¡Tarea completada!',
            `"${payload.new.title}" — ¡Sigue adelante con tu proceso!`
          )
          fetchData()
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-warm-100 shadow-card p-5 animate-pulse">
        <div className="h-4 bg-warm-100 rounded w-1/3 mb-4" />
        <div className="h-8 bg-warm-100 rounded mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-warm-100 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const streak        = progress?.login_streak ?? 0
  const sessionsComp  = progress?.sessions_completed ?? 0
  const tasksComp     = progress?.tasks_completed ?? 0
  const totalLogins   = progress?.total_logins ?? 0

  return (
    <div className="bg-white rounded-2xl border border-warm-100 shadow-card p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-warm-900 text-sm flex items-center gap-1.5">
          <TrendingUp size={15} strokeWidth={1.8} className="text-primary-500" />
          Mi progreso
        </h3>
        {achievements.length > 0 && (
          <span className="text-xs text-warm-400">{achievements.length} logros</span>
        )}
      </div>

      {/* XP Bar */}
      <XPBar xp={totalXP} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatPill
          Icon={Flame}
          value={streak}
          label={streak === 1 ? 'día seguido' : 'días seguidos'}
          color={streak >= 7 ? 'text-red-500' : streak >= 3 ? 'text-orange-500' : 'text-warm-400'}
        />
        <StatPill
          Icon={CheckCircle2}
          value={sessionsComp}
          label="sesiones"
          color="text-green-500"
        />
        <StatPill
          Icon={Target}
          value={tasksComp}
          label="tareas"
          color="text-blue-500"
        />
      </div>

      {/* Logros recientes */}
      {achievements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-warm-500 mb-2">Logros recientes</p>
          <div className="flex flex-wrap gap-2">
            {achievements.slice(0, 6).map(a => {
              const def = getAchievementDef(a.achievement_key)
              if (!def) return null
              const { Icon, color, bg, border, label } = def
              return (
                <div
                  key={a.achievement_key}
                  title={`${label} — ${def.desc}`}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium',
                    bg, border, color
                  )}
                >
                  <Icon size={11} strokeWidth={2} />
                  <span className="text-warm-700">{label}</span>
                </div>
              )
            })}
            {achievements.length > 6 && (
              <span className="text-xs text-warm-400 flex items-center">
                +{achievements.length - 6} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Mensaje motivacional */}
      {streak === 0 && sessionsComp === 0 && (
        <p className="text-xs text-warm-400 text-center py-1">
          Regresa cada día para construir tu racha y desbloquear logros
        </p>
      )}
      {streak >= 3 && (
        <p className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-center font-medium">
          <Flame size={12} className="inline mr-1" />
          ¡{streak} días seguidos! Mantén tu racha
        </p>
      )}
    </div>
  )
}
