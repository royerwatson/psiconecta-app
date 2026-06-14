/**
 * RedeemGiftPage — Canjear un código de gift card.
 * Ruta: /canjear (requiere sesión como paciente)
 *
 * Flujo:
 *   1. Leer ?code= de la URL o dejar que el usuario lo escriba
 *   2. Llamar Edge Function redeem-gift-card
 *   3. Mostrar nuevo balance y link a buscar terapeuta
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Gift, Check, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function RedeemGiftPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [code, setCode]       = useState(searchParams.get('code') ?? '')
  const [status, setStatus]   = useState('idle')   // 'idle' | 'loading' | 'success' | 'error'
  const [result, setResult]   = useState(null)
  const [errMsg, setErrMsg]   = useState('')
  const [balance, setBalance] = useState(null)

  // Cargar balance actual
  useEffect(() => {
    async function loadBalance() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login?redirect=/canjear' + (code ? `?code=${code}` : '')); return }
      const { data } = await supabase.rpc('get_patient_credit_balance', { p_user_id: user.id })
      setBalance(data ?? 0)
    }
    loadBalance()
  }, [])

  const handleRedeem = async (e) => {
    e?.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { toast.error('Ingresa el código de regalo'); return }

    setStatus('loading')
    setErrMsg('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/redeem-gift-card`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrMsg(data.error ?? 'Error canjeando el código')
        return
      }

      setResult(data)
      setBalance(data.newBalance)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrMsg('Error de conexión. Intenta de nuevo.')
    }
  }

  // Auto-submit si viene ?code= en la URL
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode && status === 'idle' && balance !== null) {
      handleRedeem()
    }
  }, [balance])

  return (
    <div className="min-h-dvh bg-psiconecta flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* ── IDLE / FORMULARIO ────────────────────────────── */}
        {(status === 'idle' || status === 'loading' || status === 'error') && (
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Gift size={28} className="text-primary-600" strokeWidth={1.6} />
              </div>
              <h1 className="font-serif text-2xl font-bold text-warm-900">Canjear regalo</h1>
              <p className="text-warm-500 text-sm mt-1">
                Ingresa el código que recibiste por email para agregar crédito a tu cuenta.
              </p>
            </div>

            {balance !== null && balance > 0 && (
              <div className="bg-primary-50 rounded-xl px-4 py-3 mb-4 flex items-center justify-between text-sm">
                <span className="text-primary-700">Tu balance actual</span>
                <span className="font-bold text-primary-800">${Number(balance).toFixed(2)} USD</span>
              </div>
            )}

            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1">Código de regalo</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="PSICO-XXXX-XXXX"
                  maxLength={14}
                  className="w-full border border-warm-200 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary-300 text-warm-900 placeholder:text-warm-300 placeholder:text-base placeholder:tracking-normal placeholder:font-sans"
                />
              </div>

              {status === 'error' && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errMsg}</span>
                </div>
              )}

              <Button fullWidth type="submit" disabled={status === 'loading'} size="lg">
                {status === 'loading'
                  ? <><Loader2 size={16} className="animate-spin mr-2" /> Canjeando...</>
                  : 'Canjear código'
                }
              </Button>
            </form>

            <button
              onClick={() => navigate(-1)}
              className="w-full mt-3 text-sm text-warm-400 hover:text-warm-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ── ÉXITO ────────────────────────────────────────── */}
        {status === 'success' && (
          <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={36} className="text-green-500" strokeWidth={2} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-warm-900 mb-1">¡Código canjeado!</h2>
            <p className="text-warm-500 text-sm mb-6">
              El crédito ya fue agregado a tu cuenta y se descontará automáticamente en tu próxima sesión.
            </p>

            <div className="bg-gradient-to-br from-primary-600 to-purple-700 rounded-2xl p-5 text-white mb-6">
              <p className="text-xs text-primary-200 font-semibold uppercase tracking-widest mb-1">Crédito añadido</p>
              <p className="text-4xl font-black">${Number(result?.amountUsd ?? 0).toFixed(2)}</p>
              <p className="text-sm text-primary-200 mt-1">USD</p>
            </div>

            <div className="bg-warm-50 rounded-xl px-4 py-3 mb-6 flex items-center justify-between text-sm">
              <span className="text-warm-600">Nuevo balance total</span>
              <span className="font-bold text-warm-900">${Number(balance ?? 0).toFixed(2)} USD</span>
            </div>

            <div className="flex flex-col gap-3">
              <Button fullWidth onClick={() => navigate('/terapeutas')}>
                Buscar terapeuta
              </Button>
              <button
                onClick={() => navigate('/perfil')}
                className="text-sm text-warm-400 hover:text-warm-700 transition-colors"
              >
                Ver mi perfil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
