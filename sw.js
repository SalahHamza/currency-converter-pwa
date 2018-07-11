const staticCacheName  = 'convter-wp-static-v1';
const dynamicCacheName = 'convter-wp-dynamic-v1';
const allCaches = [
	staticCacheName,
	dynamicCacheName
];

self.addEventListener('install', (e) => {
	e.waitUntil(
		caches.open(staticCacheName).then( (cache) => {
			return cache.addAll([
				'./',
				'./index.html',
				'./build/js/app.bundle.js',
				'./build/icons/icon_192x192.png',
				'./build/icons/icon_512x512.png',
				'https://free.currencyconverterapi.com/api/v5/currencies?'
			]);
		})
	);
});



self.addEventListener('activate', function(e) {
	e.waitUntil(
		caches.keys().then( (keyList) => {
			return Promise.all(
				keyList.filter( (key) => {
					return key.startsWith('convter-wp-') && 
						!allCaches.includes(key);
				})
				.map( (key) => {
					return caches.delete(key);
				})
			);
		})
	);
	return self.clients.claim();
});

/*
	If it's an API request:
		- if there is internet access:
		 * fetch new data from the network.
		 * update cache with new data.
		- else:
			* match the cache for a similar request and respond with it
			(the broadcastChannel is used to send the a message 
			that we are fetching from cache so show offline message).
	else:
		match other requests

*/
self.addEventListener('fetch', function(e) {
  var dataUrl = 'https://free.currencyconverterapi.com/api/v5/convert?';
  if (e.request.url.includes(dataUrl)) {
    e.respondWith(
			fetch(e.request).then( (res) => {
				console.log('Fetching from Network');
				const resClone = res.clone();
				caches.open(dynamicCacheName).then( (cache) => {
					cache.put(e.request, resClone);
				});
				return res;
			}).catch(function() {
				console.log('Fetching from Cache');
				if('BroadcastChannel' in window){
					const channel = new BroadcastChannel('sw-messages');
					channel.postMessage({isOffline: true});
				}
				return caches.match(e.request);
			})
    );
  } else {
    e.respondWith(
      caches.match(e.request).then( (response) => {
        return response || fetch(e.request);
      })
    );
  }
});


