/**
 * CurrencyContext — Provee el tipo de cambio USD→moneda local
 * a toda la app sin llamadas repetidas a la API.
 *
 * Uso en cualquier componente:
 *   import { useCurrencyContext } from '@/context/CurrencyContext'
 *   const { formatWithLocal, formatLocal, setCurrency, currency } = useCurrencyContext()
 */
import { createContext, useContext } from 'react'
import useCurrency from '@/hooks/useCurrency'

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const currency = useCurrency()   // una sola instancia para toda la app
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrencyContext() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrencyContext debe usarse dentro de <CurrencyProvider>')
  return ctx
}
