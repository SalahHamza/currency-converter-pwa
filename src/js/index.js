import App from './app';
import { insertAfter } from './utils';
import moneyDataURI from './../images/money.png';
import './../css/style.css';
import '@salahhamza/snackbars/snackbar.css';

window.addEventListener('DOMContentLoaded', function(){
	(function(/* Inserting inline brand image */){
		const brandImage = document.createElement('img');
		brandImage.src = moneyDataURI;
		brandImage.alt = 'Currency Converter';
		const brandName = document.querySelector('.headbar h1');
		insertAfter(brandImage, brandName);
	})();
	const app = new App();
	app.init();
});