import flyio from "flyio/dist/npm/wx";
import { promisify } from "@/utils/index";

const environment = "local"; // 配置环境

const fly = new flyio();

let token = "",
  tryCount = 0;
let isRelogin = false;

fly.config.baseURL = getBaseURL(environment);
fly.config.headers["Accept"] = "application/json";
fly.config.headers["Content-Type"] = "application/json; charset=utf-8";

function getBaseURL(env) {
  switch (env) {
    case "local":
      return "http://192.168.118.149:10701";
    case "mock":
      return "http://www.amusingcode.com:8001/mock/24/tell_v2";
    case "test":
      return "https://www.amusingcode.com/teller-v2";
    default:
      return "https://api.tellers.cn/teller-v2";
  }
}

function setRelogin() {
  isRelogin = true;
}

function showError(message, status, request) {
  wx.showToast({
    title: message,
    icon: "none",
    duration: 2000
  });
  sendBackErrorToCloud(message, status, request);
}

function sendBackErrorToCloud(message, status, request) {
  if (!request) {
    return false;
  }
  if (!wx.cloud) {
    return false;
  }
  const systemInfo = wx.getSystemInfoSync();
  const lauchOpts = getApp().globalData.options;
  const userId = getApp().globalData.user._id;
  const db = wx.cloud.database({
    env: environment == "prod" ? "tell-prod" : "tell-dev-2019"
  });
  const data = {
    systemInfo: systemInfo,
    lauchOpts: lauchOpts,
    requestName: request.url,
    method: request.method,
    params: request.params,
    body: request.body,
    status,
    userId,
    message,
    createdAt: Date()
  };
  db.collection("back-errors").add({ data });
}

function sendFrontErrorToCloud(error) {
  if (!wx.cloud) {
    return false;
  }
  const systemInfo = wx.getSystemInfoSync();
  const userId = getApp().globalData.user._id;
  const db = wx.cloud.database({
    env: environment == "prod" ? "tell-prod" : "tell-dev-2019"
  });
  const data = {
    systemInfo: systemInfo,
    userId,
    error,
    createdAt: Date()
  };
  db.collection("front-errors").add({ data });
}

async function login(userId) {
  isRelogin = false;
  tryCount = 0;
  if (userId) {
    token = userId;
    return fly.config.headers["x-csrf-token"] = userId;
  }
  let wxRes = await promisify(wx.login, wx)();
  let loginUrl = `/login?code=${wxRes.code}`;
  let query = getApp().globalData.options.query;
  if (query.scene) {
    loginUrl += `&scene=${query.scene}`;
  } else if (query.refer) {
    loginUrl += `&refer=${query.refer}`;
  }
  let logRes = await fly.get(loginUrl);
  token = logRes.data._id;
  fly.config.headers["x-csrf-token"] = token;
  wx.setStorage({
    key: 'token',
    data: token
  })
  logLogin(); // 上报登陆信息
  return (getApp().globalData.user = logRes.data);
}

function getUser() {
  return new Promise(function(resolve, reject) {
    fly.get("/user").then(res => {
      const user = res.data;
      getApp().globalData.user = user;
      resolve(user);
    });
  });
}

function uploadFile(path) {
  return new Promise(function(resolve, reject) {
    wx.uploadFile({
      url: getBaseURL(environment) + "/file",
      filePath: path,
      name: "img",
      header: {
        "x-csrf-token": token
      },
      success: function(res) {
        typeof resolve == "function" && resolve(res);
      },
      fail: function(err) {
        showError("上传头像失败", 500, {});
        typeof reject == "function" && reject(err);
      }
    });
  });
}

async function saveFormid(formId) {
  fly.put("/record/form", {
    formId
  });
}

async function logLogin() {
  const lauchOpts = getApp().globalData.options;
  const systemInfo = wx.getSystemInfoSync();
  fly.put("/record/login", {
    lauchOpts,
    systemInfo
  });
}

async function waitingLogin() {
  return new Promise(function(resolve, reject) {
    var hash = setInterval(function() {
      if (tryCount >= 100) {
        clearInterval(hash);
        wx.reLaunch({
          url: "/pages/noFound/index"
        });
        reject("登陆超时"); // 10秒超时时间
      }
      if (token) {
        clearInterval(hash);
        resolve("登陆成功");
      } else {
        tryCount++;
        console.log("正在等候登陆结果，请稍后");
      }
    }, 200);
  });
}

fly.interceptors.request.use(async function(request) {
  if (/login\?code=/.test(request.url)) {
    return request;
  }
  if (isRelogin) {
    await login();
  } else if (!token) {
    await waitingLogin();
  }
  // request.headers["Cookie"] = cookies;
  // request.headers["x-csrf-token"] = token;
  return request;
});

fly.interceptors.response.use(
  response => {
    // if (cookies && token) {
    //   return response.data;
    // }
    // if (response && response.headers && response.headers["set-cookie"]) {
    //   cookies = normalizeUserCookie(response.headers["set-cookie"]);
    //   token = getToken(response.headers["set-cookie"][0]);
    // }
    return response.data;
  },
  async err => {
    if (err.status == 502 || err.status == 404) {
      showError("服务器抽风啦，请稍后重试", err.status, err.request); // 生产环境：服务器正在重启
      wx.reLaunch({
        url: "/pages/noFound/index"
      });
    } else if (!err.response) {
      showError("服务器抽风啦，请稍后重试", err.status, err.request); // 本地环境：服务器正在重启
      wx.reLaunch({
        url: "/pages/noFound/index"
      });
    } else {
      showError(err.response.data.message, err.status);
    }
    return {};
  }
);

fly.login = login;
fly.saveFormid = saveFormid;
fly.uploadFile = uploadFile;
fly.getUser = getUser;
fly.setRelogin = setRelogin;
fly.sendFrontErrorToCloud = sendFrontErrorToCloud;
export default fly;
