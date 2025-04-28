// 引入必要的庫
import fetch from 'node-fetch';
import { Server } from 'socket.io';

// 緩存數據和上次更新時間
let cachedData = null;
let lastUpdated = null;
let isUpdating = false;
let cachedPrices = {};  // 緩存價格數據

// 預設的九個交易對
const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'DOGEUSDT', 'SUIUSDT', 'LINKUSDT', 'ADAUSDT', 'TRXUSDT'];

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
  okx: {
    url: 'https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-history',
    symbolParam: 'instId',
    period: '5m',
    priceUrl: 'https://www.okx.com/api/v5/market/ticker',
    exchangeInfoUrl: 'https://www.okx.com/api/v5/public/instruments?instType=SWAP'
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
      const okxSymbols = await fetchExchangeSymbols('okx');
   

      // 過濾符合搜尋條件的交易對（排除預設的九個）
      const searchUpperCase = search.toUpperCase();
      const filteredSymbols = {
        binance: binanceSymbols.filter(s => s.includes(searchUpperCase) && !DEFAULT_SYMBOLS.includes(s)),
        bybit: bybitSymbols.filter(s => s.includes(searchUpperCase) && !DEFAULT_SYMBOLS.includes(s)),
        okx: okxSymbols.filter(s => s.includes(searchUpperCase) && !DEFAULT_SYMBOLS.includes(s.replace('-USDT-SWAP', 'USDT'))),
        
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
    bodyParser: true,
  },
};

// 啟動 WebSocket 服務器
let io;
if (global.io) {
  io = global.io;
} else {
  // 直接使用全局 Socket.io 實例，不在這裡創建
  // 改為通過 /api/socketio 端點進行初始化
  global.io = null;
  
  // 啟動一個定時任務來更新緩存數據
  if (!global.updateInterval) {
    global.updateInterval = setInterval(async () => {
      try {
        if (!isUpdating) {
          isUpdating = true;
          console.log('後台更新緩存數據...');
          
          // 先獲取價格數據
          await fetchAllPrices();
          
          const openInterestData = await fetchAllExchangeData();
          cachedData = openInterestData;
          lastUpdated = new Date();
          isUpdating = false;
          console.log('後台數據更新完成');
        }
      } catch (error) {
        console.error('更新未平倉合約數據時出錯:', error);
        isUpdating = false;
      }
    }, 60000); // 每分鐘更新一次
  }
}

// 獲取所有交易所的價格數據
async function fetchAllPrices() {
  try {
    // 獲取 Binance 價格
    const binancePrices = await fetchBinancePrices();
    
    // 獲取 Bybit 價格
    const bybitPrices = await fetchBybitPrices();
    
    // 獲取 OKX 價格
    const okxPrices = await fetchOKXPrices();
    // console.log(okxPrices)
 
    
    // 合併所有價格數據
    cachedPrices = {
      ...binancePrices,
      ...bybitPrices,
      ...okxPrices,
   
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

// 獲取 OKX 價格
async function fetchOKXPrices() {
  try {
    const { priceUrl } = EXCHANGE_APIS.okx;
    const prices = {};
    
    // 由於 OKX API 需要指定交易對，我們需要先獲取可用的交易對
    const okxSymbols = await fetchExchangeSymbols('okx');
    
    // 只獲取預設幣種的價格數據以避免過多請求
    const defaultCoins = DEFAULT_SYMBOLS.map(symbol => symbol.replace('USDT', ''));
    const filteredSymbols = okxSymbols.filter(symbol => 
      defaultCoins.some(coin => symbol.includes(`${coin}-USDT`))
    );
    
    // 添加延遲函數以避免請求限制
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // 一次只請求一個交易對以避免超出限制
    for (const instId of filteredSymbols) {
      try {
        const response = await fetch(`${priceUrl}?instId=${instId}`);
      
        if (response.ok) {
          const data = await response.json();
          if (data.code === '0' && Array.isArray(data.data)) {
            data.data.forEach(item => {
              if (item.instId) {
                // 提取幣種名稱，例如：BTC-USDT-SWAP => BTCUSDT
                const symbol = item.instId.replace('-USDT-SWAP', 'USDT');
                prices[symbol] = parseFloat(item.last);
              }
            });
          }
        }
        
        // 添加 200ms 延遲以避免觸發 OKX API 限制
        await delay(200);
      } catch (error) {
        console.error(`獲取 OKX ${instId} 價格時出錯:`, error);
        continue;
      }
    }
    
    return prices;
  } catch (error) {
    console.error('獲取 OKX 價格數據時出錯:', error);
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
      
      case 'okx':
        if (data.code === '0' && Array.isArray(data.data)) {
          return data.data
            .filter(item => item.state === 'live' && item.instType === 'SWAP' && item.settleCcy === 'USDT')
            .map(item => item.instId);
        }
        return [];
      
      
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
    const okxSymbols = await fetchExchangeSymbols('okx');


    // 更新 EXCHANGE_APIS 中的 symbols
    EXCHANGE_APIS.binance.symbols = binanceSymbols;
    EXCHANGE_APIS.bybit.symbols = bybitSymbols;
    EXCHANGE_APIS.okx.symbols = okxSymbols;

    // 獲取各交易所的未平倉數據
    const [binanceData, bybitData, okxData] = await Promise.all([
      fetchBinanceOpenInterest(),
      fetchBybitOpenInterest(),
      fetchOKXOpenInterest(),
    ]);

    // 合併數據
    const mergedData = mergeExchangeData([
      { exchange: 'Binance', data: binanceData },
      { exchange: 'Bybit', data: bybitData },
      { exchange: 'OKX', data: okxData },
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
      const apiUrl = `${url}?${symbolParam}=${symbol}&category=${category}&intervalTime=${intervalTime}&limit=1`;
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

// 獲取 OKX 未平倉合約數據
async function fetchOKXOpenInterest() {
  try {
    const results = [];
    const { url, symbolParam, period } = EXCHANGE_APIS.okx;
    
    // 從 DEFAULT_SYMBOLS 提取幣種
    const defaultCoins = DEFAULT_SYMBOLS.map(symbol => symbol.replace('USDT', ''));
    
    // 添加延遲函數以避免請求限制
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 為每個幣種獲取未平倉合約數據
    for (const coin of defaultCoins) {
      const instId = `${coin}-USDT-SWAP`; // 格式化為 OKX 所需的產品 ID 格式
      const apiUrl = `${url}?${symbolParam}=${instId}&period=${period}&limit=1`;

      try {
        const response = await fetch(apiUrl);
          
        if (response.ok) {
          const data = await response.json();
        
          if (data.code === '0' && Array.isArray(data.data) && data.data.length > 0) {
            // console.log(data.data);
            const latestData = data.data[0];
            
            // 使用 oi 值（索引為 1）
            if (latestData && latestData.length > 2) {
              const oiValue = parseFloat(latestData[2]);
              
              if (!isNaN(oiValue) && isFinite(oiValue) && oiValue > 0) {
                results.push({
                  symbol: `${coin}USDT`,
                  openInterest: oiValue
                });
                // console.log(`OKX ${instId}: 使用 oi 值=${oiValue}`);
              } else {
                console.error(`OKX ${instId}: oi 值無效: ${latestData[1]}`);
              }
            }
          }
        }
        
        // 添加延遲以避免觸發 OKX API 限制
        await delay(500);
        
      } catch (error) {
        console.error(`獲取 OKX ${instId} 數據時出錯:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('獲取 OKX 未平倉合約數據時出錯:', error);
    return [];
  }
}



// 計算各交易所數據數量
function countExchangeData(data) {
  const counts = {
    binance: 0,
    bybit: 0,
    okx: 0,
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
        } else if (exchange.exchange === 'OKX') {
          counts.okx++;
        }
      }
    }
  }
  
  counts.total = counts.binance + counts.bybit + counts.okx;
  return counts;
}

// 合併各交易所的數據
function mergeExchangeData(exchangesData) {
  const allData = {};
  
  for (const { exchange, data } of exchangesData) {
    for (const item of data) {
      const symbol = item.symbol;
      const price = cachedPrices[symbol] || 0;
      let amount = 0;
      
      try {
        // 安全地解析 amount 值
        amount = parseFloat(item.openInterest || item.amount || 0);
        
        // 檢查數值是否合理 (防止極大值)
        if (isNaN(amount) || !isFinite(amount) || amount < 0) {
          console.error(`${exchange} ${symbol}: 持倉量值不合理 ${amount}，設為 0`);
          amount = 0;
        }
        
        // 對於 OKX，額外檢查是否是巨大的數值
        if (exchange === 'OKX' && amount > 1e13) {
          console.error(`OKX ${symbol}: 持倉量值異常大 ${amount}，可能有單位問題，嘗試修正`);
          amount = amount / 1e6; // 嘗試修正可能的單位問題
        }
      } catch (e) {
        console.error(`${exchange} ${symbol}: 解析持倉量失敗 - ${e.message}`);
        amount = 0;
      }
      
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
    const [binanceData, bybitData, okxData] = await Promise.all([
      fetchExchangeData('binance', DEFAULT_SYMBOLS),
      fetchExchangeData('bybit', DEFAULT_SYMBOLS),
      fetchOKXOpenInterest(),
    ]);

    return mergeExchangeData([
      { exchange: 'Binance', data: binanceData },
      { exchange: 'Bybit', data: bybitData },
      { exchange: 'OKX', data: okxData },
    ]);
  } catch (error) {
    console.error('獲取預設數據時出錯:', error);
    throw error;
  }
}


// 獲取搜索結果的數據
async function fetchSearchData(symbol) {
  try {
    const coin = symbol.replace('USDT', '');
    
    // 從不同交易所獲取數據
    const [binanceData, bybitData, okxData] = await Promise.all([
      fetchExchangeData('binance', [symbol]),
      fetchExchangeData('bybit', [symbol]),
      fetchOKXSearchData([coin])
    ]);
    
    // 合併數據
    const mergedData = mergeExchangeData([
      { exchange: 'Binance', data: binanceData },
      { exchange: 'Bybit', data: bybitData },
      { exchange: 'OKX', data: okxData }
    ]);
    
    return mergedData;
  } catch (error) {
    console.error('獲取搜索數據時出錯:', error);
    return [];
  }
}

// 專門為 OKX 獲取搜尋交易對的數據
async function fetchOKXSearchData(coins) {
  try {
    const results = [];
    const { url, symbolParam, period } = EXCHANGE_APIS.okx;
    
    // 添加延遲函數以避免請求限制
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (const coin of coins) {
      const instId = `${coin}-USDT-SWAP`; // 格式化為 OKX 所需的產品 ID 格式
      const apiUrl = `${url}?${symbolParam}=${instId}&period=${period}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.code === '0' && Array.isArray(data.data) && data.data.length > 0) {
          const latestData = data.data[0];
          
          // 使用 oi 值（索引為 1）
          if (latestData && latestData.length > 1) {
            const oiValue = parseFloat(latestData[1]);
            
            if (!isNaN(oiValue) && isFinite(oiValue) && oiValue > 0) {
              results.push({
                symbol: `${coin}USDT`,
                openInterest: oiValue
              });
              console.log(`OKX ${instId}: 使用 oi 值=${oiValue}`);
            } else {
              console.error(`OKX ${instId}: oi 值無效: ${latestData[1]}`);
            }
          }
        }
      }
      
      // 添加延遲以避免觸發 OKX API 限制
      await delay(500);
    }
    
    return results;
  } catch (error) {
    console.error('獲取 OKX 搜尋數據時出錯:', error);
    return [];
  }
}

// 獲取指定交易所的數據
async function fetchExchangeData(exchange, symbols) {
  const { url, symbolParam, category, intervalTime, productType } = EXCHANGE_APIS[exchange];
  const results = [];
  
  // 添加延遲函數用於 OKX API
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  for (const symbol of symbols) {
    try {
      let apiUrl = `${url}?${symbolParam}=${symbol}`;
      
      // 特殊處理 OKX 的 API 格式
      if (exchange === 'okx') {
        // 從 symbol 提取幣種，例如 'BTCUSDT' 轉換為 'BTC-USDT-SWAP'
        const coin = symbol.replace('USDT', '');
        const instId = `${coin}-USDT-SWAP`;
        apiUrl = `${url}?${symbolParam}=${instId}`;
        if (EXCHANGE_APIS.okx.period) apiUrl += `&period=${EXCHANGE_APIS.okx.period}`;
      } else {
        if (category) apiUrl += `&category=${category}`;
        if (intervalTime) apiUrl += `&intervalTime=${intervalTime}`;
        if (productType) apiUrl += `&productType=${productType}`;
      }

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
          case 'okx':
            if (data.code === '0' && Array.isArray(data.data) && data.data.length > 0) {
              const latestData = data.data[0];
              
              // 使用 oi 值（索引為 1）
              if (latestData && latestData.length > 1) {
                const oiValue = parseFloat(latestData[1]);
                
                if (!isNaN(oiValue) && isFinite(oiValue) && oiValue > 0) {
                  results.push({
                    symbol,
                    openInterest: oiValue
                  });
                  console.log(`OKX ${symbol}: 使用 oi 值=${oiValue}`);
                }
              }
            }
            
            // 為 OKX API 添加延遲
            await delay(500);
            break;
        }
      }
    } catch (error) {
      console.error(`獲取${exchange}數據時出錯:`, error);
    }
  }
  
  return results;
}
