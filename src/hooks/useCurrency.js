/**
 * useCurrency — Hook de conversión de moneda USD → DOP.
 *
 * Obtiene el tipo de cambio de open.er-api.com (gratis, sin API key).
 * Cachea el resultado en localStorage durante 6 horas para evitar
 * llamadas innecesarias a la API externa.
 *
 * Uso:
 *   const { formatWithLocal, rate, loading } = useCurrency()
 *   formatWithLocal(60)  →  "$60.00 USD  ≈  RD$3,540"
 */
import { useState, useEffect, useCallback } from 'react'

const CACHE_KEY     = 'psiconecta_exchange_rate'
const CACHE_TTL_MS  = 6 * 60 * 60 * 1000   // 6 horas
const API_URL       = 'https://open.er-api.com/v6/latest/USD'
const FALLBACK_RATE = 58.5                   // tasa aproximada de respaldo

// Monedas soportadas con su símbolo y locale
const CURRENCY_CONFIG = {
  DOP: { symbol: 'RD$', locale: 'es-DO', decimals: 0 },
  EUR: { symbol: '€',   locale: 'es-ES', decimals: 2 },
  MXN: { symbol: '$',   locale: 'es-MX', decimals: 0 },
  COP: { symbol: '$',   locale: 'es-CO', decimals: 0 },
}

// Detectar moneda preferida del navegador
function detectUserCurrency() {
  try {
    const locale = navigator.language ?? 'en-US'
    const region = locale.split('-')[1]?.toUpperCase()
    const map = { DO: 'DOP', ES: 'EUR', MX: 'MXN', CO: 'COP' }
    return map[region] ?? 'DOP'   // default DOP para Psiconecta
  } catch {
    return 'DOP'
  }
}

// Leer caché
function getCachedRate(currency) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${currency}`)
    if (!raw) return null
    const { rate, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL_MS) return null
    return rate
  } catch {
    return null
  }
}

// Escribir caché
function setCachedRate(currency, rate) {
  try {
    localStorage.setItem(
      `${CACHE_KEY}_${currency}`,
      JSON.stringify({ rate, timestamp: Date.now() })
    )
  } catch { /* localStorage puede estar bloqueado */ }
}

// ── Hook principal ─────────────────────────────────────────────────────────────

export default function useCurrency(preferredCurrency) {
  const [currency, setCurrency] = useState(preferredCurrency ?? detectUserCurrency())
  const [rate, setRate]         = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchRate = async () => {
      setLoading(true)

      // 1. Intentar desde caché
      const cached = getCachedRate(currency)
      if (cached) {
        if (!cancelled) { setRate(cached); setLoading(false) }
        return
      }

      // 2. Llamar a la API
      try {
        const res  = await fetch(API_URL)
        const data = await res.json()
        const r    = data?.rates?.[currency]
        if (r && !cancelled) {
          setRate(r)
          setCachedRate(currency, r)
        } else if (!cancelled) {
          setRate(FALLBACK_RATE)
        }
      } catch {
        if (!cancelled) setRate(FALLBACK_RATE)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRate()
    return () => { cancelled = true }
  }, [currency])

  /**
   * formatWithLocal(amountUSD)
   * Devuelve string con USD principal + equivalente local como referencia.
   * Ejemplo: "$60.00 USD  ≈  RD$3,540"
   */
  const formatWithLocal = useCallback((amountUSD) => {
    const usd = parseFloat(amountUSD ?? 0)
    const usdStr = `$${usd.toFixed(2)} USD`

    if (!rate || currency === 'USD') return usdStr

    const cfg      = CURRENCY_CONFIG[currency]
    const local    = usd * rate
    const localStr = cfg
      ? `${cfg.symbol}${local.toLocaleString(cfg.locale, { maximumFractionDigits: cfg.decimals })}`
      : `${currency} ${local.toFixed(2)}`

    return `${usdStr}  ≈  ${localStr}`
  }, [rate, currency])

  /**
   * formatLocal(amountUSD) — solo el equivalente local (sin USD)
   * Útil para mostrar el desglose en líneas separadas.
   */
  const formatLocal = useCallback((amountUSD) => {
    if (!rate || currency === 'USD') return null
    const usd   = parseFloat(amountUSD ?? 0)
    const cfg   = CURRENCY_CONFIG[currency]
    const local = usd * rate
    return cfg
      ? `${cfg.symbol}${local.toLocaleString(cfg.locale, { maximumFractionDigits: cfg.decimals })} ${currency}`
      : `${currency} ${local.toFixed(2)}`
  }, [rate, currency])

  return {
    currency,
    setCurrency,   // permite al usuario cambiar su moneda preferida
    rate,
    loading,
    formatWithLocal,
    formatLocal,
    supportedCurrencies: Object.keys(CURRENCY_CONFIG),
  }
}
