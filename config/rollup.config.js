import resove from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import { eslint } from 'rollup-plugin-eslint';
import replace from 'rollup-plugin-replace';
// import { uglify } from 'rollup-plugin-uglify'; // only support ES5
import { terser } from 'rollup-plugin-terser'; // uglify ES6
import json from "@rollup/plugin-json";

const path = require('path');

const DIR = {
  ROOT_PATH: path.resolve(__dirname, '../'),
  OUTPUT_PATH: path.resolve(__dirname, '../example/utils/'),
};

const isProd = process.env.NODE_ENV === 'production';

// 根据不同环境使用特定插件
const basePlugins = [
  // regenerator(),
  resove(),
  builtins(),
  commonjs(),
  json(),
  replace({
    ENV: process.env.NODE_ENV,
    delimiters: ['[[', ']]'],
  }),
];

const devPlugins = [eslint()];

const prodPlugins = [terser({
  compress: {
    defaults: false
  },
  mangle: {
    reserved: ['regeneratorRuntime', 'global']
  }
})];

const plugins = [...basePlugins].concat(isProd ? prodPlugins : devPlugins);

export default {
  input: path.join(DIR.ROOT_PATH, 'src/index.js'),
  output: {
    file: path.join(DIR.OUTPUT_PATH, 'polyv-upload-miniapp-sdk.min.js'),
    format: 'umd',
    name: 'polyv'
  },
  watch: {
    chokidar: {
      // if the chokidar option is given, rollup-watch will
      // use it instead of fs.watch. You will need to install
      // chokidar separately.
      //
      // this options object is passed to chokidar. if you
      // don't have any options, just pass `chokidar: true`
    },
    exclude: ['node_modules/**'],
  },
  plugins: plugins,
};
