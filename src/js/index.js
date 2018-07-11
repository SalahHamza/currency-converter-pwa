import App from './app';
import { insertAfter } from './utils';
import moneyDataURI from './../images/money.png';
import './../css/style.css';

window.addEventListener('load', function(){
	(function(/* Inserting inline brand image */){
		const brandImage = document.createElement('img');
		brandImage.src = moneyDataURI;
		brandImage.alt = 'CC: Currency Converter';
		const brandName = document.querySelector('.headbar h1');
		brandName.parentNode.insertBefore(brandImage, brandName);
	})();
	const app = new App();
	app.init();
});