/**
 * analytics.js — Wrapper de Google Analytics 4 para Psiconecta.
 *
 * Uso:
 *   trackEvent('click_cta', { location: 'hero' })
 *   trackEvent('view_therapist', { therapist_id: id })
 *
 * Pageviews se disparan automáticamente via usePageTracking() en App.jsx.
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

/* Verifica que GA esté disponible */
const isAvailable = () => typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_ID

/* Pageview — se llama en cada cambio de ruta */
export function trackPageview(path) {
  if (!isAvailable()) return
  window.gtag('config', GA_ID, { page_path: path })
}

/* Evento personalizado */
export function trackEvent(eventName, params = {}) {
  if (!isAvailable()) return
  window.gtag('event', eventName, params)
}

/* ─── Eventos específicos de Psiconecta ──────────── */

export const analytics = {
  /* Landing */
  clickHeroCTA:       (variant) => trackEvent('click_cta',           { location: 'hero', variant }),
  clickMatchQuiz:     ()        => trackEvent('click_match_quiz',     { location: 'landing' }),
  clickTherapistDir:  ()        => trackEvent('click_therapist_dir',  {}),

  /* Blog */
  viewBlogPost:       (slug)    => trackEvent('view_blog_post',       { slug }),
  clickBlogCTA:       (slug)    => trackEvent('click_blog_cta',       { slug }),

  /* Registro */
  startRegister:      (role)    => trackEvent('start_register',       { role }),

  /* Terapeutas */
  viewTherapist:      (id)      => trackEvent('view_therapist',       { therapist_id: id }),
  bookTherapist:      (id)      => trackEvent('book_therapist',       { therapist_id: id }),

  /* FAQ */
  openFAQ:            (question) => trackEvent('open_faq',            { question }),
}
