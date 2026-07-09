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
  '/site/offline.html',
  '/site/sw.js',
  '/site/manifest.json'
];

// Установка сервис-воркера и кеширование файлов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кеширование файлов...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Активация и очистка старого кеша
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

// Обработка запросов: сначала из кеша, затем из сети
self.addEventListener('fetch', (event) => {
  // Игнорируем запросы к Firebase и сторонним API
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
          // Если сеть упала — показываем офлайн-страницу
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/site/offline.html');
          }
          return new Response('Офлайн', { status: 503 });
        });
      })
  );
});