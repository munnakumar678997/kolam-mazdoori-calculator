// IMPORTANT: bump this version string on every future deploy so browsers
// detect the change and the in-app "Update Available" popup appears.
const CACHE_NAME = 'kolam-hisab-v3';
const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('message', (event) => {
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isPage = req.mode === 'navigate' || req.destination === 'document';

  if(isPage){
    // network-first for the app HTML so new versions (and the update popup) show up right away
    event.respondWith(
      fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', resClone));
        return res;
      }).catch(() => caches.match('./index.html').then((c) => c || caches.match(req)))
    );
    return;
  }

  // cache-first for static assets (icons, manifest)
  event.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).then((res) => {
        if(req.method === 'GET' && res && res.status === 200){
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
