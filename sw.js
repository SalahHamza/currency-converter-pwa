const staticCacheName  = 'convter-wp-static-v1';

addEventListener('install', event => {
  event.waitUntil(async function() {
    const cache = await caches.open(staticCacheName);
    await cache.addAll([
      './',
      './index.html',
      './build/js/app.bundle.js',
      './build/icons/icon_192x192.png',
      './build/icons/icon_512x512.png',
      './manifest.json'
    ]);
  }());
});

addEventListener('activate', event => {
  event.waitUntil(async function() {
    const keyList = await caches.keys();
    keyList
      .filter(key => key !== staticCacheName)
      .map(key => caches.delete(key));
  }());
  return self.clients.claim();
});


addEventListener('fetch', event => {
  event.respondWith(async function() {
    const cachedResponse = await caches.match(event.request);
    if(cachedResponse) return cachedResponse;
    return fetch(event.request);
  }());
});

/**
 * listening for a message from the client
 * stating that service worker should skip the
 * waiting state
 */
addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});