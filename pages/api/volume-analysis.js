import axios from 'axios';

const BINANCE_API = {
  spot: 'https://api.binance.com/api/v3',
  futures: 'https://fapi.binance.com/fapi/v1'
};
const BYBIT_API = 'https://api.bybit.com/v5';
const OKX_API = 'https://www.okx.com/api/v5';

// 主要交易對列表
const MAIN_PAIRS = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'DOT', 'MATIC', 'LINK', 'ADA'];

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios(url, { 
        ...options,
        timeout: 5000 // 5秒超時
      });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function fetchBinanceVolume() {
  try {
    // 獲取所有交易對數據
    const response = await fetchWithRetry(`${BINANCE_API.spot}/ticker/24hr`);
    
    const spotData = (response.data || [])
      .filter(item => item.symbol?.endsWith('USDT'))
      .reduce((acc, item) => {
        const symbol = item.symbol.replace('USDT', '');
        const volume = parseFloat(item.volume || 0);
        const price = parseFloat(item.lastPrice || 0);
        
        if (volume > 0 && price > 0) {
          acc[symbol] = {
            volume: volume * price,
            price: price,
            priceChange: parseFloat(item.priceChangePercent || 0)
          };
        }
        return acc;
      }, {});

    return {
      spot: spotData,
      futures: {} // 暫時不獲取合約數據
    };
  } catch (error) {
    console.error('Binance API error:', error.message);
    return { spot: {}, futures: {} };
  }
}

async function fetchBybitVolume() {
  try {
    const response = await fetchWithRetry(`${BYBIT_API}/market/tickers`, {
      params: { category: 'spot' }
    });

    const spotData = (response.data?.result?.list || [])
      .filter(item => item.symbol?.endsWith('USDT'))
      .reduce((acc, item) => {
        const symbol = item.symbol.replace('USDT', '');
        const volume = parseFloat(item.volume24h || 0);
        const price = parseFloat(item.lastPrice || 0);
        
        if (volume > 0 && price > 0) {
          acc[symbol] = {
            volume: volume * price,
            price: price,
            priceChange: parseFloat(item.price24hPcnt || 0) * 100
          };
        }
        return acc;
      }, {});

    return {
      spot: spotData,
      futures: {} // 暫時不獲取合約數據
    };
  } catch (error) {
    console.error('Bybit API error:', error.message);
    return { spot: {}, futures: {} };
  }
}

async function fetchOKXVolume() {
  try {
    const response = await fetchWithRetry(`${OKX_API}/market/tickers`, {
      params: { instType: 'SPOT' }
    });

    const spotData = (response.data?.data || [])
      .filter(item => item.instId?.endsWith('-USDT'))
      .reduce((acc, item) => {
        const symbol = item.instId.replace('-USDT', '');
        const volume = parseFloat(item.vol24h || 0);
        const price = parseFloat(item.last || 0);
        
        if (volume > 0 && price > 0) {
          acc[symbol] = {
            volume: volume * price,
            price: price,
            priceChange: ((parseFloat(item.last || 0) / parseFloat(item.open24h || 1) - 1) * 100) || 0
          };
        }
        return acc;
      }, {});

    return {
      spot: spotData,
      futures: {} // 暫時不獲取合約數據
    };
  } catch (error) {
    console.error('OKX API error:', error.message);
    return { spot: {}, futures: {} };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const [binanceData, bybitData, okxData] = await Promise.all([
      fetchBinanceVolume(),
      fetchBybitVolume(),
      fetchOKXVolume()
    ]);

    // 合併所有交易所的幣種
    const allSymbols = new Set([
      ...Object.keys(binanceData.spot),
      ...Object.keys(bybitData.spot),
      ...Object.keys(okxData.spot)
    ]);

    // 確保主要交易對總是包含在內
    MAIN_PAIRS.forEach(pair => allSymbols.add(pair));

    const result = Array.from(allSymbols).map(symbol => {
      const totalSpotVolume = (
        (binanceData.spot[symbol]?.volume || 0) +
        (bybitData.spot[symbol]?.volume || 0) +
        (okxData.spot[symbol]?.volume || 0)
      );

      return {
        symbol,
        totalVolume: totalSpotVolume,
        spotVolume: totalSpotVolume,
        futuresVolume: 0, // 暫時不計算合約交易量
        exchanges: {
          binance: {
            spot: binanceData.spot[symbol] || null,
            futures: null
          },
          bybit: {
            spot: bybitData.spot[symbol] || null,
            futures: null
          },
          okx: {
            spot: okxData.spot[symbol] || null,
            futures: null
          }
        }
      };
    }).filter(item => item.totalVolume > 0 || MAIN_PAIRS.includes(item.symbol));

    // 按總交易量排序
    result.sort((a, b) => b.totalVolume - a.totalVolume);

    res.status(200).json({
      timestamp: Date.now(),
      data: result.slice(0, 100) // 只返回前100個幣種
    });
  } catch (error) {
    console.error('Error fetching volume data:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
} 