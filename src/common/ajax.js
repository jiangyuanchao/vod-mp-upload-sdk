const ajxa = {
  request(url, data = {}, type = 'GET') {
    if (!url) console.warn('!!request url can not be empty');
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: type,
        data: data,
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 字符
        },
        success(res) {
          resolve(res.data);
        },
        fail(error) {
          reject(error);
        }
      });
    });
  }
};

export default ajxa;
