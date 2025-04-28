import axios from 'axios';

// 使用幣安公開 API
const BINANCE_TICKER_API = 'https://api.binance.com/api/v3/ticker/24hr';
const BINANCE_PRICE_API = 'https://api.binance.com/api/v3/ticker/price';

export default async function handler(req, res) {
  try {
    // 獲取24小時行情數據
    const [tickerResponse, priceResponse] = await Promise.all([
      axios.get(BINANCE_TICKER_API),
      axios.get(BINANCE_PRICE_API)
    ]);

    const tickerData = tickerResponse.data;
    const priceData = priceResponse.data;

    // 創建價格映射
    const priceMap = new Map(priceData.map(item => [item.symbol, parseFloat(item.price)]));
    
    // 只處理 USDT 交易對
    const marketData = tickerData
      .filter(item => item.symbol.endsWith('USDT'))
      .map(item => {
        const price = priceMap.get(item.symbol) || parseFloat(item.lastPrice);
        return {
          symbol: item.symbol.replace('USDT', ''),
          price: price,
          volume: parseFloat(item.volume) * price, // 24小時交易量（以USDT計）
          priceChange: parseFloat(item.priceChangePercent),
        };
      });

    // 按交易量排序並取前50個
    const sortedData = marketData
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 50);

    res.status(200).json(sortedData);
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    res.status(500).json({ error: '獲取市場數據失敗' });
  }
} 