const CACHE_NAME = 'elemaster-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css?v=2',
  './js/storage.js?v=2',
  './js/quiz.js?v=2',
  './js/app.js?v=2',
  './data/elements.json',
  './data/mnemonics.json',
  './manifest.json?v=2',
  './images/icons/icon-192.png?v=2',
  './images/icons/icon-512.png?v=2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Cache addAll warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, toCache);
        });
        return response;
      }).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
