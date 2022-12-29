//index.js
import PlvVideoUpload from '../../utils/polyv-upload-miniapp-sdk.min.js';

const getPolyvAuthorization = 'http://localhost:14002/getToken?isSubAccount=N';

Page({
  data: {
    src: '',
    uploaderidList: [],
  },
  onReady() {
    console.log('onReady');

    this.uploaderidList = [];

    const videoUpload = this.videoUpload = new PlvVideoUpload({
      parallelFileLimit: 5,
      events: {
        UploadComplete: this.onUploadComplete,
        Error: this.onError
      }
    });
    this.autoUpdateUserData(null, videoUpload);
  },
  getUserData(videoUpload) {
    console.log('getPolyvAuthorization: ',getPolyvAuthorization);

    wx.request({
      url: getPolyvAuthorization,
      method: 'GET',
      success(res) {
        const data = res.data;
        const userData = {
          userid: data.userid,
          ptime: data.timestamp,
          sign: data.sign,
          hash: data.hash
        };
        videoUpload.updateUserData(userData);
      },
      fail(error) {
        console.log(error);
      }
    });
  },
  // 由于sign等用户信息有效期为3分钟，需要每隔3分钟更新一次
  autoUpdateUserData(timer, videoUpload) {
    this.getUserData(videoUpload);
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(() => {
      this.autoUpdateUserData(timer, videoUpload);
    }, 3 * 50 * 1000);
  },
  // 事件回调
  onUploadComplete() {
    // 获取上传文件列表
    console.info('上传结束：', this.videoUpload.files);
  },

  onError(err) {
    if (err.code) {
      // 110：文件重复，111：拦截文件类型不在acceptedMimeType中的文件，102：用户剩余空间不足
      let errMag = `（错误代码：${err.code}）${err.message}`;
      if (err.code === 110 || err.code === 111) {
        errMag += ` ${err.data.filename}`;
      }
      console.error(errMag);
    } else {
      console.info(err);
    }
  },

  onFileStarted({ uploaderid, fileData }) {
    console.info('开始上传', uploaderid, fileData);
  },

  onFileProgress({ uploaderid, progress }) {
    const p = progress;
    console.log('onFileProgress: ', uploaderid, p);
  },

  onFileSucceed({ uploaderid, fileData }) {
    console.info( uploaderid,fileData);

    for (let i = 0; i < this.uploaderidList.length; i++) {
      const element = this.uploaderidList[i];
      if (element === uploaderid) {
        this.uploaderidList.splice(i,1);
      }
    }
    
  },

  onFileFailed({ uploaderid, errData }) {
    console.info('上传失败：',  uploaderid, errData);
  },

  onFileStopped({ uploaderid }) {
    const { videoUpload } = this;
    console.info('暂停上传 ' + uploaderid);
    console.info(videoUpload);
  },

  // 添加文件到上传列表
  async addFile(file) {
    const fileSetting = {
      desc: 'demo中设置的描述',
      cataid: 1615427644015,
      tag: 'demo中设置的标签',
      luping: 0,
      keepsource: 0,
      title: '',
      state: 'test'
    };

    // 添加文件到上传列表
    const uploader = await this.videoUpload.addFile(file, {
      FileStarted: this.onFileStarted,
      FileProgress: this.onFileProgress,
      FileSucceed: this.onFileSucceed,
      FileFailed: this.onFileFailed,
      FileStopped: this.onFileStopped,
    }, fileSetting);
    if (!uploader) {
      return;
    }

    const uploaderid = uploader.id;
    console.info(uploader);
    this.uploaderidList.unshift(uploaderid);
    console.info(this.uploaderidList);
    /* const $fileDom = $(fileDom(uploader));

    // 开始/恢复上传文件
    $fileDom.find('.js-fileStart').on('click', function() {
      videoUpload.resumeFile(uploaderid);
    });
    // 暂停上传文件
    $fileDom.find('.js-filePause').on('click', function() {
      videoUpload.stopFile(uploaderid);
    });
    // 删除文件
    $fileDom.find('.js-fileDelete').on('click', function() {
      videoUpload.removeFile(uploaderid);
      $fileDom.remove();
    });
    $uploadList.append($fileDom); */
  },
  
  chooseVideo() {
    const t = this;
    wx.chooseVideo({
      sourceType: ['album','camera'],
      compressed: false,
      camera: 'back',
      success(res) {
        console.log(res);
        // t.videoUrl = res.tempFilePath;
        // t.filesize = res.size;
        const filePath = res.tempFilePath;
        const name = filePath.substring(filePath.lastIndexOf('/') + 1);
        console.log(name);
        const file = {
          path: filePath,
          size: res.size,
          name,
          type: 'video/mp4' // TODO
        }
        t.addFile(file);
      },
      fail(e) {
        console.log('chooseVideo fail: ', e);
      }
    })
  },
  start() {
    const { videoUpload } = this;
    const uploaderid = this.uploaderidList[0];
    if (videoUpload) {
      videoUpload.resumeFile(uploaderid);
    }
  },
  pause() {
    const { videoUpload } = this;
    const uploaderid = this.uploaderidList[0];
    if (videoUpload) {
      videoUpload.stopFile(uploaderid);
    }
  },
  delete() {
    const uploaderid = this.uploaderidList[0];
    const { videoUpload } = this;
    if (videoUpload) {
      videoUpload.removeFile(uploaderid);
    }
    this.uploaderidList.shift();
  },
  allstart() {
    const { videoUpload } = this;
    if (videoUpload) {
      videoUpload.startAll();
    }
  },
  allstop() {
    const { videoUpload } = this;
    if (videoUpload) {
      videoUpload.stopAll();
    }
  },
  alldelete() {
    const { videoUpload } = this;
    if (videoUpload) {
      videoUpload.clearAll();
    }
    this.uploaderidList = [];
  },
  // 开始/恢复上传所有文件
/* $('#start').on('click', function() {
  if (videoUpload) {
    videoUpload.startAll();
  }
});

// 暂停上传所有文件
$('#pause').on('click', function() {
  if (videoUpload) {
    videoUpload.stopAll();
  }
});

// 清除所有文件
$('#clear').on('click', function() {
  if (videoUpload) {
    videoUpload.clearAll();
  }
  document.getElementById('select').value = '';
  $uploadList.html('');
});

$('#update').on('click', function() {
  const fileSetting = {
    title: $('#title').val(),
  };
  console.info(fileSetting);
  videoUpload.updateFileData($('#uploaderid').val(), fileSetting);
}); */
});


