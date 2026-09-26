const CACHE_NAME = 'catatan-belanja-v2'
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_PRECACHE)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Jangan pernah cache permintaan Supabase / API backend
  if (url.hostname.includes('supabase.co') || event.request.method !== 'GET') {
    return
  }

  // Untuk navigasi dokumen HTML (App Shell), gunakan Network-First dengan fallback Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const cloned = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned))
          return networkResponse
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Untuk aset statis (CSS, JS, Fonts, Images), gunakan Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cloned = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned))
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})
