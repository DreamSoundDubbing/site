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
  '/site/feedback.html',
  '/site/inventory.html',
  '/site/lootboxes.html',
  '/site/style.css',
  '/site/offline.html',
  '/site/manifest.json',
  '/site/sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кеширование файлов...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/__/auth/') || 
      url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/site/offline.html');
          }
          return new Response('Офлайн', { status: 503 });
        });
      })
  );
});