# Currency Converter Progressive Web App

Currency Converter Progressive Web App capstone project for the Google Africa Challenge Scholarship: Mobile Web Specialist Course by Google, Udacity and Andela Learning Community.

Check [the app demo](https://salahhamza.github.io/currency-converter-pwa/) live and functioning.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development.

### Prerequisites

You first need a copy of the code in your local machine, you can do that by running this command:

```
git clone https://github.com/SalahHamza/currency-converter-pwa.git
```

### Installing

To get up and running all you need to do is install the development dependencies. You can do that by running:

```
npm install
```

**Note**: Make sure you are inside the project directory.

After that make sure to run Webpack in order to generate the needed assests.

```
npm run develop
```
Running webpack on **development mode** will generate un-optimized assets like scripts and stylesheets.


```
npm run build
```
Running webpack on **production mode** will generate optimized assets (Optimization includes: minification, scope hoisting, tree-shaking and more.).

After that make sure to start up a simple HTTP server. Here are the steps to do so:

1. In this folder, start up a simple HTTP server to serve up the site files on your local computer. Python has some simple tools to do this, and you don't even need to know Python. For most people, it's already installed on your computer.

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

2. With your server running, visit the site: `http://localhost:8000`, and look around for a bit to see what the current experience looks like.
3. Explore the provided code, and start making a plan to implement the required features in three areas: responsive design, accessibility and offline use.
4. Write code to implement the updates to get this site on its way to being a mobile-ready website.

Alternatively, If you are using chrome you can download [**Web server for chrome**](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb) extension, it's easy to use and works offline.

## Running the tests

No tests available.

## Built With

* [npm](https://npmjs.com) - Dependency Management
* [https://webpack.js.org/](Webpack) - Used bundler
* [https://babeljs.io/](Babel) - Used to compile code from ES2015+ to ES5

## License

No license.

## Acknowledgments

* Thanks to ALC, Google and Udacity for giving us the chance to learn new things
* Thanks to instructors and reviewers for being helpful and patient with us