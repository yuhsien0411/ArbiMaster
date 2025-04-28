// 使用 Next.js 的內置 API 路由處理 WebSocket
import { Server } from 'socket.io';

// 緩存配置
const CACHE_DURATION = 60000; // 1分鐘
let cachedData = null;
let lastCacheTime = 0;
let io = null;

// 初始化 Socket.IO
const initSocketIO = (res) => {
  if (!io) {
    io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
      console.log('Client connected to funding rates socket');
      
      socket.on('disconnect', () => {
        console.log('Client disconnected from funding rates socket');
      });
    });

    res.socket.server.io = io;
  }
  return io;
};

// 添加 fetch 超時和重試函數
async function fetchWithTimeout(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      timeout: timeout // 添加顯式超時
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// 改進重試函數
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  const delays = [1000, 2000, 4000]; // 遞增延遲時間
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error(`JSON 解析錯誤 (${url}):`, e);
        throw e;
      }
    } catch (error) {
      lastError = error;
      console.error(`嘗試 ${i + 1}/${maxRetries} 失敗:`, error.message);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
        continue;
      }
    }
  }
  
  throw lastError;
}

// 主要的 API 處理函數
export default async function handler(req, res) {
  // 如果是 WebSocket 升級請求
  if (req.headers.upgrade === 'websocket') {
    // 確保 Socket.IO 已初始化
    if (!res.socket.server.io) {
      initSocketIO(res);
    }
    res.end();
    return;
  }

  try {
    const currentTime = Date.now();
    
    // 檢查緩存是否有效
    if (cachedData && currentTime - lastCacheTime < CACHE_DURATION) {
      return res.status(200).json(cachedData);
    }

    // 獲取新數據
    const data = await fetchAllExchangeData();
    
    // 更新緩存
    cachedData = data;
    lastCacheTime = currentTime;

    // 如果 Socket.IO 已初始化，則廣播新數據
    if (io) {
      io.emit('funding-rates-update', data);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching funding rates:', error);
    // 如果有緩存數據，在錯誤時返回緩存數據
    if (cachedData) {
      return res.status(200).json(cachedData);
    }
    res.status(500).json({ 
      success: false,
      error: '獲取資金費率失敗',
      details: error.message
    });
  }
}

async function fetchAllExchangeData() {
  try {
    console.log('開始獲取交易所數據...');
    
    const apiCalls = [
      { 
        name: 'Binance Rates', 
        url: 'https://fapi.binance.com/fapi/v1/premiumIndex',
        options: { timeout: 15000 }
      },
      { 
        name: 'Binance Funding Info', 
        url: 'https://fapi.binance.com/fapi/v1/fundingInfo',
        options: { timeout: 15000 }
      },
      { 
        name: 'Bybit Rates', 
        url: 'https://api.bybit.com/v5/market/tickers?category=linear',
        options: { timeout: 15000 }
      },
      { 
        name: 'Bybit Instruments', 
        url: 'https://api.bybit.com/v5/market/instruments-info?category=linear&limit=1000',
        options: { timeout: 15000 }
      },
      { 
        name: 'Bitget Rates', 
        url: 'https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES',
        options: {
          headers: {
            'Content-Type': 'application/json',
            'locale': 'zh-CN'
          },
          timeout: 15000
        }
      },
      { 
        name: 'Bitget Contracts', 
        url: 'https://api.bitget.com/api/v2/mix/market/contracts?productType=USDT-FUTURES',
        options: {
          headers: {
            'Content-Type': 'application/json',
            'locale': 'zh-CN'
          },
          timeout: 15000
        }
      },
      { 
        name: 'OKX Tickers', 
        url: 'https://www.okx.com/api/v5/public/mark-price?instType=SWAP',
        options: { timeout: 15000 }
      },
      { 
        name: 'OKX Instruments', 
        url: 'https://www.okx.com/api/v5/public/instruments?instType=SWAP',
        options: { timeout: 15000 }
      },
      { 
        name: 'Hyperliquid', 
        url: 'https://api.hyperliquid.xyz/info',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
          timeout: 15000
        }
      },
      { 
        name: 'Gate.io Contracts', 
        url: 'https://api.gateio.ws/api/v4/futures/usdt/contracts',
        options: {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      }
    ];

    const responses = await Promise.allSettled(
      apiCalls.map(async ({ name, url, options = {} }) => {
        try {
          return await fetchWithRetry(url, options);
        } catch (error) {
          console.error(`${name} API 調用失敗:`, error);
          return null;
        }
      })
    );

    // 處理響應結果
    const [
      binanceRatesResult,
      binanceFundingInfoResult,
      bybitRatesResult,
      bybitInstrumentsResult,
      bitgetRatesResult,
      bitgetContractsResult,
      okxTickersResult,
      okxInstrumentsResult,
      hyperliquidResult,
      gateioContractsResult
    ] = responses;

    // 提取成功的響應數據
    const binanceRatesData = binanceRatesResult.status === 'fulfilled' ? binanceRatesResult.value : null;
    const binanceFundingInfoData = binanceFundingInfoResult.status === 'fulfilled' ? binanceFundingInfoResult.value : null;
    const bybitRatesData = bybitRatesResult.status === 'fulfilled' ? bybitRatesResult.value : null;
    const bybitInstrumentsData = bybitInstrumentsResult.status === 'fulfilled' ? bybitInstrumentsResult.value : null;
    const bitgetRatesData = bitgetRatesResult.status === 'fulfilled' ? bitgetRatesResult.value : null;
    const bitgetContractsData = bitgetContractsResult.status === 'fulfilled' ? bitgetContractsResult.value : null;
    const okxTickersData = okxTickersResult.status === 'fulfilled' ? okxTickersResult.value : null;
    const okxInstrumentsData = okxInstrumentsResult.status === 'fulfilled' ? okxInstrumentsResult.value : null;
    const hyperliquidData = hyperliquidResult.status === 'fulfilled' ? hyperliquidResult.value : null;
    const gateioContractsData = gateioContractsResult.status === 'fulfilled' ? gateioContractsResult.value : null;

    // 檢查是否所有必需的數據都成功獲取
    if (!binanceRatesData || !bybitRatesData || !bitgetRatesData || !okxTickersData) {
      console.error('部分關鍵數據獲取失敗:', {
        binanceRatesData: !!binanceRatesData,
        bybitRatesData: !!bybitRatesData,
        bitgetRatesData: !!bitgetRatesData,
        okxTickersData: !!okxTickersData
      });
    }

    // 創建幣安結算週期映射
    const binanceIntervals = {};
    if (binanceFundingInfoData) {
      binanceFundingInfoData.forEach(info => {
        binanceIntervals[info.symbol] = parseInt(info.fundingIntervalHours) || 8;
      });
    }

    // 創建 Bybit 結算週期映射
    const bybitIntervals = {};
    if (bybitInstrumentsData?.result?.list) {
      bybitInstrumentsData.result.list.forEach(instrument => {
        bybitIntervals[instrument.symbol] = (parseInt(instrument.fundingInterval) || 480) / 60;
      });
    }

    // 處理幣安數據
    const binanceRates = binanceRatesData
      ? binanceRatesData
          .filter(item => item.symbol.endsWith('USDT'))
          .map(item => {
            const interval = binanceIntervals[item.symbol] || 8;
            return {
              symbol: item.symbol.replace('USDT', ''),
              exchange: 'Binance',
              currentRate: (parseFloat(item.lastFundingRate) * 100).toFixed(4),
              isSpecialInterval: interval !== 8,
              settlementInterval: interval
            };
          })
      : [];

    // 創建 Bitget 合約結算週期映射
    const bitgetIntervals = {};
    if (bitgetContractsData?.data) {
      bitgetContractsData.data.forEach(contract => {
        bitgetIntervals[contract.symbol] = parseInt(contract.fundInterval) || 8;
      });
    }

    // 處理 HyperLiquid 數據
    let hyperliquidRates = [];
    if (hyperliquidData) {
      try {
        const [metadata, assetContexts] = hyperliquidData;
        hyperliquidRates = metadata.universe.map((asset, index) => {
          const assetData = assetContexts[index];
          const rate = (parseFloat(assetData.funding) * 100).toFixed(4);
          return {
            symbol: asset.name,
            exchange: 'HyperLiquid',
            currentRate: rate,
            isSpecialInterval: true,
            settlementInterval: 1
          };
        });
      } catch (error) {
        console.error('HyperLiquid 數據處理錯誤:', error);
      }
    }

    // 處理 Bybit 數據
    const bybitRates = bybitRatesData?.result?.list
      ? bybitRatesData.result.list
          .filter(item => item.symbol.endsWith('USDT') && item.fundingRate)
          .map(item => {
            try {
              const interval = bybitIntervals[item.symbol] || 8;
              return {
                symbol: item.symbol.replace('USDT', ''),
                exchange: 'Bybit',
                currentRate: (parseFloat(item.fundingRate) * 100).toFixed(4),
                isSpecialInterval: interval !== 8,
                settlementInterval: interval
              };
            } catch (error) {
              console.error('Bybit 數據處理錯誤:', error, item);
              return null;
            }
          })
          .filter(item => item !== null)
      : [];

    // 處理 Bitget 數據
    const bitgetRates = bitgetRatesData?.data
      ? bitgetRatesData.data
          .filter(item => item.symbol && item.fundingRate)
          .map(item => {
            try {
              const symbol = item.symbol.replace('USDT', '');
              const interval = bitgetIntervals[item.symbol] || 8;
              return {
                symbol,
                exchange: 'Bitget',
                currentRate: (parseFloat(item.fundingRate) * 100).toFixed(4),
                isSpecialInterval: interval !== 8,
                settlementInterval: interval
              };
            } catch (error) {
              console.error('Bitget 數據處理錯誤:', error, item);
              return null;
            }
          })
          .filter(item => item !== null)
      : [];

    // 創建 OKX 結算週期映射
    const okxIntervals = {};
    if (okxInstrumentsData.data) {
      okxInstrumentsData.data.forEach(instrument => {
        if (instrument.instId.endsWith('-USDT-SWAP')) {
          // 從 fundingInterval 獲取結算週期（毫秒轉小時）
          const interval = parseInt(instrument.fundingInterval) / (1000 * 60 * 60);
          okxIntervals[instrument.instId] = interval || 8;
        }
      });
    }

    // 處理 OKX 數據
    // 1. 先從 tickers 獲取所有 USDT 永續合約
    const okxUsdtContracts = (okxTickersData.data || [])
      .filter(item => item.instId && item.instId.endsWith('-USDT-SWAP'))
      .map(item => item.instId);

    // 2. 獲取這些合約的資金費率
    const okxFundingRatesData = await Promise.allSettled(
      okxUsdtContracts.map(instId => 
        fetchWithRetry(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`)
      )
    ).then(results => 
      results.map(result => result.status === 'fulfilled' ? result.value : null)
    );

    // 3. 處理資金費率數據
    const okxRates = okxFundingRatesData
      .filter(data => data.data && data.data[0])
      .map(data => {
        try {
          const item = data.data[0];
          const symbol = item.instId.split('-')[0];
          const fundingRate = parseFloat(item.fundingRate);

          if (!item.instId || !fundingRate || isNaN(fundingRate)) {
            return null;
          }

          // 計算結算週期（毫秒轉換為小時）
          const nextFundingTime = parseInt(item.nextFundingTime);
          const currentFundingTime = parseInt(item.fundingTime);
          const interval = (nextFundingTime - currentFundingTime) / (1000 * 60 * 60);

          return {
            symbol,
            exchange: 'OKX',
            currentRate: (fundingRate * 100).toFixed(4),
            isSpecialInterval: interval !== 8,  // 如果不是8小時就標記
            settlementInterval: interval,  // 實際結算間隔
            nextFundingTime: new Date(nextFundingTime).toISOString(),
            fundingTime: new Date(currentFundingTime).toISOString()
          };
        } catch (error) {
          console.error('OKX data processing error:', error, item);
          return null;
        }
      })
      .filter(item => item !== null);

    // 處理 Gate.io 數據
    let gateioRates = [];
    if (gateioContractsData) {
      try {
        gateioRates = gateioContractsData
          .filter(item => item.name && item.name.endsWith('_USDT'))
          .map(item => {
            try {
              const symbol = item.name.replace('_USDT', '');
              const fundingRate = parseFloat(item.funding_rate);
              const interval = parseInt(item.funding_interval) / 3600; // 轉換為小時

              if (!item.name || !fundingRate || isNaN(fundingRate)) {
                return null;
              }

              return {
                symbol,
                exchange: 'Gate.io',
                currentRate: (fundingRate * 100).toFixed(4),
                isSpecialInterval: interval !== 8,
                settlementInterval: interval,
                nextFundingTime: new Date(item.funding_next_apply * 1000).toISOString()
              };
            } catch (error) {
              console.error('Gate.io 數據處理錯誤:', error, item);
              return null;
            }
          })
          .filter(item => item !== null);
      } catch (error) {
        console.error('Gate.io 數據處理錯誤:', error);
      }
    }

    // 合併所有交易所的數據
    const allRates = [
      ...binanceRates,
      ...bybitRates,
      ...bitgetRates,
      ...okxRates,
      ...gateioRates,
      ...hyperliquidRates
    ].filter(item => {
      // 確保 item 和 currentRate 存在且為有效數值
      return item && 
        item.currentRate && 
        !isNaN(parseFloat(item.currentRate)) && 
        parseFloat(item.currentRate) !== 0;
    });

    console.log('數據處理完成，各交易所數據數量:', {
      binance: binanceRates?.length || 0,
      bybit: bybitRates?.length || 0,
      bitget: bitgetRates?.length || 0,
      okx: okxRates?.length || 0,
      gateio: gateioRates?.length || 0,
      hyperliquid: hyperliquidRates?.length || 0
    });

    return {
      success: true,
      data: allRates,
      debug: {
        binanceCount: binanceRates?.length || 0,
        bybitCount: bybitRates?.length || 0,
        bitgetCount: bitgetRates?.length || 0,
        okxCount: okxRates?.length || 0,
        gateioCount: gateioRates?.length || 0,
        hyperliquidCount: hyperliquidRates?.length || 0,
        totalCount: allRates.length
      }
    };
  } catch (error) {
    console.error('fetchAllExchangeData 發生錯誤:', error);
    return {
      success: false,
      data: [],
      error: error.message,
      errorDetails: {
        name: error.name,
        code: error.code,
        cause: error.cause
      }
    };
  }
}

// 配置 API 路由以支持 WebSocket
export const config = {
  api: {
    bodyParser: false,
  },
};