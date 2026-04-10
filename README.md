# CalorieBank (卡路里銀行) 🏦

一個基於 React Native + Expo 開發的專業、私密且強大的卡路里與健康管理應用程序。

## 🌟 核心理念 — 「你的數據，你來做主」

CalorieBank 不僅是你的健康帳務員，更是你的隱私守護者。我們採取 **Local-First（本地優先）** 與 **去中心化 AI** 架構，確保您的生理與飲食數據完全保存在您的設備中，不經過我們的伺服器。

## 🚀 核心功能

### 飲食與 AI 辨識

- **🥗 AI 食物影像辨識**：首創「自備 API Key」模式，串接 Google Gemini 2.0 / 1.5。拍照即可辨識食物成分、熱量及三大營養素（蛋白質、碳水、脂肪）。
- **📋 飲食紀錄**：支援早／午／晚／點心分類、手動新增與編輯、自訂飲食標籤，並可依日期瀏覽與管理。

### 熱量與營養管理

- **🎯 精準熱量銀行**：依 **Mifflin-St Jeor** 公式動態計算每日 TDEE，並依目標體重與減重速度調整每日熱量目標，像管理銀行帳戶一樣管理卡路里收支。
- **📊 三大營養素追蹤**：首頁與紀錄頁即時顯示蛋白質、碳水、脂肪攝取與目標比例。

### 體重與身體數據

- **⚖️ 體重紀錄**：每日體重紀錄，可選填體脂率，支援歷史列表與趨勢圖表。
- **📈 90 天體重趨勢**：分析頁採用平滑曲線動態追蹤體重變化。

### 運動與活動

- **🏃 運動紀錄**：內建多種運動類型（MET 值計算消耗熱量），支援常用運動置頂、自訂運動，依日期紀錄時長與消耗。
- **👟 步數目標（選用）**：設定每日步數目標；原生端可擴充步數追蹤（目前首頁步數卡片為預留）。

### 飲水紀錄

- **💧 每日飲水量**：可設定每日目標與杯具容量（小／中／大），一鍵紀錄飲水量，首頁即時顯示當日進度。

### 數據分析

- **📊 7 天趨勢**：攝取熱量、運動消耗的柱狀圖，以及營養比例圓餅圖。
- **📉 30 天統計**：熱量與運動的週/月維度摘要，助你掌握習慣。

### 隱私與設定

- **⚙️ 去中心化 AI 設定**：用戶可自選 Gemini 模型（如 2.5 Flash / Pro）、自行管理 API Key，並在 App 內完成連線驗證。
- **🔐 隱私與安全**：資料儲存於裝置本地（網頁版 `AsyncStorage`，原生版 `expo-sqlite`）；API Key 使用 `expo-secure-store` 加密保存，不經伺服器。
- **☁️ 雲端備份（選用）**：可透過 `.env` 開關啟用 Google Drive 備份／還原，Onboarding 時可選擇從雲端匯入資料。

## 🛠️ 技術棧

- **Frontend**: React Native + Expo（SDK 54）
- **Language**: TypeScript
- **AI**: [@google/genai](https://www.npmjs.com/package/@google/genai)（Google Gemini SDK）
- **Charts**: `react-native-gifted-charts`、`react-native-chart-kit`
- **Storage**: `AsyncStorage`、`expo-secure-store`（網頁／共用）；`expo-sqlite`（原生）
- **UI / UX**: `expo-linear-gradient`、`Ionicons`、`MaterialCommunityIcons`、`react-native-calendars`

## 📂 專案架構

```text
src/
├── components/     # UI 組件（AI 引導、圖表、飲食/體重/飲水/運動彈窗等）
├── context/        # 全域狀態（AppContext）與本地持久化
├── navigation/     # 底部 Tab（首頁、紀錄、分析、設定）
├── screens/       # 首頁、紀錄、分析、設定、Onboarding
├── services/      # 資料庫、Gemini、Google Drive（選用）
├── constants/     # 健身公式、運動類型、功能開關、Onboarding 文案
├── types/         # 型別定義
└── utils/         # 卡路里計算、時間與影像處理
```

## 🏁 快速開始

### 1. 安裝與啟動

```bash
# 安裝依賴
npm install

# 啟動專案（支援 iOS / Android / Web）
npm run web        # 網頁版
npx expo start     # 使用 Expo Go 在手機上測試
```

### 2. 打包 APK（Android 自行安裝）

使用 Expo EAS 雲端打包：

1. 安裝 EAS CLI：`npm install -g eas-cli`
2. 登入：`eas login`
3. 執行：`eas build -p android --profile preview`
4. 完成後依終端機指示掃描 QR Code 下載 APK。

### 3. 配置 AI 辨識

App 不內建 API Key，以保護隱私並維持免費使用：

1. 至 [Google AI Studio](https://aistudio.google.com/app/apikey) 申請 API Key。
2. 在 App 內進入 **「設定」→「AI 辨識系統」**。
3. 貼上 API Key、選擇模型（建議 `gemini-2.5-flash`）。
4. 通過連線驗證後即可使用拍照辨識。
