// 引入必要的庫
import fetch from 'node-fetch';
import { Server } from 'socket.io';

// 緩存數據和上次更新時間
let cachedData = null;
let lastUpdated = null;
let isUpdating = false;

// 配置各交易所的 API URL
const EXCHANGE_APIS = {
  binance: {
    url: 'https://fapi.binance.com/fapi/v1/openInterest',
    symbolParam: 'symbol',
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT']
  },
  bybit: {
    url: 'https://api.bybit.com/v5/market/open-interest',
    symbolParam: 'symbol',
    category: 'linear',
    intervalTime: '5min',
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'DOTUSDT']
  },
  bitget: {
    url: 'https://api.bitget.com/api/mix/v1/market/open-interest',
    symbolParam: 'symbol',
    productType: 'USDT-FUTURES',
    // Bitget的交易對格式不同，需要添加_UMCBL後綴
    symbols: [
      'BTCUSDT_UMCBL', 
      'ETHUSDT_UMCBL', 
      'SOLUSDT_UMCBL', 
      'BNBUSDT_UMCBL', 
      'ADAUSDT_UMCBL', 
      'XRPUSDT_UMCBL', 
      'DOGEUSDT_UMCBL', 
      'AVAXUSDT_UMCBL', 
      'MATICUSDT_UMCBL', 
      'DOTUSDT_UMCBL'
    ]
  }
};

// 網頁API處理函數
export default async function handler(req, res) {
  // 設置 CORS 頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  
  // 處理 OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // 如果有緩存數據且最後更新時間在5分鐘內，直接返回緩存數據
    const now = new Date();
    if (cachedData && lastUpdated && ((now - lastUpdated) < 5 * 60 * 1000)) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        lastUpdated: lastUpdated.toISOString(),
        counts: countExchangeData(cachedData)
      });
    }
    
    // 否則獲取新數據
    if (!isUpdating) {
      isUpdating = true;
      
      // 獲取各交易所數據
      const openInterestData = await fetchAllExchangeData();
      
      // 更新緩存
      cachedData = openInterestData;
      lastUpdated = new Date();
      isUpdating = false;
      
      // 返回數據
      return res.status(200).json({
        success: true,
        data: cachedData,
        lastUpdated: lastUpdated.toISOString(),
        counts: countExchangeData(cachedData)
      });
    } else {
      // 如果正在更新中且有緩存，返回緩存數據
      if (cachedData && lastUpdated) {
        return res.status(200).json({
          success: true,
          data: cachedData,
          lastUpdated: lastUpdated.toISOString(),
          counts: countExchangeData(cachedData)
        });
      } else {
        // 如果正在更新但沒有緩存，返回等待消息
        return res.status(202).json({
          success: false,
          error: '數據正在更新中，請稍後再試'
        });
      }
    }
  } catch (error) {
    console.error('獲取未平倉合約數據時出錯:', error);
    return res.status(500).json({
      success: false,
      error: '伺服器錯誤，無法獲取未平倉合約數據'
    });
  }
}

// 配置 WebSocket 服務器
export const config = {
  api: {
    bodyParser: false,
  },
};

// 啟動 WebSocket 服務器
let io;
if (global.io) {
  io = global.io;
} else {
  io = new Server({
    path: '/api/socketio',
  });
  global.io = io;
  
  // 設置定時任務，每分鐘更新一次數據
  setInterval(async () => {
    try {
      if (!isUpdating) {
        isUpdating = true;
        const openInterestData = await fetchAllExchangeData();
        cachedData = openInterestData;
        lastUpdated = new Date();
        isUpdating = false;
        
        // 廣播更新的數據
        io.emit('open-interest-update', {
          data: cachedData,
          lastUpdated: lastUpdated.toISOString(),
          counts: countExchangeData(cachedData)
        });
      }
    } catch (error) {
      console.error('WebSocket 更新未平倉合約數據時出錯:', error);
      isUpdating = false;
    }
  }, 60000); // 每分鐘更新一次
}

// 獲取所有交易所的未平倉合約數據
async function fetchAllExchangeData() {
  try {
    const allData = {};
    
    // 獲取 Binance 數據
    const binanceData = await fetchBinanceOpenInterest();
    for (const item of binanceData) {
      const symbol = item.symbol;
      if (!allData[symbol]) {
        allData[symbol] = {
          symbol,
          exchangeData: [],
          totalAmount: 0
        };
      }
      
      allData[symbol].exchangeData.push({
        exchange: 'Binance',
        amount: parseFloat(item.openInterest)
      });
      
      allData[symbol].totalAmount += parseFloat(item.openInterest);
    }
    
    // 獲取 Bybit 數據
    const bybitData = await fetchBybitOpenInterest();
    for (const item of bybitData) {
      const symbol = item.symbol;
      if (!allData[symbol]) {
        allData[symbol] = {
          symbol,
          exchangeData: [],
          totalAmount: 0
        };
      }
      
      allData[symbol].exchangeData.push({
        exchange: 'Bybit',
        amount: parseFloat(item.openInterest)
      });
      
      allData[symbol].totalAmount += parseFloat(item.openInterest);
    }
    
    // 獲取 Bitget 數據
    const bitgetData = await fetchBitgetOpenInterest();
    for (const item of bitgetData) {
      const symbol = item.symbol;
      if (!allData[symbol]) {
        allData[symbol] = {
          symbol,
          exchangeData: [],
          totalAmount: 0
        };
      }
      
      allData[symbol].exchangeData.push({
        exchange: 'Bitget',
        amount: parseFloat(item.amount)
      });
      
      allData[symbol].totalAmount += parseFloat(item.amount);
    }
    
    // 轉換為陣列並按未平倉量排序
    return Object.values(allData).sort((a, b) => b.totalAmount - a.totalAmount);
  } catch (error) {
    console.error('獲取所有交易所數據時出錯:', error);
    throw error;
  }
}

// 獲取 Binance 未平倉合約數據
async function fetchBinanceOpenInterest() {
  try {
    const results = [];
    const { symbols, url, symbolParam } = EXCHANGE_APIS.binance;
    
    for (const symbol of symbols) {
      const apiUrl = `${url}?${symbolParam}=${symbol}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        results.push(data);
      }
    }
    
    return results;
  } catch (error) {
    console.error('獲取 Binance 未平倉合約數據時出錯:', error);
    return [];
  }
}

// 獲取 Bybit 未平倉合約數據
async function fetchBybitOpenInterest() {
  try {
    const results = [];
    const { symbols, url, symbolParam, category, intervalTime } = EXCHANGE_APIS.bybit;
    
    for (const symbol of symbols) {
      const apiUrl = `${url}?${symbolParam}=${symbol}&category=${category}&intervalTime=${intervalTime}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.list && data.result.list.length > 0) {
          results.push({
            symbol: symbol,
            openInterest: data.result.list[0].openInterest
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('獲取 Bybit 未平倉合約數據時出錯:', error);
    return [];
  }
}

// 獲取 Bitget 未平倉合約數據
async function fetchBitgetOpenInterest() {
  try {
    const results = [];
    const { symbols, url, symbolParam, productType } = EXCHANGE_APIS.bitget;
    
    for (const symbol of symbols) {
      const apiUrl = `${url}?${symbolParam}=${symbol}&productType=${productType}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          // 從原始符號中移除_UMCBL後綴以統一顯示格式
          const displaySymbol = symbol.replace('_UMCBL', '');
          results.push({
            symbol: displaySymbol,
            amount: data.data.amount
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('獲取 Bitget 未平倉合約數據時出錯:', error);
    return [];
  }
}

// 計算各交易所數據數量
function countExchangeData(data) {
  const counts = {
    binance: 0,
    bybit: 0,
    bitget: 0,
    total: 0
  };
  
  if (!Array.isArray(data)) return counts;
  
  for (const item of data) {
    if (item.exchangeData) {
      for (const exchange of item.exchangeData) {
        if (exchange.exchange === 'Binance') {
          counts.binance++;
        } else if (exchange.exchange === 'Bybit') {
          counts.bybit++;
        } else if (exchange.exchange === 'Bitget') {
          counts.bitget++;
        }
      }
    }
  }
  
  counts.total = counts.binance + counts.bybit + counts.bitget;
  return counts;
} 