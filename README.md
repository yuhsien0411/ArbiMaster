# ArbiMaster - AI驅動的加密貨幣套利監控與預測平台

## 🚀 專案概述

ArbiMaster 是一個基於 Next.js 14 的現代化加密貨幣套利監控平台，整合了 AI 預測分析功能。系統能夠實時監控多個交易所的資金費率、交易量、持倉量等關鍵指標，並運用機器學習技術提供資金費率預測、套利機會識別和市場情緒分析。

## ✨ 核心功能

### 🔮 AI 預測分析系統
- **資金費率預測**: 基於歷史數據和技術指標預測未來資金費率變化
- **套利機會識別**: 自動識別跨交易所套利機會並評估風險
- **市場情緒分析**: 綜合分析市場情緒指標，提供交易建議
- **模型性能追蹤**: 實時監控AI模型預測準確率和表現

### 📊 實用AI預測 (新增)
- **真實數據整合**: 使用實際API數據而非模擬數據
- **多因子分析**: 結合技術指標、交易量、持倉量等多維度數據
- **具體交易建議**: 提供明確的做多/做空/觀望建議
- **風險評估**: 詳細的風險等級評估和止損建議
- **歷史表現追蹤**: 顯示模型過往預測的準確性
- **綜合分析報告**: 生成詳細的市場分析和投資建議

### 📈 數據監控
- **實時資金費率**: 監控多個交易所的資金費率變化
- **交易量分析**: 分析24小時交易量變化趨勢
- **持倉量監控**: 追蹤開倉量變化，識別市場情緒
- **資金流向**: 監控資金流入流出情況

## 🛠️ 技術架構

### 前端技術
- **Next.js 14** - React 框架
- **Material-UI** - UI 組件庫
- **Chart.js** - 數據可視化
- **Axios** - HTTP 客戶端

### 後端技術
- **Node.js** - 運行時環境
- **TensorFlow.js** - 機器學習框架 (可選)
- **Express.js** - API 路由處理

### AI 模型
- **RealisticPredictor**: 基於真實數據的多因子分析預測器
- **FundingRatePredictor**: 神經網路資金費率預測器
- **SimplePredictor**: 純JavaScript線性回歸預測器

## 🚀 快速開始

### 1. 克隆專案
```bash
git clone <repository-url>
cd ArbiMaster
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 環境配置
創建 `.env.local` 文件：
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. 啟動開發服務器
```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看應用。

## 📁 專案結構

```
ArbiMaster/
├── pages/
│   ├── api/
│   │   ├── funding-rates.js          # 資金費率API
│   │   ├── predictions.js            # 基礎AI預測API
│   │   ├── realistic-predictions.js  # 實用AI預測API (新增)
│   │   └── ...
│   ├── predictions.js                # 基礎AI預測頁面
│   ├── realistic-predictions.js      # 實用AI預測頁面 (新增)
│   └── index.js                      # 主頁面
├── lib/
│   ├── predictors/
│   │   ├── RealisticPredictor.js     # 實用預測器 (新增)
│   │   ├── FundingRatePredictor.js   # 神經網路預測器
│   │   └── SimplePredictor.js        # 簡化預測器
│   └── utils/
│       └── DataPreprocessor.js       # 數據預處理
├── test-realistic-predictions.js     # 實用預測測試 (新增)
└── README.md
```

## 🔧 AI 功能詳解

### 實用AI預測系統

#### 核心特點
1. **真實數據源**: 整合實際的資金費率、交易量、持倉量API數據
2. **多因子分析**: 結合技術指標(MA、RSI、波動率)、市場數據、情緒指標
3. **實用建議**: 提供具體的做多/做空/觀望建議，包含預期收益和風險評估
4. **歷史追蹤**: 記錄預測歷史，計算模型準確率
5. **風險管理**: 詳細的風險評估和止損建議

#### 預測流程
1. **數據收集**: 獲取真實的市場數據
2. **技術分析**: 計算移動平均線、RSI、波動率等技術指標
3. **情緒分析**: 基於費率、技術指標分析市場情緒
4. **預測生成**: 綜合多因子生成預測結果
5. **建議生成**: 基於預測結果生成交易建議
6. **風險評估**: 評估交易風險並提供止損建議

#### API 端點
- `GET /api/realistic-predictions?action=predict` - 獲取預測
- `GET /api/realistic-predictions?action=analysis` - 獲取綜合分析
- `GET /api/realistic-predictions?action=history` - 獲取歷史記錄
- `GET /api/realistic-predictions?action=performance` - 獲取性能統計

## 🧪 測試

### 測試實用AI預測
```bash
node test-realistic-predictions.js
```

### 測試基礎AI預測
```bash
node test-predictions.js
```

## 🔍 故障排除

### 常見問題

#### 1. npm install 失敗
如果遇到 `node-pre-gyp` 錯誤：
```bash
# 清理緩存
npm cache clean --force

# 重新安裝
npm install

# 如果仍有問題，使用簡化版本
npm run install:tfjs
```

#### 2. TensorFlow.js 安裝問題
如果無法安裝 TensorFlow.js，系統會自動使用簡化的 JavaScript 預測器：
```bash
# 檢查是否支援 TensorFlow.js
npm run install:tf

# 或直接使用簡化版本
npm run install:tfjs
```

#### 3. API 錯誤
確保所有 API 端點正常運行：
```bash
# 檢查服務器狀態
curl http://localhost:3000/api/funding-rates
```

## 📊 功能對比

| 功能 | 基礎AI預測 | 實用AI預測 |
|------|------------|------------|
| 數據源 | 模擬數據 | 真實API數據 |
| 預測方法 | 神經網路 | 多因子分析 |
| 交易建議 | 基礎 | 詳細具體 |
| 風險評估 | 簡單 | 全面 |
| 歷史追蹤 | 無 | 完整 |
| 實用性 | 中等 | 高 |

## 🎯 使用場景

### 投資者
- 獲取資金費率變化預測
- 識別套利機會
- 評估市場情緒
- 制定交易策略

### 交易員
- 實時監控多交易所數據
- 快速識別套利機會
- 風險評估和管理
- 歷史表現分析

### 研究人員
- 市場數據分析
- AI模型研究
- 量化交易策略開發
- 學術研究支持

## 🔮 未來規劃

- [ ] 增加更多交易所支援
- [ ] 優化AI模型準確率
- [ ] 添加更多技術指標
- [ ] 實現自動化交易
- [ ] 移動端應用開發
- [ ] 更多幣種支援

## 📄 授權

本專案僅供學習和研究使用，請勿用於實際投資決策。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**免責聲明**: 本系統僅供參考，不構成投資建議。投資有風險，請謹慎決策。


