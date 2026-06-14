import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { CheckCircle2, Clock, ClipboardList, Landmark, User, CreditCard, Hash, AlertCircle, Calendar, Wallet, Send, Download } from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATUS_CONFIG = {
  pending:    { label: 'Pendiente',   color: 'bg-warm-100 text-warm-600'       },
  processing: { label: 'Procesando',  color: 'bg-blue-100 text-blue-700'       },
  completed:  { label: 'Completado',  color: 'bg-emerald-100 text-emerald-700' },
  failed:     { label: 'Fallido',     color: 'bg-red-100 text-red-600'         },
}

const METHOD_LABEL = {
  bank_transfer: 'Transferencia bancaria',
  paypal:        'PayPal',
  manual:        'Manual',
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function AdminPayouts() {
  const [tab, setTab]               = useState('pending')  // pending | history
  const [search, setSearch]         = useState('')
  const [earnings, setEarnings]     = useState([])         // ganancias pendientes
  const [history, setHistory]       = useState([])         // payouts anteriores
  const [loading, setLoading]       = useState(true)
  const [histLoading, setHistLoading] = useState(false)
  const [selected, setSelected]     = useState(null)       // terapeuta seleccionado para pagar
  const [confirmModal, setConfirmModal] = useState(null)   // payout pendiente para confirmar
  const [processing, setProcessing] = useState(false)
  const [form, setForm]             = useState({
    amount: '',
    note: '',
    periodStart: '',
    periodEnd: '',
    reference: '',
  })

  useEffect(() => { fetchPending() }, [])
  useEffect(() => { if (tab === 'history') fetchHistory() }, [tab])

  // ── Ganancias pendientes ────────────────────────────────────────────────────
  const fetchPending = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('therapist_pending_earnings')
      .select('*')
    if (error) console.error('fetchPending:', error)
    setEarnings(data ?? [])
    setLoading(false)
  }

  // ── Historial de payouts ────────────────────────────────────────────────────
  const fetchHistory = async () => {
    setHistLoading(true)
    const { data } = await supabase
      .from('payouts')
      .select(`
        *,
        therapist:profiles!payouts_therapist_id_fkey(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    setHistory(data ?? [])
    setHistLoading(false)
  }

  // ── Abrir modal para pagar terapeuta ───────────────────────────────────────
  const openPayModal = (t) => {
    setSelected(t)
    setForm({
      amount:      t.pending_amount?.toFixed(2) ?? '',
      note:        '',
      periodStart: t.earliest_session ?? '',
      periodEnd:   t.latest_session   ?? '',
      reference:   '',
    })
  }

  // ── Iniciar pago (crear payout) ────────────────────────────────────────────
  const initiatePayout = async () => {
    if (!form.amount || isNaN(Number(form.amount))) {
      toast.error('Ingresa un monto válido'); return
    }
    setProcessing(true)
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession?.access_token}`,
          },
          body: JSON.stringify({
            action:       'create',
            therapistId:  selected.therapist_id,
            amount:       Number(form.amount),
            note:         form.note,
            periodStart:  form.periodStart || null,
            periodEnd:    form.periodEnd   || null,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error iniciando pago')

      if (json.method === 'bank_transfer') {
        // Mostrar modal para confirmar con referencia bancaria
        toast.success('Payout creado — realiza la transferencia y confirma')
        setConfirmModal({ payoutId: json.payoutId, therapistName: selected.therapist_name })
      } else {
        toast.success('Pago enviado vía PayPal')
      }
      setSelected(null)
      fetchPending()
      if (tab === 'history') fetchHistory()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  // ── Confirmar transferencia bancaria ───────────────────────────────────────
  const confirmPayout = async (payoutId) => {
    setProcessing(true)
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession?.access_token}`,
          },
          body: JSON.stringify({
            action:    'confirm',
            payoutId,
            reference: form.reference || null,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error confirmando')
      toast.success('Transferencia confirmada')
      setConfirmModal(null)
      fetchPending()
      fetchHistory()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  // ── También permite confirmar payouts "processing" desde el historial ───────
  const quickConfirm = async (payout) => {
    const ref = window.prompt('Número de referencia de la transferencia (opcional):')
    if (ref === null) return // cancelado
    setProcessing(true)
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authSession?.access_token}`,
          },
          body: JSON.stringify({ action: 'confirm', payoutId: payout.id, reference: ref }),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Payout confirmado')
      fetchHistory()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  // ── Exportar historial como CSV ─────────────────────────────────────────────
  const exportPayoutsCSV = () => {
    const filtered = search.trim()
      ? history.filter(p => (p.therapist?.full_name ?? '').toLowerCase().includes(search.toLowerCase()))
      : history

    const headers = ['ID', 'Terapeuta', 'Monto (USD)', 'Estado', 'Método', 'Referencia', 'Período desde', 'Período hasta', 'Pagado en', 'Creado en', 'Nota']
    const rows = filtered.map(p => [
      p.id,
      p.therapist?.full_name ?? '',
      (p.amount ?? 0).toFixed(2),
      STATUS_CONFIG[p.status]?.label ?? p.status,
      METHOD_LABEL[p.payment_method] ?? p.payment_method ?? '',
      p.reference ?? '',
      p.period_start ? fmtDate(p.period_start) : '',
      p.period_end   ? fmtDate(p.period_end)   : '',
      p.paid_at      ? fmtDate(p.paid_at)      : '',
      p.created_at   ? fmtDate(p.created_at)   : '',
      p.note ?? '',
    ])
    const csv  = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `payouts_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Totales ────────────────────────────────────────────────────────────────
  const totalPending = earnings.reduce((a, e) => a + (e.pending_amount ?? 0), 0)

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-warm-900">Pagos a Terapeutas</h1>
          <p className="text-warm-500 text-sm mt-1">Gestión de liquidaciones y transferencias</p>
        </div>
        {earnings.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2 text-right">
            <p className="text-xs text-amber-600 font-medium">Total pendiente</p>
            <p className="text-xl font-bold text-amber-700">{formatPrice(totalPending)}</p>
          </div>
        )}
      </div>

      {/* Tabs + búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex gap-1 bg-warm-100 p-1 rounded-xl w-fit shrink-0">
          {[
            { id: 'pending', label: 'Pendientes' },
            { id: 'history', label: 'Historial'  },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-white shadow-sm text-warm-900' : 'text-warm-500 hover:text-warm-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar terapeuta..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {/* ── TAB: Pendientes ── */}
      {tab === 'pending' && (
        <>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-16 text-warm-400">
              <CheckCircle2 size={40} strokeWidth={1.5} className="mx-auto mb-3 text-emerald-400" />
              <p className="font-medium text-warm-600">Todo al día</p>
              <p className="text-sm mt-1">No hay pagos pendientes por procesar</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {earnings.filter(e => !search.trim() || (e.therapist_name ?? '').toLowerCase().includes(search.toLowerCase())).map(e => (
                <div key={e.therapist_id}
                  className="bg-white border border-warm-100 rounded-2xl p-4 hover:border-warm-200 transition-colors">
                  <div className="flex items-start gap-3">
                    <Avatar name={e.therapist_name ?? ''} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-warm-900">{e.therapist_name}</p>
                      <p className="text-sm text-warm-400">{e.specialty}</p>

                      {/* Método de pago */}
                      <p className="text-xs text-warm-500 mt-1">
                        {METHOD_LABEL[e.payment_method] ?? '—'}
                      </p>

                      {/* Datos bancarios */}
                      {e.payment_method === 'bank_transfer' && (
                        <div className="mt-2 bg-warm-50 rounded-xl p-2.5 text-xs text-warm-600 space-y-0.5">
                          {e.bank_name           && <p className="flex items-center gap-1.5"><Landmark size={12} className="shrink-0" /> <strong>{e.bank_name}</strong></p>}
                          {e.bank_account_name   && <p className="flex items-center gap-1.5"><User size={12} className="shrink-0" /> {e.bank_account_name}</p>}
                          {e.bank_account_number && <p className="flex items-center gap-1.5"><CreditCard size={12} className="shrink-0" /> {e.bank_account_number}</p>}
                          {e.bank_routing        && <p className="flex items-center gap-1.5"><Hash size={12} className="shrink-0" /> {e.bank_routing}</p>}
                          {!e.bank_name && !e.bank_account_number && (
                            <p className="text-red-400 flex items-center gap-1.5"><AlertCircle size={12} className="shrink-0" /> El terapeuta no ha ingresado datos bancarios</p>
                          )}
                        </div>
                      )}
                      {e.payment_method === 'paypal' && e.paypal_email && (
                        <div className="mt-2 bg-blue-50 rounded-xl p-2.5 text-xs text-blue-700">
                          PayPal: <strong>{e.paypal_email}</strong>
                        </div>
                      )}

                      {/* Estadísticas */}
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-warm-400">
                        <span className="flex items-center gap-1"><Calendar size={11} /> {e.sessions_count} sesiones</span>
                        <span className="flex items-center gap-1"><Wallet size={11} /> Total: {formatPrice(e.total_earned)}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Pagado: {formatPrice(e.total_paid)}</span>
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <Clock size={11} /> Pendiente: {formatPrice(e.pending_amount)}
                        </span>
                      </div>
                      {e.earliest_session && (
                        <p className="text-xs text-warm-300 mt-1">
                          Período: {fmtDate(e.earliest_session)} — {fmtDate(e.latest_session)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-warm-50">
                    <Button
                      fullWidth
                      onClick={() => openPayModal(e)}
                      disabled={
                        e.payment_method === 'bank_transfer' &&
                        !e.bank_account_number
                      }
                    >
                      <Send size={13} className="mr-1.5" strokeWidth={1.8} />Procesar pago · {formatPrice(e.pending_amount)}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: Historial ── */}
      {tab === 'history' && (
        <>
          {/* Botón CSV — solo visible cuando hay datos */}
          {!histLoading && history.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={exportPayoutsCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
              >
                <Download size={13} strokeWidth={1.8} />CSV
              </button>
            </div>
          )}
          {histLoading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-warm-400">
              <ClipboardList size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
              <p>No hay pagos registrados aún</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.filter(p => !search.trim() || (p.therapist?.full_name ?? '').toLowerCase().includes(search.toLowerCase())).map(p => {
                const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending
                return (
                  <div key={p.id} className="bg-white border border-warm-100 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={p.therapist?.full_name ?? ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-warm-900">
                            {p.therapist?.full_name}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.color}`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-warm-400">
                          <span className="font-bold text-warm-800 text-sm">
                            {formatPrice(p.amount)}
                          </span>
                          <span>{METHOD_LABEL[p.payment_method] ?? p.payment_method}</span>
                          <span>{fmtDate(p.created_at)}</span>
                          {p.reference && (
                            <span className="text-emerald-600">Ref: {p.reference}</span>
                          )}
                          {p.period_start && (
                            <span>
                              Período: {fmtDate(p.period_start)} — {fmtDate(p.period_end)}
                            </span>
                          )}
                        </div>
                        {p.error_message && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {p.error_message}</p>
                        )}
                        {p.note && (
                          <p className="text-xs text-warm-400 mt-0.5 italic">{p.note}</p>
                        )}
                      </div>
                    </div>

                    {/* Acción rápida para payouts en processing */}
                    {p.status === 'processing' && p.payment_method !== 'paypal' && (
                      <div className="mt-3 pt-3 border-t border-warm-50">
                        <Button size="sm" fullWidth onClick={() => quickConfirm(p)} loading={processing}>
                          <CheckCircle2 size={13} className="mr-1" strokeWidth={1.8} />Marcar como pagado
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modal: iniciar pago ── */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Procesar pago">
        {selected && (
          <div className="flex flex-col gap-4">
            {/* Info terapeuta */}
            <div className="flex items-center gap-3 bg-warm-50 rounded-xl p-3">
              <Avatar name={selected.therapist_name ?? ''} size="md" />
              <div>
                <p className="font-bold text-warm-900">{selected.therapist_name}</p>
                <p className="text-sm text-warm-500">{selected.specialty}</p>
              </div>
            </div>

            {/* Resumen financiero */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                ['Ganado', formatPrice(selected.total_earned), 'text-warm-800'],
                ['Pagado',  formatPrice(selected.total_paid),   'text-emerald-700'],
                ['Pendiente', formatPrice(selected.pending_amount), 'text-amber-700 font-bold'],
              ].map(([k, v, c]) => (
                <div key={k} className="bg-warm-50 rounded-xl p-2.5 text-center">
                  <p className="text-warm-400 mb-0.5">{k}</p>
                  <p className={c}>{v}</p>
                </div>
              ))}
            </div>

            {/* Datos bancarios destino */}
            {selected.payment_method === 'bank_transfer' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 space-y-1">
                <p className="font-semibold text-xs text-blue-500 uppercase tracking-wide mb-1">
                  <Landmark size={12} className="inline mr-1" />Destino de la transferencia
                </p>
                {selected.bank_name           && <p>Banco: <strong>{selected.bank_name}</strong></p>}
                {selected.bank_account_name   && <p>Titular: <strong>{selected.bank_account_name}</strong></p>}
                {selected.bank_account_number && <p>Cuenta: <strong>{selected.bank_account_number}</strong></p>}
                {selected.bank_routing        && <p>Routing/SWIFT: <strong>{selected.bank_routing}</strong></p>}
              </div>
            )}
            {selected.payment_method === 'paypal' && selected.paypal_email && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800">
                <p className="font-semibold text-xs text-blue-500 uppercase tracking-wide mb-1">
                  PayPal destino
                </p>
                <p className="font-bold">{selected.paypal_email}</p>
                <p className="text-xs text-blue-400 mt-0.5">
                  El pago se enviará automáticamente vía PayPal Payouts API
                </p>
              </div>
            )}

            {/* Formulario */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">
                  Monto a pagar (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-warm-600 mb-1">
                    Período desde
                  </label>
                  <input type="date" value={form.periodStart}
                    onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))}
                    className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-warm-600 mb-1">
                    Período hasta
                  </label>
                  <input type="date" value={form.periodEnd}
                    onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))}
                    className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-600 mb-1">
                  Nota interna (opcional)
                </label>
                <input type="text" placeholder="Ej: Liquidación quincenal de mayo"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" fullWidth onClick={() => setSelected(null)}>
                Cancelar
              </Button>
              <Button fullWidth loading={processing} onClick={initiatePayout}>
                {selected.payment_method === 'paypal'
                  ? 'Enviar vía PayPal'
                  : 'Registrar transferencia'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: confirmar transferencia bancaria ── */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="Confirmar transferencia"
      >
        {confirmModal && (
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-1"><Landmark size={22} className="text-emerald-600" strokeWidth={1.8} /></div>
              <p className="font-semibold text-warm-900 mt-2">
                Pago a {confirmModal.therapistName} registrado
              </p>
              <p className="text-sm text-warm-500 mt-1">
                Realiza la transferencia bancaria con los datos mostrados arriba,
                luego ingresa el número de referencia para confirmar.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-warm-600 mb-1">
                Número de referencia bancaria (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: TRF-20240601-001"
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                className="w-full border border-warm-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setConfirmModal(null)}>
                Confirmar después
              </Button>
              <Button fullWidth loading={processing}
                onClick={() => confirmPayout(confirmModal.payoutId)}>
                <CheckCircle2 size={13} className="mr-1" strokeWidth={1.8} />Confirmar pagado
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
