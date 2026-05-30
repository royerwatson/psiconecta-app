import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { formatDate, formatTime, formatPrice } from '@/lib/utils'
import { addDays, startOfWeek, format, parseISO, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HOURS      = Array.from({ length: 12 }, (_, i) => `${String(8 + i).padStart(2,'0')}:00`)

/** Color de sesión según estado */
const SESSION_COLORS = {
  scheduled:   'bg-primary-100 hover:bg-primary-200 text-primary-800 border-primary-200',
  in_progress: 'bg-green-100 hover:bg-green-200 text-green-800 border-green-200',
  completed:   'bg-warm-100 hover:bg-warm-200 text-warm-600 border-warm-200',
  cancelled:   'bg-red-50 hover:bg-red-100 text-red-500 border-red-100',
}

export default function TherapistSchedule() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [availability, setAvailability] = useState([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [selectedSession, setSelectedSession] = useState(null)
  const [markingDone, setMarkingDone] = useState(false)
  const [showAvailModal, setShowAvailModal] = useState(false)
  const [availForm, setAvailForm] = useState({ start_time: '09:00', end_time: '17:00' })
  const [selectedDays, setSelectedDays] = useState([])
  const [savingAvail, setSavingAvail] = useState(false)
  const [blockedDates, setBlockedDates] = useState([])
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockForm, setBlockForm] = useState({ date: '', reason: '' })
  const [savingBlock, setSavingBlock] = useState(false)

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))

  useEffect(() => {
    if (user) fetchWeek()
  }, [user, weekStart])

  const fetchWeek = async () => {
    setLoading(true)
    const weekEnd = addDays(weekStart, 6)
    const [{ data }, { data: avail }, { data: blocked }] = await Promise.all([
      supabase
        .from('sessions')
        .select('*, patient:profiles!sessions_patient_id_fkey(id, full_name, avatar_url)')
        .eq('therapist_id', user.id)
        .gte('scheduled_at', weekStart.toISOString())
        .lte('scheduled_at', weekEnd.toISOString())
        .order('scheduled_at'),
      supabase.from('therapist_availability').select('*').eq('therapist_id', user.id),
      supabase.from('therapist_blocked_dates').select('*').eq('therapist_id', user.id)
        .gte('blocked_date', new Date().toISOString().split('T')[0]).order('blocked_date'),
    ])
    setSessions(data ?? [])
    setAvailability(avail ?? [])
    setBlockedDates(blocked ?? [])
    setLoading(false)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const getSessionsForDay = (day) => sessions.filter((s) => isSameDay(parseISO(s.scheduled_at), day))
  const isDateBlocked = (day) => blockedDates.some((b) => b.blocked_date === format(day, 'yyyy-MM-dd'))

  const toggleDay = (dayNum) =>
    setSelectedDays((prev) => prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum])

  const toggleNoWeekends = () => {
    const weekdays = [1, 2, 3, 4, 5]
    const onlyWeekdays = weekdays.every((d) => selectedDays.includes(d)) &&
      !selectedDays.includes(6) && !selectedDays.includes(7)
    setSelectedDays(onlyWeekdays ? [] : weekdays)
  }

  const noWeekendsActive = [1,2,3,4,5].every((d) => selectedDays.includes(d)) &&
    !selectedDays.includes(6) && !selectedDays.includes(7)

  const markSessionCompleted = async () => {
    if (!selectedSession) return
    setMarkingDone(true)
    const { error } = await supabase.from('sessions').update({ status: 'completed' }).eq('id', selectedSession.id)
    if (error) { toast.error('Error al actualizar sesión'); setMarkingDone(false); return }
    toast.success('✅ Sesión marcada como completada')
    setSelectedSession(null)
    setMarkingDone(false)
    fetchWeek()
  }

  const saveAvailability = async () => {
    if (selectedDays.length === 0) { toast.error('Selecciona al menos un día de la semana'); return }
    if (availForm.start_time >= availForm.end_time) { toast.error('La hora de inicio debe ser anterior a la hora de fin'); return }
    setSavingAvail(true)
    const rows = selectedDays.map((day) => ({
      therapist_id: user.id,
      day_of_week:  String(day),
      start_time:   availForm.start_time,
      end_time:     availForm.end_time,
    }))
    const { error } = await supabase.from('therapist_availability').upsert(rows, { onConflict: 'therapist_id,day_of_week' })
    if (error) { toast.error('Error guardando disponibilidad. Intenta de nuevo.'); setSavingAvail(false); return }
    toast.success(`Disponibilidad guardada para ${selectedDays.length} día${selectedDays.length > 1 ? 's' : ''}`)
    setShowAvailModal(false)
    setSelectedDays([])
    setSavingAvail(false)
    fetchWeek()
  }

  const saveBlockedDate = async () => {
    if (!blockForm.date) { toast.error('Selecciona una fecha'); return }
    setSavingBlock(true)
    const { error } = await supabase.from('therapist_blocked_dates').upsert({
      therapist_id: user.id,
      blocked_date: blockForm.date,
      reason: blockForm.reason.trim() || null,
    }, { onConflict: 'therapist_id,blocked_date' })
    if (error) { toast.error('Error guardando fecha bloqueada'); setSavingBlock(false); return }
    toast.success('📅 Fecha bloqueada correctamente')
    setShowBlockModal(false)
    setBlockForm({ date: '', reason: '' })
    setSavingBlock(false)
    fetchWeek()
  }

  const removeBlockedDate = async (id) => {
    const { error } = await supabase.from('therapist_blocked_dates').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar bloqueo'); return }
    toast.success('Bloqueo eliminado')
    fetchWeek()
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Mi agenda</h1>
          <p className="text-warm-500 text-sm mt-1">
            {format(weekStart, "'Semana del' d", { locale: es })}
            {' – '}
            {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: es })}
          </p>
        </div>

        {/* Navegación de semana */}
        <div className="flex items-center gap-1.5 bg-warm-50 border border-warm-100 rounded-2xl p-1">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-warm-600 hover:bg-white hover:shadow-sm transition-all text-lg font-bold"
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className={`px-3 h-9 rounded-xl text-sm font-medium transition-all ${
              isCurrentWeek
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-warm-600 hover:bg-white hover:shadow-sm'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-warm-600 hover:bg-white hover:shadow-sm transition-all text-lg font-bold"
            aria-label="Semana siguiente"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Resumen semanal ── */}
      {!loading && sessions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-warm-500">Esta semana:</span>
          <Badge variant="primary" dot>
            {sessions.filter(s => s.status === 'scheduled').length} programadas
          </Badge>
          {sessions.filter(s => s.status === 'completed').length > 0 && (
            <Badge variant="neutral" dot>
              {sessions.filter(s => s.status === 'completed').length} completadas
            </Badge>
          )}
          {sessions.filter(s => s.status === 'in_progress').length > 0 && (
            <Badge variant="calm" dot>
              {sessions.filter(s => s.status === 'in_progress').length} en curso
            </Badge>
          )}
        </div>
      )}

      {/* ── Botones de acción ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="flex items-center justify-between gap-3" padding={false}>
          <div className="p-4">
            <p className="font-medium text-warm-800 text-sm">Disponibilidad</p>
            <p className="text-xs text-warm-500 mt-0.5">Horarios para recibir citas</p>
          </div>
          <Button size="sm" className="mr-3 shrink-0" onClick={() => setShowAvailModal(true)}>
            + Añadir
          </Button>
        </Card>
        <Card className="flex items-center justify-between gap-3" padding={false}>
          <div className="p-4">
            <p className="font-medium text-warm-800 text-sm">Bloquear fecha</p>
            <p className="text-xs text-warm-500 mt-0.5">Vacaciones o días no disponibles</p>
          </div>
          <Button size="sm" variant="secondary" className="mr-3 shrink-0" onClick={() => setShowBlockModal(true)}>
            🚫 Bloquear
          </Button>
        </Card>
      </div>

      {/* ── Grid semanal ── */}
      <Card padding={false} className="overflow-hidden">
        {/* Encabezado de días */}
        <div className="grid grid-cols-7 border-b border-warm-100">
          {weekDays.map((day, i) => {
            const today = isToday(day)
            return (
              <div key={i} className={`py-3 text-center border-r border-warm-100 last:border-0 transition-colors ${
                today ? 'bg-primary-50' : ''
              }`}>
                <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider">
                  {DAYS_SHORT[i]}
                </p>
                <p className={`text-base font-bold mt-0.5 w-8 h-8 flex items-center justify-center mx-auto rounded-full ${
                  today
                    ? 'bg-primary-600 text-white'
                    : 'text-warm-800'
                }`}>
                  {format(day, 'd')}
                </p>
              </div>
            )
          })}
        </div>

        {/* Cuerpo del grid */}
        <div className="grid grid-cols-7 min-h-52 divide-x divide-warm-100">
          {loading ? (
            // Skeleton en el grid
            weekDays.map((_, i) => (
              <div key={i} className="p-2 flex flex-col gap-1.5">
                {i % 3 === 0 && <Skeleton className="h-12 rounded-lg" />}
                {i % 5 === 0 && <Skeleton className="h-10 rounded-lg" />}
              </div>
            ))
          ) : (
            weekDays.map((day, i) => {
              const daySessions = getSessionsForDay(day)
              const blocked     = isDateBlocked(day)
              const today       = isToday(day)
              return (
                <div key={i} className={`p-1.5 flex flex-col gap-1.5 ${
                  blocked ? 'bg-red-50/60' : today ? 'bg-primary-50/20' : ''
                }`}>
                  {daySessions.map((s) => {
                    const colors = SESSION_COLORS[s.status] ?? SESSION_COLORS.scheduled
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSession(s)}
                        className={`w-full text-left p-1.5 rounded-lg border transition-all active:scale-95 ${colors}`}
                      >
                        <p className="text-[11px] font-semibold truncate leading-tight">
                          {formatTime(s.scheduled_at)}
                        </p>
                        <p className="text-[10px] truncate leading-tight opacity-80">
                          {s.patient?.full_name?.split(' ')[0]}
                        </p>
                      </button>
                    )
                  })}
                  {blocked && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
                      <span className="text-base">🚫</span>
                      <span className="text-red-400 text-[9px] font-medium text-center">Bloqueado</span>
                    </div>
                  )}
                  {!blocked && daySessions.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-warm-200 text-sm">—</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* ── Disponibilidad configurada ── */}
      {availability.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-semibold text-warm-900 mb-3">Horarios activos</h2>
          <div className="flex flex-wrap gap-2">
            {availability.map((av) => (
              <Badge key={av.id} variant="calm">
                {DAYS_SHORT[Number(av.day_of_week) - 1]}  {av.start_time} – {av.end_time}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* ── Fechas bloqueadas ── */}
      {blockedDates.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-semibold text-warm-900 mb-3">Días bloqueados</h2>
          <div className="flex flex-col gap-2">
            {blockedDates.map((b) => (
              <div key={b.id} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                <span className="text-red-400 text-lg">🚫</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-red-700 text-sm">
                    {format(new Date(b.blocked_date + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  {b.reason && (
                    <p className="text-xs text-red-400 mt-0.5 truncate">{b.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => removeBlockedDate(b.id)}
                  className="text-red-300 hover:text-red-600 transition-colors text-xl font-bold shrink-0"
                  aria-label="Eliminar bloqueo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal detalle de sesión ── */}
      <Modal isOpen={!!selectedSession} onClose={() => setSelectedSession(null)} title="Detalle de sesión">
        {selectedSession && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-warm-50 rounded-xl p-3">
              <Avatar name={selectedSession.patient?.full_name ?? ''} size="lg" />
              <div>
                <p className="font-semibold text-warm-900">{selectedSession.patient?.full_name}</p>
                <p className="text-sm text-warm-500">
                  {formatDate(selectedSession.scheduled_at)} · {formatTime(selectedSession.scheduled_at)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-warm-50 rounded-xl p-3">
                <p className="text-warm-500 text-xs uppercase font-semibold mb-1">Precio</p>
                <p className="font-bold text-warm-800 text-base">{formatPrice(selectedSession.price ?? 0)}</p>
                {selectedSession.is_urgent && (
                  <p className="text-orange-500 text-xs mt-0.5">⚡ Cita urgente</p>
                )}
              </div>
              <div className="bg-warm-50 rounded-xl p-3">
                <p className="text-warm-500 text-xs uppercase font-semibold mb-1">Estado</p>
                <Badge variant={
                  selectedSession.status === 'completed'  ? 'neutral' :
                  selectedSession.status === 'in_progress' ? 'calm' : 'primary'
                }>
                  {selectedSession.status === 'scheduled'   ? 'Programada' :
                   selectedSession.status === 'in_progress' ? 'En curso'   :
                   selectedSession.status === 'completed'   ? 'Completada' : selectedSession.status}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {selectedSession.status !== 'completed' && (
                <Button variant="calm" fullWidth onClick={() => navigate(`/video-call/${selectedSession.id}`)}>
                  📹 Iniciar videollamada
                </Button>
              )}
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate(`/therapist/patients/${selectedSession.patient?.id}`)}
              >
                📋 Ver historial del paciente
              </Button>
              {selectedSession.status === 'scheduled' && (
                <Button variant="ghost" fullWidth loading={markingDone} onClick={markSessionCompleted}>
                  ✅ Marcar como completada
                </Button>
              )}
              {selectedSession.status === 'completed' && (
                <div className="flex items-center justify-center gap-2 py-2.5 text-sm text-green-700 bg-green-50 rounded-xl font-medium">
                  ✅ Sesión completada
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal disponibilidad ── */}
      <Modal
        isOpen={showAvailModal}
        onClose={() => { setShowAvailModal(false); setSelectedDays([]) }}
        title="Añadir disponibilidad"
      >
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-3">Días de la semana</p>
            <div className="flex gap-2 flex-wrap">
              {DAYS_SHORT.map((d, i) => {
                const dayNum = i + 1
                const active = selectedDays.includes(dayNum)
                return (
                  <button key={dayNum} onClick={() => toggleDay(dayNum)}
                    className={`w-11 h-11 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                      active
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-white text-warm-600 border-warm-200 hover:border-primary-300 hover:text-primary-600'
                    }`}>
                    {d}
                  </button>
                )
              })}
            </div>

            <button onClick={toggleNoWeekends}
              className="flex items-center gap-2 mt-3 text-sm text-warm-600 hover:text-warm-800 transition-colors">
              <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                noWeekendsActive ? 'bg-primary-600 border-primary-600 text-white' : 'border-warm-300'
              }`}>
                {noWeekendsActive && <span className="text-xs font-bold">✓</span>}
              </span>
              Solo días laborales (Lun–Vie)
            </button>

            {selectedDays.length > 0 && (
              <p className="text-xs text-primary-600 mt-2 font-medium">
                {selectedDays.length} día{selectedDays.length > 1 ? 's' : ''}: {selectedDays.map(d => DAYS_SHORT[d - 1]).join(', ')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Hora inicio" value={availForm.start_time}
              onChange={(e) => setAvailForm(f => ({ ...f, start_time: e.target.value }))}>
              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
            </Select>
            <Select label="Hora fin" value={availForm.end_time}
              onChange={(e) => setAvailForm(f => ({ ...f, end_time: e.target.value }))}>
              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
            </Select>
          </div>

          <Button onClick={saveAvailability} fullWidth loading={savingAvail} disabled={selectedDays.length === 0}>
            Guardar disponibilidad
          </Button>
        </div>
      </Modal>

      {/* ── Modal bloquear fecha ── */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => { setShowBlockModal(false); setBlockForm({ date: '', reason: '' }) }}
        title="Bloquear fecha"
      >
        <div className="flex flex-col gap-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
            <span>🚫</span>
            <span>Los pacientes no podrán agendar citas en esta fecha.</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-1.5">
              Fecha a bloquear
            </label>
            <input
              type="date"
              value={blockForm.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBlockForm(f => ({ ...f, date: e.target.value }))}
              className="w-full rounded-xl border border-warm-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 text-warm-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-1.5">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={blockForm.reason}
              onChange={(e) => setBlockForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Ej. Vacaciones, día personal..."
              maxLength={100}
              className="w-full rounded-xl border border-warm-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 text-warm-800 placeholder-warm-300"
            />
          </div>
          <Button onClick={saveBlockedDate} fullWidth loading={savingBlock} disabled={!blockForm.date}>
            Bloquear fecha
          </Button>
        </div>
      </Modal>
    </div>
  )
}
