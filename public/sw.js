/* Service worker « Mon Yorkshire » : cache runtime pour un usage hors ligne. */
const CACHE = 'mon-yorkshire-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.add(new Request('./', { cache: 'reload' })).catch(() => undefined)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const url = new URL(request.url);
          const base = url.pathname.replace(/\/$/, '');
          for (const candidate of [`${base}/`, `${base}/index.html`, `${base}.html`, './']) {
            const hit = await caches.match(candidate);
            if (hit) return hit;
          }
        }
        return new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }),
  );
});
