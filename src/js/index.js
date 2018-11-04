import '@babel/polyfill';
import App from './app';
import { insertAfter } from './utils';
import moneyDataURI from './../images/money.png';
import './../css/style.css';
import '@salahhamza/snackbars/lib/snackbar.css';
import ServiceWorkerRegistration from './swRegistration';
import Snackbars from '@salahhamza/snackbars';

const snackbarsInstance = new Snackbars(null, true);

window.addEventListener('DOMContentLoaded', () => {

  ((/* Inserting inline brand image */) => {
    const brandImage = document.createElement('img');
    brandImage.src = moneyDataURI;
    brandImage.alt = 'Currency Converter';
    const brandName = document.querySelector('.headbar h1');
    insertAfter(brandImage, brandName);
  })();

  // initilize app
  const app = new App(snackbarsInstance);
  app.init();
});

window.addEventListener('load', () => {
  const swRegisterer = new ServiceWorkerRegistration(snackbarsInstance);
  swRegisterer.registerServiceWorker();
});