# 加密貨幣數據中心

**當前版本**：1.0.0

這是一個專注於加密貨幣市場數據分析的網頁應用程式，提供多種市場指標的即時監控和分析功能。

## 功能特點

- **資金費率監控**：追蹤多個交易所（Binance、Bybit、OKX、Bitget、HyperLiquid）的資金費率數據，支援排序和篩選功能。
- **資金流向分析**：分析市場資金流入和流出情況，幫助了解市場趨勢。
- **恐懼與貪婪指數**：顯示市場情緒指標，幫助投資決策。
- **未平倉合約量**：監控市場未平倉合約數據。
- **交易量分析**：追蹤市場交易量變化。
- **CEX 理財收益**：比較各大交易所（Binance、Bybit、OKX、Bitget）的穩定幣活期理財收益率，支援 USDT、USDC、DAI。
- **歷史數據查詢**：提供歷史數據查詢和分析功能。

## 技術架構

- **前端框架**：Next.js、React
- **UI 組件**：Material-UI (MUI)、純CSS樣式
- **數據視覺化**：Chart.js、React-Chartjs-2
- **後端通訊**：Socket.IO、Axios
- **數據存儲**：SQLite3

## 安裝指南

### 前置需求

- Node.js (v14.0.0 或更高版本)
- npm 或 yarn
- 各交易所的 API 密鑰（用於獲取理財收益數據）

### 安裝步驟

1. 克隆專案到本地：

```bash
git clone https://github.com/your-username/funding-rate.git
cd funding-rate
```

2. 安裝依賴：

```bash
npm install
# 或
yarn install
```

3. 配置環境變數：

在專案根目錄創建 `.env` 文件，並添加以下配置：

```env
# Binance API 配置
BINANCE_API_KEY=您的幣安API密鑰
BINANCE_API_SECRET=您的幣安API密鑰

# Bitget API 配置
BITGET_API_KEY=您的Bitget API密鑰
BITGET_API_SECRET=您的Bitget API密鑰
BITGET_PASSPHRASE=您的Bitget API密碼

# 其他配置...
```

4. 啟動開發伺服器：

```bash
npm run dev
# 或
yarn dev
```

5. 打開瀏覽器訪問 `http://localhost:3000`

## 生產環境部署

1. 構建專案：

```bash
npm run build
# 或
yarn build
```

2. 啟動生產伺服器：

```bash
npm run start
# 或
yarn start
```

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

安裝 socket.io-client 套件
```bash
npm install socke.io-client
```
克隆專案
1.
開新的空白專案
Terminal打
”git clone GitHub連結”

2.
克隆完成之後開始編輯
不用另外用倉庫，因為科隆的時候就會連到倉庫了。

3.
存檔完
Push 編輯的檔案
下面有選項，可以選分支。
統一用master，其他的我刪了


