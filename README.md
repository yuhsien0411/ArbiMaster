# ArbiMaster - AI加密貨幣套利監控平台

## 📋 專案簡介

ArbiMaster是一個整合機器學習的加密貨幣套利監控平台，專為資訊工程系畢業專題設計。平台提供資金費率預測、套利機會識別和市場情緒分析功能。

## ✨ 主要功能

- 🔮 **AI資金費率預測**: 基於機器學習的資金費率預測模型
- 💰 **套利機會識別**: 自動識別跨交易所套利機會
- 📊 **市場情緒分析**: 實時市場情緒監控
- 📈 **數據視覺化**: 互動式圖表和儀表板
- 🔄 **實時監控**: WebSocket實時數據更新

## 🛠️ 技術棧

- **前端**: Next.js, React, Material-UI, Chart.js
- **後端**: Next.js API Routes
- **AI/ML**: 簡化版線性回歸模型（純JavaScript實現）
- **數據處理**: 自定義特徵工程
- **部署**: Vercel/Netlify

## 🚀 快速開始

### 方法一：一鍵安裝（推薦）

#### Windows用戶
```bash
# 下載並執行安裝腳本
install.bat
```

#### macOS/Linux用戶
```bash
# 下載並執行安裝腳本
chmod +x install.sh
./install.sh
```

### 方法二：手動安裝

1. **克隆專案**
```bash
git clone https://github.com/your-username/ArbiMaster.git
cd ArbiMaster
```

2. **安裝依賴**
```bash
npm install
```

3. **啟動開發服務器**
```bash
npm run dev
```

4. **開啟瀏覽器**
訪問 [http://localhost:3000](http://localhost:3000)

## 🔧 TensorFlow.js 安裝問題解決方案

### 問題描述
在Windows系統上安裝TensorFlow.js時可能遇到以下錯誤：
```
node-pre-gyp ERR! not ok
* Downloading libtensorflow
* Building TensorFlow Node.js bindings
```

### 解決方案

#### 方案一：使用簡化版預測器（推薦）
專案已內建簡化版預測器，不依賴TensorFlow.js：
- 使用純JavaScript實現的線性回歸模型
- 無需編譯原生依賴
- 跨平台兼容性更好

#### 方案二：強制安裝TensorFlow.js
如果仍需要使用完整版AI模型：

```bash
# 清理npm緩存
npm cache clean --force

# 刪除node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 重新安裝依賴
npm install

# 強制安裝TensorFlow.js
npm run install:tf
```

#### 方案三：使用TensorFlow.js Web版本
```bash
# 安裝Web版本（無需編譯）
npm run install:tfjs
```

### 系統要求
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **記憶體**: >= 4GB RAM
- **磁碟空間**: >= 2GB

## 📁 專案結構

```
ArbiMaster/
├── components/          # React組件
│   ├── Dashboard/      # 儀表板組件
│   ├── Prediction/     # 預測相關組件
│   └── Charts/         # 圖表組件
├── lib/                # 核心庫
│   ├── predictors/     # 預測模型
│   │   ├── SimplePredictor.js    # 簡化版預測器
│   │   └── EnhancedPredictor.js  # 增強版預測器
│   └── utils/          # 工具函數
├── pages/              # Next.js頁面
│   ├── api/           # API端點
│   └── prediction/    # 預測頁面
├── public/            # 靜態資源
└── styles/            # 樣式文件
```

## 🎯 AI功能說明

### 簡化版預測器
- **模型類型**: 線性回歸
- **特徵工程**: 8個核心特徵
- **優勢**: 快速、穩定、跨平台
- **適用場景**: 基礎預測需求

### 特徵說明
1. **當前費率**: 最新資金費率
2. **費率變化**: 費率變化趨勢
3. **交易量變化**: 交易量變化率
4. **持倉量變化**: 持倉量變化率
5. **時間特徵**: 24小時週期特徵
6. **技術指標**: RSI等技術指標
7. **市場情緒**: 基於費率和交易量的情緒
8. **波動率**: 價格波動率

## 🔌 API端點

### 預測API
```bash
POST /api/predict
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "exchange": "Binance"
}
```

### 訓練API
```bash
POST /api/train
Content-Type: application/json

{
  "action": "train_and_evaluate",
  "trainingData": [...]
}
```

## 🧪 測試

### 運行測試腳本
```bash
# 測試預測功能
node test-prediction.js

# 測試訓練功能
node test-training.js
```

## 🚀 部署

### Vercel部署
```bash
# 安裝Vercel CLI
npm i -g vercel

# 部署
vercel
```

### 本地生產環境
```bash
# 構建
npm run build

# 啟動
npm start
```

## 🔧 故障排除

### 常見問題

#### 1. npm install 失敗
```bash
# 清理緩存
npm cache clean --force

# 刪除node_modules
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

#### 2. 端口被佔用
```bash
# 查找佔用端口的進程
lsof -i :3000

# 終止進程
kill -9 <PID>
```

#### 3. 記憶體不足
```bash
# 增加Node.js記憶體限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 4. 權限問題（Linux/macOS）
```bash
# 修復權限
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

## 📊 性能優化

### 前端優化
- 使用React.memo減少重渲染
- 實現虛擬滾動處理大量數據
- 圖片懶加載

### 後端優化
- API響應緩存
- 數據庫查詢優化
- 並發請求限制

## 🤝 貢獻指南

1. Fork專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟Pull Request

## 📝 更新日誌

### v2.0.0 (2024-12-27)
- ✅ 新增簡化版預測器（無TensorFlow.js依賴）
- ✅ 優化跨平台兼容性
- ✅ 新增一鍵安裝腳本
- ✅ 完善故障排除指南
- ✅ 更新依賴版本

### v1.0.0 (2024-12-26)
- 🎉 初始版本發布
- 🔮 AI資金費率預測
- 📊 數據視覺化
- 🔄 實時監控

## 📄 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 文件

## 📞 聯絡資訊

- **專案維護者**: ArbiMaster Team
- **Email**: contact@arbimaster.com
- **GitHub**: [https://github.com/your-username/ArbiMaster](https://github.com/your-username/ArbiMaster)

## 🙏 致謝

感謝所有貢獻者和開源社區的支持！

---

⭐ 如果這個專案對您有幫助，請給我們一個星標！


