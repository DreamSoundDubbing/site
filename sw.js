const CACHE_NAME = 'dsd-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/offline.html',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

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