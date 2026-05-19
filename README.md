# 日常三輪體空 242 實踐網站

## 直接上 GitHub Pages

請上傳以下前端檔案到 GitHub Repository 根目錄：

- `index.html`
- `style.css`
- `script.js`
- `firebase-config.js`
- `manifest.webmanifest`
- `sw.js`
- `assets/`

再到 Settings → Pages → Deploy from branch → main / root。

## 必填：Cloudflare Worker

前端不能安全保存 Gemini API Key，所以必須先部署 `worker/worker.js`。

部署後，將 Worker 網址填入：

```js
export const WORKER_ENDPOINT = "https://你的-worker.workers.dev";
```

## 選填：Firebase 雲端資料庫與統計

若要啟用雲端使用紀錄與全站統計，請到 Firebase 建立專案，開啟 Firestore，並修改 `firebase-config.js`：

```js
export const FIREBASE_SETTINGS = {
  enabled: true,
  config: {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
  }
};
```

若保持 `enabled:false`，網站仍可使用本機自動儲存與本機使用次數統計。

## 已加入功能

- 手機版優化
- PWA 安裝功能
- 自動儲存草稿
- Cloudflare Worker 代理 Gemini API
- 分享文字
- 產生日記圖片並下載/分享
- 使用紀錄
- Firebase 雲端紀錄入口
- AI 圖片生成入口
