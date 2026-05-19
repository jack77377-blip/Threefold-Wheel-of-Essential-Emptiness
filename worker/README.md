# Cloudflare Worker 部署說明

1. 到 Cloudflare Dashboard → Workers & Pages → Create Worker。
2. 將 `worker.js` 內容貼上並部署。
3. 到 Worker → Settings → Variables 新增：
   - `GEMINI_API_KEY`：你的 Gemini API Key
   - 可選：`GEMINI_TEXT_MODEL`：`gemini-2.0-flash`
   - 可選：`GEMINI_IMAGE_MODEL`：依 Google AI Studio 目前支援的圖片模型填入
4. 複製 Worker 網址，例如：`https://gemini-proxy.xxx.workers.dev`
5. 回到網站檔案 `firebase-config.js`，將網址填入 `WORKER_ENDPOINT`。
