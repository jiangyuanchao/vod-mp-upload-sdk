# POLYV 视频上传 SDK
Polyv 小程序 上传 SDK 为您提供上传媒体文件到[保利威云点播平台](http://www.polyv.net/vod/)的开发工具包。


## 功能
- 快捷上传多种格式的媒体文件。
- 支持上传时的各种设置，如文件标题、描述、标签、上传目录、是否开启课件优化处理等。


## 使用方法

### 前提条件
1. 使用本 SDK 前，要先开通**保利威云点播服务**。如果您还不了解该服务，请登录产品主页查看，详见：[云点播](http://www.polyv.net/vod/)。
2. 获取 secretKey 等相关信息用于用户身份校验，您可以在「云点播管理后台 -> 设置 -> API接口」页面中找到相关信息，[点击这里登录后台](http://my.polyv.net/v2/login)。

### 微信基础库版本
- 1.9.6以上

#### 注意
##### 1.当前文件若使用 async await语法糖，需要打开增强编译
```
只要把“微信开发者工具”更新到 v1.02.1904282 以上，就不需要干 npm install regenerator 这之类的事情，只需要修改一个配置项就能使用 async/await 特性了。这个配置就在“工具栏?详情?本地设置”页面中的“增强编译”。
```

### 集成 SDK
您可以选择以下任意一种方法调用本 SDK：

#### 引入资源
```js
import PlvVideoUpload from '../../utils/polyv-upload-miniapp-sdk.min.js';
```


## 快速开始

### 初始化上传实例

首先，创建 PlvVideoUpload 实例。
```js
const videoUpload = new PlvVideoUpload({
  events: {
      Error: (err) => {  // 错误事件回调
          console.log(err);
      },
      UploadComplete: () => {}  // 全部上传任务完成回调
  }
});
```

调用 `updateUserData()` 设置账号授权验证信息，并每隔 3 分钟更新一次
```js
// 授权验证信息3分钟内有效，当 sign 过期时需要调用该方法更新
videoUpload.updateUserData({
  userid: <userid> , // Polyv云点播账号的ID
  ptime: <timestamp> , // 时间戳
  sign: <sign> , // 是根据将secretkey和ts按照顺序拼凑起来的字符串进行MD5计算得到的值
  hash: <hash> , // 是根据将ts和writeToken按照顺序拼凑起来的字符串进行MD5计算得到的值
});
```

其中 ptime、sign 和 hash 都要从服务端获取，服务端的代码示例（PHP）如下：

```php
/* 
 * userid、secretkey、writeToken 都可以在「云点播管理后台 -> 设置 -> API接口」页面中找到。
 */
$userid = "your userid";
$secretkey = "your sercrety";
$writeToken = "your writeToken";

$ptime = time() * 1000;
$sign = md5($secretkey . $ptime);
$hash = md5($ptime . $writeToken);
```

### 添加上传文件进入上传列表
```js
fileSetting = { // 文件上传相关信息设置
  title: <title>,  // 标题
  desc: <desc>,  // 描述
  cataid: <cataid>,  // 上传分类目录ID
  tag: <tag>,  // 标签
  luping: 0,  // 是否开启视频课件优化处理，对于上传录屏类视频清晰度有所优化：0为不开启，1为开启
  keepsource: 0  // 是否源文件播放（不对视频进行编码）：0为编码，1为不编码
};
```

调用 PlvVideoUpload 实例的 `addFile(file, events, fileSetting)` 方法，添加文件到文件列表，该方法返回一个 `UploadManager` 对象：

```js
var uploadManager = videoUpload.addFile(
  file, // file 为待上传的文件对象
  { 
    FileStarted: function(uploadInfo) { // 文件开始上传回调
        console.log("文件上传开始: " + uploadInfo.fileData.title);
    },
    FileProgress: function(uploadInfo) { // 文件上传过程返回上传进度信息回调
        console.log("文件上传中: " + (uploadInfo.progress * 100).toFixed(2) + '%');
    },
    FileStopped: function(uploadInfo) { // 文件暂停上传回调
        console.log("文件上传停止: " + uploadInfo.fileData.title);
    },
    FileSucceed: function(uploadInfo) { // 文件上传成功回调
        console.log("文件上传成功: " + uploadInfo.fileData.title);
    },
    FileFailed: function(uploadInfo) { // 文件上传失败回调
        console.log("文件上传失败: " + uploadInfo.fileData.title);
    }
  },
  fileSetting
);
```


## API 文档
见源代码中的 docs 文件夹或 [点击此处打开](https://polyv.github.io/vod-upload-js-sdk/api/1.x/index.html)。


## 示例代码
源代码中的 demo 文件夹包含示例：

- 引入 SDK 的示例。需要修改 build 文件夹下的 webpack.dev.config.js 文件中的账号信息，然后在本项目根目录下运行 `npm run dev` ，打开微信开发者工具访问 `example` 目录即可。

## 错误代码

Error 事件已知错误类型：

| code | 描述 |
| --- | -- |
| 102 | 用户剩余空间不足 |
| 110 | 文件重复 |
| 111 | 拦截文件类型不在 acceptedMimeType 中的文件 |
| 112 | 文件已经开始上传或已上传完毕，禁止修改文件信息 |

FileFailed 事件已知错误类型：

| type                 | code | 描述                         |
| -------------------- | ---- | ---------------------------- |
| InitUploadError      | 3001 | 分类不存在                   |
| InitUploadError      | 405  | 上传视频初始化失败           |
| InitUploadError      | 406  | 视频大小不能为0              |
| InitUploadError      | 408  | 账户服务状态异常，请联系客服 |
| UpdateTokenError     |      | 更新上传token时获取token失败 |



## 版本更新
### v1.0.0
