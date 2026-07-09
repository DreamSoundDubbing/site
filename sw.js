const CACHE_NAME = 'dream-sound-dubbing-v2'; // Версия обновлена

// === ИЗМЕНЕНИЕ: Убраны несуществующие файлы. Оставлены только гарантированно существующие. ===
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
  '/site/voice.html',
  '/site/offline.html', // Добавлена страница офлайн
  '/site/style.css',
  '/site/firebase-config.js',
  '/site/data.js',
  '/site/manifest.json',
  '/site/sw.js',
  // Файлы изображений, если они точно есть в корне /site/
  '/site/logo1.jpg'
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
            return caches.match('/site/offline.html');
          }
          return new Response('Офлайн', { status: 503 });
        });
      })
  );
});