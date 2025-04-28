// 處理交易所資金流向數據的 API 端點
import axios from 'axios';

const BINANCE_API = 'https://api.binance.com/api/v3';
const BYBIT_API = 'https://api.bybit.com/v5';
const OKX_API = 'https://www.okx.com/api/v5';

// 配置參數
const LARGE_ORDER_THRESHOLD = 100000; // 大額交易閾值（USDT）
const REQUEST_TIMEOUT = 10000; // 請求超時時間
const TIME_WINDOW = 5 * 60 * 1000; // 5分鐘時間窗口
const TRADES_LIMIT = 1000; // 獲取交易數量限制

// 緩存機制
let cache = {
  binance: { data: null, timestamp: 0 },
  bybit: { data: null, timestamp: 0 },
  okx: { data: null, timestamp: 0 }
};

// 添加重試機制
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios({
        ...options,
        url,
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      return response.data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

async function fetchBinanceData() {
  try {
    const trades = await fetchWithRetry(`${BINANCE_API}/trades`, {
      params: {
        symbol: 'BTCUSDT',
        limit: TRADES_LIMIT
      }
    });
    
    const ticker = await fetchWithRetry(`${BINANCE_API}/ticker/24hr`, {
      params: { symbol: 'BTCUSDT' }
    });

    return { trades, ticker, timestamp: Date.now() };
  } catch (error) {
    console.error('Binance API error:', error.message);
    return null;
  }
}

async function fetchBybitData() {
  try {
    // 使用 execution 端點替代 recent-trade
    const trades = await fetchWithRetry(`${BYBIT_API}/market/recent-trade`, {
      params: {
        category: 'spot',
        symbol: 'BTCUSDT',
        limit: TRADES_LIMIT
      }
    });
    
    const ticker = await fetchWithRetry(`${BYBIT_API}/market/tickers`, {
      params: {
        category: 'spot',
        symbol: 'BTCUSDT'
      }
    });

    // 添加數據檢查和日誌
    if (!trades?.result?.list || !Array.isArray(trades.result.list)) {
      console.error('Bybit trades data format error:', trades);
      return null;
    }

    if (!ticker?.result?.list?.[0]) {
      console.error('Bybit ticker data format error:', ticker);
      return null;
    }

    return { trades, ticker, timestamp: Date.now() };
  } catch (error) {
    console.error('Bybit API error:', error.message);
    return null;
  }
}

async function fetchOKXData() {
  try {
    const trades = await fetchWithRetry(`${OKX_API}/market/trades`, {
      params: {
        instId: 'BTC-USDT',
        limit: TRADES_LIMIT
      }
    });
    
    const ticker = await fetchWithRetry(`${OKX_API}/market/ticker`, {
      params: {
        instId: 'BTC-USDT'
      }
    });

    return { trades, ticker, timestamp: Date.now() };
  } catch (error) {
    console.error('OKX API error:', error.message);
    return null;
  }
}

function calculateNetFlow(data, exchange, previousData = null) {
  if (!data || !data.trades) return { netFlow: 0, largeOrdersCount: 0 };
  
  let netFlow = 0;
  let largeOrdersCount = 0;
  let volume24h = 0;
  const currentTime = Date.now();

  try {
    switch (exchange) {
      case 'binance':
        // 過濾最近5分鐘的交易
        const binanceTrades = data.trades.filter(trade => 
          currentTime - trade.time <= TIME_WINDOW
        );
        
        binanceTrades.forEach(trade => {
          const price = parseFloat(trade.price);
          const quantity = parseFloat(trade.qty);
          const amount = price * quantity;
          
          if (amount >= LARGE_ORDER_THRESHOLD) {
            largeOrdersCount++;
          }
          
          netFlow += trade.isBuyerMaker ? -amount : amount;
        });
        volume24h = parseFloat(data.ticker.volume) * parseFloat(data.ticker.lastPrice);
        break;
      
      case 'bybit':
        if (data.trades.result && Array.isArray(data.trades.result.list)) {
          const bybitTrades = data.trades.result.list.filter(trade => {
            // Bybit 的時間戳是以毫秒為單位
            const tradeTime = parseInt(trade.time);
            return !isNaN(tradeTime) && (currentTime - tradeTime <= TIME_WINDOW);
          });
          
          bybitTrades.forEach(trade => {
            try {
              const price = parseFloat(trade.price);
              const size = parseFloat(trade.size);
              if (isNaN(price) || isNaN(size)) {
                console.warn('Bybit invalid trade data:', trade);
                return;
              }
              
              const amount = price * size;
              if (amount >= LARGE_ORDER_THRESHOLD) {
                largeOrdersCount++;
              }
              
              // Bybit 的買賣方向是 Buy/Sell
              netFlow += trade.side === 'Buy' ? amount : -amount;
            } catch (err) {
              console.error('Bybit trade processing error:', err, trade);
            }
          });
        }
        
        if (data.ticker.result?.list?.[0]) {
          const tickerData = data.ticker.result.list[0];
          // 使用 turnover24h 作為24小時成交量
          volume24h = parseFloat(tickerData.turnover24h || 0);
          if (isNaN(volume24h)) {
            console.warn('Bybit invalid volume data:', tickerData);
            volume24h = 0;
          }
        }
        break;
      
      case 'okx':
        if (data.trades.data && Array.isArray(data.trades.data)) {
          const okxTrades = data.trades.data.filter(trade => 
            currentTime - parseInt(trade.ts) <= TIME_WINDOW
          );
          
          okxTrades.forEach(trade => {
            const price = parseFloat(trade.px);
            const size = parseFloat(trade.sz);
            const amount = price * size;
            
            if (amount >= LARGE_ORDER_THRESHOLD) {
              largeOrdersCount++;
            }
            
            netFlow += trade.side.toLowerCase() === 'buy' ? amount : -amount;
          });
        }
        if (data.ticker.data && data.ticker.data[0]) {
          volume24h = parseFloat(data.ticker.data[0].vol24h) * 
                     parseFloat(data.ticker.data[0].last);
        }
        break;
    }

    // 數據平滑處理
    if (previousData) {
      netFlow = (netFlow + previousData.netFlow) / 2;
      largeOrdersCount = Math.round((largeOrdersCount + previousData.largeOrdersCount) / 2);
    }

    // 添加數據驗證
    if (isNaN(netFlow)) {
      console.error(`Invalid netFlow for ${exchange}:`, netFlow);
      netFlow = 0;
    }
    if (isNaN(volume24h)) {
      console.error(`Invalid volume24h for ${exchange}:`, volume24h);
      volume24h = 0;
    }

    return {
      netFlow: Math.round(netFlow * 100) / 100,
      largeOrdersCount,
      volume24h: Math.round(volume24h * 100) / 100
    };
  } catch (error) {
    console.error(`Error calculating net flow for ${exchange}:`, error);
    return { netFlow: 0, largeOrdersCount: 0, volume24h: 0 };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const currentTime = Date.now();
    const [binanceData, bybitData, okxData] = await Promise.all([
      fetchBinanceData(),
      fetchBybitData(),
      fetchOKXData()
    ]);

    // 更新緩存
    if (binanceData) {
      const previousData = cache.binance.data;
      cache.binance = { 
        data: calculateNetFlow(binanceData, 'binance', previousData),
        timestamp: currentTime 
      };
    }
    if (bybitData) {
      const previousData = cache.bybit.data;
      cache.bybit = { 
        data: calculateNetFlow(bybitData, 'bybit', previousData),
        timestamp: currentTime 
      };
    }
    if (okxData) {
      const previousData = cache.okx.data;
      cache.okx = { 
        data: calculateNetFlow(okxData, 'okx', previousData),
        timestamp: currentTime 
      };
    }

    const result = {
      binance: cache.binance.data ? {
        ...cache.binance.data,
        timestamp: cache.binance.timestamp
      } : null,
      bybit: cache.bybit.data ? {
        ...cache.bybit.data,
        timestamp: cache.bybit.timestamp
      } : null,
      okx: cache.okx.data ? {
        ...cache.okx.data,
        timestamp: cache.okx.timestamp
      } : null
    };

    // 計算總體數據
    const validResults = Object.values(result).filter(Boolean);
    const total = {
      netFlow: validResults.reduce((sum, exchange) => sum + (exchange.netFlow || 0), 0),
      largeOrdersCount: validResults.reduce((sum, exchange) => sum + (exchange.largeOrdersCount || 0), 0),
      volume24h: validResults.reduce((sum, exchange) => sum + (exchange.volume24h || 0), 0),
      timestamp: currentTime
    };

    // 移除為null的交易所數據
    const cleanResult = Object.fromEntries(
      Object.entries(result).filter(([_, value]) => value !== null)
    );

    res.status(200).json({
      ...cleanResult,
      total
    });
  } catch (error) {
    console.error('Error fetching fund flow data:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 