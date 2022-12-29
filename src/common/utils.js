/**
 * 工具函数
 * @module utils
 * @ignore
 */

import ajxa from './ajax';

/**
 * 初始化视频信息
 * @param {UserDate} userData 用户信息
 * @param {FileData} fileData 文件信息
 * @returns {Promise}
 */
export function initUpload(userData, fileData) {
  const data = {
    ptime: userData.ptime,
    sign: userData.sign,
    hash: userData.hash,

    title: fileData.title,
    describ: fileData.desc,
    cataid: fileData.cataid,
    tag: fileData.tag,
    luping: fileData.luping,
    keepsource: fileData.keepsource,
    filesize: fileData.filesize,
    state: fileData.state,

    autoid: 1, // 自动生成vid，无需在请求参数中传vid
    uploadType: 'vod_miniapp_sdk_v1',
    compatible: 1
  };
  const url = `https://api.polyv.net/v2/uploadvideo/direct/${userData.userid}/init`;
  return ajxa.request(url, data, 'POST');
}

/**
 * 获取token
 * @param {UserData} userData 用户信息
 * @returns {Promise}
 */
export function getToken(userData) {
  const { sign, ptime, hash, userid } = userData;
  const data = {
    ptime: ptime,
    sign: sign,
    hash: hash,
    compatible: 1
  };
  const url = `https://api.polyv.net/v2/uploadvideo/${userid}/token`;
  return ajxa.request(url, data);
}

// 获取文件md5
function _generateFingerprint(fileData) {
  const { file } = fileData;
  return new Promise((resolve, reject) => {
    wx.getFileInfo({
      filePath: file.path,
      success(res) {
        resolve(res.digest);
      },
      fail(res) {
        reject(res);
      }
    });
  });
}

/**
 * 过滤带尖括号的标签
 * @param {String} str 待处理的字符
 * @returns {String}
 */
export function cleanStript(str) {
  if (str && typeof str === 'string') {
    str = str.trim();
    str = str.replace(/<.+?>/g, '');
  }
  return str;
}

/**
 * 生成fileData对象
 * @param {File} file 文件对象
 * @param {Object} fileSetting 用户对文件的设置
 * @param {UserData} userData 用户信息
 * @returns {FileData}
 */
export async function generateFileData(file, fileSetting, userData) {
  // 设置默认值
  const fileData = {
    desc: '',
    cataid: 1,
    tag: '',
    luping: 0,
    keepsource: 0,
    title: file.name.replace(/\.\w+$/, ''),
    filename: file.name
  };
  for (const key in fileSetting) {
    if (key === 'title') {
      if (typeof fileSetting.title !== 'string' || fileSetting.title.replace(/(^\s*)|(\s*$)/, '') === '') {
        continue;
      }
      fileData.title = cleanStript(fileSetting.title);
    } else {
      fileData[key] = fileSetting[key];
    }
  }
  Object.defineProperty(fileData, 'file', { value: file, writable: false, enumerable: false, configurable: false });
  Object.defineProperty(fileData, 'size', { value: file.size, writable: false, enumerable: false, configurable: false });
  Object.defineProperty(fileData, 'filesize', { value: file.size, writable: false, enumerable: false, configurable: false });
  const hash = await _generateFingerprint(fileData);
  Object.defineProperty(fileData, 'id', { value: hash, writable: false, enumerable: false, configurable: false });
  return fileData;
}

function getAPIProtocol() {
  return 'https:';
}

/**
 * 强制https
 * @param {*} inputUrl 传入url
 * @returns outputUrl 输出url
 */
export function prefixUrl(valueStr) {
  const protocal = 'https:';
  if (typeof valueStr !== 'string' || valueStr.trim() === '') {
    return '';
  }
  if (/^http/.test(valueStr)) {
    return valueStr.replace('http:', protocal);
  } else if (/^\/\//.test(valueStr)) { // 双斜杠开头的路径
    return `${protocal}${valueStr}`;
  }
  return valueStr;
}

/**
 * 生成ossConfig对象
 * @param {Object} data init接口或获取token的接口返回的data
 * @returns {Object}
 */
export function generateOssConfig(data) {
  const protocol = getAPIProtocol();
  return {
    endpoint: protocol + '//' + data.domain,
    bucket: data.bucketName,
    accessKeyId: data.accessId,
    accessKeySecret: data.accessKey,
    stsToken: data.token,
    secure: protocol === 'https:',
    cname: true
  };
}

// 默认允许上传的文件类型
const DEFAULT_ACCEPTED_MIME_TYPE = 'video/avi,.avi,.f4v,video/mpeg,.mpg,video/mp4,.mp4,video/x-flv,.flv,video/x-ms-wmv,.wmv,video/quicktime,.mov,video/3gpp,.3gp,.rmvb,video/x-matroska,.mkv,.asf,.264,.ts,.mts,.dat,.vob,audio/mpeg,.mp3,audio/x-wav,.wav,video/x-m4v,.m4v,video/webm,.webm,.mod';
function _isContainFileMimeType(file, acceptedMimeType) {
  const acceptedList = acceptedMimeType.split(',');
  return acceptedList.indexOf(file.type) > -1 || acceptedList.indexOf(file.name.replace(/.+(\..+)$/, '$1').toLowerCase()) > -1;
}

/**
 * 上传文件的文件类型是否在允许范围内
 * @param {File} file
 * @param {String} extraAcceptedMimeType 用户自定义的允许上传的文件类型，使用英文逗号分隔
 * @returns {Boolean}
 */
export function isContainFileMimeType(file, extraAcceptedMimeType) {
  const isContainDefaultFileMimeType = _isContainFileMimeType(file, DEFAULT_ACCEPTED_MIME_TYPE);
  // 无论用户是否自定义了上传文件类型，都应该首先符合点播后台要求的上传文件类型
  const isContainExtraFileMimeType = extraAcceptedMimeType ? _isContainFileMimeType(file, extraAcceptedMimeType) : true;
  return isContainDefaultFileMimeType && isContainExtraFileMimeType;
}
