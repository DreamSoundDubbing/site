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
  '/site/offline.html' // <--- ДОБАВИЛИ ЭТУ СТРОКУ
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

// ===== ГЛАВНОЕ: ПЕРЕХВАТ ОШИБОК СЕТИ =====
self.addEventListener('fetch', (event) => {
  // Игнорируем запросы не к нашему сайту (например, к Firebase)
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/site/') && !url.pathname.startsWith('/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Пытаемся загрузить из сети
        return fetch(event.request).then((response) => {
          // Кешируем новые файлы только если они успешно загружены
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // ===== ЕСЛИ СЕТЬ УПАЛА — ПОКАЗЫВАЕМ ЗАГЛУШКУ =====
          // Для HTML-страниц показываем offline.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/site/offline.html');
          }
          // Для остальных запросов (картинки, стили) просто возвращаем ошибку
          return new Response('Офлайн', { status: 503 });
        });
      })
  );
});