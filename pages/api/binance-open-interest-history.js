import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 設置 CORS 頭
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  
  // 處理 OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { symbol, period, limit } = req.query;
  
  if (!symbol || !period) {
    return res.status(400).json({
      success: false,
      error: '缺少必要參數 symbol 或 period'
    });
  }
  
  try {
    const requestedLimit = parseInt(limit || "500");
    const API_MAX_LIMIT = 500; // Binance API 的最大限制
    
    // 根據週期設置數據請求的上限
    const periodLimit = getPeriodLimit(period);
    const effectiveLimit = Math.min(requestedLimit, periodLimit);
    
    // 如果請求的數據量小於或等於 API_MAX_LIMIT，直接獲取
    if (effectiveLimit <= API_MAX_LIMIT) {
      const data = await fetchOpenInterestData(symbol, period, effectiveLimit);
      return res.status(200).json({
        success: true,
        data: data
      });
    } else {
      // 如果請求的數據量大於 API_MAX_LIMIT，需要進行多次請求並合併
      let allData = [];
      let remainingLimit = effectiveLimit;
      let endTime = Date.now(); // 當前時間作為第一次請求的結束時間
      
      // 進行多次請求直到獲取足夠的數據
      while (remainingLimit > 0 && allData.length < effectiveLimit) {
        const batchLimit = Math.min(remainingLimit, API_MAX_LIMIT);
        const batchData = await fetchOpenInterestData(symbol, period, batchLimit, null, endTime);
        
        if (batchData.length === 0) break; // 沒有更多數據可獲取
        
        allData = [...allData, ...batchData];
        remainingLimit -= batchData.length;
        
        // 更新下一批請求的結束時間為當前批次最早數據的時間戳減1毫秒
        if (batchData.length > 0) {
          endTime = batchData[batchData.length - 1].timestamp - 1;
        }
      }
      
      // 按時間從早到晚排序
      allData.sort((a, b) => a.timestamp - b.timestamp);
      
      // 如果獲取的數據超過請求的限制，只返回最近的 effectiveLimit 條
      if (allData.length > effectiveLimit) {
        allData = allData.slice(allData.length - effectiveLimit);
      }
      
      return res.status(200).json({
        success: true,
        data: allData
      });
    }
  } catch (error) {
    console.error('獲取 Binance 合約持倉量歷史數據失敗:', error);
    return res.status(500).json({
      success: false,
      error: `獲取數據失敗: ${error.message}`
    });
  }
}

// 輔助函數，用於獲取單批次的開倉量數據
async function fetchOpenInterestData(symbol, period, limit, startTime = null, endTime = null) {
  // 構建 API URL
  let apiUrl = `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=${period}&limit=${limit}`;
  
  // 添加可選參數
  if (startTime) {
    apiUrl += `&startTime=${startTime}`;
  }
  
  if (endTime) {
    apiUrl += `&endTime=${endTime}`;
  }
  
  // 發送請求到 Binance API
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // 轉換數據格式，使其更易用於前端
  return data.map(item => ({
    timestamp: parseInt(item.timestamp),
    symbol: item.symbol,
    sumOpenInterest: parseFloat(item.sumOpenInterest),
    sumOpenInterestValue: parseFloat(item.sumOpenInterestValue)
  }));
}

// 根據時間週期獲取數據請求上限
function getPeriodLimit(period) {
  switch(period) {
    case '5m':
    case '15m':
    case '30m':
      // 5分鐘/15分鐘/30分鐘粒度最多只能查詢2天內的數據
      return period === '5m' ? 576 : // 2 * 24 * 12 (2天 * 24小時 * 每小時12個5分鐘)
             period === '15m' ? 192 : // 2 * 24 * 4 (2天 * 24小時 * 每小時4個15分鐘)
             96; // 2 * 24 * 2 (2天 * 24小時 * 每小時2個30分鐘)
    case '1h':
    case '2h':
    case '4h':
    case '6h':
    case '12h':
    case '1d':
      // 1小時及以上粒度最多查詢30天內的數據
      return period === '1h' ? 720 : // 30 * 24 (30天 * 24小時)
             period === '2h' ? 360 : // 30 * 12 (30天 * 每天12個2小時)
             period === '4h' ? 180 : // 30 * 6 (30天 * 每天6個4小時)
             period === '6h' ? 120 : // 30 * 4 (30天 * 每天4個6小時)
             period === '12h' ? 60 : // 30 * 2 (30天 * 每天2個12小時)
             30; // 30天 (1d)
    default:
      return 500; // 默認使用API限制
  }
} 