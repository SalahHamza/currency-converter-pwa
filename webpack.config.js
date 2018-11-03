/*global __dirname:true*/
const path = require('path');
const WebpackPwaManifest = require('webpack-pwa-manifest');

module.exports = {
  entry: ['./src/js/index.js'],
  output: {
    path: path.resolve(__dirname, 'build/'),
    publicPath: '/build',
    filename: 'js/app.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader'
      }, {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }, {
        test: /\.(png|jpg|gif)$/,
        loader: 'url-loader'
      }, {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader' ,
        options: {
          limit: 10000,
          mimetype: 'application/font-woff',
        }
      }, {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader'
      },
    ]
  },
  plugins: [
    new WebpackPwaManifest({
      filename: '../manifest.json',
      fingerprints: false,
      name: 'Currency Converter',
      short_name: 'CC',
      description: 'Currency Converter Progressive Web App',
      background_color: '#223843',
      theme_color: '#223843',
      icons: [
        {
          src: path.resolve('src/images/money.png'),
          sizes: [192, 512], // multiple sizes
          destination: path.join('icons'),
        }
      ]
    })
  ],
  stats: {
    colors: true
  },
  devtool: 'source-map'
};

