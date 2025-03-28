# ArbiMaster

## 版本信息
- 當前版本：v1.0.0
- 更新日期：2024-03-21
- 更新內容：
  - 新增 Gate.io 槓桿現貨利率數據獲取
  - 優化數據處理邏輯
  - 修復已知問題

ArbiMaster 是一個專注於加密貨幣套利機會的監控平台，提供多個交易所的資金費率、資金流向、持倉量等數據的即時比較和分析。

## 更新日誌

### v1.3.0 (2024-04-xx)
- 新增槓桿現貨功能，提供各大交易所槓桿現貨交易數據比較
- 支持按照交易所篩選槓桿現貨資訊
- 優化用戶界面和數據展示

### v1.2.0 (2024-04-xx)
- 為所有數據頁面添加返回主頁按鈕
- 在未平倉合約頁面添加搜尋功能，方便用戶快速找到特定幣種
- 優化頁面響應式設計，提升移動端使用體驗

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

### 5. 槓桿現貨利率比較
- 支持多個交易所的槓桿現貨借貸利率比較
- 實時更新利率數據
- 支持不同時間週期的利率顯示（1小時、1天、1年）
- 目前支持的交易所：
  - Binance（全倉槓桿）
  - Bybit（全倉槓桿）
  - OKX（全倉槓桿）
  - Bitget（模擬數據）
  - Gate.io（模擬數據）

### 6. 價格比較
- 支持多個交易所的現貨價格比較
- 實時更新價格數據
- 計算價格差異百分比
- 支持多個交易對

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
│   ├── volume.js       # 交易量頁面
│   ├── cexearn.js      # CEX 收益分析頁面
│   └── leveraged-spot.js # 槓桿現貨頁面
├── styles/             # 樣式文件
│   ├── globals.css     # 全局樣式
│   ├── theme.css       # 主題變量
│   ├── Home.module.css # 首頁樣式
│   ├── FundingRate.module.css
│   ├── Volume.module.css
│   ├── CexEarn.module.css
│   └── LeveragedSpot.module.css
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

### 槓桿現貨頁面

- 提供各大交易所的槓桿現貨交易數據比較
- 顯示最大槓桿倍數、交易對、手續費率等重要參數
- 支持按交易所篩選數據
- 實時排序功能，方便用戶快速找到合適的交易平台
- 清晰展示各交易所的清算閾值和最小交易額要求
- 數據定期更新，確保信息的時效性

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
  - Gate.io
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
- 🚀 新增交易所支持
  - 添加 Gate.io 資金費率數據
  - 整合 Gate.io 歷史資金費率
  - 解決跨域資源共享 (CORS) 問題
- 🔧 性能優化
  - 增加 API 請求超時處理

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

## 環境變量
請確保設置以下環境變量：
```
BINANCE_API_KEY=your_binance_api_key
BINANCE_API_SECRET=your_binance_api_secret
GATEIO_API_KEY=your_gateio_api_key
GATEIO_API_SECRET=your_gateio_api_secret
```

## 安裝和運行
1. 克隆項目
```bash
git clone https://github.com/yourusername/ArbiMaster.git
```

2. 安裝依賴
```bash
npm install
```

3. 運行開發服務器
```bash
npm run dev
```

4. 構建生產版本
```bash
npm run build
```

## 使用說明
1. 訪問 http://localhost:3000
2. 在搜索框中輸入幣種代碼（如 BTC、ETH 等）
3. 查看各交易所的槓桿現貨利率數據

## 注意事項
- 請確保 API 密鑰的安全性
- 建議在測試環境中先進行測試
- 定期更新 API 密鑰

## 貢獻指南
歡迎提交 Issue 和 Pull Request

## 授權
MIT License

# Bitget API 錯誤處理與簽名生成

## 簽名生成邏輯

### 簽名格式
當queryString不為空時：
```
timestamp + method.toUpperCase() + requestPath + "?" + queryString + body
```

當queryString為空時：
```
timestamp + method.toUpperCase() + requestPath + body
```

### 示例

1. 獲取合約深度信息（GET請求）：
```
Timestamp = 16273667805456
Method = "GET"
requestPath = "/api/mix/v2/market/depth"
queryString = "limit=20&symbol=BTCUSDT"

待簽名字符串：
16273667805456GET/api/mix/v2/market/depth?limit=20&symbol=BTCUSDT
```

2. 合約下單（POST請求）：
```
Timestamp = 16273667805456
Method = "POST"
requestPath = "/api/v2/mix/order/place-order"
body = {"productType":"usdt-futures","symbol":"BTCUSDT","size":"8","marginMode":"crossed","side":"buy","orderType":"limit","clientOid":"123456"}

待簽名字符串：
16273667805456POST/api/v2/mix/order/place-order{"productType":"usdt-futures","symbol":"BTCUSDT","size":"8","marginMode":"crossed","side":"buy","orderType":"limit","clientOid":"123456"}
```

### 簽名生成步驟

1. 使用私鑰secretkey進行HMAC SHA256加密：
```javascript
const hmac = crypto.createHmac('sha256', secretKey);
hmac.update(message);
const signature = hmac.digest('base64');
```

2. 對Signature進行base64編碼：
```javascript
const signature = base64.encode(signature);
```

## 常見錯誤處理

### 1. 簽名錯誤
- 錯誤碼：40001
- 原因：簽名生成不正確
- 解決方案：
  - 檢查timestamp格式是否正確
  - 確保method大寫
  - 驗證queryString格式
  - 確認body格式（JSON字符串）

### 2. API Key錯誤
- 錯誤碼：40002
- 原因：API Key無效或過期
- 解決方案：
  - 檢查API Key是否正確
  - 確認API Key是否已啟用
  - 驗證API Key權限

### 3. 時間戳錯誤
- 錯誤碼：40003
- 原因：請求時間戳與服務器時間差異過大
- 解決方案：
  - 確保本地時間準確
  - 使用服務器時間同步

### 4. 請求參數錯誤
- 錯誤碼：40004
- 原因：請求參數格式不正確
- 解決方案：
  - 檢查參數名稱是否正確
  - 驗證參數值格式
  - 確認必填參數是否完整

## 最佳實踐

1. 請求頭設置：
```javascript
headers: {
  'ACCESS-KEY': apiKey,
  'ACCESS-SIGN': signature,
  'ACCESS-PASSPHRASE': passphrase,
  'ACCESS-TIMESTAMP': timestamp,
  'Content-Type': 'application/json'
}
```

2. 錯誤處理：
```javascript
try {
  const response = await axios.get(url, {
    headers: headers,
    params: params
  });
  
  if (response.data.code === '00000') {
    // 成功處理
  } else {
    console.error('API錯誤:', response.data);
  }
} catch (error) {
  console.error('請求失敗:', error.message);
  if (error.response?.data) {
    console.error('錯誤詳情:', error.response.data);
  }
}
```

3. 參數處理：
```javascript
function parseParamsToStr(params) {
  if (!params || Object.keys(params).length === 0) return '';
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}
```


