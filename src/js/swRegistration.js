

export default class ServiceWorkerRegistration {
  constructor(snackbarsInstance) {
    this.snackbars = snackbarsInstance;
  }

  /**
	 * Registers service workers
	 */
  registerServiceWorker() {
    if(!navigator.serviceWorker) return;
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        if (!navigator.serviceWorker.controller) {
          this.snackbars.show({
            name: 'swRegistered',
            message: 'Service Worker installed! This page is saved for offline use.',
            duration: 4500
          });
          return;
        }

        if (reg.waiting) {
          this.updateReady(reg.waiting);
          return;
        }

        if (reg.installing) {
          this.trackInstalling(reg.installing);
          return;
        }

        reg.addEventListener('updatefound', () => {
          this.trackInstalling(reg.installing);
        });
      })
      .catch(err => {
        console.log(`Service worker registration failed.\nError: ${err}`);
      });

    // Ensure refresh is only called once.
    // This works around a bug in "force update on reload".
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  }

  trackInstalling (worker) {
    worker.addEventListener('statechange', ()  => {
      if (worker.state == 'installed') {
        this.updateReady(worker);
      }
    });
  }

  updateReady(worker) {
    this.snackbars.show({
      message: 'New version available! Refresh to update.',
      name: 'update',
      actions: [{
        name: 'refresh',
        textColor: '#50d8a4',
        handler() {
          worker.postMessage({action: 'skipWaiting'});
        }
      }, {
        name: 'dismiss'
      }]
    });
  }
}
