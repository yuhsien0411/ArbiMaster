import axios from 'axios';
import crypto from 'crypto';
const GateApi = require('gate-api');

// Bitget 簽名相關函數
function getTimestamp() {
  return Date.now().toString();
}

function sign(message, secretKey) {
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('base64');
}

function preHash(timestamp, method, requestPath, queryString = '', body = '') {
  return timestamp + method.toUpperCase() + requestPath + (queryString ? '?' + queryString : '') + body;
}

function parseParamsToStr(params) {
  if (!params || Object.keys(params).length === 0) return '';
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

// 使用示例
function getBitgetSignature(timestamp, method, requestPath, params, body = '') {
  const queryString = parseParamsToStr(params);
  const message = preHash(timestamp, method, requestPath, queryString, body);
  return sign(message, process.env.BITGET_API_SECRET);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只支持 GET 請求' });
  }

  try {
    // 使用 API Key 獲取 Binance 資產信息
    console.log('開始獲取 Binance 資產信息...');
    const timestamp = Date.now();
    const queryString = 'timestamp=' + timestamp;
    const signature = crypto
      .createHmac('sha256', process.env.BINANCE_API_SECRET)
      .update(queryString)
      .digest('hex');

    const binanceAssetsResponse = await axios.get('https://api.binance.com/sapi/v1/margin/allAssets', {
      headers: {
        'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      params: {
        timestamp: timestamp,
        signature: signature
      }
    });
    
    // console.log('Binance 資產數量:', binanceAssetsResponse.data.length);
    // console.log('Binance 資產示例:', binanceAssetsResponse.data.slice(0, 5));
    
    // 過濾出可借貸的資產
    const allAssets = binanceAssetsResponse.data
      .filter(item => item && item.isBorrowable && item.assetName !== 'USDT')
      .map(item => item.assetName);
    
    // console.log('提取的可借貸資產數量:', allAssets.length);
    // console.log('可借貸資產示例:', allAssets.slice(0, 10));

    // 分批獲取利率數據（每批20個幣種）
    let binanceData = [];
    // console.log('開始分批獲取利率數據...');
    for (let i = 0; i < allAssets.length; i += 20) {
      const batch = allAssets.slice(i, i + 20);
      if (batch.length === 0) continue; // 跳過空批次
      
      // console.log(`獲取第 ${i/20 + 1} 批數據，幣種數量:`, batch.length);
      // console.log('當前批次幣種:', batch);
      
      try {
        const timestamp = Date.now();
        const queryString = `assets=${batch.join(',')}&isIsolated=false&timestamp=${timestamp}`;
        const signature = crypto
          .createHmac('sha256', process.env.BINANCE_API_SECRET)
          .update(queryString)
          .digest('hex');

        const binanceResponse = await axios.get('https://api.binance.com/sapi/v1/margin/next-hourly-interest-rate', {
          headers: {
            'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          params: {
            assets: batch.join(','),
            isIsolated: false,
            timestamp: timestamp,
            signature: signature
          }
        });
        
        // console.log(`第 ${i/20 + 1} 批數據響應:`, binanceResponse.data);
        
        // 修正數據處理邏輯
        const batchData = batch.map(asset => {
          const rateData = binanceResponse.data.find(item => item.asset === asset);
          if (rateData) {
            return {
              exchange: 'Binance',
              pair: `${asset}/USDT`,
              hourlyBorrowRate: rateData.nextHourlyInterestRate
            };
          }
          return null;
        }).filter(item => item !== null);

        binanceData = [...binanceData, ...batchData];
        // console.log(`第 ${i/20 + 1} 批數據處理完成，當前總數據量:`, binanceData.length);
      } catch (batchError) {
        console.error(`第 ${i/20 + 1} 批數據獲取失敗:`, batchError.message);
      }
    }
    console.log('Binance 數據獲取完成，總數據量:', binanceData.length);

    // 獲取 Bybit 數據
    const bybitResponse = await axios.get('https://api.bybit.com/v5/spot-margin-trade/data', {
      params: {
        vipLevel: 'No VIP'
      }
    });
    let bybitData = [];
    if (bybitResponse.data.retCode === 0) {
      bybitData = bybitResponse.data.result.vipCoinList[0].list
        .map(item => ({
          exchange: 'Bybit',
          pair: `${item.currency}/USDT`,
          hourlyBorrowRate: item.hourlyBorrowRate
        }));
    }

    // 獲取 Bitget 數據
    console.log('開始獲取 Bitget 槓桿現貨數據...');
    let bitgetData = [];
    try {
      const currenciesResponse = await axios.get('https://api.bitget.com/api/v2/margin/currencies');
      // console.log('Bitget 支持的貨幣:', currenciesResponse.data);
      // if (currenciesResponse.data.code === '00000' && Array.isArray(currenciesResponse.data.data)) {
      //   const borrowablePairs = currenciesResponse.data.data
      //     .filter(item => item.isBorrowable && item.quoteCoin === 'USDT')
      //     .map(item => item.symbol);
      const borrowablePairs = ['BTCUSDT'];
        // 獲取每個交易對的利率數據
        for (const symbol of borrowablePairs) {
          console.log('開始獲取 Bitget 利率數據...', symbol);
          try {
            const rateTimestamp = getTimestamp();
            const rateMethod = 'GET';
            const rateRequestPath = '/api/v2/margin/isolated/interest-rate-and-limit';
            const rateParams = { 
              symbol,
            };
            const rateBody = '';
            
            const rateSignature = getBitgetSignature(rateTimestamp, rateMethod, rateRequestPath, rateParams, rateBody);
        
            const url = 'https://api.bitget.com' + rateRequestPath+'?symbol='+symbol;
            console.log('傳送網址:', url);
            console.log('加密簽名:', rateSignature);
            const rateResponse = await axios.get(url, {
              headers: {
                'ACCESS-KEY': process.env.BITGET_API_KEY,
                'ACCESS-SIGN': rateSignature,
                'ACCESS-PASSPHRASE': process.env.BITGET_API_PASSPHRASE,
                'ACCESS-TIMESTAMP': rateTimestamp,
                'Content-Type': 'application/json'
              },
              params: rateParams
            });

            if (rateResponse.data.code === '00000' && rateResponse.data.data && rateResponse.data.data[0]) {
              const rateData = rateResponse.data.data[0];
              bitgetData.push({
                exchange: 'Bitget',
                pair: `${rateData.baseCoin}/USDT`,
                hourlyBorrowRate: (parseFloat(rateData.baseDailyInterestRate) * 24).toString(),
                maxLeverage: rateData.leverage,
                dailyInterestRate: rateData.baseDailyInterestRate,
                annuallyInterestRate: rateData.baseAnnuallyInterestRate,
                maxBorrowableAmount: rateData.baseMaxBorrowableAmount
              });
            }
          } catch (pairError) {
            console.error(`獲取 ${symbol} 利率數據失敗:`, pairError.message);
            if (pairError.response?.data) {
              console.error('錯誤詳情:', pairError.response.data);
            }
          }
        }
        console.log('Bitget 數據獲取成功，數量:', bitgetData.length);
      
    } catch (error) {
      console.error('獲取 Bitget 數據失敗:', error.message);
      if (error.response?.data) {
        console.error('錯誤詳情:', error.response.data);
      }
    }

    // 獲取 OKX 數據
    console.log('開始獲取 OKX 利率數據...');
    const okxResponse = await axios.get('https://www.okx.com/api/v5/public/interest-rate-loan-quota');
    let okxData = [];
    if (okxResponse.data.code === '0' && okxResponse.data.data && okxResponse.data.data[0]) {
      okxData = okxResponse.data.data[0].basic
        .filter(item => item.ccy !== 'USDT') // 排除 USDT
        .map(item => ({
          exchange: 'OKX',
          pair: `${item.ccy}/USDT`,
          hourlyBorrowRate: item.rate
        }));
      console.log('OKX 數據獲取成功，數量:', okxData.length);
    }

    // 獲取 Gate.io 數據
    console.log('開始獲取 Gate.io 利率數據...');
    let gateioData = [];
    
    try {
      // 初始化 Gate.io API 客戶端
      const client = new GateApi.ApiClient();
      client.setApiKeySecret(process.env.GATEIO_API_KEY, process.env.GATEIO_API_SECRET);
      const api = new GateApi.MarginUniApi(client);

      // 首先獲取可借貸市場列表
      console.log('獲取 Gate.io 可借貸市場列表...');
      const marketResponse = await axios.get('https://api.gateio.ws/api/v4/margin/uni/currency_pairs').then(response => response.data);
    
      // console.log('Gate.io 市場列表響應:', marketResponse);
      
      // 提取貨幣對並轉換格式
      const borrowableCurrencies = marketResponse
        .map(market => {
          const [currency] = market.currency_pair.split('_');
          return currency.toUpperCase();
        });

      // console.log('可借貸幣種列表:', borrowableCurrencies);
      // console.log('Gate.io 可借貸幣種數量:', borrowableCurrencies.length);

      // 分批獲取利率數據（每組最多10個）
      const currencyGroups = [];
      for (let i = 0; i < borrowableCurrencies.length; i += 10) {
        currencyGroups.push(borrowableCurrencies.slice(i, i + 10));
      }

      // 獲取所有幣種的利率數據
      for (const group of currencyGroups) {
        try {
          // console.log('獲取幣種組利率數據:', group);
          const response = await api.getMarginUniEstimateRate(group);
          
          if (!response || !response.body) {
            // console.error('無法獲取利率數據:', response);
            continue;
          }

          // console.log('Gate.io 利率數據響應:', response);
          // console.log('Gate.io 利率數據:', response.body);

          // 處理返回的數據
          const groupData = Object.entries(response.body)
            .filter(([_, rate]) => rate !== '') // 過濾掉不支持的空利率
            .map(([currency, rate]) => ({
              exchange: 'Gate.io',
              pair: `${currency}/USDT`,
              hourlyBorrowRate: (parseFloat(rate) * 100).toString()
            }));

          gateioData = [...gateioData, ...groupData];
          // console.log('當前批次處理完成，數據量:', groupData.length);
        } catch (groupError) {
          // console.error('處理幣種組時發生錯誤:', groupError);
          // console.error('錯誤的幣種組:', group);
        }
      }

      console.log('Gate.io 數據處理完成，總數據量:', gateioData.length);
    } catch (error) {
      console.error('獲取 Gate.io 數據失敗:', error);
      console.error('錯誤詳情:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
    }

    // 合併所有數據
    const allData = [...binanceData, ...bybitData, ...bitgetData, ...okxData, ...gateioData];
    console.log('所有數據合併完成，總數據量:', allData.length);
    console.log('各交易所數據量:', {
      binance: binanceData.length,
      bybit: bybitData.length,
      bitget: bitgetData.length,
      okx: okxData.length,
      gate: gateioData.length
    });

    // 返回數據
    res.status(200).json({
      success: true,
      data: allData
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      message: '獲取數據失敗',
      error: error.message
    });
  }
} 