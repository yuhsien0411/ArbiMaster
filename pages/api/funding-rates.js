// 使用 Next.js 的內置 API 路由處理 WebSocket
import { Server } from 'socket.io';

// 緩存配置
const CACHE_DURATION = 60000; // 1分鐘
let cachedData = null;
let lastCacheTime = 0;

// 創建 socket.io 實例
let io;

if (!global.io) {
  global.io = new Server();
}
io = global.io;

// 主要的 API 處理函數
export default async function handler(req, res) {
  // 設置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const currentTime = Date.now();
    
    // 檢查緩存是否有效
    if (cachedData && currentTime - lastCacheTime < CACHE_DURATION) {
      return res.status(200).json(cachedData);
    }

    // 獲取新數據
    const data = await fetchAllExchangeData();
    
    // 更新緩存
    cachedData = data;
    lastCacheTime = currentTime;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching funding rates:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch funding rates',
      details: error.message 
    });
  }
}

async function fetchAllExchangeData() {
  try {
    // 直接請求交易所 API
    const [binanceData, bybitData, bitgetData] = await Promise.all([
      fetch('https://fapi.binance.com/fapi/v1/premiumIndex').then(res => res.json()),
      fetch('https://api.bybit.com/v5/market/tickers?category=linear').then(res => res.json()),
      fetch('https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES', {
        headers: {
          'Content-Type': 'application/json',
          'locale': 'zh-CN'
        }
      }).then(res => res.json())
    ]);

    // 處理幣安數據
    const binanceRates = binanceData
      ? binanceData
          .filter(item => item.symbol.endsWith('USDT'))
          .map(item => ({
            symbol: item.symbol.replace('USDT', ''),
            exchange: 'Binance',
            currentRate: (parseFloat(item.lastFundingRate) * 100).toFixed(4),
            isSpecialInterval: false,
            settlementInterval: 8
          }))
      : [];

    // 處理 Bybit 數據
    const bybitRates = bybitData?.result?.list
      ? bybitData.result.list
          .filter(item => item.symbol.endsWith('USDT') && item.fundingRate)
          .map(item => ({
            symbol: item.symbol.replace('USDT', ''),
            exchange: 'Bybit',
            currentRate: (parseFloat(item.fundingRate) * 100).toFixed(4),
            isSpecialInterval: false,
            settlementInterval: 8
          }))
      : [];

    // 處理 Bitget 數據
    const bitgetRates = bitgetData?.data
      ? bitgetData.data
          .filter(item => item.symbol && item.fundingRate)
          .map(item => ({
            symbol: item.symbol.replace('USDT', ''),
            exchange: 'Bitget',
            currentRate: (parseFloat(item.fundingRate) * 100).toFixed(4),
            isSpecialInterval: false,
            settlementInterval: 8
          }))
      : [];

    // 合併所有數據
    const allRates = [...binanceRates, ...bybitRates, ...bitgetRates];

    return {
      success: true,
      data: allRates,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error in fetchAllExchangeData:', error);
    throw error;
  }
}

// 配置 API 路由以支持 WebSocket
export const config = {
  api: {
    bodyParser: false,
  },
};