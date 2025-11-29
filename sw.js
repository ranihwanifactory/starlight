const CACHE_NAME = 'starlight-store-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force activation
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim()); // Take control of all clients
});

self.addEventListener('fetch', (e) => {
  // Network First strategy
  // Try to fetch from network, if successful, put in cache.
  // If offline, try to serve from cache.
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Clone the response to store in cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Only cache valid responses
          if (e.request.method === 'GET' && response.status === 200) {
             cache.put(e.request, responseClone);
          }
        });
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(e.request);
      })
  );
});