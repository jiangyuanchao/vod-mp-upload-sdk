
const md5 = require('../../utils/md5');
import { prefixUrl } from '../common/utils';

Page({
  data: {

  },
  chooseVideo() {
    const t = this;
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      compressed: false,
      camera: 'back',
      success(res) {
        t.videoUrl = res.tempFilePath;
        t.filesize = res.size;
      },
      fail(e) {
        console.error('chooseVideo fail: ', e);
      }
    });
  },
  requestToken() {
    const t = this;
    const userid = 'userid';
    const secrectKey = 'secrectKey';
    const writetoken = 'writetoken';
    const ptime = Date.now();
    const filesize = this.filesize;
    const sign = md5(secrectKey + ptime);
    const hash = md5(ptime + writetoken);
    const uploadType = 'plugin_miniapp_v1';
    const title = 'test video';

    wx.request({
      url: `https://api.polyv.net/v2/uploadvideo/direct/${userid}/init`,
      data: {
        ptime,
        sign,
        hash,
        filesize,
        userid,
        uploadType,
        title,
        compatible: 1,
        isSts: 'N'
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method: 'POST',
      timeout: 5000,
      success: (result) => {
        const data = result.data.data;
        t.upload(data);
      },
      fail: (res) => {
        console.error(res);
      }
    });
  },

  upload(data) {
    const t = this;
    // const { host, signature, policy, accessid, dir } = data;
    const host = prefixUrl(data.host);
    const signature = data.signature;
    const OSSAccessKeyId = data.accessid;
    const policy = data.policy;
    const filePath = t.videoUrl; // 待上传文件的文件路径。
    const key = data.dir + data.vid + filePath.substring(filePath.lastIndexOf('.'));
    const callback = data.callback;
    // const securityToken = '<x-oss-security-token>';

    const uploadTask = t.uploadTask = wx.uploadFile({
      url: host, // 开发者服务器的URL。
      filePath: t.videoUrl,
      name: 'file', // 必须填file。
      formData: {
        key,
        policy,
        OSSAccessKeyId,
        signature,
        callback
        // 'x-oss-security-token': securityToken // 使用STS签名时必传。
      },
      success: (res) => {
        if (res.statusCode === 204) {
          console.log('上传成功', res);
        }
      },
      fail: err => {
        console.error(err);
      }
    });
  },
  cancel() {
    this.uploadTask.abort();
  },
});
