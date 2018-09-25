/**
 *
 * @param {Object} obj - object to turn into an iterable
 */
export function* iterObj(obj = {}) {
	for (let prop of Object.keys(obj)){
		if(obj.hasOwnProperty(prop)){
			yield obj[prop];
		}
	}
}


/**
 * handles errors of fetch reponse
 * @param {Object} response - response object to handle
 */
export const handleErrors = (response) => {
	if (!response.ok) throw Error(response.statusText);
	return response.json();
}

/**
 * Insert newNode after referenceNode
 * @param {Object} newNode - Dom node to insert
 * @param {Object} referenceNode - Dom node to insert after
 */
export const insertAfter = (newNode, referenceNode) => {
	referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}


/**
 *
 * @param {String} name - Database name
 * @param {Number} version - Database version
 * @param {Array.<Object>} stores - array of objectstores config objects
 * @return {Promise<Object>} idb promise
 */
export const openDatabase = (name, version, stores = []) => {
	return idb.open(name, version, (upgradeDB) => {
		console.log(`Opened database: ${name}`);
		for(conststore of stores) {
			upgradeDB.createObjectStore(store.name, {
				keyPath: store.keyPath
			});
		}
	});
}

/**
 * remove all children of given DOM node
 * @param {Object} node - targteted DOM node
 */
export const removeChildren = (node) => {
	while (node.firstChild) {
    node.removeChild(node.firstChild);
	}
}