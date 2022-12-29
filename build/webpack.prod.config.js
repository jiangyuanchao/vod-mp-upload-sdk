const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const outPutPath = path.join(__dirname, '../example/utils');

const prodConfig = merge(common, {
  // devtool: 'source-map',
  output: {
    filename: 'polyv-upload-miniapp-sdk.min.js',
    path: outPutPath,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  plugins: [
    new UglifyJSPlugin({
      sourceMap: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  ]
});

module.exports = prodConfig;
