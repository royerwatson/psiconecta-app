/**
 * Utilidades compartidas de la app Psiconecta.
 *
 * Incluye:
 *   - Formateo de fechas en español (date-fns)
 *   - Helper de clases CSS condicionales (cn)
 *   - Generación de iniciales y colores de avatar
 *   - Formateo de precios
 *   - Mapas de estado para sesiones y check-ins
 *   - Lógica de ventana de tiempo para iniciar videollamada
 */
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// Formateo de fechas en español
export const formatDate = (date, fmt = 'dd MMM yyyy') =>
  format(typeof date === 'string' ? parseISO(date) : date, fmt, { locale: es })

export const formatTime = (date) =>
  format(typeof date === 'string' ? parseISO(date) : date, 'HH:mm', { locale: es })

export const formatDateTime = (date) =>
  format(typeof date === 'string' ? parseISO(date) : date, "dd MMM 'a las' HH:mm", { locale: es })

export const formatRelative = (date) =>
  formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, {
    addSuffix: true,
    locale: es,
  })

export const formatSessionDate = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return `Hoy, ${formatTime(d)}`
  if (isTomorrow(d)) return `Mañana, ${formatTime(d)}`
  return formatDateTime(d)
}

// Clases CSS condicionales (similar a clsx)
export const cn = (...classes) => classes.filter(Boolean).join(' ')

// Iniciales para avatar
export const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')

// Color de avatar determinístico por nombre
const AVATAR_COLORS = [
  'bg-primary-100 text-primary-700',
  'bg-calm-100 text-calm-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
]
export const getAvatarColor = (name = '') => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

// Formateo de precio — siempre en USD
export const formatPrice = (amount) => {
  const num = parseFloat(amount ?? 0)
  return `$${num.toFixed(2)} USD`
}

// Nivel de riesgo del check-in IA
export const getRiskLabel = (level) => {
  const map = {
    low:    { label: 'Bajo',    color: 'text-success bg-green-50' },
    medium: { label: 'Medio',   color: 'text-warning bg-amber-50' },
    high:   { label: 'Alto',    color: 'text-danger  bg-red-50'   },
  }
  return map[level] ?? map.low
}

// Estado de sesión
export const getSessionStatus = (status) => {
  const map = {
    scheduled:  { label: 'Programada',  color: 'bg-blue-50 text-blue-700'   },
    in_progress:{ label: 'En curso',    color: 'bg-green-50 text-green-700' },
    completed:  { label: 'Completada',  color: 'bg-warm-100 text-warm-600'  },
    cancelled:  { label: 'Cancelada',   color: 'bg-red-50 text-red-600'     },
    urgent:     { label: 'Urgente',     color: 'bg-amber-50 text-amber-700' },
  }
  return map[status] ?? map.scheduled
}

// Verificar si una sesión puede iniciar videollamada (±15 min del horario)
export const canStartVideo = (scheduledAt) => {
  const sessionTime = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt
  const now = new Date()
  const diffMs = sessionTime - now
  const diffMin = diffMs / 1000 / 60
  return diffMin <= 30 && diffMin >= -90 // 30 min antes hasta 90 min después
}

// Minutos restantes hasta el inicio de sesión (negativo = ya pasó)
export const minutesUntilSession = (scheduledAt) => {
  const sessionTime = typeof scheduledAt === 'string' ? parseISO(scheduledAt) : scheduledAt
  return Math.round((sessionTime - new Date()) / 1000 / 60)
}

// Saludo dinámico según hora del día
export const getGreeting = () => {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Buenos días'
  if (h >= 12 && h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// Generar ID único simple
export const generateId = () => Math.random().toString(36).slice(2, 11)

// Truncar texto
export const truncate = (text = '', maxLen = 100) =>
  text.length > maxLen ? text.slice(0, maxLen) + '…' : text
