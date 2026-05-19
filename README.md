# 日常三輪體空 242 實踐網站

這是一個可直接部署到 GitHub Pages 的純靜態網站。

## 檔案

- `index.html`：網站主頁
- `style.css`：版面樣式
- `script.js`：互動功能與 AI 產生功能

## 上架 GitHub Pages

1. 在 GitHub 建立新的 Repository。
2. 將本資料夾內的 `index.html`、`style.css`、`script.js`、`README.md` 上傳到 Repository 根目錄。
3. 到 Repository 的 `Settings` → `Pages`。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，Folder 選 `/root`。
6. 按 `Save`。
7. 等待 GitHub 產生網址，例如：`https://你的帳號.github.io/你的專案名稱/`。

## AI 功能提醒

此網站是公開靜態網站，不建議把 Gemini API Key 直接寫在程式碼裡。
網站已設計為讓使用者在頁面上自行輸入 API Key，並只儲存在自己的瀏覽器 localStorage。
