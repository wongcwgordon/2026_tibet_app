const CACHE = 'tibet-v2';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== CACHE).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE).then(cache => {
      return cache.match(e.request).then(response => {
        // Return cached if available, otherwise fetch with timeout
        if (response) return response;
        return Promise.race([
          fetch(e.request),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]).then(response => {
          cache.put(e.request, response.clone());
          return response;
        }).catch(() => {
          // Fallback to cached or index.html
          return cache.match(e.request) || cache.match('./index.html');
        });
      });
    })
  );
});
