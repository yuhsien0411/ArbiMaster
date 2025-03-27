import axios from 'axios';
import crypto from 'crypto';

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
    
    console.log('Binance 資產數量:', binanceAssetsResponse.data.length);
    console.log('Binance 資產示例:', binanceAssetsResponse.data.slice(0, 5));
    
    // 過濾出可借貸的資產
    const allAssets = binanceAssetsResponse.data
      .filter(item => item && item.isBorrowable && item.assetName !== 'USDT')
      .map(item => item.assetName);
    
    console.log('提取的可借貸資產數量:', allAssets.length);
    console.log('可借貸資產示例:', allAssets.slice(0, 10));

    // 分批獲取利率數據（每批20個幣種）
    let binanceData = [];
    console.log('開始分批獲取利率數據...');
    for (let i = 0; i < allAssets.length; i += 20) {
      const batch = allAssets.slice(i, i + 20);
      if (batch.length === 0) continue; // 跳過空批次
      
      console.log(`獲取第 ${i/20 + 1} 批數據，幣種數量:`, batch.length);
      console.log('當前批次幣種:', batch);
      
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
        
        console.log(`第 ${i/20 + 1} 批數據響應:`, binanceResponse.data);
        
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
        console.log(`第 ${i/20 + 1} 批數據處理完成，當前總數據量:`, binanceData.length);
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

    // Bitget 模擬數據
    const bitgetData = [
      { exchange: 'Bitget', pair: 'BTC/USDT', hourlyBorrowRate: '0.00015' },
      { exchange: 'Bitget', pair: 'ETH/USDT', hourlyBorrowRate: '0.00015' },
      { exchange: 'Bitget', pair: 'BNB/USDT', hourlyBorrowRate: '0.00015' },
      { exchange: 'Bitget', pair: 'XRP/USDT', hourlyBorrowRate: '0.00015' },
      { exchange: 'Bitget', pair: 'ADA/USDT', hourlyBorrowRate: '0.00015' },
      { exchange: 'Bitget', pair: 'DOGE/USDT', hourlyBorrowRate: '0.00015' },
      { exchange: 'Bitget', pair: 'MATIC/USDT', hourlyBorrowRate: '0.00015' },
      { exchange: 'Bitget', pair: 'SOL/USDT', hourlyBorrowRate: '0.00015' },
      { exchange: 'Bitget', pair: 'DOT/USDT', hourlyBorrowRate: '0.00015' },
      { exchange: 'Bitget', pair: 'LTC/USDT', hourlyBorrowRate: '0.00015' }
    ];

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

    // Gate.io 虛擬數據
    const gateData = [
      { exchange: 'Gate.io', pair: 'BTC/USDT', hourlyBorrowRate: '0.00012' },
      { exchange: 'Gate.io', pair: 'ETH/USDT', hourlyBorrowRate: '0.00012' },
      { exchange: 'Gate.io', pair: 'BNB/USDT', hourlyBorrowRate: '0.00012' },
      { exchange: 'Gate.io', pair: 'XRP/USDT', hourlyBorrowRate: '0.00012' },
      { exchange: 'Gate.io', pair: 'ADA/USDT', hourlyBorrowRate: '0.00012' },
      { exchange: 'Gate.io', pair: 'DOGE/USDT', hourlyBorrowRate: '0.00012' },
      { exchange: 'Gate.io', pair: 'MATIC/USDT', hourlyBorrowRate: '0.00012' },
      { exchange: 'Gate.io', pair: 'SOL/USDT', hourlyBorrowRate: '0.00012' },
      { exchange: 'Gate.io', pair: 'DOT/USDT', hourlyBorrowRate: '0.00012' },
      { exchange: 'Gate.io', pair: 'LTC/USDT', hourlyBorrowRate: '0.00012' }
    ];

    // 合併所有數據
    const allData = [...binanceData, ...bybitData, ...bitgetData, ...okxData, ...gateData];
    console.log('所有數據合併完成，總數據量:', allData.length);
    console.log('各交易所數據量:', {
      binance: binanceData.length,
      bybit: bybitData.length,
      bitget: bitgetData.length,
      okx: okxData.length,
      gate: gateData.length
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