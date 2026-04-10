# CalorieBank（卡路里銀行）🏦

一個以 React Native + Expo 開發的卡路里與健康管理應用，強調資料留在本機、AI 由使用者自行帶入金鑰。

## 核心理念 — 「你的數據，你來做主」

CalorieBank 採 **Local-First（本地優先）** 與 **使用者自帶 API Key** 的 AI 設計：生理與飲食資料主要存於裝置；呼叫 Google Gemini／備援 AI 時由你的金鑰直接連線供應商，不經 CalorieBank 伺服器。

## 核心功能

### 飲食與 AI 辨識

- **AI 食物影像辨識**：使用 **Google Gemini**（`@google/genai`），於設定中貼上 **Google AI Studio** 取得的 API Key。可選預設模型（如 **Gemini 2.5 Flash**、Flash-Lite、Pro）或自訂模型 ID，並支援連線驗證與（原生端）列出可用模型。
- **備援 AI（Groq）**：當 Gemini 發生過載、頻率限制等狀況時，若已於設定中儲存 **Groq API Key**，可改以 Groq（預設 Llama 系列模型）解析影像／文字，流程與主線相同。
- **文字描述辨識**：除拍照外，可依文字描述食物（達最小字數）請 AI 估算熱量與三大營養素。
- **飲食紀錄**：早／午／晚／點心分類、手動新增與編輯、份量倍率、自訂飲食標籤，並可依日期瀏覽與管理。
- **儲存餐點（常用模板）**：將常吃的組合存成模板，從設定或紀錄流程快速一鍵加入當日紀錄。

### 熱量與營養管理

- **熱量目標**：依 **Mifflin-St Jeor** 與活動等級計算 TDEE，並依目標體重與減重／增重速度調整每日熱量目標。
- **三大營養素追蹤**：首頁與紀錄頁顯示蛋白質、碳水、脂肪與目標比例。

### 體重與身體數據

- **體重紀錄**：每日體重，可選填體脂率；支援歷史列表與趨勢圖表。
- **分析頁**：約 **90 天**體重曲線；若有體脂資料，另有體脂趨勢與 **30 天**體脂摘要（平均、變化）。摘要區含 **7 天**平均攝入熱量、運動消耗與體重變化區間說明。

### 運動與活動

- **運動紀錄**：內建多種運動類型（MET 估算消耗熱量），支援常用運動置頂、自訂運動，依日期紀錄時長與消耗。
- **步數目標**：可設定每日步數目標。**iOS／Android** 在裝置支援時透過 **expo-sensors**（Pedometer）讀取當日步數；**網頁版**僅顯示預覽提示，不會取得真實步數。

### 飲水紀錄

- **每日飲水量**：可設定每日目標與杯具容量（小／中／大），一鍵紀錄，首頁顯示當日進度。

### 數據分析

- **7 天**：攝取熱量、運動消耗柱狀圖，以及 **7 天**營養比例圓餅圖。
- **長期統計**：與體重／體脂圖表搭配，協助觀察習慣。

### 隱私、首次使用與設定

- **Onboarding**：首次使用需完成個人資料與目標設定；內含 **AI 功能說明與同意**（未設定 API Key 則不會呼叫 AI）。
- **AI 設定**：集中管理 Gemini、Groq 金鑰與模型；**原生**使用 `expo-secure-store` 保存金鑰；**網頁版**以記憶體方式保存（不寫入 SecureStore，僅供開發／瀏覽器測試，正式環境請注意風險）。
- **資料儲存**：**iOS／Android** 以 **expo-sqlite** 持久化，並可從舊版 **AsyncStorage** 一次性遷移；**Web** 僅使用 **AsyncStorage**，無 SQLite。
- **重置**：設定內可清除本機所有紀錄與 AI 設定（不可復原）。
- **Google Drive 備份／還原（選用）**：需在專案根目錄 `.env` 設定 `ENABLE_GOOGLE_DRIVE_SYNC=true` 並設定各平台 OAuth Client ID（見下方）。**Onboarding 的「從雲端匯入」僅 iOS／Android**；網頁版可於設定頁連結帳號後執行備份／還原（實作以程式為準）。

## 技術棧

- **Frontend**：React Native + Expo（SDK 54）
- **Language**：TypeScript
- **AI**：`@google/genai`（Gemini）；備援為 Groq HTTP API（`groqService`）
- **Charts**：`react-native-gifted-charts`、`react-native-chart-kit`
- **Storage**：`AsyncStorage`；`expo-sqlite`（僅原生）；`expo-secure-store`（金鑰，原生）
- **Others**：`expo-image-picker`、`expo-image-manipulator`、`expo-auth-session`、`expo-web-browser`（Google OAuth）、`expo-sensors`（步數）

## 專案架構

```text
src/
├── components/     # UI（AI 設定、圖表、飲食／體重／飲水／運動彈窗、步數卡片等）
├── context/        # AppContext：狀態與持久化
├── navigation/     # 底部 Tab（首頁、紀錄、分析、設定）
├── screens/        # 首頁、紀錄、分析、設定、Onboarding
├── services/       # SQLite、Gemini、Groq、Google Drive（選用）
├── constants/      # 健身公式、運動類型、功能開關、Onboarding／同意文案
├── types/          # 型別定義
└── utils/          # 卡路里計算、時間、體重區間顯示等
```

## 快速開始

### 安裝與啟動

```bash
npm install

npm run web          # 網頁版
npm start            # Expo 開發伺服器（Expo Go / 模擬器）
npm run android      # 建置並執行 Android
npm run ios          # 建置並執行 iOS（需 macOS）
```

### 打包 APK（Android）

使用 Expo EAS 雲端打包：

1. 安裝 EAS CLI：`npm install -g eas-cli`
2. 登入：`eas login`
3. 執行：`eas build -p android --profile preview`
4. 依終端機指示下載 APK

### 配置 AI 辨識

應用程式不內建第三方 API Key：

1. 至 [Google AI Studio](https://aistudio.google.com/app/apikey) 申請 Gemini API Key。
2. 在 App 內進入 **「設定」→「AI 辨識系統」**（或 Onboarding 引導）。
3. 貼上 Key、選擇模型（建議 `gemini-2.5-flash`），通過驗證後即可使用影像／文字辨識。
4. （選用）至 [Groq Console](https://console.groq.com/) 申請 Key 並在相同設定中儲存，作為 Gemini 異常時的備援。

### 啟用 Google Drive 同步（開發者）

於專案根目錄建立 `.env`（已列入 `.gitignore`），並設定：

- `ENABLE_GOOGLE_DRIVE_SYNC=true`
- `GOOGLE_WEB_CLIENT_ID`、`GOOGLE_IOS_CLIENT_ID`、`GOOGLE_ANDROID_CLIENT_ID`（依 Google Cloud Console OAuth 設定）

未設定或 `ENABLE_GOOGLE_DRIVE_SYNC` 非 `true` 時，雲端備份相關 UI 不會出現。
