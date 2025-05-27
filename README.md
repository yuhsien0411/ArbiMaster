# ArbiMaster

ArbiMaster 是一個專注於加密貨幣套利機會的監控平台，提供多個交易所的資金費率、資金流向、持倉量等數據的即時比較和分析。

## 版本信息
- 當前版本：v1.4.0
- 更新內容：
  - 優化槓桿現貨API數據獲取
  - 完善錯誤處理機制
  - 改進日誌輸出系統

## 功能特點

### 1. 資金費率比較
- 即時監控多個主流交易所的永續合約資金費率
- 支持標準化費率顯示（將不同結算週期的費率轉換為8小時基準）
- 提供費率排序和搜尋功能
- 可自定義顯示的交易所
- 支持深色/淺色主題切換
- 🔄 每30秒自動更新資金費率數據
- 📈 查看各幣種的歷史資金費率走勢
- 支持查看24小時、7天、30天的歷史數據

### 2. 資金流向分析
- 監控交易所間的資金流向
- 提供資金流向趨勢圖表
- 分析市場資金動向

### 3. 持倉量分析
- 監控各交易所的持倉量變化
- 提供持倉量趨勢圖表
- 分析市場情緒

### 4. 交易量分析
- 監控現貨和合約交易量
- 提供交易量趨勢圖表
- 分析市場活躍度

### 5. 槓桿現貨利率比較
- 支持多個交易所的槓桿現貨借貸利率比較
- 實時更新利率數據
- 支持不同時間週期的利率顯示（1小時、1天、1年）
- 顯示最大槓桿倍數、交易對、手續費率等重要參數
- 清晰展示各交易所的清算閾值和最小交易額要求
- 目前支持的交易所：Binance（全倉槓桿）、Bybit（全倉槓桿）、OKX（全倉槓桿）

### 6. 價格比較
- 支持多個交易所的現貨價格比較
- 實時更新價格數據
- 計算價格差異百分比
- 支持多個交易對

### 7. CEX 理財收益分析
- 比較各大交易所的穩定幣活期理財收益率
- 支援 USDT、USDC、DAI 三種主要穩定幣
- 按幣種和收益率排序
- 顯示最低投資金額和鎖定期信息
- 數據每 2 分鐘自動更新

## 支持的交易所
- Binance
- Bybit
- OKX
- Bitget
- Gate.io
- HyperLiquid

## 技術架構

### 前端技術
- Next.js - React 框架
- CSS Modules - 模組化樣式管理
- Axios - HTTP 客戶端
- Chart.js - 數據可視化
- Socket.IO - 即時數據更新
- Tailwind CSS - 響應式設計

### 後端技術
- Node.js
- Express.js
- MongoDB - 數據存儲
- Redis - 緩存層

### 部署
- Docker 容器化
- Nginx 反向代理
- PM2 進程管理
- Vercel 平台部署選項

## 專案結構

```
project/
├── components/           # React 組件
│   ├── ThemeToggle.js   # 主題切換組件
│   └── ThemeToggle.module.css
├── pages/               # Next.js 頁面
│   ├── _app.js         # 應用入口
│   ├── index.js        # 首頁
│   ├── funding-rate.js # 資金費率頁面
│   ├── fund-flow.js    # 資金流向頁面
│   ├── open-interest.js # 持倉量頁面
│   ├── volume.js       # 交易量頁面
│   ├── cexearn.js      # CEX 收益分析頁面
│   └── leveraged-spot.js # 槓桿現貨頁面
├── styles/             # 樣式文件
│   ├── globals.css     # 全局樣式
│   ├── theme.css       # 主題變量
│   ├── Home.module.css # 首頁樣式
│   └── [其他樣式文件]
├── public/             # 靜態資源
├── api/                # API 路由
├── lib/                # 工具函數
└── config/             # 配置文件
```

## 開發指南

### 環境要求
- Node.js >= 14.0.0
- MongoDB >= 4.4
- Redis >= 6.0

### 環境變量
請確保設置以下環境變量：
```
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret

BITGET_API_KEY=your_bitget_api_key
BITGET_API_SECRET=your_bitget_api_secret
BITGET_PASSPHRASE=your_bitget_passphrase

GATEIO_API_KEY=your_gateio_api_key
GATEIO_API_SECRET=your_gateio_api_secret
```

### 安裝步驟
1. 克隆專案
```bash
git clone https://github.com/yuhsien0411/ArbiMaster.git
cd ArbiMaster
```

2. 安裝依賴
```bash
npm install
```

3. 配置環境變量
```bash
cp .env.example .env.local
# 編輯 .env.local 文件，填入必要的配置信息
```

4. 啟動開發服務器
```bash
npm run dev
```

5. 訪問應用
```
http://localhost:3000
```

### 構建部署
```bash
# 構建生產版本
npm run build

# 啟動生產服務器
npm start
```

## API 使用限制

為了確保 API 的穩定性和避免超出使用限制，我們對各交易所的 API 請求做了以下處理：

- 使用緩存機制，相同數據 2 分鐘內只請求一次
- 錯誤重試和錯誤處理機制
- 支援跨域請求（CORS）
- API 請求超時處理

## 使用說明

### 資金費率頁面
- 查看各交易所的資金費率數據
- 按幣種或交易所排序
- 篩選特定交易所的數據
- 支援深色模式切換

### 槓桿現貨頁面
- 在搜索框中輸入幣種代碼（如 BTC、ETH 等）
- 查看各交易所的槓桿現貨利率數據
- 按交易所篩選數據
- 使用排序功能找到合適的交易平台

### 其他功能頁面
- 恐懼與貪婪指數：查看市場情緒指標
- 未平倉合約量：監控市場槓桿情況
- 交易量分析：追蹤市場活躍度

## 開發流程
- 克隆完成後直接開始編輯
- 不需要另外創建倉庫
- 編輯完成後直接推送到 master 分支
- 使用 GitHub 的推送選項
- 統一使用 master 分支

## 注意事項
- 請確保 API 密鑰的安全性
- 建議在測試環境中先進行測試
- 定期更新 API 密鑰

## 貢獻指南
1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 聯絡方式
- 作者：Yu Hsien, Jerry
- GitHub Issues：[https://github.com/yuhsien0411/ArbiMaster/issues](https://github.com/yuhsien0411/ArbiMaster/issues)

## 授權協議
本專案採用 MIT 授權協議 - 詳見 [LICENSE](LICENSE) 文件

## 免責聲明
本工具僅供參考，不構成投資建議。使用本工具進行交易決策的風險由使用者自行承擔。


