# CalorieBank (卡路里銀行) 🏦

一個基於 React Native + Expo 開發的專業、私密且強大的卡路里與健康管理應用程序。

## 🌟 核心理念 - 「你的數據，你來做主」
CalorieBank 不僅是你的健康帳務員，更是你的隱私守護者。我們採取 **Local-First (本地優先)** 與 **去中心化 AI** 架構，確保您的生理與飲食數據完全保存在您的設備中，不經過我們的伺服器。

## 🚀 核心功能
- **🥗 AI 食物影像辨識**：首創「自備 API Key」模式，串接 Google Gemini 2.0/1.5 模型。拍照即可辨識食物成分、熱量及三大營養素。
- **📊 專業級數據分析**：
    - **7 天趨勢視圖**：即時分析攝入、運動與營養比例。
    - **90 天體重趨勢**：採用 Smooth Bezier Curve (平滑貝茲曲線) 動態追蹤體重變化。
- **🎯 精準熱量銀行**：根據 Mifflin-St Jeor 公式動態計算每日 TDEE，讓你像管理銀行帳戶一樣管理每日卡路里收支。
- **⚙️ 去中心化 AI 設定**：用戶可自由選擇 Gemini 模型型號（如 Gemini 1.5 Flash 或 Pro），並管理自己的 API 指令。
- **🔐 隱私與安全**：所有數據儲存在本地 `AsyncStorage`，API Key 加密儲存於 `SecureStore`，並計畫支援 **Google Drive 雲端同步備份**。

## 🛠️ 技術棧
- **Frontend**: React Native + Expo (SDK 50+)
- **Language**: TypeScript
- **AI Integration**: [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini SDK)
- **Charts**: `react-native-gifted-charts` & `react-native-chart-kit`
- **Storage**: `AsyncStorage` & `expo-secure-store`
- **UI/UX**: `expo-linear-gradient`, `Ionicons`, `MaterialCommunityIcons`

## 📂 專案架構
```text
src/
├── components/     # UI 組件（包含 AI 引導介面與圖表封裝）
├── context/        # 全域狀態 (AppContext) 與本地持久化邏輯
├── services/       # 外部服務 (Gemini 官方 SDK 整合層)
├── screens/        # 核心頁面 (儀表板、紀錄、分析、設定)
├── constants/      # 健身公式與系統常數
├── types/          # 強型別定義
└── utils/          # 卡路里計算與影像處理工具
```

## 🏁 快速開始

### 1. 安裝與啟動
```bash
# 安裝依賴
npm install

# 啟動專案 (支援 iOS / Android / Web)
npm run web  # 開啟網頁版
# 或
npx expo start # 使用 Expo Go 手機測試
```

### 2. 打包 APK (Android 自行安裝)
本專案使用 Expo EAS 服務進行雲端打包：
1. **安裝 EAS CLI**: `npm install -g eas-cli`
2. **登入 Expo**: `eas login`
3. **執行打包指令**:
   ```bash
   eas build -p android --profile preview
   ```
4. 打包完成後掃描終端機 QR Code 即可下載 APK 安裝。

### 3. 配置 AI 辨識功能
本 App 不內建 API Key 以保護隱私並保持免費。請按照以下步驟啟用 AI 功能：
1. 前往 [Google AI Studio](https://aistudio.google.com/app/apikey) 免費申請 API Key。
2. 在 App 內進入 **「設定」 > 「AI 辨識系統」**。
3. 貼上您的 API Key 並選擇模型（推薦使用 `gemini-1.5-flash`）。
4. 通過測試連線後即可開始使用拍照辨識！

## 🗺️ 開發進度與路徑圖
- [ ] **Google Drive 數據備份與同步 (Next Step)**
- [ ] **SQLite 資料庫遷移**
- [ ] 飲水追蹤與週期分析提醒
- [ ] AI 模型設定還有問題

---
**CalorieBank** - 您最私密的智慧營養管家。
開發者：Antigravity (Google DeepMind Team) & USER
