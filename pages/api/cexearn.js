// CEX理財收益API端點
import axios from 'axios';
import crypto from 'crypto';

// 支援的穩定幣列表
const SUPPORTED_STABLECOINS = ['USDT', 'USDC', 'DAI'];

// 緩存配置
const CACHE_DURATION = 120000; // 2分鐘
let cachedData = null;
let lastCacheTime = 0;

// 生成幣安 API 簽名
function generateBinanceSignature(queryString, apiSecret) {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');
}

// 獲取幣安數據
async function fetchBinanceData() {
  try {
    const products = [];
    for (const coin of SUPPORTED_STABLECOINS) {
      const timestamp = Date.now();
      const queryString = `asset=${coin}&current=1&size=100&timestamp=${timestamp}`;
      const signature = generateBinanceSignature(queryString, process.env.BINANCE_API_SECRET || '');

      const response = await axios.get(
        `https://api.binance.com/sapi/v1/simple-earn/flexible/list?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': process.env.BINANCE_API_KEY || ''
          }
        }
      );

      if (response.data?.rows?.[0]) {
        const product = response.data.rows[0];
        products.push({
          exchange: 'Binance',
          coin: product.asset,
          apy: Number((parseFloat(product.latestAnnualPercentageRate) * 100).toFixed(2)),
          minAmount: parseFloat(product.minPurchaseAmount),
          lockPeriod: '靈活'
        });
      }
    }
    return products;
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    return [];
  }
}

// 獲取 Bybit 數據
async function fetchBybitData() {
  try {
    const response = await axios.get(
      'https://api.bybit.com/v5/earn/product?category=FlexibleSaving'
    );

    if (response.data?.result?.list) {
      return response.data.result.list
        .filter(product => 
          SUPPORTED_STABLECOINS.includes(product.coin) && 
          product.status === 'Available'
        )
        .map(product => ({
          exchange: 'Bybit',
          coin: product.coin,
          apy: parseFloat(product.estimateApr.replace('%', '')),
          minAmount: parseFloat(product.minStakeAmount),
          lockPeriod: '靈活'
        }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching Bybit data:', error);
    return [];
  }
}

// 獲取 OKX 數據
async function fetchOKXData() {
  try {
    const response = await axios.get(
      'https://www.okx.com/api/v5/finance/savings/lending-rate-summary'
    );

    if (response.data?.data) {
      return response.data.data
        .filter(product => SUPPORTED_STABLECOINS.includes(product.ccy))
        .map(product => ({
          exchange: 'OKX',
          coin: product.ccy,
          apy: Number((parseFloat(product.estRate) * 100).toFixed(2)),
          minAmount: 1, // OKX 通常是 1
          lockPeriod: '靈活'
        }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching OKX data:', error);
    return [];
  }
}

// 獲取 Bitget 數據
async function fetchBitgetData() {
  try {
    const timestamp = Date.now().toString();
    const products = [];

    for (const coin of SUPPORTED_STABLECOINS) {
      const path = '/api/v2/earn/savings/product';
      const queryString = `filter=available&coin=${coin}`;
      const signStr = timestamp + 'GET' + path + '?' + queryString;
      const signature = crypto
        .createHmac('sha256', process.env.BITGET_API_SECRET || '')
        .update(signStr)
        .digest('base64');

      const response = await axios.get(
        `https://api.bitget.com${path}?${queryString}`,
        {
          headers: {
            'ACCESS-KEY': process.env.BITGET_API_KEY || '',
            'ACCESS-SIGN': signature,
            'ACCESS-TIMESTAMP': timestamp,
            'ACCESS-PASSPHRASE': process.env.BITGET_PASSPHRASE || '',
            'Content-Type': 'application/json',
            'locale': 'en-US'
          }
        }
      );

      if (response.data?.data) {
        const flexibleProduct = response.data.data.find(
          p => p.periodType.toLowerCase() === 'flexible' && p.status === 'in_progress'
        );

        if (flexibleProduct) {
          const apy = flexibleProduct.apyList.length === 1
            ? parseFloat(flexibleProduct.apyList[0]?.currentApy || '0')
            : parseFloat(flexibleProduct.apyList[1]?.currentApy || '0');

          products.push({
            exchange: 'Bitget',
            coin: flexibleProduct.coin,
            apy: Number(apy.toFixed(2)),
            minAmount: Math.max(500, parseFloat(flexibleProduct.apyList[1]?.minStepVal || '500')),
            lockPeriod: '靈活'
          });
        }
      }
    }
    return products;
  } catch (error) {
    console.error('Error fetching Bitget data:', error);
    return [];
  }
}

export default async function handler(req, res) {
  // 設置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

    // 從各個交易所獲取數據
    const [binanceData, bybitData, okxData, bitgetData] = await Promise.all([
      fetchBinanceData(),
      fetchBybitData(),
      fetchOKXData(),
      fetchBitgetData()
    ]);

    // 合併所有數據
    const allData = [
      ...binanceData,
      ...bybitData,
      ...okxData,
      ...bitgetData
    ].filter(product => product.apy > 0); // 只保留有效的利率

    // 更新緩存
    cachedData = {
      success: true,
      data: allData,
      timestamp: new Date().toISOString()
    };
    lastCacheTime = currentTime;

    res.status(200).json(cachedData);
  } catch (error) {
    console.error('Error fetching CEX earn data:', error);
    res.status(500).json({ 
      success: false,
      error: '獲取數據失敗',
      details: error.message 
    });
  }
} 