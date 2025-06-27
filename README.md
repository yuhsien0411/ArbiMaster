# ArbiMaster - AI驅動加密貨幣套利監控平台

![ArbiMaster Logo](https://img.shields.io/badge/ArbiMaster-AI%20Powered%20Arbitrage-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.0.0+-green)
![Next.js](https://img.shields.io/badge/Next.js-14.0.0+-black)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.15.0+-orange)

## 🎯 專案簡介

ArbiMaster是一個基於AI的加密貨幣套利監控平台，提供資金費率預測、套利機會識別和市場情緒分析功能。專為資訊工程系畢業專題設計，展示機器學習在金融科技中的應用。

## ✨ 主要功能

### 🤖 AI預測系統
- **資金費率預測**: 使用LSTM、Transformer和深度MLP預測資金費率變化
- **套利機會識別**: 多交易所套利機會自動識別
- **市場情緒分析**: 綜合技術指標、社交媒體和新聞的情緒分析
- **綜合預測**: 多維度市場分析和交易建議

### 📊 數據可視化
- 實時資金費率監控
- 市場熱力圖
- 資金流向分析
- 交易量統計
- 持倉量分析

### 🔧 技術特色
- **集成學習**: 多模型融合提高預測準確性
- **高級特徵工程**: 30+維特徵向量
- **智能訓練**: 自動化模型訓練和優化
- **實時更新**: 實時數據收集和分析

## 🚀 快速開始

### 系統要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **作業系統**: Windows, macOS, Linux

### 安裝步驟

1. **克隆專案**
```bash
git clone https://github.com/yuhsien0411/ArbiMaster.git
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

4. **訪問應用**
打開瀏覽器訪問: `http://localhost:3000`

## 📁 專案結構

```
ArbiMaster/
├── pages/                    # Next.js頁面
│   ├── api/                 # API端點
│   │   ├── predictions.js   # 基本預測API
│   │   └── enhanced-predictions.js # 增強版AI API
│   ├── predictions.js       # AI預測頁面
│   └── index.js            # 主頁面
├── lib/                     # 核心邏輯
│   ├── predictors/         # AI預測器
│   ├── training/           # 訓練管理器
│   └── utils/              # 工具函數
├── models/                 # 訓練好的模型
├── components/             # React組件
├── styles/                # 樣式文件
└── test-*.js              # 測試腳本
```

## 🧠 AI功能使用

### 基本預測
```bash
# 資金費率預測
curl "http://localhost:3000/api/predictions?symbol=BTC&exchange=Binance&predictionType=funding_rate"

# 套利機會識別
curl "http://localhost:3000/api/predictions?symbol=BTC&exchange=Binance&predictionType=arbitrage_opportunities"

# 市場情緒分析
curl "http://localhost:3000/api/predictions?symbol=BTC&exchange=Binance&predictionType=market_sentiment"
```

### 增強版AI功能
```bash
# 綜合預測
curl "http://localhost:3000/api/enhanced-predictions?symbol=BTC&exchange=Binance&predictionType=comprehensive"

# 模型訓練
curl "http://localhost:3000/api/enhanced-predictions?action=train&symbols=BTC,ETH&days=30"

# 數據收集
curl "http://localhost:3000/api/enhanced-predictions?action=collect_data&symbol=BTC&days=30"
```

## 🧪 測試功能

### 基本功能測試
```bash
node test-predictions.js
```

### 增強版AI測試
```bash
node test-enhanced-ai.js
```

## 🔧 故障排除

### 常見問題

#### 1. npm install 失敗
**問題**: 依賴安裝失敗
**解決方案**:
```bash
# 清除npm緩存
npm cache clean --force

# 刪除node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 重新安裝
npm install
```

#### 2. TensorFlow.js 安裝問題
**問題**: @tensorflow/tfjs-node 安裝失敗
**解決方案**:
```bash
# 確保Node.js版本 >= 18
node --version

# 單獨安裝TensorFlow.js
npm install @tensorflow/tfjs-node@4.15.0
```

#### 3. 端口被佔用
**問題**: 3000端口已被使用
**解決方案**:
```bash
# 查找佔用端口的進程
lsof -i :3000

# 終止進程
kill -9 <PID>

# 或使用不同端口
npm run dev -- -p 3001
```

#### 4. 模型載入失敗
**問題**: AI模型無法載入
**解決方案**:
```bash
# 重新訓練模型
curl "http://localhost:3000/api/enhanced-predictions?action=train&symbols=BTC&days=30"
```

### 環境檢查腳本
```bash
# 檢查系統環境
node --version
npm --version
npm list --depth=0
```

## 📚 技術文檔

### AI模型架構
- **LSTM神經網路**: 處理時間序列數據
- **Transformer模型**: 捕捉複雜模式
- **深度MLP**: 特徵學習和預測
- **集成學習**: 多模型融合

### 特徵工程
- **技術指標**: RSI、MACD、布林帶、隨機指標
- **市場數據**: 交易量、持倉量、價格變化
- **時間特徵**: 小時、星期、月份、季節性
- **情緒指標**: 恐懼貪婪指數、社交媒體情緒

### API文檔
詳細的API文檔請參考 `AI_PREDICTION_SYSTEM.md`

## 🤝 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權 - 查看 [LICENSE](LICENSE) 文件了解詳情

## 👥 團隊

- **開發者**: ArbiMaster Team
- **專題**: 資訊工程系畢業專題
- **技術棧**: Next.js, React, TensorFlow.js, Material-UI

## 📞 支援

如果遇到問題，請：
1. 查看 [故障排除](#故障排除) 部分
2. 檢查 [Issues](https://github.com/yuhsien0411/ArbiMaster/issues)
3. 創建新的 Issue

## 🎉 致謝

感謝所有為這個專案做出貢獻的開發者和研究人員！

---

**⭐ 如果這個專案對您有幫助，請給我們一個星標！**


