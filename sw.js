const CACHE_NAME = 'shobdo-daily-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles/base.css',
  '/src/app/main.js',
  '/src/app/router.js',
  '/src/core/state.js',
  '/src/core/dates.js',
  '/src/data/idb.js',
  '/src/data/firebase.js',
  '/src/app/views/home.js',
  '/src/app/views/bookmark.js',
  '/src/app/views/settings.js',
  '/src/app/views/premium.js',
  '/assets/waive.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Try network first, then cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
