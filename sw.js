const staticCacheName  = 'convter-wp-static-v1';
const dynamicCacheName = 'convter-wp-dynamic-v1';
const allCaches = [
	staticCacheName,
	dynamicCacheName
];

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
		return keyList
			.filter( key =>key.startsWith('convter-wp-') && !allCaches.includes(key))
			.map( key => caches.delete(key));
	}());
	return clients.claim();
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
addEventListener('fetch', event => {
	event.respondWith(async function() {
		const cachedResponse = await caches.match(event.request);
		if(cachedResponse) return cachedResponse;
		return fetch(event.request);
	}());
});

/**
 * checks if online, fetch data from network,
 * updates cache and repond with data
 * if offline responds with cached data and sends
 * message to app that app is offline
 * @param {Object} request - The Request the browser intends to make
 */
async function fetchCurrency(request){
	try {
		const networkResponse = await fetch(request);
		// Online, but got 4xx or 5xx
		if(!networkResponse || !networkResponse.ok) throw new Error('Previous Data');
		console.log('Fetching from Network');
		const cache = await caches.open(dynamicCacheName);

		cache.put(request, networkResponse.clone());
		return response;
	} catch(err) {
		return await caches.match(request);
	}
}


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