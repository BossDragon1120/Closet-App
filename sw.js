// ── Closet PWA Service Worker ──────────────────────────────────
// Bump CACHE_VERSION any time you deploy new code — the old cache
// is automatically deleted and users get the fresh version.
const CACHE_VERSION = 'closet-v20260605';

self.addEventListener('install', e => {
  self.skipWaiting(); // activate immediately, don't wait for old SW to die
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(['./', './index.html']))
  );
});

self.addEventListener('activate', e => {
  // Delete every cache that isn't the current version
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // For navigation (loading the HTML page itself) — always try network first
  // so updates are picked up immediately; fall back to cache if offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // For everything else (fonts, CDN scripts, etc.) — cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
