const snackbarCSS = '.snackbar{opacity:0;position:fixed;z-index:3;bottom:0;left:0;right:0;background-color:rgb(35, 29, 29);padding:14px 0 14px 24px;box-sizing:border-box;display:flex;transition:opacity 0.3s ease;}\
.snackbar .message{flex:1;color:white;margin:0 48px 0 0}\
.snackbut{margin:0 24px 0 0;float:right;color:tomato;text-transform:uppercase;background-color:transparent;border:0;letter-spacing:1px;cursor:pointer;}\
@media screen and (min-width:624px){.snackbar{bottom:16px;left:24px;width:fit-content;border-radius:2px;min-width:300px;max-width:600px}}';

export default class Snackbar {
	constructor(message, duration) {
    this.message = message;
    this.duration = duration;

    /* keeping a list of all timeouts to
    clear them when snackbar is gone */
    this._timeouts = [];

    this.create();


    /* setting timeout to hide snackbar if duration is provided */
    if(this.duration && this.duration > 0){
      // set a timeout && hide (clear timeout as well)
      const hideTimeout = setTimeout(() => {
        this.hide();
      }, this.duration * 1000);
      // keeping it for later clear
      this._timeouts.push(hideTimeout);
    }
  }

  static setSnackbarCSS(doc){
    const head = doc.head || doc.getElementsByTagName('head')[0],
    style = doc.createElement('style');

    style.type = 'text/css';
    if (style.styleSheet){
      // This is required for IE8 and below.
      style.styleSheet.cssText = snackbarCSS;
    } else {
      style.appendChild(doc.createTextNode(snackbarCSS));
    }
    head.appendChild(style);
    return style;
  }

	create(){

		/* create snackbar Container */
    this.container = document.createElement('div');
    this.container.classList.add('snackbar');

    /* create snackbar message */
    const messageElem = document.createElement('p');
		messageElem.classList.add('message');
    messageElem.textContent = this.message;
    this.container.appendChild(messageElem);

    // setting default action
    this.setAction('dismiss');

    // returning 'this' for chaining
    return this;
  }

  setAction(name, callback, hideManually = false){
    const buttonElem = document.createElement('button');
    buttonElem.classList.add('snackbut');
    buttonElem.innerText = name;

    /* Action Event */
    buttonElem.addEventListener('click', (event) => {
      if(callback){
        callback(event.target, this.container);
      }
      if(hideManually) return;
      this.hide();
    });

    this.container.appendChild(buttonElem);

    return this;
  }

  show(nodeToAppendTo){
    nodeToAppendTo.appendChild(this.container);
    const opacityTimeout = setTimeout(() => {
      this.container.style.opacity = '1';
    }, 500);
    this._timeouts.push(opacityTimeout);
  }

  hide(){
    this.container.parentNode.removeChild(this.container);

    /* clear all set timeouts */
    for(let timeout in this._timeouts){
      clearTimeout(timeout);
    }
    this._timeouts = [];
  }

}