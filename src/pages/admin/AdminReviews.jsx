import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { Star, Trophy, Trash2 } from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

const Stars = ({ value, size = 'sm' }) => {
  const sz = size === 'lg' ? 20 : 13
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={sz} strokeWidth={1.5}
          className={i <= value ? 'text-amber-400 fill-amber-400' : 'text-warm-200'} />
      ))}
    </span>
  )
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })

// ─── Componente ──────────────────────────────────────────────────────────────

export default function AdminReviews() {
  const [reviews, setReviews]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [ratingFilter, setRatingFilter] = useState('all')   // all | 1 | 2 | 3 | 4 | 5
  const [search, setSearch]           = useState('')
  const [selected, setSelected]       = useState(null)
  const [deleting, setDeleting]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)  // review id to delete

  useEffect(() => { fetchReviews() }, [])

  const fetchReviews = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        therapist:profiles!reviews_therapist_id_fkey(id, full_name, avatar_url),
        patient:profiles!reviews_patient_id_fkey(id, full_name, avatar_url),
        session:sessions(id, scheduled_at)
      `)
      .order('created_at', { ascending: false })

    if (error) console.error('fetchReviews:', error)
    setReviews(data ?? [])
    setLoading(false)
  }

  const deleteReview = async (id) => {
    setDeleting(true)
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar reseña'); setDeleting(false); return }
    toast.success('Reseña eliminada')
    setReviews(prev => prev.filter(r => r.id !== id))
    setSelected(null)
    setConfirmDelete(null)
    setDeleting(false)
  }

  // Filtrado
  const filtered = reviews.filter(r => {
    const matchRating = ratingFilter === 'all' || r.rating === Number(ratingFilter)
    const matchSearch = !search || [
      r.therapist?.full_name,
      r.patient?.full_name,
      r.comment,
    ].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    return matchRating && matchSearch
  })

  // KPIs
  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  const distribution = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct:   reviews.length
      ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100)
      : 0,
  }))

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Gestión de Reseñas</h1>
        <p className="text-warm-500 text-sm mt-1">
          Todas las evaluaciones post-sesión de la plataforma
        </p>
      </div>

      {/* KPI + distribución */}
      {!loading && reviews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Rating global */}
          <div className="bg-white border border-warm-100 rounded-2xl p-5 flex items-center gap-5">
            <div className="text-center">
              <p className="text-5xl font-bold text-amber-500">{avgRating}</p>
              <Stars value={Math.round(Number(avgRating))} size="lg" />
              <p className="text-xs text-warm-400 mt-1">{reviews.length} reseñas en total</p>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {distribution.map(({ star, count, pct }) => (
                <button
                  key={star}
                  onClick={() => setRatingFilter(v => v === String(star) ? 'all' : String(star))}
                  className={`flex items-center gap-2 group rounded-lg px-1 py-0.5 transition-colors ${
                    ratingFilter === String(star) ? 'bg-amber-50' : 'hover:bg-warm-50'
                  }`}
                >
                  <span className="text-xs text-warm-500 w-6 shrink-0 flex items-center gap-0.5">{star}<Star size={10} strokeWidth={0} className="fill-amber-400 text-amber-400" /></span>
                  <div className="flex-1 bg-warm-100 rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-warm-400 w-8 text-right shrink-0">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 terapeutas mejor calificados */}
          <div className="bg-white border border-warm-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-warm-800 mb-3 flex items-center gap-1.5"><Trophy size={14} strokeWidth={1.8} className="text-amber-500" /> Mejor calificados</p>
            {(() => {
              const byT = {}
              reviews.forEach(r => {
                const name = r.therapist?.full_name ?? 'N/A'
                const id   = r.therapist?.id ?? name
                if (!byT[id]) byT[id] = { name, ratings: [], avatar: r.therapist?.avatar_url }
                byT[id].ratings.push(r.rating)
              })
              return Object.values(byT)
                .map(t => ({ ...t, avg: t.ratings.reduce((a, v) => a + v, 0) / t.ratings.length }))
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 3)
                .map((t, i) => (
                  <div key={t.name} className="flex items-center gap-3 py-1.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-warm-100 text-warm-600' : 'bg-orange-100 text-orange-700'}`}>{i + 1}</span>
                    <Avatar name={t.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-800 truncate">{t.name}</p>
                      <p className="text-xs text-warm-400">{t.ratings.length} reseñas</p>
                    </div>
                    <span className="text-sm font-bold text-amber-500 flex items-center gap-0.5">
                      {t.avg.toFixed(1)}<Star size={12} className="fill-amber-400 text-amber-400" strokeWidth={1.5} />
                    </span>
                  </div>
                ))
            })()}
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por terapeuta, paciente o comentario..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 bg-white"
        />
        {/* Botones de filtro por estrellas */}
        <div className="flex items-center gap-1 bg-white border border-warm-200 rounded-xl px-1">
          <button onClick={() => setRatingFilter('all')}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              ratingFilter === 'all' ? 'bg-primary-600 text-white' : 'text-warm-500 hover:text-warm-700'
            }`}>Todos</button>
          {[5,4,3,2,1].map(s => (
            <button key={s} onClick={() => setRatingFilter(v => v === String(s) ? 'all' : String(s))}
              className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                ratingFilter === String(s)
                  ? 'bg-amber-400 text-white'
                  : 'text-warm-400 hover:text-amber-500'
              }`}>
              {s}<Star size={11} className="inline ml-0.5 fill-current" strokeWidth={0} />
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-warm-400">
          <Star size={40} strokeWidth={1.5} className="mx-auto mb-3 text-warm-300" />
          <p>No hay reseñas que coincidan con el filtro</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => (
            <div key={r.id}
              className="bg-white border border-warm-100 rounded-2xl p-4 hover:border-warm-200 transition-colors">
              <div className="flex items-start gap-3">
                <Avatar name={r.patient?.full_name ?? ''} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-warm-900">
                        {r.patient?.full_name ?? 'Paciente'}
                      </p>
                      <p className="text-xs text-warm-400">
                        Para: <span className="text-warm-600 font-medium">{r.therapist?.full_name ?? 'Terapeuta'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Stars value={r.rating} />
                      <span className="text-xs text-warm-400">{fmtDate(r.created_at)}</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-warm-700 mt-2 line-clamp-2 italic">
                      "{r.comment}"
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-warm-50">
                <Button size="sm" variant="secondary" onClick={() => setSelected(r)} fullWidth>
                  Ver detalle
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => setConfirmDelete(r.id)} fullWidth>
                  <Trash2 size={13} className="mr-1" strokeWidth={1.8} />Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detalle */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle de reseña">
        {selected && (
          <div className="flex flex-col gap-4">
            {/* Rating grande */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
              <Stars value={selected.rating} size="lg" />
              <p className="text-3xl font-bold text-amber-600 mt-1">{selected.rating} / 5</p>
            </div>

            {/* Info paciente y terapeuta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-warm-50 rounded-xl p-3">
                <p className="text-xs text-warm-400 mb-1">Paciente</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.patient?.full_name ?? ''} size="xs" />
                  <p className="text-sm font-medium text-warm-800 truncate">
                    {selected.patient?.full_name ?? '—'}
                  </p>
                </div>
              </div>
              <div className="bg-warm-50 rounded-xl p-3">
                <p className="text-xs text-warm-400 mb-1">Terapeuta</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.therapist?.full_name ?? ''} size="xs" />
                  <p className="text-sm font-medium text-warm-800 truncate">
                    {selected.therapist?.full_name ?? '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Fecha sesión */}
            {selected.session?.scheduled_at && (
              <div className="bg-warm-50 rounded-xl p-3">
                <p className="text-xs text-warm-400">Sesión</p>
                <p className="text-sm font-medium text-warm-800 mt-0.5">
                  {fmtDate(selected.session.scheduled_at)}
                </p>
              </div>
            )}

            {/* Comentario */}
            {selected.comment ? (
              <div className="bg-warm-50 rounded-xl p-3">
                <p className="text-xs text-warm-400 mb-1">Comentario</p>
                <p className="text-sm text-warm-700 italic">"{selected.comment}"</p>
              </div>
            ) : (
              <div className="bg-warm-50 rounded-xl p-3 text-center text-sm text-warm-400">
                Sin comentario escrito
              </div>
            )}

            <p className="text-xs text-warm-400 text-center">
              Publicada el {fmtDate(selected.created_at)}
            </p>

            <Button variant="outline" fullWidth
              onClick={() => { setConfirmDelete(selected.id); setSelected(null) }}>
              <Trash2 size={13} strokeWidth={1.8} className="mr-1.5" />Eliminar esta reseña
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal confirmación eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-float border border-warm-100"
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3"><Trash2 size={24} className="text-red-400" strokeWidth={1.8} /></div>
              <p className="font-serif font-semibold text-warm-900">¿Eliminar reseña?</p>
              <p className="text-sm text-warm-500 mt-1">
                Esta acción es permanente y no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-warm-200 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => deleteReview(confirmDelete)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
