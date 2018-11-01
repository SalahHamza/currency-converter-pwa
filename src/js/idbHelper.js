import idb from 'idb';
import {objToArray} from './utils';
/**
 *	Opens IDB database and creates object stores
 */
const openDatabase = () => {
  return idb.open('converter-wp-app', 1, (upgradeDB) => {
    console.log(`Opened database: ${name}`);
    upgradeDB.createObjectStore('currencies', { keyPath: 'id' });
    upgradeDB.createObjectStore('conversions',{ keyPath: 'id' });
  });
};

class IDBHelper {
  constructor() {
    this.idbPromise = openDatabase();
  }

  /**
   *  fetch currencies from api and adds them to IDB store
   *
   * @param {Object} error - error object
   * @param {function} callback - callback to invoke when data is fetched or failed
   */
  async _fetchCurrencies(error, callback) {
    // const url = 'https://free.currencyconverterapi.com/api/v5/currencies?';
    const path = 'src/currencies.json';
    try {
      const response = await fetch(path);
      const data = await response.json();
      const currencies = objToArray(data.results);
      callback(null, currencies);

      const db = await this.idbPromise;
      if(!db) return;

      // adding currencies to IDB
      const tx = db.transaction('currencies', 'readwrite');
      const store = tx.objectStore('currencies');
      for(const currency of currencies) {
        store.put({
          id: currency.id,
          name: currency.currencyName
        });
      }
      return tx.complete;
    } catch(err) {
      const sentError = `Errors:\n${error}\n${err}`;
      callback(sentError, null);
    }
  }

  /**
   * fetch currencies from IDB (if they exist) and fallback to network
   *
   * @param {function} callback - callback to invoke when data is fetched or failed
	 */
  async getCurrencies(callback) {
    try {
      const db = await this.idbPromise;
      if(!db) return;

      const tx = db.transaction('currencies');
      const store = tx.objectStore('currencies');
      const currencies = await store.getAll();

      if(!currencies.length) throw new Error('No currencies in IDB');

      callback(null, currencies);
      return tx.complete;
    } catch(err) {
      await this._fetchCurrencies(err, callback);
    }
  }

  /**
   * @param {string} fr - The currency to convert from
   * @param {string} to - The currency to convert to
   * @param {function} callback - callback to invoke when data is fetched
   */
  async fetchConversion(fr, to, amount, callback) {
    const query = `${fr}_${to},${to}_${fr}`;
    const url   = `https://free.currencyconverterapi.com/api/v5/convert?q=${query}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const conversion = this.structureData(data.results, fr, to, amount);
      callback(null, conversion);
    } catch (err) {
      callback(err, null);
    }
  }

  /**
   * structure conversion data fetched from API
   *
	 * @param {Object} data - fetched API data object
	 * @param {String} fr - currency to convert from
	 * @param {String} to  - currency to convert to
	 * @param {Number} amount - amount to convert
	 */
  structureData(data, fr, to, amount) {
    const id = `${fr}_${to}`;
    const date = new Date();
    // direct rate: fr -> to
    const dc = data[id]['val'];
    // reverse rate: to -> fr
    const rc = data[`${to}_${fr}`]['val'];
    return {id, date, fr, to, dc, rc, amount};
  }

  /**
	 * add conversions to IDB
   * @param {array} conversions - conversions to add to IDB
	 */
  async saveAddedConversions(conversions) {
    try {
      const db = await this.idbPromise;
      if(!db) return;

      const tx = db.transaction('conversions', 'readwrite');
      const store = tx.objectStore('conversions');
      for(const conversion of conversions){
        store.put(conversion);
      }
      return tx.complete;
    } catch(err) {
      console.log('Couldn\'t save added conversions to IDB', err);
    }
  }

  /**
   * deletes conversion from IDB
   * @param {string} id - conversion id to delete
   */
  async deleteConversion(id) {
    try {
      const db = await this.idbPromise;
      if(!db) return;

      const tx = db.transaction('conversions', 'readwrite');
      tx.objectStore('conversions').delete(id);
      return tx.complete;
    } catch(err) {
      console.log('Couldn\'t delete conversion from IDB', err);
    }
  }

  /**
   * get conversions saved in IDB
   *
   * @param {function} callback - callback to invoke when data is fetched
   */
  async getSavedConversions(callback) {
    try {
      const db = await this.idbPromise;
      if(!db) return;

      const tx = db.transaction('conversions');
      const conversionsStore = tx.objectStore('conversions');
      const conversions = await conversionsStore.getAll();

      if(!conversions.length) throw new Error('No saved conversions in IDB');
      callback(null, conversions);
      return tx.complete;
    } catch(err) {
      callback(err, null);
    }
  }

}

export default IDBHelper;