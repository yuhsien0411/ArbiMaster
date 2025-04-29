// CEX理財收益API端點
import axios from 'axios';
import crypto from 'crypto';

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

// 獲取幣安數據 - 所有靈活理財產品
async function fetchBinanceData() {
  try {
    const timestamp = Date.now();
    const queryString = `current=1&size=100&timestamp=${timestamp}`;
    const signature = generateBinanceSignature(queryString, process.env.BINANCE_API_SECRET || '');

    const response = await axios.get(
      `https://api.binance.com/sapi/v1/simple-earn/flexible/list?${queryString}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': process.env.BINANCE_API_KEY || ''
        }
      }
    );

    if (response.data?.rows) {
      return response.data.rows.map(product => ({
        exchange: 'Binance',
        coin: product.asset,
        apy: Number((parseFloat(product.latestAnnualPercentageRate) * 100).toFixed(2)),
        minAmount: parseFloat(product.minPurchaseAmount),
        lockPeriod: '靈活'
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching Binance data:', error);
    return [];
  }
}

// 獲取 Bybit 數據 - 所有靈活理財產品
async function fetchBybitData() {
  try {
    const response = await axios.get(
      'https://api.bybit.com/v5/earn/product?category=FlexibleSaving'
    );

    if (response.data?.result?.list) {
      return response.data.result.list
        .filter(product => product.status === 'Available')
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

// 獲取 OKX 數據 - 所有靈活理財產品
async function fetchOKXData() {
  try {
    const response = await axios.get(
      'https://www.okx.com/api/v5/finance/savings/lending-rate-summary'
    );

    if (response.data?.data) {
      return response.data.data
        .filter(product => {
          // 過濾出平均借貸金額超過10000美元的幣種
          const avgAmtUsd = parseFloat(product.avgAmtUsd || '0');
          return avgAmtUsd > 10000;
        })
        .map(product => {
          // 計算利率
          const avgRate = Number((parseFloat(product.avgRate) * 100).toFixed(2)); // 過去24小時平均借出年利率
          
          return {
            exchange: 'OKX',
            coin: product.ccy,
            // 使用avgRate作為主要顯示的利率
            apy: avgRate,
            // 保存原始數據，但不在UI主視圖顯示
            estRate: Number((parseFloat(product.estRate) * 100).toFixed(2)),  // 預估年利率 
            minAmount: 1, // OKX 通常是 1
            lockPeriod: '靈活',
            avgAmtUsd: parseFloat(product.avgAmtUsd || '0').toFixed(0), // 添加平均借貸金額
            avgAmt: parseFloat(product.avgAmt || '0').toFixed(2) // 添加原生幣種的平均借貸量
          };
        });
    }
    return [];
  } catch (error) {
    console.error('Error fetching OKX data:', error);
    return [];
  }
}

// 獲取 Bitget 數據 - 所有靈活理財產品
async function fetchBitgetData() {
  try {
    const timestamp = Date.now().toString();
    const path = '/api/v2/earn/savings/product';
    const queryString = 'filter=available';
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

    const products = [];
    if (response.data?.data) {
      for (const item of response.data.data) {
        if (item.periodType.toLowerCase() === 'flexible' && item.status === 'in_progress') {
          const apy = item.apyList.length === 1
            ? parseFloat(item.apyList[0]?.currentApy || '0')
            : parseFloat(item.apyList[1]?.currentApy || '0');

          products.push({
            exchange: 'Bitget',
            coin: item.coin,
            apy: Number(apy.toFixed(2)),
            minAmount: Math.max(500, parseFloat(item.apyList[1]?.minStepVal || '500')),
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