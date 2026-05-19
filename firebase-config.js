// 1) 請先部署 worker/worker.js 到 Cloudflare Workers
// 2) 把 Worker 網址貼在這裡，例如：https://gemini-proxy.你的帳號.workers.dev
export const WORKER_ENDPOINT = "";

// Firebase 可選：若不使用雲端資料庫與統計，可保持 enabled:false
// 若要啟用，請到 Firebase 建立 Web App + Firestore，填入 config，並改 enabled:true
export const FIREBASE_SETTINGS = {
  enabled: false,
  config: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  }
};
