/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules.

// We need to precache files we care about in order to work offline
const CACHE_NAME = 'property-cache-v1';
const RUNTIME = 'runtime';

// Precache assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/favicon.svg',
          '/manifest.json',
          '/js/serviceWorkerRegistration.js',
          // Add other assets to cache as needed
        ]);
      })
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch handler - cache first for assets, network first for API
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip firebase API requests
  if (event.request.url.includes('googleapis.com') || 
      event.request.url.includes('firebasestorage.googleapis.com') ||
      event.request.url.includes('firebaseio.com')) {
    return;
  }

  // Cache first for assets
  if (
    event.request.url.includes('/static/') ||
    event.request.url.includes('/assets/') ||
    event.request.url.endsWith('.js') ||
    event.request.url.endsWith('.css') ||
    event.request.url.endsWith('.svg') ||
    event.request.url.endsWith('.png') ||
    event.request.url.endsWith('.jpg') ||
    event.request.url.endsWith('.jpeg') ||
    event.request.url.endsWith('.gif') ||
    event.request.url.endsWith('.webp') ||
    event.request.url.endsWith('.woff2') ||
    event.request.url.endsWith('.woff') ||
    event.request.url.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME).then((cache) => {
          return fetch(event.request).then((response) => {
            // Put a copy of the response in the runtime cache.
            return cache.put(event.request, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  } else {
    // Network first for HTML and API
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we got a valid response, clone and cache it
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, try to serve from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For navigation requests, serve the index.html from cache
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            return null;
          });
        })
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});
