// 處理交易所資金流向數據的 API 端點
import axios from 'axios';

const BINANCE_API = 'https://api.binance.com/api/v3';
const BYBIT_API = 'https://api.bybit.com/v5';
const OKEX_API = 'https://www.okx.com/api/v5';

// 設定大額交易閾值（USDT）
const LARGE_ORDER_THRESHOLD = 100000;

async function fetchBinanceData() {
  try {
    // 獲取最近的交易數據
    const trades = await axios.get(`${BINANCE_API}/aggTrades`, {
      params: {
        limit: 1000, // 獲取最近1000筆交易
        symbol: 'BTCUSDT' // 以 BTC/USDT 為主要指標
      }
    });
    
    // 獲取24小時價格統計
    const ticker = await axios.get(`${BINANCE_API}/ticker/24hr`, {
      params: { symbol: 'BTCUSDT' }
    });

    return {
      trades: trades.data,
      ticker: ticker.data
    };
  } catch (error) {
    console.error('Binance API error:', error);
    return null;
  }
}

async function fetchBybitData() {
  try {
    // 獲取最近的交易數據
    const trades = await axios.get(`${BYBIT_API}/market/recent-trade`, {
      params: {
        category: 'spot',
        symbol: 'BTCUSDT',
        limit: 1000
      }
    });
    
    // 獲取24小時價格統計
    const ticker = await axios.get(`${BYBIT_API}/market/tickers`, {
      params: {
        category: 'spot',
        symbol: 'BTCUSDT'
      }
    });

    return {
      trades: trades.data,
      ticker: ticker.data
    };
  } catch (error) {
    console.error('Bybit API error:', error);
    return null;
  }
}

async function fetchOKEXData() {
  try {
    // 獲取最近的交易數據
    const trades = await axios.get(`${OKEX_API}/market/trades`, {
      params: {
        instId: 'BTC-USDT',
        limit: 1000
      }
    });
    
    // 獲取24小時價格統計
    const ticker = await axios.get(`${OKEX_API}/market/ticker`, {
      params: {
        instId: 'BTC-USDT'
      }
    });

    return {
      trades: trades.data,
      ticker: ticker.data
    };
  } catch (error) {
    console.error('OKEX API error:', error);
    return null;
  }
}

function calculateNetFlow(data, exchange) {
  if (!data || !data.trades) return { netFlow: 0, largeOrdersCount: 0 };
  
  let netFlow = 0;
  let largeOrdersCount = 0;

  switch (exchange) {
    case 'binance':
      data.trades.forEach(trade => {
        const amount = parseFloat(trade.price) * parseFloat(trade.quantity);
        if (amount >= LARGE_ORDER_THRESHOLD) {
          largeOrdersCount++;
        }
        netFlow += trade.isBuyerMaker ? -amount : amount;
      });
      break;
    
    case 'bybit':
      data.trades.result.list.forEach(trade => {
        const amount = parseFloat(trade.price) * parseFloat(trade.size);
        if (amount >= LARGE_ORDER_THRESHOLD) {
          largeOrdersCount++;
        }
        netFlow += trade.side === 'Buy' ? amount : -amount;
      });
      break;
    
    case 'okex':
      data.trades.data.forEach(trade => {
        const amount = parseFloat(trade.px) * parseFloat(trade.sz);
        if (amount >= LARGE_ORDER_THRESHOLD) {
          largeOrdersCount++;
        }
        netFlow += trade.side === 'buy' ? amount : -amount;
      });
      break;
  }

  return {
    netFlow,
    largeOrdersCount,
    volume24h: calculateVolume24h(data.ticker, exchange)
  };
}

function calculateVolume24h(ticker, exchange) {
  switch (exchange) {
    case 'binance':
      return parseFloat(ticker.volume) * parseFloat(ticker.lastPrice);
    case 'bybit':
      return parseFloat(ticker.result.list[0].volume24h);
    case 'okex':
      return parseFloat(ticker.data[0].vol24h) * parseFloat(ticker.data[0].last);
    default:
      return 0;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 並行獲取所有交易所數據
    const [binanceData, bybitData, okexData] = await Promise.all([
      fetchBinanceData(),
      fetchBybitData(),
      fetchOKEXData()
    ]);

    const timestamp = Date.now();

    // 計算每個交易所的淨流入
    const result = {
      binance: {
        ...calculateNetFlow(binanceData, 'binance'),
        timestamp
      },
      bybit: {
        ...calculateNetFlow(bybitData, 'bybit'),
        timestamp
      },
      okex: {
        ...calculateNetFlow(okexData, 'okex'),
        timestamp
      }
    };

    // 添加總淨流入和統計信息
    result.total = {
      netFlow: Object.values(result).reduce((acc, { netFlow }) => acc + (netFlow || 0), 0),
      largeOrdersCount: Object.values(result).reduce((acc, { largeOrdersCount }) => acc + (largeOrdersCount || 0), 0),
      volume24h: Object.values(result).reduce((acc, { volume24h }) => acc + (volume24h || 0), 0),
      timestamp
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching fund flow data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 