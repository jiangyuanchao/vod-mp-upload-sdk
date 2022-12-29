const compressing = require('compressing');
const path = require('path');
const fs = require('fs');

const concatPath = (dir) => {
  return path.join(__dirname, dir);
};

const name = 'polyv-upload-miniapp-sdk';
const currentPath = concatPath('../example');
const newPath = concatPath(`../${name}`);

fs.rename(currentPath, newPath, function(err) {
  if (err) { console.warn('/** 文件夹修改名称失败 **/'); } else console.info('/** 文件夹修改名称成功 **/');
});

compressing.zip.compressDir(newPath, `${name}.zip`)
  .then(() => {
    console.info('/** zip success **/');
    fs.rename(newPath, currentPath, function(err) {
      console.log(err);
    });
  })
  .catch(err => {
    console.error(err);
  });
