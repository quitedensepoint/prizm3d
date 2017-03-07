/* jshint node: true */

var webpack = require('webpack');
var path = require('path');

const loaders = [
  {
    loader: 'css-loader',
    options: {
      modules: true
    }
  },
  {
    loader: 'postcss-loader'
  },
  {
    loader: 'sass-loader'
  }
];

const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
    filename: "assets/css/styles.css",
});

module.exports = {
    entry: path.resolve(__dirname, './app.js'),
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: '/dist/',
        filename: 'bundle.js',
        sourceMapFilename: '[file].map'
    },
    module: {
        rules: [
            { test: /\.html$/, loader: 'underscore-template-loader' },
            // fonts used in CSS should not be inlined
            { test: /\.pcc\.(woff|eot|svg|ttf)$/, loader: 'file-loader?name=fonts/[name].[ext]' },
            // load SVG file as an XML string
            { test: /\.svg$/, loader: 'html-loader' },
            // PNG fallbacks should not be inlined, so modern browsers do not have to
            // download the PNG sprite
            { test: /\.png$/, loader: 'file-loader?name=img/[name].[ext]' },
            {
				test: /\.js$/,
				exclude: [/node_modules/],
				use: [{
				  loader: 'babel-loader',
				  options: { presets: ['es2016'] }
				}]
			},
            {
				test: /\.css$/,
				loader: extractSass.extract({
					loader: [{
						loader: "css-loader"
					},
					{
						loader: "sass-loader"
					}]
				})
			}
        ]
    }
};
