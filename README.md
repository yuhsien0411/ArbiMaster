# ArbiMaster

**版本**：1.1.0

ArbiMaster 是一個專注於加密貨幣套利機會的監控平台，提供多個交易所的資金費率、資金流向、持倉量等數據的即時比較和分析。

## 更新日誌

### v1.1.0 (2024-03-xx)
- 優化 CSS 結構，將樣式分離到獨立模塊
- 改進主題切換功能
- 新增資金費率標準化顯示
- 優化移動端適配

### v1.0.0 (2024-02-xx)
- 初始版本發布
- 實現基本功能框架
- 支援多交易所數據整合

## 功能特點

### 1. 資金費率比較
- 即時監控多個主流交易所的永續合約資金費率
- 支持標準化費率顯示（將不同結算週期的費率轉換為8小時基準）
- 提供費率排序和搜尋功能
- 可自定義顯示的交易所
- 支持深色/淺色主題切換

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

## 技術架構

### 前端技術
- Next.js - React 框架
- CSS Modules - 模組化樣式管理
- Axios - HTTP 客戶端
- Chart.js - 數據可視化

### 後端技術
- Node.js
- Express.js
- MongoDB - 數據存儲
- Redis - 緩存層

### 部署
- Docker 容器化
- Nginx 反向代理
- PM2 進程管理

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
│   └── volume.js       # 交易量頁面
├── styles/             # 樣式文件
│   ├── globals.css     # 全局樣式
│   ├── theme.css       # 主題變量
│   ├── Home.module.css # 首頁樣式
│   ├── FundingRate.module.css
│   └── Volume.module.css
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
- Socket.IO - 即時數據更新

### 安裝步驟
1. 克隆專案
```bash
git clone https://github.com/yuhsien0411/ArbiMaster.git
cd ArbiMaster
```

2. 安裝依賴
```bash
npm install
npm install socket.io-client
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

### 構建部署
```bash
# 構建生產版本
npm run build

# 啟動生產服務器
npm start
```

## 貢獻指南

1. Fork 專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權協議

本專案採用 MIT 授權協議 - 詳見 [LICENSE](LICENSE) 文件

## 聯繫方式

- 作者：Yu Hsien
- 郵箱：yuhsien0411@gmail.com
- 網站：[your-website.com]

## 使用指南

### 資金費率頁面

- 查看各交易所的資金費率數據
- 按幣種或交易所排序
- 篩選特定交易所的數據
- 支援深色模式切換

### 資金流向頁面

- 查看市場資金流入和流出情況
- 分析不同時間段的資金流向變化

### CEX 理財收益頁面

- 比較各大交易所的穩定幣活期理財收益率
- 支援 USDT、USDC、DAI 三種主要穩定幣
- 按幣種和收益率排序
- 顯示最低投資金額和鎖定期信息
- 數據每 2 分鐘自動更新
- 支援深色模式顯示

### 其他功能頁面

- 恐懼與貪婪指數：查看市場情緒指標
- 未平倉合約量：監控市場槓桿情況
- 交易量分析：追蹤市場活躍度

## API 使用限制

為了確保 API 的穩定性和避免超出使用限制，我們對各交易所的 API 請求做了以下處理：

- 使用緩存機制，相同數據 2 分鐘內只請求一次
- 錯誤重試和錯誤處理機制
- 支援跨域請求（CORS）

## 貢獻指南

歡迎提交問題報告和功能請求。如果您想貢獻代碼，請遵循以下步驟：

1. Fork 專案
2. 創建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟一個 Pull Request

## 授權

本專案採用 ISC 授權 - 詳情請參閱 [LICENSE](LICENSE) 文件。

## 聯絡方式

如有任何問題或建議，請通過以下方式聯絡我們：

* GitHub Issues：[https://github.com/yuhsien0411/ArbiMaster/issues](https://github.com/yuhsien0411/ArbiMaster/issues)

## 開發流程

1. 克隆專案
```bash
git clone https://github.com/yuhsien0411/ArbiMaster.git
```

2. 開發流程
- 克隆完成後直接開始編輯
- 不需要另外創建倉庫
- 編輯完成後直接推送到 master 分支

3. 提交更改
- 使用 GitHub 的推送選項
- 統一使用 master 分支
- 其他分支已刪除

# 永續合約資金費率比較工具

這是一個用於比較各大交易所永續合約資金費率的工具，提供即時數據和歷史趨勢分析。

## 功能特點

- 🔄 即時更新：每30秒自動更新資金費率數據
- 📊 多交易所支持：
  - Binance
  - Bybit
  - OKX
  - Bitget
  - HyperLiquid
- 📈 歷史趨勢：查看各幣種的歷史資金費率走勢
- 🎨 深色/淺色模式：支持自適應主題切換
- 🔍 搜索功能：快速查找特定幣種
- 📱 響應式設計：完美支持移動端和桌面端
- ⚡ 性能優化：使用緩存和重試機制確保數據穩定性

## 最新更新

### 2024-03-xx
- ✨ 新增歷史資金費率頁面
  - 支持查看24小時、7天、30天的歷史數據
  - 提供圖表視覺化展示
  - 支持按交易所篩選數據
  - 顯示累計費率統計
- 🔧 性能優化
  - 增加 API 請求超時處理
  - 添加自動重試機制
  - 優化數據緩存策略
- 🎨 界面優化
  - 改進深色模式支持
  - 優化表格交互體驗
  - 添加載入狀態提示

## 技術棧

- Next.js
- React
- Chart.js
- Socket.IO
- Tailwind CSS

## 本地開發

1. 克隆倉庫：
```bash
git clone https://github.com/yourusername/funding-rate-comparison.git
cd funding-rate-comparison
```

2. 安裝依賴：
```bash
npm install
```

3. 運行開發服務器：
```bash
npm run dev
```

4. 打開瀏覽器訪問：`http://localhost:3000`

## 部署

該項目可以輕鬆部署到 Vercel 平台：

1. Fork 本倉庫
2. 在 Vercel 中導入項目
3. 部署完成

## 貢獻指南

歡迎提交 Pull Request 或提出 Issue。在提交代碼前，請確保：

1. 代碼符合項目的代碼風格
2. 所有測試通過
3. 提交信息清晰明確

## 授權協議

MIT License

## 免責聲明

本工具僅供參考，不構成投資建議。使用本工具進行交易決策的風險由使用者自行承擔。


