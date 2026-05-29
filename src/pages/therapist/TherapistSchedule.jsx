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
import { addDays, startOfWeek, format, parseISO, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HOURS = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`)

export default function TherapistSchedule() {
  const { user, profile } = useAuthStore()
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

  useEffect(() => {
    if (user) fetchWeek()
  }, [user, weekStart])

  const fetchWeek = async () => {
    setLoading(true)
    const weekEnd = addDays(weekStart, 6)
    const { data } = await supabase
      .from('sessions')
      .select('*, patient:profiles!sessions_patient_id_fkey(id, full_name, avatar_url)')
      .eq('therapist_id', user.id)
      .gte('scheduled_at', weekStart.toISOString())
      .lte('scheduled_at', weekEnd.toISOString())
      .order('scheduled_at')

    const { data: avail } = await supabase
      .from('therapist_availability')
      .select('*')
      .eq('therapist_id', user.id)

    const { data: blocked } = await supabase
      .from('therapist_blocked_dates')
      .select('*')
      .eq('therapist_id', user.id)
      .gte('blocked_date', new Date().toISOString().split('T')[0])
      .order('blocked_date')

    setSessions(data ?? [])
    setAvailability(avail ?? [])
    setBlockedDates(blocked ?? [])
    setLoading(false)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getSessionsForDay = (day) =>
    sessions.filter((s) => isSameDay(parseISO(s.scheduled_at), day))

  const toggleDay = (dayNum) =>
    setSelectedDays(prev =>
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
    )

  const markSessionCompleted = async () => {
    if (!selectedSession) return
    setMarkingDone(true)
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', selectedSession.id)
    if (error) { toast.error('Error al actualizar sesión'); setMarkingDone(false); return }
    toast.success('✅ Sesión marcada como completada')
    setSelectedSession(null)
    setMarkingDone(false)
    fetchWeek()
  }

  /**
   * Alterna entre "solo días laborales" y "todos los días".
   * - Si ya están seleccionados los 5 días laborales (sin fines de semana): deselecciona todo.
   * - Si no: selecciona lunes-viernes y quita sábado-domingo.
   */
  const toggleNoWeekends = () => {
    const weekdays = [1, 2, 3, 4, 5]
    const onlyWeekdays = weekdays.every(d => selectedDays.includes(d)) &&
      !selectedDays.includes(6) && !selectedDays.includes(7)

    if (onlyWeekdays) {
      // Ya están solo laborales → deseleccionar todo
      setSelectedDays([])
    } else {
      // Seleccionar lunes-viernes y quitar sábado-domingo
      setSelectedDays(weekdays)
    }
  }

  const noWeekendsActive = [1,2,3,4,5].every(d => selectedDays.includes(d)) &&
    !selectedDays.includes(6) && !selectedDays.includes(7)

  const saveAvailability = async () => {
    if (selectedDays.length === 0) { toast.error('Selecciona al menos un día'); return }
    setSavingAvail(true)
    const rows = selectedDays.map(day => ({
      therapist_id: user.id,
      day_of_week:  String(day),
      start_time:   availForm.start_time,
      end_time:     availForm.end_time,
    }))
    const { error } = await supabase.from('therapist_availability').upsert(rows, { onConflict: 'therapist_id,day_of_week' })
    if (error) { toast.error('Error guardando disponibilidad'); setSavingAvail(false); return }
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

  const isDateBlocked = (day) =>
    blockedDates.some(b => b.blocked_date === format(day, 'yyyy-MM-dd'))

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Mi agenda</h1>
          <p className="text-warm-500 text-sm mt-1">
            {format(weekStart, "'Semana del' d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            ← Anterior
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Hoy
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            Siguiente →
          </Button>
        </div>
      </div>

      {/* Botones de disponibilidad y bloqueos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="flex items-center justify-between">
          <div>
            <p className="font-medium text-warm-800">Gestionar disponibilidad</p>
            <p className="text-sm text-warm-500">Define tus horarios para recibir citas</p>
          </div>
          <Button size="sm" onClick={() => setShowAvailModal(true)}>
            + Añadir horario
          </Button>
        </Card>
        <Card className="flex items-center justify-between">
          <div>
            <p className="font-medium text-warm-800">Bloquear fecha</p>
            <p className="text-sm text-warm-500">Vacaciones o días no disponibles</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowBlockModal(true)}>
            🚫 Bloquear día
          </Button>
        </Card>
      </div>

      {/* Vista semanal */}
      <Card padding={false} className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-warm-100">
          {weekDays.map((day, i) => (
            <div key={i} className={`p-3 text-center border-r border-warm-100 last:border-0 ${
              isSameDay(day, new Date()) ? 'bg-primary-50' : ''
            }`}>
              <p className="text-xs font-medium text-warm-500 uppercase">{DAYS[i]}</p>
              <p className={`text-lg font-bold mt-0.5 ${
                isSameDay(day, new Date()) ? 'text-primary-600' : 'text-warm-800'
              }`}>{format(day, 'd')}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-64 divide-x divide-warm-100">
          {weekDays.map((day, i) => {
            const daySessions = getSessionsForDay(day)
            const blocked = isDateBlocked(day)
            return (
              <div key={i} className={`p-2 flex flex-col gap-1.5 ${
                blocked ? 'bg-red-50/60' : isSameDay(day, new Date()) ? 'bg-primary-50/30' : ''
              }`}>
                {daySessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className="w-full text-left p-1.5 rounded-lg bg-primary-100 hover:bg-primary-200 transition-colors"
                  >
                    <p className="text-xs font-semibold text-primary-800 truncate">
                      {formatTime(s.scheduled_at)}
                    </p>
                    <p className="text-xs text-primary-600 truncate">{s.patient?.full_name}</p>
                  </button>
                ))}
                {blocked && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-1">
                    <span className="text-red-400 text-base">🚫</span>
                    <span className="text-red-400 text-[10px] text-center leading-tight">Bloqueado</span>
                  </div>
                )}
                {!blocked && daySessions.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-warm-200 text-xs">—</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Disponibilidad configurada */}
      {availability.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-semibold text-warm-900 mb-3">Horarios activos</h2>
          <div className="flex flex-wrap gap-2">
            {availability.map((av) => (
              <Badge key={av.id} variant="calm">
                {DAYS[av.day_of_week - 1]}  {av.start_time} – {av.end_time}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Modal detalle de sesión */}
      <Modal isOpen={!!selectedSession} onClose={() => setSelectedSession(null)} title="Detalle de sesión">
        {selectedSession && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={selectedSession.patient?.full_name ?? ''} size="lg" />
              <div>
                <p className="font-semibold text-warm-900">{selectedSession.patient?.full_name}</p>
                <p className="text-sm text-warm-500">{formatDate(selectedSession.scheduled_at)} · {formatTime(selectedSession.scheduled_at)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-warm-50 rounded-xl p-3">
                <p className="text-warm-500 text-xs">Precio</p>
                <p className="font-semibold text-warm-800 mt-0.5">{formatPrice(selectedSession.price ?? 0)}</p>
              </div>
              <div className="bg-warm-50 rounded-xl p-3">
                <p className="text-warm-500 text-xs">Estado</p>
                <p className="font-semibold text-warm-800 mt-0.5 capitalize">{selectedSession.status}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {selectedSession.status === 'scheduled' && (
                <Button variant="calm" fullWidth onClick={() => navigate(`/video-call/${selectedSession.id}`)}>
                  📹 Iniciar videollamada
                </Button>
              )}
              {selectedSession.status === 'scheduled' && (
                <Button variant="secondary" fullWidth loading={markingDone} onClick={markSessionCompleted}>
                  ✅ Marcar como completada
                </Button>
              )}
              {selectedSession.status === 'completed' && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-green-600 bg-green-50 rounded-xl">
                  <span>✅</span> Sesión completada
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Fechas bloqueadas */}
      {blockedDates.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-semibold text-warm-900 mb-3">Días bloqueados</h2>
          <div className="flex flex-wrap gap-2">
            {blockedDates.map((b) => (
              <div key={b.id} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm">
                <span className="text-red-500">🚫</span>
                <div>
                  <span className="font-medium text-red-700">
                    {format(new Date(b.blocked_date + 'T12:00:00'), "d 'de' MMMM", { locale: es })}
                  </span>
                  {b.reason && <span className="text-red-400 text-xs ml-1">· {b.reason}</span>}
                </div>
                <button onClick={() => removeBlockedDate(b.id)}
                  className="text-red-300 hover:text-red-600 ml-1 transition-colors font-bold">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal disponibilidad */}
      <Modal isOpen={showAvailModal} onClose={() => { setShowAvailModal(false); setSelectedDays([]) }} title="Añadir disponibilidad">
        <div className="flex flex-col gap-5">
          {/* Selector de días */}
          <div>
            <p className="text-xs font-semibold text-warm-500 uppercase mb-2">Días de la semana</p>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d, i) => {
                const dayNum = i + 1
                const active = selectedDays.includes(dayNum)
                return (
                  <button key={dayNum} onClick={() => toggleDay(dayNum)}
                    className={`w-11 h-11 rounded-xl text-sm font-semibold border transition-all ${
                      active
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-warm-600 border-warm-200 hover:border-warm-400'
                    }`}>
                    {d}
                  </button>
                )
              })}
            </div>

            {/* Checkbox sin fines de semana */}
            <button onClick={toggleNoWeekends}
              className="flex items-center gap-2 mt-3 text-sm text-warm-600 hover:text-warm-800 transition-colors">
              <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                noWeekendsActive ? 'bg-primary-600 border-primary-600 text-white' : 'border-warm-300'
              }`}>
                {noWeekendsActive && <span className="text-xs font-bold">✓</span>}
              </span>
              Sin fines de semana (Sáb y Dom)
            </button>

            {selectedDays.length > 0 && (
              <p className="text-xs text-primary-600 mt-2 font-medium">
                {selectedDays.length} día{selectedDays.length > 1 ? 's' : ''} seleccionado{selectedDays.length > 1 ? 's' : ''}: {selectedDays.map(d => DAYS[d - 1]).join(', ')}
              </p>
            )}
          </div>

          {/* Horas */}
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

          <Button onClick={saveAvailability} fullWidth loading={savingAvail}
            disabled={selectedDays.length === 0}>
            Guardar disponibilidad
          </Button>
        </div>
      </Modal>
      {/* Modal bloquear fecha */}
      <Modal isOpen={showBlockModal} onClose={() => { setShowBlockModal(false); setBlockForm({ date: '', reason: '' }) }} title="Bloquear fecha">
        <div className="flex flex-col gap-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
            🚫 Los pacientes no podrán agendar citas en las fechas que bloquees.
          </div>
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase mb-1.5">Fecha a bloquear</label>
            <input
              type="date"
              value={blockForm.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setBlockForm(f => ({ ...f, date: e.target.value }))}
              className="w-full rounded-xl border border-warm-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 text-warm-800"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-warm-500 uppercase mb-1.5">Motivo (opcional)</label>
            <input
              type="text"
              value={blockForm.reason}
              onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}
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
