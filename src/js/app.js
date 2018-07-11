import idb from 'idb';
import {insertAfter, handleErrors, iterObj} from './utils';

/**
 * open new IndexedDB database
 * @returns {Promise} idb promise
 */
const openDatabase = () => {
	return idb.open('converter-wp-app', 1, (upgradeDB) => {
		console.log('opening DB');
		upgradeDB.createObjectStore('currencies', { keyPath: 'id' });
		upgradeDB.createObjectStore('conversions',{ keyPath: 'id' });
	});
}


export default class App {
	constructor(){
		this.$container = document.querySelector('.main');
		this.$cardTemplate = document.querySelector('.cardTemplate');
		this.$converterCard = document.querySelector('.converter.card');
		this.$fromSelectElem = document.getElementById('fromCurrency');
		this.$toSelectElem = document.getElementById('toCurrency');
		this._idbPromise = openDatabase();
		this._visibleCards = {};
		this._addedConversions = [];
		this._loadingCards = [];
		this._messageShown = true;
	}

	/****************************************
	 * 						NETWORK calls
	*****************************************/

	/**
	 * fetch currencies from API and sets it to the DB
	 * @returns {Promise} Promise that resolves with the currencies iterable
	 */
	_fetchCurrencies(){
		const url = 'https://free.currencyconverterapi.com/api/v5/currencies?';
		/* path is used for debugging & testing 
			so that we don't abuse the API */
		const path = 'src/currencies.json';
		return fetch(url)
		.then(handleErrors)
		.then( data => {
			const currencies = iterObj(data.results);
			return Promise.resolve(currencies);
		});
	}

	/**
	 * fetch conversion data from API
	 * @param {String} fr - Currency to convert from 
	 * @param {String} to - Currency to convert to
	 * @param {Number} amount - Amount of money to 
	 * @returns {Promise} promise that resolves with conversion data
	 */
	_fetchConversion(fr, to, amount){
		const query = `${fr}_${to},${to}_${fr}`;
		const url   = `https://free.currencyconverterapi.com/api/v5/convert?q=${query}`;
		this._setPlaceholder(/* setting loading placeholder */ `${fr}_${to}`);
		return fetch(url).then(handleErrors);
	}


	/****************************************
	 * 					UI CONTROLLERS
	*****************************************/

	/**
	 * 
	 * @param {String} fr 
	 * @param {String} to 
	 * @param {Number} amount 
	 */
	_getConversion(fr, to, amount){
		this._fetchConversion(fr, to, amount).then(data => {
			const structuredData = this.
				_structureData(data.results, fr, to, amount);
			this._putCoversionCard(structuredData);
			this._addedConversions.push({id:`${fr}_${to}`, fr, to, amount});
			this._saveAddedConversions();
		}).catch(/* logging error */console.log);
	}


	/**
	 * Updates Conversion card data if it already exists
	 * else it creates a new conversion card 
	 * 
	 * @param {Object} data - conversion data
	 */
	_putCoversionCard(data){
		let card = this._visibleCards[data.id];
		if(!card){
			card = this.$cardTemplate.cloneNode(true);
			card.classList.remove('cardTemplate');
			this.$container.replaceChild(card, this._loadingCards[0]);
			this._visibleCards[data.id] = card;
			this._loadingCards.shift();
		}
		card.setAttribute('id', data.id);
		this._setDataToCard(card, data);
		this._addConvertEvent(card);
		this._addDeleteEvent(card, data.id);
		this._insertCard(card);
	}

	/**
	 * inserts card to the top of the card list
	 * @param {Objcet} card - new card to insert 
	 */
	_insertCard(card){
		insertAfter(card, this.$converterCard);
	}


	/**
	 * sets conversion data to conversion card
	 * 
	 * @param {Object} card - card dom element
	 * @param {*} data - conversion data
	 */
	_setDataToCard(card, data){
		card.querySelector('.fromResultAmount').value = data.amount.toFixed(3);
		card.querySelector('.fromResultName').textContent = data.fr;
		const val = Number(data.dc)*data.amount;
		card.querySelector('.toResultAmount').textContent = val.toFixed(6);
		card.querySelector('.toResultName').textContent = data.to;
		card.querySelector('.fromRate').textContent = `1 ${data.fr} =  ${data.dc} ${data.to}`;
		card.querySelector('.toRate').textContent = `1 ${data.to} =  ${data.rc} ${data.fr}`;
		card.querySelector('.date').textContent = data.date.toUTCString();
	}

	/**
	 * adds currency option to the from/to select elems
	 * 
	 * @param {String} id - currency identifier
	 */
	_addCurrencyOption({id}){
		const slctd1 = id === 'USD' ? 'selected' : '';
		const slctd2 = id === 'EUR' ? 'selected' : '';
		this.$fromSelectElem
		.innerHTML +=  `<option value="${id}" ${slctd1}>${id}</option>`;
		this.$toSelectElem
		.innerHTML += `<option value="${id}" ${slctd2}>${id}</option>`;
	}

	/**
	 * set dummy card until data arrives from aPI
	 * @param {String} id - conversion id 
	 */
	_setPlaceholder(id){
		if(!this._visibleCards[id]){
			const placeholderCard = this._createPlaceholder(id);
			this._loadingCards.unshift(placeholderCard);
			this._insertCard(placeholderCard, this.$converterCard);
		}
	}


	/**
	 * create placeholder card
	 * @param {String} id - conversion id 
	 */
	_createPlaceholder(id){
		const placeholderElem = this.$cardTemplate.cloneNode(true);
		placeholderElem.classList.remove('cardTemplate');
		placeholderElem.classList.add('placeholder');
		placeholderElem.setAttribute('id', id);
		placeholderElem.innerHTML = 
			`<div class="fromResult"><div class="organ animated"></div></div>
			<div class="toResult"><div class="organ animated"></div></div>
			<div class="rates">
				<div class="fromRate"><div class="organ animated"></div></div>
				<div class="toRate"><div class="organ animated"></div></div>
			</div>
			<div class="date"><div class="organ animated"></div></div>
			<div class="utils"><div class="organ animated"></div></div>`;
		return placeholderElem;
	}


	/**
	 * Show toast message (when network requests fail)
	 */
	_showMessage(){
		let headsUpElem  = document.querySelector('.snackbar');
		if(headsUpElem) return;
		headsUpElem = document.createElement('div');
		headsUpElem.classList.add('snackbar');
		headsUpElem.classList.add('clearfix');
		const message =
			'You seem to be offline. If you have any saved conversions make sure to use them.';
		headsUpElem.innerHTML +=  `<span class="message">${message}</span>
											<span class="hide">Hide</span>`;
		headsUpElem.querySelector('.hide').addEventListener('click', () => {
			headsUpElem.remove();
			this._messageShown = false;
		});
		this.$container.appendChild(headsUpElem);
	}

	/****************************************
	 * 							EVENTS
	*****************************************/

	/**
	 * adds convert event to conversion card
	 * @param {Object} card - conversion card element
	 */
	_addConvertEvent(card){
		card.querySelector('.fromResultName.button').addEventListener('click', () => {
			const frAmountElem 	= card.querySelector('.fromResultAmount');
			const frNameElem 	 	= card.querySelector('.fromResultName');
			const toNameElem 		= card.querySelector('.toResultName');
			/* turning amount into positive number */
			let amount = frAmountElem.value;
			amount = Math.abs(Number(amount));
			const fr = frNameElem.textContent;
			const to = toNameElem.textContent;
			this._fetchConversion(fr, to, amount).then(data => {
				const structuredData = this._structureData(data.results, fr, to, amount);
				this._setDataToCard(card, structuredData);
				this._addedConversions.push({id: `${fr}_${to}`, fr, to, amount});
				this._saveAddedConversions();
			}).catch(/* logging error */console.log);
		});
	}

	/* Adds close/delete event to the conversion card */
	/**
	 * 
	 * @param {Object} card - card dom element 
	 * @param {*} id - conversion id
	 */
	_addDeleteEvent(card, id){
		if(!card) return;
		card.querySelector('.close').addEventListener('click', () => {
			card.remove();
			this._idbPromise.then((db) => {
				const tx = db.transaction('conversions', 'readwrite');
				tx.objectStore('conversions').delete(id);
				return tx.complete;
			});
		});
	}

	/****************************************
	 * 						IDB CONTROLLERS
	*****************************************/

	/**
	 * adds fetched currencies to IDB if they are not there
	 * and sets select options for every currency
	 * 
	 * @param {Object} db - opened IDB database object 
	 */
	_addFetchedCurrencies(db){
		this._fetchCurrencies().then( currencies => {
			const tx = db.transaction('currencies', 'readwrite');
			const store = tx.objectStore('currencies');
			for(let currency of currencies){
				store.put({
					id: currency.id,
					name: currency.currencyName
				});
				this._addCurrencyOption(currency);
			}
		}).catch(/* logging error */ console.log);
	}

	/**
	 * Gets currencies from IDB if there else fetch from
	 * network and add to IDB. then, set options
	 * 
	 */
	_getCurrencies(){
		this._idbPromise.then( async (db) => {
			try {
				const tx = db.transaction('currencies');
				const currenciesStore = tx.objectStore('currencies');
				const currencies = await currenciesStore.getAll();
				if(!currencies.length){
					this._addFetchedCurrencies(db);
					return;
				}
				currencies.forEach(currency => {
					this._addCurrencyOption(currency);
				});
				return tx.complete;
			} catch(err) {
				/* If there is an error fetch new currencies */
				this._addFetchedCurrencies(db);
			}
		});
	}

	/**
	 * add conversions to IDB
	 */
  _saveAddedConversions(){
    this._idbPromise.then((db) => {
      if(!db) return;
      const tx = db.transaction('conversions', 'readwrite');
      const conversionsStore = tx.objectStore('conversions');
      for(let conversion of this._addedConversions){
        conversionsStore.put(conversion);
      }
      return tx.complete;
    });
  }



	/****************************************
	 * 							OTHERS
	*****************************************/


	/**
	 * structure fetched conversion data
	 * @param {Object} data - fetched API data object
	 * @param {String} fr - currency to convert from
	 * @param {String} to  - currency to convert to
	 * @param {Number} amount - amount to convert
	 */
	_structureData(data, fr, to, amount){
		const id = `${fr}_${to}`;
		const date = new Date();
		const dc = data[id]['val'];
		const rc = data[`${to}_${fr}`]['val'];
		return {id, date, fr, to, dc, rc, amount}
	}

	/**
	 * Registers service workers
	 */
	_registerServiceWorker(){
		if(!navigator.serviceWorker) return;
		navigator.serviceWorker.register('./sw.js')
		.then(() => {
			 console.log('Sw registered');
		})
		.catch(() => {
			 console.log('Sw registeration failed');
		});
 	}

	/**
	 * App initializer
	 */
	init(){
		this._registerServiceWorker();
		/* Getting currency options */
		this._getCurrencies();
		/* Add swap event to the swap button */
		document.querySelector('.button.swap').addEventListener('click',() => {
			/* select containers */
			const frContainer = this.$fromSelectElem.parentNode;
			const toContainer = this.$toSelectElem.parentNode;
			/* getting select values */
			const fr	= this.$fromSelectElem.value;
			const to  = this.$toSelectElem.value;
			/* cloning select elements */
			const frElem = this.$fromSelectElem.cloneNode(true);
			const toElem  = this.$toSelectElem.cloneNode(true);
			/* unselecting old options */
			frElem.querySelector(`option[value=${fr}]`)
			.removeAttribute('selected');
			toElem.querySelector(`option[value=${to}]`)
			.removeAttribute('selected');
			/* Selecting new options */
			frElem.querySelector(`option[value=${fr}]`)
			.setAttribute('selected', 'selected');
			toElem.querySelector(`option[value=${to}]`)
			.setAttribute('selected', 'selected');
			/* swaping name attributes */
			frElem.setAttribute('name', 'toCurrency');
			toElem.setAttribute('name', 'fromCurrency');
			/* removing old elements */
			this.$fromSelectElem.remove();
			this.$toSelectElem.remove();
			/* appending new select elements */
			frContainer.appendChild(toElem);
			toContainer.appendChild(frElem);
			/* setting new selectElem props */
			this.$fromSelectElem = toElem;
			this.$toSelectElem = frElem;
		});

		/* getting all saved conversions */
		this._idbPromise.then( async (db) => {
			try {
				const tx = db.transaction('conversions');
				const conversionsStore = tx.objectStore('conversions');
				const conversions = await conversionsStore.getAll();
				if(!conversions.length) return;
				this._addedConversions = conversions;
				for(let conversion of this._addedConversions){
					this._getConversion(
						conversion.fr, 
						conversion.to, 
						conversion.amount
					);
				}
				return tx.complete;
			} catch(err){/* Do nothing */}
		});

		/* add new conversion */
		document.querySelector('.button.convert').addEventListener('click', () => {
			const amountElem = document.querySelector('input.amount');
			/* turning amount into positive number */
			let amount = amountElem.value;
			amount = Math.abs(Number(amount));
			/*  getting from and to currencies */
			const fr = this.$fromSelectElem.value;
			const to   = this.$toSelectElem.value;
			this._getConversion(fr, to, amount);
		});

		/* create broadcast channel to receive messages from service worker */
		if('BroadcastChannel' in window){
			const channel = new BroadcastChannel('sw-messages');
			channel.addEventListener('message', event => {
				if(event.data.isOffline && this._messageShown){
					this._showMessage();
				}
			});
		}
	}
}

