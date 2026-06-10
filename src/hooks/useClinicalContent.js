/**
 * useClinicalContent — Carga DSM-5-TR / CIE-11 desde la Edge Function
 * `clinical-content` (protegida server-side con is_pro_therapist).
 *
 * Cachea en memoria por sesión: la primera visita descarga (~100 KB),
 * las siguientes son instantáneas.
 *
 *   const { data, loading, error } = useClinicalContent('dsm5tr')
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const cache = {}
const inflight = {}

async function fetchDataset(dataset) {
  if (cache[dataset]) return cache[dataset]
  if (!inflight[dataset]) {
    inflight[dataset] = supabase.functions
      .invoke('clinical-content', { body: { dataset } })
      .then(({ data, error }) => {
        delete inflight[dataset]
        if (error) throw error
        if (data?.error) throw new Error(data.error)
        cache[dataset] = data.data
        return cache[dataset]
      })
      .catch((err) => {
        delete inflight[dataset]
        throw err
      })
  }
  return inflight[dataset]
}

export function useClinicalContent(dataset) {
  const [data, setData]       = useState(cache[dataset] ?? null)
  const [loading, setLoading] = useState(!cache[dataset])
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (cache[dataset]) {
      setData(cache[dataset])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError(null)
    fetchDataset(dataset)
      .then((d) => { if (active) { setData(d); setLoading(false) } })
      .catch((e) => { if (active) { setError(e); setLoading(false) } })
    return () => { active = false }
  }, [dataset])

  return { data, loading, error }
}
