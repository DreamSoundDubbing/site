const CACHE_NAME = 'dream-sound-dubbing-v1';
const ASSETS_TO_CACHE = [
  '/site/',
  '/site/index.html',
  '/site/titles.html',
  '/site/title.html',
  '/site/profile.html',
  '/site/login.html',
  '/site/search.html',
  '/site/sostav.html',
  '/site/dub-in.html',
  '/site/voice-order.html',
  '/site/admin-orders.html',
  '/site/privacy.html',
  '/site/style.css',
  '/site/logo1.jpg',
  '/site/data.js',
  '/site/offline.html'
];
// ... остальной код sw.js ...

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request).then(res => res || caches.match('/offline.html')))
    );
});