const CACHE_NAME = 'dream-sound-dubbing-v2';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/titles.html',
  '/title.html',
  '/profile.html',
  '/login.html',
  '/search.html',
  '/sostav.html',
  '/dub-in.html',
  '/voice-order.html',
  '/admin-orders.html',
  '/privacy.html',
  '/feedback.html',
  '/inventory.html',
  '/lootboxes.html',
  '/voice.html',
  '/offline.html',
  '/style.css',
  '/firebase-config.js',
  '/data.js',
  '/manifest.json',
  '/sw.js',
  '/logo1.jpg'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кеширование файлов...');
        // === ИЗМЕНЕНИЕ: Используем Promise.allSettled, чтобы не падать при одной ошибке ===
        const promises = ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`[SW] Не удалось закешировать ${url}:`, err);
            // Возвращаем resolved, чтобы не прерывать общий процесс
            return Promise.resolve();
          });
        });
        return Promise.allSettled(promises);
      })
      .then(() => {
        console.log('[SW] Кеширование завершено (с пропущенными ошибками)');
        self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Игнорируем запросы к Firebase и Google API
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
          // Если запрос на навигацию (страницу) и сеть недоступна, показываем offline.html
          if (event.request.mode === 'navigate') {
            return caches.match('//offline.html');
          }
          return new Response('Офлайн', { status: 503 });
        });
      })
  );
});