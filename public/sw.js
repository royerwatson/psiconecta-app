/**
 * Service Worker de Psiconecta — soporte offline básico.
 *
 * Estrategias:
 *  - Navegaciones (HTML): network-first con fallback al index cacheado
 *    → la app abre sin conexión (shell)
 *  - /assets/* (JS/CSS con hash inmutable) y fuentes: cache-first
 *  - API (supabase.co): NUNCA se cachea aquí — los datos offline los
 *    gestiona la app en localStorage (agenda del día)
 */
const CACHE = 'psiconecta-v1'
const CORE = ['/', '/icons/icon-192.png', '/icons/icon-512.png', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET') return
  // No interceptar API ni websockets
  if (url.hostname.endsWith('supabase.co')) return
  if (url.origin !== self.location.origin) return

  // Navegaciones: red primero, fallback al shell cacheado
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  // Assets inmutables y fuentes: cache-first
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit || fetch(e.request).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
          return res
        })
      )
    )
  }
})
