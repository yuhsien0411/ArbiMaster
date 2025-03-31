// 引入必要的庫
import fetch from 'node-fetch';
import { Server } from 'socket.io';

// 緩存數據和上次更新時間
let cachedData = null;
let lastUpdated = null;
let isUpdating = false;
let cachedPrices = {};  // 緩存價格數據

// 預設的九個交易對
const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT', 'ADAUSDT'];

// 配置各交易所的 API URL
const EXCHANGE_APIS = {
  binance: {
    url: 'https://fapi.binance.com/fapi/v1/openInterest',
    symbolParam: 'symbol',
    priceUrl: 'https://fapi.binance.com/fapi/v1/ticker/price',
    exchangeInfoUrl: 'https://fapi.binance.com/fapi/v1/exchangeInfo'
  },
  bybit: {
    url: 'https://api.bybit.com/v5/market/open-interest',
    symbolParam: 'symbol',
    category: 'linear',
    intervalTime: '5min',
    priceUrl: 'https://api.bybit.com/v5/market/tickers',
    exchangeInfoUrl: 'https://api.bybit.com/v5/market/instruments-info?category=linear'
  },
  bitget: {
    url: 'https://api.bitget.com/api/mix/v1/market/open-interest',
    symbolParam: 'symbol',
    productType: 'USDT-FUTURES',
    priceUrl: 'https://api.bitget.com/api/mix/v1/market/ticker',
    exchangeInfoUrl: 'https://api.bitget.com/api/mix/v1/market/contracts?productType=USDT-FUTURES'
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
    const { search } = req.query;
    const now = new Date();

    // 如果是搜尋請求
    if (search) {
      // 獲取所有交易所的交易對
      const binanceSymbols = await fetchExchangeSymbols('binance');
      const bybitSymbols = await fetchExchangeSymbols('bybit');
      const bitgetSymbols = await fetchExchangeSymbols('bitget');

      // 過濾符合搜尋條件的交易對（排除預設的九個）
      const searchUpperCase = search.toUpperCase();
      const filteredSymbols = {
        binance: binanceSymbols.filter(s => s.includes(searchUpperCase) && !DEFAULT_SYMBOLS.includes(s)),
        bybit: bybitSymbols.filter(s => s.includes(searchUpperCase) && !DEFAULT_SYMBOLS.includes(s)),
        bitget: bitgetSymbols.filter(s => s.includes(searchUpperCase) && !DEFAULT_SYMBOLS.includes(s))
      };

      // 獲取搜尋結果的數據
      const searchData = await fetchSearchData(filteredSymbols);
      
      return res.status(200).json({
        success: true,
        data: searchData,
        lastUpdated: now.toISOString(),
        isSearchResult: true
      });
    }
    
    // 如果是初始請求或更新請求
    if (!isUpdating) {
      isUpdating = true;
      
      // 先獲取價格數據
      await fetchAllPrices();
      
      // 只獲取預設九個交易對的數據
      const defaultData = await fetchDefaultData();
      
      // 更新緩存
      cachedData = defaultData;
      lastUpdated = now;
      isUpdating = false;
      
      return res.status(200).json({
        success: true,
        data: defaultData,
        lastUpdated: now.toISOString(),
        counts: countExchangeData(defaultData)
      });
    }
    
    // 如果正在更新中且有緩存，返回緩存數據
    if (cachedData && lastUpdated) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        lastUpdated: lastUpdated.toISOString(),
        counts: countExchangeData(cachedData)
      });
    }
    
    return res.status(202).json({
      success: false,
      error: '數據正在更新中，請稍後再試'
    });
  } catch (error) {
    console.error('處理請求時出錯:', error);
    return res.status(500).json({
      success: false,
      error: '伺服器錯誤'
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
        
        // 先獲取價格數據
        await fetchAllPrices();
        
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

// 獲取所有交易所的價格數據
async function fetchAllPrices() {
  try {
    // 獲取 Binance 價格
    const binancePrices = await fetchBinancePrices();
    
    // 獲取 Bybit 價格
    const bybitPrices = await fetchBybitPrices();
    
    // 獲取 Bitget 價格
    const bitgetPrices = await fetchBitgetPrices();
    
    // 合併所有價格數據
    cachedPrices = {
      ...binancePrices,
      ...bybitPrices,
      ...bitgetPrices
    };
    
    return cachedPrices;
  } catch (error) {
    console.error('獲取價格數據時出錯:', error);
    return {};
  }
}

// 獲取 Binance 價格
async function fetchBinancePrices() {
  try {
    const { priceUrl } = EXCHANGE_APIS.binance;
    const response = await fetch(priceUrl);
    
    if (response.ok) {
      const data = await response.json();
      const prices = {};
      
      data.forEach(item => {
        if (item.symbol) {
          prices[item.symbol] = parseFloat(item.price);
        }
      });
      
      return prices;
    }
    
    return {};
  } catch (error) {
    console.error('獲取 Binance 價格數據時出錯:', error);
    return {};
  }
}

// 獲取 Bybit 價格
async function fetchBybitPrices() {
  try {
    const { priceUrl } = EXCHANGE_APIS.bybit;
    const response = await fetch(`${priceUrl}?category=linear`);
    
    if (response.ok) {
      const data = await response.json();
      const prices = {};
      
      if (data.result && data.result.list) {
        data.result.list.forEach(item => {
          if (item.symbol) {
            prices[item.symbol] = parseFloat(item.lastPrice);
          }
        });
      }
      
      return prices;
    }
    
    return {};
  } catch (error) {
    console.error('獲取 Bybit 價格數據時出錯:', error);
    return {};
  }
}

// 獲取 Bitget 價格
async function fetchBitgetPrices() {
  try {
    const { priceUrl, symbols, productType } = EXCHANGE_APIS.bitget;
    const prices = {};
    
    for (const symbol of symbols) {
      const response = await fetch(`${priceUrl}?symbol=${symbol}&productType=${productType}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const displaySymbol = symbol.replace('_UMCBL', '');
          prices[displaySymbol] = parseFloat(data.data.last);
        }
      }
    }
    
    return prices;
  } catch (error) {
    console.error('獲取 Bitget 價格數據時出錯:', error);
    return {};
  }
}

// 獲取交易所所有可用的交易對
async function fetchExchangeSymbols(exchange) {
  try {
    const { exchangeInfoUrl } = EXCHANGE_APIS[exchange];
    const response = await fetch(exchangeInfoUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 根據不同交易所解析數據
    switch (exchange) {
      case 'binance':
        return data.symbols
          .filter(symbol => symbol.status === 'TRADING' && symbol.contractType === 'PERPETUAL')
          .map(symbol => symbol.symbol);
      
      case 'bybit':
        return data.result.list
          .filter(symbol => symbol.status === 'Trading')
          .map(symbol => symbol.symbol);
      
      case 'bitget':
        return data.data
          .filter(symbol => symbol.symbolStatus === 'normal')
          .map(symbol => symbol.symbol);
      
      default:
        return [];
    }
  } catch (error) {
    console.error(`獲取${exchange}交易對列表時出錯:`, error);
    return [];
  }
}

// 修改獲取所有交易所數據的函數
async function fetchAllExchangeData() {
  try {
    // 獲取所有交易所的交易對
    const binanceSymbols = await fetchExchangeSymbols('binance');
    const bybitSymbols = await fetchExchangeSymbols('bybit');
    const bitgetSymbols = await fetchExchangeSymbols('bitget');

    // 更新 EXCHANGE_APIS 中的 symbols
    EXCHANGE_APIS.binance.symbols = binanceSymbols;
    EXCHANGE_APIS.bybit.symbols = bybitSymbols;
    EXCHANGE_APIS.bitget.symbols = bitgetSymbols;

    // 獲取各交易所的未平倉數據
    const [binanceData, bybitData, bitgetData] = await Promise.all([
      fetchBinanceOpenInterest(),
      fetchBybitOpenInterest(),
      fetchBitgetOpenInterest()
    ]);

    // 合併數據
    const mergedData = mergeExchangeData([
      { exchange: 'Binance', data: binanceData },
      { exchange: 'Bybit', data: bybitData },
      { exchange: 'Bitget', data: bitgetData }
    ]);

    return mergedData;
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

// 合併各交易所的數據
function mergeExchangeData(exchangesData) {
  const allData = {};
  
  for (const { exchange, data } of exchangesData) {
    for (const item of data) {
      const symbol = item.symbol;
      const price = cachedPrices[symbol] || 0;
      const amount = parseFloat(item.openInterest || item.amount);
      const notionalValue = amount * price;
      
      if (!allData[symbol]) {
        allData[symbol] = {
          symbol,
          exchangeData: [],
          totalAmount: 0,
          totalNotionalValue: 0
        };
      }
      
      allData[symbol].exchangeData.push({
        exchange,
        amount,
        notionalValue
      });
      
      allData[symbol].totalAmount += amount;
      allData[symbol].totalNotionalValue += notionalValue;
    }
  }
  
  // 轉換為陣列並按名義價值排序
  return Object.values(allData).sort((a, b) => b.totalNotionalValue - a.totalNotionalValue);
}

// 獲取預設九個交易對的數據
async function fetchDefaultData() {
  try {
    const [binanceData, bybitData, bitgetData] = await Promise.all([
      fetchExchangeData('binance', DEFAULT_SYMBOLS),
      fetchExchangeData('bybit', DEFAULT_SYMBOLS),
      fetchExchangeData('bitget', DEFAULT_SYMBOLS.map(s => s + '_UMCBL'))
    ]);

    return mergeExchangeData([
      { exchange: 'Binance', data: binanceData },
      { exchange: 'Bybit', data: bybitData },
      { exchange: 'Bitget', data: bitgetData }
    ]);
  } catch (error) {
    console.error('獲取預設數據時出錯:', error);
    throw error;
  }
}

// 獲取搜尋結果的數據
async function fetchSearchData(filteredSymbols) {
  try {
    const [binanceData, bybitData, bitgetData] = await Promise.all([
      fetchExchangeData('binance', filteredSymbols.binance),
      fetchExchangeData('bybit', filteredSymbols.bybit),
      fetchExchangeData('bitget', filteredSymbols.bitget.map(s => s + '_UMCBL'))
    ]);

    return mergeExchangeData([
      { exchange: 'Binance', data: binanceData },
      { exchange: 'Bybit', data: bybitData },
      { exchange: 'Bitget', data: bitgetData }
    ]);
  } catch (error) {
    console.error('獲取搜尋數據時出錯:', error);
    throw error;
  }
}

// 獲取指定交易所的數據
async function fetchExchangeData(exchange, symbols) {
  const { url, symbolParam, category, intervalTime, productType } = EXCHANGE_APIS[exchange];
  const results = [];

  for (const symbol of symbols) {
    try {
      let apiUrl = `${url}?${symbolParam}=${symbol}`;
      if (category) apiUrl += `&category=${category}`;
      if (intervalTime) apiUrl += `&intervalTime=${intervalTime}`;
      if (productType) apiUrl += `&productType=${productType}`;

      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        switch (exchange) {
          case 'binance':
            results.push(data);
            break;
          case 'bybit':
            if (data.result?.list?.[0]) {
              results.push({
                symbol,
                openInterest: data.result.list[0].openInterest
              });
            }
            break;
          case 'bitget':
            if (data.data) {
              results.push({
                symbol: symbol.replace('_UMCBL', ''),
                amount: data.data.amount
              });
            }
            break;
        }
      }
    } catch (error) {
      console.error(`獲取${exchange}數據時出錯:`, error);
    }
  }
  
  return results;
} 