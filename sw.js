// Nombre de la caché (Cambia v1 a v2, v3... cuando quieras forzar una limpieza manual)
const CACHE_NAME = 'coompau-portal-v1';

// Archivos esenciales a cachear para funcionamiento offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/lucide@latest'
];

// 1. Instalación: Guarda los archivos base en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // Toma el control inmediatamente
  );
});

// 2. Activación: Elimina cachés antiguas si cambias la versión (CACHE_NAME)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Estrategia Network-First (Prioridad Red -> Fallback a Caché)
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones no GET o de extensiones
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si el servidor responde correctamente, guardamos una copia fresca en la caché
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si falla la red (offline), servimos desde la caché local
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si el usuario intenta ir a una página .html no cacheada sin red
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});