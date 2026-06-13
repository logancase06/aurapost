// Service Worker minimal AuraPost — cache de l'app shell + fallback offline basique.
const CACHE = 'aurapost-v1';
const OFFLINE_URLS = ['/', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Network-first pour la navigation ; fallback cache puis page offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/offline')))
    );
    return;
  }
  // Cache-first pour les assets statiques.
  if (request.method === 'GET' && /\.(css|js|woff2?|png|jpg|svg|ico)$/.test(new URL(request.url).pathname)) {
    event.respondWith(caches.match(request).then((r) => r || fetch(request)));
  }
});

// Réception de push (si VAPID configuré côté serveur ultérieurement).
self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data ? event.data.json() : {};
    } catch {
      return {};
    }
  })();
  const title = data.title || 'AuraPost';
  const body = data.body || 'Vous avez une nouvelle notification.';
  event.waitUntil(self.registration.showNotification(title, { body, icon: '/icon.png' }));
});
