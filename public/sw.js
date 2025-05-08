const CACHE_NAME = 'data-engineer-portfolio-v1';

// Assets to cache immediately on service worker install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/images/penguindb_main_logo.png',
  '/images/oops_penguin.png',
];

// Install event - precache key assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Use individual cache.add() calls with error handling instead of cache.addAll()
        return Promise.all(
          PRECACHE_ASSETS.map(asset => {
            return cache.add(asset).catch(error => {
              console.error(`Failed to cache asset: ${asset}`, error);
              // Continue with other assets even if one fails
              return Promise.resolve();
            });
          })
        );
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or fetch from network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Skip browser extensions and similar
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // For blog pages and related assets - use stale-while-revalidate strategy
  if (url.pathname.startsWith('/blog') || 
      url.pathname.includes('data/blog') || 
      url.pathname.includes('components/blog')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Return cached response immediately if available
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Update cache with new response for future use
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => {
              // Network failed, return cached or fallback
              return cachedResponse || caches.match('/offline.html');
            });
            
          // Prioritize cached response, fall back to network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // For archive pages and related assets - use stale-while-revalidate strategy
  if (url.pathname.startsWith('/archive') ||
      url.pathname.includes('data/blog') ||
      url.pathname.includes('components/blog')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // Return cached response immediately if available
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Update cache with new response for future use
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => {
              // Network failed, return cached or fallback
              return cachedResponse || caches.match('/offline.html');
            });
            
          // Prioritize cached response, fall back to network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // For images and static assets - use cache-first strategy
  if (event.request.url.match(/\.(jpe?g|png|gif|svg|webp|ico|ttf|woff2?|eot|mp4|webm|pdf|css|js)$/i)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request)
          .then((networkResponse) => {
            // Add to cache for future requests
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          })
          .catch(() => {
            // For images, can return a placeholder
            if (event.request.url.match(/\.(jpe?g|png|gif|svg|webp)$/i)) {
              return caches.match('/images/placeholder.png');
            }
            return new Response('Not available offline', { status: 404 });
          });
      })
    );
    return;
  }

  // For other pages - use network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache the network response for future offline use
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            return cachedResponse || caches.match('/offline.html');
          });
      })
  );
}); 