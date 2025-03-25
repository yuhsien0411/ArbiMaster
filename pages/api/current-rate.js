// 代理獲取當前資金費率的API端點
export default async function handler(req, res) {
  const { symbol, exchange } = req.query;

  if (!symbol) {
    return res.status(400).json({ 
      success: false, 
      error: '缺少必要參數: symbol' 
    });
  }

  try {
    let data = {};

    // 根據不同交易所調用不同的API
    switch (exchange?.toLowerCase()) {
      case 'gate':
        // Gate.io
        const gateRes = await fetch(
          `https://api.gateio.ws/api/v4/futures/usdt/contracts/${symbol}_USDT`
        );
        const gateData = await gateRes.json();
        
        if (gateData?.funding_rate && !isNaN(parseFloat(gateData.funding_rate))) {
          data = {
            success: true,
            rate: (parseFloat(gateData.funding_rate) * 100).toFixed(4),
            nextFundingTime: gateData.funding_next_apply ? 
              new Date(gateData.funding_next_apply * 1000).toLocaleString() : null
          };
        } else {
          data = {
            success: false,
            error: '獲取 Gate.io 資金費率失敗'
          };
        }
        break;
      
      case 'binance':
        // Binance
        const binanceRes = await fetch(
          `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}USDT`
        );
        const binanceData = await binanceRes.json();
        
        if (binanceData?.lastFundingRate) {
          data = {
            success: true,
            rate: (parseFloat(binanceData.lastFundingRate) * 100).toFixed(4),
            nextFundingTime: binanceData.nextFundingTime ? 
              new Date(binanceData.nextFundingTime).toLocaleString() : null
          };
        } else {
          data = {
            success: false,
            error: '獲取 Binance 資金費率失敗'
          };
        }
        break;
        
      case 'bybit':
        // Bybit
        const bybitRes = await fetch(
          `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}USDT`
        );
        const bybitData = await bybitRes.json();
        
        if (bybitData?.result?.list?.[0]?.fundingRate) {
          data = {
            success: true,
            rate: (parseFloat(bybitData.result.list[0].fundingRate) * 100).toFixed(4),
            nextFundingTime: bybitData.result.list[0].nextFundingTime ? 
              new Date(parseInt(bybitData.result.list[0].nextFundingTime)).toLocaleString() : null
          };
        } else {
          data = {
            success: false,
            error: '獲取 Bybit 資金費率失敗'
          };
        }
        break;
      
      case 'okx':
        // OKX
        const okxRes = await fetch(
          `https://www.okx.com/api/v5/public/funding-rate?instId=${symbol}-USDT-SWAP`
        );
        const okxData = await okxRes.json();
        
        if (okxData?.data?.[0]?.fundingRate) {
          data = {
            success: true,
            rate: (parseFloat(okxData.data[0].fundingRate) * 100).toFixed(4),
            nextFundingTime: okxData.data[0].nextFundingTime ? 
              new Date(parseInt(okxData.data[0].nextFundingTime)).toLocaleString() : null
          };
        } else {
          data = {
            success: false,
            error: '獲取 OKX 資金費率失敗'
          };
        }
        break;
        
      case 'bitget':
        // Bitget
        const bitgetRes = await fetch(
          `https://api.bitget.com/api/v2/mix/market/current-fund-rate?symbol=${symbol}USDT&productType=USDT-FUTURES`
        );
        const bitgetData = await bitgetRes.json();
        
        if (bitgetData?.code === '00000' && bitgetData?.data?.[0]?.fundingRate) {
          data = {
            success: true,
            rate: (parseFloat(bitgetData.data[0].fundingRate) * 100).toFixed(4)
          };
        } else {
          data = {
            success: false,
            error: '獲取 Bitget 資金費率失敗'
          };
        }
        break;
        
      default:
        // 如果沒有指定交易所，返回錯誤
        return res.status(400).json({ 
          success: false, 
          error: '無效的交易所參數' 
        });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(`獲取${exchange || ''}資金費率失敗:`, error);
    return res.status(500).json({ 
      success: false, 
      error: `獲取${exchange || ''}資金費率失敗`,
      details: error.message
    });
  }
} 