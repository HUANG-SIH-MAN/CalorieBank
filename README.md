# CalorieBank (卡路里銀行) 🏦

一個基於 React Native + Expo 開發的專業卡路里計算與體重管理應用程序。

## 🌟 核心理念
CalorieBank 像管理銀行帳戶一樣管理您的健康，讓您對每日的卡路里收支一目瞭然。

## 🚀 主要功能 (開發中)
- **卡路里預算管理**：即時計算每日剩餘可攝取量。
- **飲食追蹤**：詳細記錄早、午、晚、點心的攝取細節（熱量、蛋白質、碳水、脂肪）。
- **體重追蹤**：圖表化呈現體重變化趨勢。
- **個人化目標**：根據身高、體重、年齡及活動強度自動計算每日需求。
- **數據持久化**：所有數據儲存於手機本地，保護隱私且離線可用。

## 🛠️ 技術棧
- **框架**: [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- **語言**: [TypeScript](https://www.typescriptlang.org/)
- **導航**: [React Navigation](https://reactnavigation.org/)
- **存儲**: [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- **UI 圖標**: [Ionicons (@expo/vector-icons)](https://icons.expo.fyi/)

## 📂 專案架構
```text
src/
├── components/     # 可重複使用組件
├── context/        # 全域狀態與資料存儲 (AppContext)
├── navigation/     # 導航設定 (TabNavigator)
├── screens/        # 頁面組組件 (Home, Log, Analysis, Settings)
├── types/          # TypeScript 定義
└── utils/          # 工具函數
```

## 🏁 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動專案
```bash
# 啟動 Expo 開發伺服器
npx expo start

# 啟動網頁預覽
npm run web
```

### 3. 在手機上測試
下載 **Expo Go** App 並掃描終端機顯示的 QR Code 即可。

---
開發者：Antigravity (Google DeepMind Team) & USER
