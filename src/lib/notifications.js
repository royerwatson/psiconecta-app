/**
 * notifications.js — Utilidades de notificaciones push del browser.
 *
 * Usado por: ProgressWidget, MyTasksPage, PatientDashboard,
 *            PaymentSuccess (al confirmar cita).
 */

const APP_ICON = '/favicon.svg'

// ── Solicitar permiso ─────────────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

// ── Enviar notificación push ──────────────────────────────────────────────────

export function sendPush(title, body) {
  if (typeof window === 'undefined') return
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: APP_ICON, badge: APP_ICON })
    } catch {
      // Fallback silencioso (ServiceWorker requerido en algunos entornos)
    }
  }
}

// ── Notificaciones específicas ────────────────────────────────────────────────

export async function sendSessionCompletionNotification() {
  await requestNotificationPermission()
  sendPush(
    '¡Sesión completada!',
    'Has concluido una sesión terapéutica. ¡Excelente trabajo! Recuerda registrar cómo te sentiste.'
  )
}

export async function sendTaskCompletionNotification(taskTitle) {
  await requestNotificationPermission()
  sendPush(
    '¡Tarea completada!',
    `"${taskTitle}" — Tu compromiso con el proceso hace la diferencia. ¡Sigue así!`
  )
}

export async function sendStreakNotification(days) {
  await requestNotificationPermission()
  const msgs = {
    3:  'Llevas 3 días seguidos en Psiconecta. ¡Vas muy bien!',
    7:  '¡Una semana completa! Tu constancia es admirable.',
    14: '¡14 días de constancia! Estás construyendo un hábito saludable.',
    30: '¡30 días seguidos! Eres un ejemplo de compromiso con tu bienestar.',
  }
  sendPush(`Racha de ${days} días`, msgs[days] ?? `Llevas ${days} días consecutivos en Psiconecta.`)
}

export async function sendAchievementNotification(label, desc, xp) {
  await requestNotificationPermission()
  sendPush(`Logro desbloqueado: ${label}`, `${desc} +${xp} XP`)
}
