const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const webpack = require('webpack');
const outPutPath = path.join(__dirname, '../example/utils');
const md5 = require('md5');

// TODO
const accountData = {
  userid: '46c10ad8d2',
  // userid: 'LZM6z1qyQD8X',
  secretkey: 'Pc2u2SS2MQ',
  writeToken: 'QFST70VoOxCsyET-r1D08P8Yygq4jOil',
};


const devConfig = merge(common, {
  devtool: 'inline-source-map',
  output: {
    filename: 'polyv-upload-miniapp-sdk.min.js',
    path: outPutPath,
    libraryTarget: 'umd',
    umdNamedDefine: true,
    hotUpdateChunkFilename: 'hot/hot-update.js',
    hotUpdateMainFilename: 'hot/hot-update.json'
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ],
  devServer: {
    host: '0.0.0.0',
    port: 14002,
    compress: true,
    overlay: true,
    before: function(app) {
      app.get('/getToken', (req, res) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json;charset=utf8');

        const timestamp = Date.now();
        const { userid, writeToken, secretkey } = accountData;
        const hash = md5(timestamp + writeToken);
        const sign = md5(secretkey + timestamp);
        res.send({
          timestamp,
          hash,
          sign,
          userid,
        });
      });
    }
  }
});

module.exports = devConfig;
