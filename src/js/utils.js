/**
 * put object properties to array
 *
 * @param {Object} obj - object to turn to array
 */
export const objToArray = (obj = {}) => {
  const arr = [];
  for (let prop of Object.keys(obj)){
    if(obj.hasOwnProperty(prop)){
      arr.push(obj[prop]);
    }
  }
  return arr;
};

/**
 * Insert newNode after referenceNode
 * @param {Object} newNode - Dom node to insert
 * @param {Object} referenceNode - Dom node to insert after
 */
export const insertAfter = (newNode, referenceNode) => {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};

/**
 * remove all children of given DOM node
 * @param {Object} node - targteted DOM node
 */
export const removeChildren = (node) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};