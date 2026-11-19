const CACHE_NAME = 'elemaster-v11';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css?v=11',
  './js/storage.js?v=11',
  './js/quiz.js?v=11',
  './js/app.js?v=11',
  './manifest.json?v=11',
  './images/icons/icon-192.png?v=11',
  './images/icons/icon-512.png?v=11',
  './images/elements/actinium.png?v=11',
  './images/elements/aluminium.png?v=11',
  './images/elements/americium.png?v=11',
  './images/elements/antimony.png?v=11',
  './images/elements/argon.png?v=11',
  './images/elements/arsenic.png?v=11',
  './images/elements/astatine.png?v=11',
  './images/elements/barium.png?v=11',
  './images/elements/berkelium.png?v=11',
  './images/elements/beryllium.png?v=11',
  './images/elements/bismuth.png?v=11',
  './images/elements/boron.png?v=11',
  './images/elements/bromine.png?v=11',
  './images/elements/cadmium.png?v=11',
  './images/elements/calcium.png?v=11',
  './images/elements/californium.png?v=11',
  './images/elements/carbon.png?v=11',
  './images/elements/cerium.png?v=11',
  './images/elements/cesium.png?v=11',
  './images/elements/chlorine.png?v=11',
  './images/elements/chromium.png?v=11',
  './images/elements/cobalt.png?v=11',
  './images/elements/copper.png?v=11',
  './images/elements/curium.png?v=11',
  './images/elements/dysprosium.png?v=11',
  './images/elements/einsteinium.png?v=11',
  './images/elements/erbium.png?v=11',
  './images/elements/europium.png?v=11',
  './images/elements/fluorine.png?v=11',
  './images/elements/francium.png?v=11',
  './images/elements/gadolinium.png?v=11',
  './images/elements/gallium.png?v=11',
  './images/elements/germanium.png?v=11',
  './images/elements/gold.png?v=11',
  './images/elements/helium.png?v=11',
  './images/elements/holmium.png?v=11',
  './images/elements/hydrogen.png?v=11',
  './images/elements/indium.png?v=11',
  './images/elements/iodine.png?v=11',
  './images/elements/iridium.png?v=11',
  './images/elements/iron.png?v=11',
  './images/elements/krypton.png?v=11',
  './images/elements/lanthanum.png?v=11',
  './images/elements/lead.png?v=11',
  './images/elements/lithium.png?v=11',
  './images/elements/lutetium.png?v=11',
  './images/elements/magnesium.png?v=11',
  './images/elements/manganese.png?v=11',
  './images/elements/mercury.png?v=11',
  './images/elements/molybdenum.png?v=11',
  './images/elements/neodymium.png?v=11',
  './images/elements/neon.png?v=11',
  './images/elements/neptunium.png?v=11',
  './images/elements/nickel.png?v=11',
  './images/elements/niobium.png?v=11',
  './images/elements/nitrogen.png?v=11',
  './images/elements/osmium.png?v=11',
  './images/elements/oxygen.png?v=11',
  './images/elements/palladium.png?v=11',
  './images/elements/phosphorus.png?v=11',
  './images/elements/platinum.png?v=11',
  './images/elements/plutonium.png?v=11',
  './images/elements/potassium.png?v=11',
  './images/elements/praseodymium.png?v=11',
  './images/elements/promethium.png?v=11',
  './images/elements/protactinium.png?v=11',
  './images/elements/radium.png?v=11',
  './images/elements/rhenium.png?v=11',
  './images/elements/rhodium.png?v=11',
  './images/elements/rubidium.png?v=11',
  './images/elements/ruthenium.png?v=11',
  './images/elements/samarium.png?v=11',
  './images/elements/scandium.png?v=11',
  './images/elements/selenium.png?v=11',
  './images/elements/silicon.png?v=11',
  './images/elements/silver.png?v=11',
  './images/elements/sodium.png?v=11',
  './images/elements/strontium.png?v=11',
  './images/elements/sulfur.png?v=11',
  './images/elements/tantalum.png?v=11',
  './images/elements/technetium.png?v=11',
  './images/elements/tellurium.png?v=11',
  './images/elements/terbium.png?v=11',
  './images/elements/thallium.png?v=11',
  './images/elements/thorium.png?v=11',
  './images/elements/thulium.png?v=11',
  './images/elements/tin.png?v=11',
  './images/elements/titanium.png?v=11',
  './images/elements/tungsten.png?v=11',
  './images/elements/uranium.png?v=11',
  './images/elements/vanadium.png?v=11',
  './images/elements/xenon.png?v=11',
  './images/elements/ytterbium.png?v=11',
  './images/elements/yttrium.png?v=11',
  './images/elements/zinc.png?v=11',
  './images/elements/zirconium.png?v=11',
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('Cache addAll warning:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // For data and images: Network-first, fallback to cache
  if (url.pathname.includes('/data/') || url.pathname.includes('/images/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // For all other resources
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});