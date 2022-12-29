const path = require('path');

const config = {
  entry: {
    app: path.join(__dirname, '../', 'src/index.js')
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|woff|eot|svg|ttf)$/,
        use: 'url-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }

    ]
  },
  resolve: {
    extensions: ['.js']
  }
};

module.exports = config;
