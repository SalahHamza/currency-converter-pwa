import IDBHelper from './idbHelper';
import {insertAfter} from './utils';

class App {
  constructor(snackbarsInstance) {
    // Elements
    this.container = document.querySelector('.main');
    this.cardTemplate = document.querySelector('.cardTemplate');
    this.converterCard = document.querySelector('.converter.card');
    this.fromSelectElem = document.getElementById('fromCurrency');
    this.toSelectElem = document.getElementById('toCurrency');

    this.visibleCards = {};
    this.addedConversions = [];
    this.loadingCards = [];

    this.idbHelper = new IDBHelper();
    this.snackbars = snackbarsInstance;

    // binding handlers with 'this'
    this.handleConvertClick = this.handleConvertClick.bind(this);
    this.handleSwapClick = this.handleSwapClick.bind(this);
    this.handleInCardConvertClick = this.handleInCardConvertClick.bind(this);

  }

  /* ============= UI ============= */

  /**
   * adds conversion if it already
   * @param {Object} conversion - conversion data
   */
  putCoversionCard(conversion) {
    // if card is already visible for this conversion id
    // get it, if not instantiate new card from template
    let card = this.visibleCards[conversion.id];
    if(!card){
      card = this.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      // add card to visible cards
      this.visibleCards[conversion.id] = card;
      this.replacePlaceholder(card);
    }
    card.setAttribute('id', conversion.id);
    card.id = conversion.id;
    this.setDataToCard(card, conversion);
    this.addInCardConvertEvent(card);
    this.addDeleteEvent(card, conversion.id);
    this.insertCard(card);
  }

  setDataToCard(card, conversion) {
    card.querySelector('.fromResultAmount').value = conversion.amount.toFixed(3);
    card.querySelector('.fromResultName').textContent = conversion.fr;
    // getting the value of the conversion
    const val = Number(conversion.dc)*conversion.amount;
    card.querySelector('.toResultAmount').textContent = val.toFixed(6);
    card.querySelector('.toResultName').textContent = conversion.to;
    card.querySelector('.fromRate').textContent = `1 ${conversion.fr} =  ${conversion.dc} ${conversion.to}`;
    card.querySelector('.toRate').textContent = `1 ${conversion.to} =  ${conversion.rc} ${conversion.fr}`;
    card.querySelector('.date').textContent = conversion.date.toUTCString();
  }

  createPlaceholder(id) {
    const placeholderElem = this.cardTemplate.cloneNode(true);
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
   * append option for every currency to respective select element
   * @param {Array} currencies - currencies to add
   */
  addCurrencyOptions(currencies) {
    const frOptions = [];
    const toOptions = [];
    for(const currency of currencies) {
      const id = currency.id;
      // only add selected attribute to USD and EUR
      // options for each select respectively
      const slctd1 = id === 'USD' ? 'selected' : '';
      const slctd2 = id === 'EUR' ? 'selected' : '';
      frOptions.push(`<option value="${id}" ${slctd1}>${id}</option>`);
      toOptions.push(`<option value="${id}" ${slctd2}>${id}</option>`);
    }
    this.fromSelectElem.insertAdjacentHTML('beforeend', frOptions.join(''));
    this.toSelectElem.insertAdjacentHTML('beforeend', toOptions.join(''));
  }

  /* ============= UI Helpers ============= */

  /**
   * adds a click event to convert button (in card)
   * @param {Object} card - conversion card element to add event to
   */
  addInCardConvertEvent(card) {
    card
      .querySelector('.fromResultName.button')
      .addEventListener('click', this.handleInCardConvertClick(card));
  }

  addDeleteEvent(card, id) {
    if(!card) return;
    card.querySelector('.close').addEventListener('click', event => {
      // remove conversion card from DOM
      let remove = true;

      // hiding the card
      card.style.display = 'none';
      card.setAttribute('aria-hidden', 'true');

      this.snackbars.show({
        name: 'undoCardDelete',
        message: `${id} conversion has been removed`,
        actions: [{
          name: 'undo',
          handler() {
            // If the user wishes to undo the card removal
            // we show the card again and make sure the
            // conversion isn't deleted in IDB
            remove = false;
            card.style.display = 'block';
            card.setAttribute('aria-hidden', 'false');
          }
        }],
        duration: 4000
      });

      // giving the users enough time to decide if they
      // want to undo the conversion removal
      setTimeout(() => {
        if(!remove) return;
        // remove conversion from added conversions
        this.addedConversions = this.addedConversions
          .filter(conversion => conversion.id !== id);
        // remove conversion from idb store
        this.idbHelper.deleteConversion(id);
      }, 4500);

      // Prevents other listeners of the same event from being called
      event.stopImmediatePropagation();
    });
  }

  /**
   * inserts card after converter card
   * @param {Object} card - card to insert
   */
  insertCard(card){
    insertAfter(card, this.converterCard);
  }

  /**
   *
   * @param {string} id - placeholder id
   */
  addPlaceholder(id) {
    const placeholderCard = this.createPlaceholder(id);
    // adding placeholder to loading cards
    this.loadingCards.unshift(placeholderCard);
    this.insertCard(placeholderCard);
  }

  /**
   * remove placeholder from DOM
   */
  removePlaceholder() {
    if(!this.loadingCards[0]) return;
    this.loadingCards[0].remove();
    this.loadingCards.shift();
  }

  /**
   * replace placeholder with card
   * @param {Object} card - card to replace placeholder with
   */
  replacePlaceholder(card) {
    if(!this.loadingCards[0]) return;
    this.container.replaceChild(card, this.loadingCards[0]);
    this.loadingCards.shift();
  }

  /* ============= Handlers ============= */

  /**
   * get and set conversion data to new card or existing one
   */
  handleConvertClick() {
    const amountElem = document.querySelector('input.amount');
    /* turning amount into positive number */
    let amount = amountElem.value;
    amount = Math.abs(Number(amount));
    /*  getting from and to currencies */
    const fr 	= this.fromSelectElem.value;
    const to  = this.toSelectElem.value;
    const id = `${fr}_${to}`;
    // show a loading card if no card with this id is already visible
    if(!this.visibleCards[id]) {
      this.addPlaceholder(id);
    } else {
      // show added conversion with this id if it already exists
      for(let i in this.addedConversions) {
        const savedConversion = this.addedConversions[i];
        if(savedConversion.id === id) {
          this.addedConversions[i].amount = amount;
          this.putCoversionCard(savedConversion);
          this.idbHelper.saveConversion(this.addedConversions[i]);
          break;
        }
      }
    }
    this.idbHelper.fetchConversion(fr, to, amount, (error, conversion) => {
      if(error) {
        this.removePlaceholder();
        console.error(error);
        return;
      }
      this.putCoversionCard(conversion);
      this.addedConversions.push(conversion);
      this.idbHelper.saveConversion(conversion);
    });
  }

  /**
   * swap from currency with to currency in converter
   */
  handleSwapClick() {
    /* select containers */
    const frContainer = this.fromSelectElem.parentNode;
    const toContainer = this.toSelectElem.parentNode;
    /* getting select values */
    const fr	= this.fromSelectElem.value;
    const to  = this.toSelectElem.value;
    /* cloning select elements */
    const frElem = this.fromSelectElem.cloneNode(true);
    const toElem  = this.toSelectElem.cloneNode(true);
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
    this.fromSelectElem.remove();
    this.toSelectElem.remove();
    /* appending new select elements */
    frContainer.appendChild(toElem);
    toContainer.appendChild(frElem);
    /* setting new selectElem props */
    this.fromSelectElem = toElem;
    this.toSelectElem = frElem;
  }

  /**
   * returns handler for the convert button in every (specific) card
   */
  handleInCardConvertClick(card) {
    return () => {
      const frAmountElem 	= card.querySelector('.fromResultAmount');
      const frNameElem 	 	= card.querySelector('.fromResultName');
      const toNameElem 		= card.querySelector('.toResultName');

      /* turning amount into positive number */
      let amount = frAmountElem.value;
      amount = Math.abs(Number(amount));
      const fr = frNameElem.textContent;
      const to = toNameElem.textContent;
      const id = card.id;

      for(let i in this.addedConversions) {
        if(this.addedConversions[i].id === id) {
          this.addedConversions[i].amount = amount;
          this.setDataToCard(card, this.addedConversions[i]);
          this.idbHelper.saveConversion(this.addedConversions[i]);
          break;
        }
      }

      this.idbHelper.fetchConversion(fr, to, amount, (error, conversion) => {
        if(error) {
          console.error(error);
          return;
        }
        this.setDataToCard(card, conversion);
        this.addedConversions.push({id:`${fr}_${to}`, fr, to, amount});
        this.idbHelper.saveConversion(conversion);
      });
    };
  }



  /* ============= Init ============= */
  /**
   * app initilizer
   *  - gets initial currencies
   *  - gets saved conversion (if they exist)
   *  - add click event to convert button and handle it
   *  - add click event to swap button and handle it
   */
  init() {

    /* get currencies and set them to select elements */
    this.idbHelper.getCurrencies((error, currencies) => {
      if(error) {
        console.error(error);
        return;
      }
      this.addCurrencyOptions(currencies);
    });

    /* add new conversion */
    document.querySelector('.button.convert').addEventListener('click', this.handleConvertClick);

    /* Add swap event to the swap button */
    document.querySelector('.button.swap').addEventListener('click', this.handleSwapClick);

    /* get initial saved convesions from IDB */
    this.idbHelper.getSavedConversions((error, conversions) => {
      if(error) {
        console.log(error.message);
        return;
      }
      for(let i in conversions) {
        const savedConversion = conversions[i];
        const {fr, to, amount} = savedConversion;
        // show saved conversion first
        this.putCoversionCard(savedConversion);
        // fetch conversion from network and update UI
        this.idbHelper.fetchConversion(fr, to, amount, (error, conversion) => {
          if(conversion) {
            this.putCoversionCard(conversion);
            conversions[i] = conversion;
          }
        });
      }
      this.addedConversions = conversions;
      this.idbHelper.saveAddedConversions(this.addedConversions);
    });
  }

}

export default App;