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
				'./manifest.json',
				'https://free.currencyconverterapi.com/api/v5/currencies?',
			]);
		})
	);
});



self.addEventListener('activate', (e) => {
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
self.addEventListener('fetch', (e) => {
  var dataUrl = 'https://free.currencyconverterapi.com/api/v5/convert?';
  if (e.request.url.includes(dataUrl)) {
		e.respondWith(fetchCurrency(e.request));

  } else {
    e.respondWith(
      caches.match(e.request).then( (response) => {
        return response || fetch(e.request);
      })
    );
  }
});


/**
 * matches request to cached data and sends message
 * to the app that it's offline
 * @param {Object} request - The Request the browser intends to make
 */
function handleOffline(request) {
	console.log('Fetching from Cache');
	return caches.match(request);
}


/**
 * checks if online, fetch data from network,
 * updates cache and repond with data
 * if offline responds with cached data and sends
 * message to app that app is offline
 * @param {Object} request - The Request the browser intends to make
 */
function fetchCurrency(request){
	if(!navigator.onLine){
		// We are OFFLINE
		return handleOffline(request);
	}
	/* Trying to fetch from network */
	return fetch(request).then( response => {
		if(!response.ok){
			// Online, but got 4xx or 5xx
			throw new Error('Previous Data');
		}
		/* we are online and got the data */
		console.log('Fetching from Network');
		/* Cloning the response to cache it first */
		const resClone = response.clone();
		caches.open(dynamicCacheName).then( cache => {
			cache.put(request, resClone);
		});
		return response;
	}).catch( () => {
		/* handle 4xx, 5xx and other errors as if offline */
		return handleOffline(request);
	});
}


/**
 * listening for a message from the client
 * stating that service worker should skip the
 * waiting state
 */
self.addEventListener('message', (e) => {
  if (e.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});