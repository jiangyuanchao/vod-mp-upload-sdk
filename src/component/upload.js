import PubSub from 'jraiser/pubsub/1.2/pubsub';

import {
  initUpload,
  getToken,
  generateOssConfig,
  cleanStript,
  prefixUrl
} from '../common/utils';

const NET_ERR = '网络错误，请检查网络后重试';

class UploadManager extends PubSub {
  /**
   * 管理单个文件上传
   * @ignore
   * @param {UserData} userData 用户信息
   * @param {FileData} fileData 文件信息
   * @param {Object} [events] 事件回调
   * @param {Object} [config] 用户设置（暂未开放）
   * @property {String} id 每个上传实例的唯一标识
   * @property {Number} statusCode 文件的上传状态码：-1 已完成 0 上传中 1 未开始 2 暂停状态
   */
  constructor(userData, fileData, events = {}, config = {}) {
    super(events);

    this.userData = userData;
    this.fileData = fileData;

    // 用户设置，暂不开放
    this.parallel = config.threadCount;
    this.partSize = config.partSize;
    this.retryCount = typeof config.retryCount === 'number' ? config.retryCount : 3;

    this.statusCode = 1; // 文件的上传状态码：-1 已完成 0 上传中 1 未开始 2 暂停状态
    this.percentage = 0;
    this.id = fileData.id;
    this.isDeleted = false; // 从列表删除后改为true，用于判断stop回调里面是否要重新加到waitQueue
  }

  addRejectListener(reject) {
    this.reject = reject;
  }

  addResolveListener(resolve) {
    this.resolve = resolve;
  }

  // 修改文件信息
  updateFileData(fileData) {
    for (const key in fileData) {
      // 不允许将title改为为空字符串
      if (key === 'title') {
        if (typeof fileData.title !== 'string' || fileData.title.replace(/(^\s*)|(\s*$)/, '') === '') {
          continue;
        }
        this.fileData.title = cleanStript(fileData.title);
      } else {
        this.fileData[key] = fileData[key];
      }
    }
  }

  // 开始/继续文件上传
  _start() {
    if (this.statusCode === 2) { // 暂停状态
      this.statusCode = 0; // 上传中
      return this._Upload();
    }
    this.statusCode = 0; // 上传中

    const { userData, fileData } = this;

    return initUpload(userData, fileData).then(res => {
      const data = res.data;
      // 上传失败
      if (res.code !== 200) {
        this._emitFileFailed({
          code: res.code,
          message: res.message,
          type: 'InitUploadError',
        });
        return Promise.resolve({
          data: {
            uploader: this,
          },
          code: 101,
          message: res.message
        });
      }

      // 用户剩余空间不足
      if (fileData.size > data.remainSpace) {
        return Promise.resolve({
          data: {
            id: this.id,
            uploader: this
          },
          code: 102,
          message: '您的剩余空间不足，请及时联系客服升级空间'
        });
      }

      this.fileData.vid = data.vid;

      /**
       * 触发上传开始事件
       * @fires UploadManager#FileStarted
       */
      this.trigger('FileStarted', {
        uploaderid: this.id,
        fileData
      });

      const filename = fileData.file.name;
      // const callback = JSON.parse(Base64.decode(data.callback) || 'null');

      this.ossConfig = data;
      // 上传到OSS的name
      this.filenameOss = data.dir + data.vid + filename.substring(filename.lastIndexOf('.'));
      // 上传回调
      // this.callbackBody = {
      //   url: callback.callbackUrl,
      //   body: callback.callbackBody,
      //   host: callback.callbackHost
      // };

      return this._Upload();
    }).catch((err) => {
      // 上传失败
      this._emitFileFailed({
        code: '',
        message: err.message,
        type: 'UploadError',
      });
      return Promise.resolve({
        data: {
          uploader: this,
        },
        code: 101,
        message: NET_ERR
      });
    });
  }

  // 直传
  _Upload() {
    // wx上传
    return new Promise((resolve, reject) => {
      const t = this;
      const { ossConfig, filenameOss } = this;
      const { host, signature, accessid, policy, callback } = ossConfig;
      const filePath = this.fileData.file.path; // 待上传文件的文件路径。

      const uploadTask = this.uploadTask = wx.uploadFile({
        url: prefixUrl(host), // 开发者服务器的URL。
        filePath,
        name: 'file', // 必须填file。
        formData: {
          key: filenameOss,
          policy,
          OSSAccessKeyId: accessid,
          signature,
          callback
          // 'x-oss-security-token': securityToken // 使用STS签名时必传。
        },
        success: (res) => {
          if (res.statusCode === 204 || res.statusCode === 200) {
            t._finish();
            return resolve({
              code: 100,
              message: `${this.fileData.title}完成上传`,
              data: {
                id: this.id
              },
            });
          }
        },
        fail: err => {
          // 微信小程序取消上传返回msg
          if (err.errMsg == 'uploadFile:fail abort') {
            err.name = 'cancel';
            err.status = 0;
          }
          return t._handleUploadError(err, resolve, reject);
        }
      });
      uploadTask.onProgressUpdate((res) => {
        t._updateProgress(res.progress);
      });
    });
  }

  // 处理catch到Upload方法出错的情况
  _handleUploadError(err, resolve, reject) {
    // 取消/暂停上传
    if (err.status === 0 && err.name === 'cancel') {
      if (!this.isDeleted) {
        this.trigger('FileStopped', {
          uploaderid: this.id,
          fileData: this.fileData
        });
      }
      return resolve({
        code: 104,
        message: '暂停上传',
        data: {
          uploader: this,
        },
      });
    }

    // Upload ID 不存在
    if (err.status == 404 && err.name == 'NoSuchUploadError') {
      if (this.retryCount > 0) {
        return this._retry(resolve);
      }
      this._emitFileFailed({
        code: '',
        message: err.message,
        type: 'NoSuchUploadError',
      });
      return resolve({
        data: {
          uploader: this,
        },
        code: 105,
        message: 'Upload ID 不存在'
      });
    }

    // token过期，获取最新token后继续从端点上传
    // if (err.status == 403) {
    //   return this._updateToken(resolve, reject);
    // }

    // 重传
    if (this.retryCount > 0) {
      return this._retry(resolve);
    }

    // 上传失败
    this._emitFileFailed({
      code: '',
      message: err.message,
      type: err.name,
    });
    return resolve({
      data: {
        uploader: this,
      },
      code: 101,
      message: NET_ERR
    });
  }

  // catch到Upload方法出错尝试有限次数的重传
  _retry(resolve) {
    this.retryCount--;
    // 返回新的promise，以便于判断所有文件上传结束
    return resolve({
      code: 107,
      message: '上传错误，正在重试',
      data: {
        uploader: this
      }
    });
  }

  // 更新上传token
  _updateToken(resolve, reject) {
    getToken(this.userData)
      .then(res => {
        // 请求失败
        if ('success' !== res.status) {
          this._emitFileFailed({
            code: '',
            message: res.message,
            type: 'UpdateTokenError',
          });
          return resolve({
            data: {
              uploader: this,
            },
            code: 101,
            message: NET_ERR
          });
        }

        this.ossConfig = generateOssConfig(res.data);
        // 返回新的promise，以便于判断所有文件上传结束
        return resolve({
          code: 106,
          message: 'token过期，正在重试',
          data: {
            promise: this._Upload()
          }
        });
      })
      .catch((err) => {
        this._emitFileFailed({
          code: '',
          message: '接口请求失败',
          type: 'UpdateTokenError',
        });
        return reject(err);
      });
  }

  _emitFileFailed(errData) {
    /**
     * @fires UploadManager#FileFailed
     */
    this.trigger('FileFailed', {
      uploaderid: this.id,
      errData,
      fileData: this.fileData
    });
  }

  // 停止文件上传
  _stop() {
    if (this.statusCode !== 0) { // 上传中
      return this.resolve();
    }
    this.statusCode = 2; // 暂停状态
    if (!this.uploadTask) {
      return this.resolve();
    }
    this.uploadTask.abort();
  }

  // 文件完成上传
  _finish() {
    this.statusCode = -1; // 已完成
    this.percentage = 1;
    /**
     * @fires UploadManager#FileSucceed
     */
    this.trigger('FileSucceed', {
      uploaderid: this.id,
      fileData: this.fileData
    });
  }

  // 更新上传进度
  _updateProgress(progress) {
    this.percentage = progress;
    /**
     * @fires UploadManager#FileProgress
     */
    this.trigger('FileProgress', {
      uploaderid: this.id,
      progress,
      fileData: this.fileData
    });
  }
}

export default UploadManager;
