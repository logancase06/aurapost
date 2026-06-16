// Service Worker AuraPost — cache app shell, offline (dernier dashboard en cache),
// notifications push « Vos posts du mois sont prêts ».
const CACHE = 'aurapost-v3';
const OFFLINE_URLS = ['/', '/offline', '/icons/icon-192.png'];

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
  // Cache-first pour les assets statiques. Tout échec réseau est rattrapé (pas de
  // rejet non géré : sinon « Uncaught TypeError: Failed to fetch » quand le serveur
  // est injoignable — offline, dev arrêté, etc.).
  if (request.method === 'GET' && /\.(css|js|woff2?|png|jpg|svg|ico)$/.test(new URL(request.url).pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => caches.match(request).then((r) => r || new Response('', { status: 504, statusText: 'offline' })));
      })
    );
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
  const title = data.title || 'AuraPost ✦';
  const body = data.body || 'Vos posts du mois sont prêts à être relus.';
  const url = data.url || '/dashboard';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
      actions: [{ action: 'open', title: 'Voir mes posts' }],
    })
  );
});

// Clic sur la notification → ouvre/focus le dashboard.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
