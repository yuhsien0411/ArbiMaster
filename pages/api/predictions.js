import { FundingRatePredictor } from '../../lib/predictors/FundingRatePredictor.js';

// 緩存預測結果
let predictionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘緩存

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '只支持 GET 請求' });
  }

  try {
    const { symbol = 'BTC', exchange = 'Binance', predictionType = 'funding_rate', action } = req.query;
    
    // 處理不同的操作
    switch (action) {
      case 'train':
        return await handleTrainModel(req, res);
      case 'evaluate':
        return await handleEvaluateModel(req, res);
      default:
        return await handlePrediction(req, res);
    }
    
  } catch (error) {
    console.error('預測API錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '預測失敗',
      details: error.message 
    });
  }
}

// 處理預測請求
async function handlePrediction(req, res) {
  const { symbol, exchange, predictionType } = req.query;
  
  try {
    // 檢查緩存
    const cacheKey = `${predictionType}_${symbol}_${exchange}`;
    const cachedResult = predictionCache.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        data: cachedResult.data,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    let predictions = {};
    
    switch (predictionType) {
      case 'funding_rate':
        const ratePredictor = new FundingRatePredictor();
        predictions = await ratePredictor.predict(symbol, exchange);
        break;
        
      case 'arbitrage_opportunity':
        predictions = await predictArbitrageOpportunity(symbol);
        break;
        
      case 'market_sentiment':
        predictions = await predictMarketSentiment(symbol);
        break;
        
      default:
        return res.status(400).json({ 
          success: false,
          error: '不支持的預測類型',
          supportedTypes: ['funding_rate', 'arbitrage_opportunity', 'market_sentiment']
        });
    }
    
    // 更新緩存
    predictionCache.set(cacheKey, {
      data: predictions,
      timestamp: Date.now()
    });
    
    res.status(200).json({
      success: true,
      data: predictions,
      cached: false,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('預測處理錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '預測處理失敗',
      details: error.message 
    });
  }
}

// 處理模型訓練請求
async function handleTrainModel(req, res) {
  try {
    console.log('開始訓練模型...');
    
    const ratePredictor = new FundingRatePredictor();
    const result = await ratePredictor.trainModel();
    
    res.status(200).json({
      success: true,
      message: '模型訓練完成',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('模型訓練錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '模型訓練失敗',
      details: error.message 
    });
  }
}

// 處理模型評估請求
async function handleEvaluateModel(req, res) {
  try {
    console.log('開始評估模型...');
    
    const ratePredictor = new FundingRatePredictor();
    await ratePredictor.initialize();
    const evaluation = await ratePredictor.evaluateModel();
    
    res.status(200).json({
      success: true,
      message: '模型評估完成',
      data: evaluation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('模型評估錯誤:', error);
    res.status(500).json({ 
      success: false,
      error: '模型評估失敗',
      details: error.message 
    });
  }
}

// 套利機會預測（簡化版本）
async function predictArbitrageOpportunity(symbol) {
  try {
    // 獲取所有交易所的資金費率
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/funding-rates`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('無法獲取資金費率數據');
    }
    
    // 找出指定幣種的費率
    const symbolRates = data.data.filter(item => item.symbol === symbol);
    
    if (symbolRates.length < 2) {
      return {
        symbol,
        opportunities: [],
        message: '數據不足，無法計算套利機會'
      };
    }
    
    // 計算套利機會
    const opportunities = [];
    const minSpread = 0.001; // 最小利差 0.1%
    
    // 找出最低和最高費率
    const sortedRates = symbolRates.sort((a, b) => parseFloat(a.currentRate) - parseFloat(b.currentRate));
    const lowestRate = sortedRates[0];
    const highestRate = sortedRates[sortedRates.length - 1];
    
    const spread = parseFloat(highestRate.currentRate) - parseFloat(lowestRate.currentRate);
    
    if (spread > minSpread) {
      opportunities.push({
        type: 'funding_rate_arbitrage',
        longExchange: lowestRate.exchange,
        shortExchange: highestRate.exchange,
        spread: spread.toFixed(6),
        expectedReturn: (spread * 100).toFixed(4) + '%',
        confidence: calculateArbitrageConfidence(spread, symbolRates),
        urgency: calculateUrgency(spread),
        risk: assessArbitrageRisk(spread, symbolRates)
      });
    }
    
    return {
      symbol,
      timestamp: new Date().toISOString(),
      opportunities,
      summary: generateArbitrageSummary(opportunities)
    };
    
  } catch (error) {
    console.error('套利機會預測錯誤:', error);
    throw error;
  }
}

// 市場情緒預測（簡化版本）
async function predictMarketSentiment(symbol) {
  try {
    // 獲取市場數據
    const [fundingRatesRes, volumeRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/funding-rates`),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/volume-analysis`)
    ]);
    
    const fundingRatesData = await fundingRatesRes.json();
    const volumeData = await volumeRes.json();
    
    // 找出指定幣種的數據
    const symbolRates = fundingRatesData.data.filter(item => item.symbol === symbol);
    const symbolVolume = volumeData.data.find(item => item.symbol === symbol);
    
    if (symbolRates.length === 0) {
      return {
        symbol,
        sentiment: 'neutral',
        score: 50,
        message: '數據不足，無法分析市場情緒'
      };
    }
    
    // 計算市場情緒指標
    const averageRate = symbolRates.reduce((sum, item) => sum + parseFloat(item.currentRate), 0) / symbolRates.length;
    const rateVolatility = calculateVolatility(symbolRates.map(item => parseFloat(item.currentRate)));
    const volumeChange = symbolVolume ? calculateVolumeChange(symbolVolume) : 0;
    
    // 綜合情緒評分
    let sentimentScore = 50; // 中性
    
    // 費率影響（負費率通常表示看漲情緒）
    if (averageRate < 0) {
      sentimentScore += Math.abs(averageRate) * 1000; // 負費率越深，看漲情緒越強
    } else {
      sentimentScore -= averageRate * 1000; // 正費率越高，看跌情緒越強
    }
    
    // 波動率影響（高波動率通常表示不確定性）
    sentimentScore -= rateVolatility * 100;
    
    // 交易量影響
    sentimentScore += volumeChange * 10;
    
    // 限制在0-100範圍內
    sentimentScore = Math.max(0, Math.min(100, sentimentScore));
    
    // 確定情緒類型
    let sentiment = 'neutral';
    if (sentimentScore > 70) sentiment = 'bullish';
    else if (sentimentScore > 60) sentiment = 'slightly_bullish';
    else if (sentimentScore < 30) sentiment = 'bearish';
    else if (sentimentScore < 40) sentiment = 'slightly_bearish';
    
    return {
      symbol,
      timestamp: new Date().toISOString(),
      sentiment,
      score: sentimentScore.toFixed(1),
      indicators: {
        averageFundingRate: averageRate.toFixed(6),
        rateVolatility: rateVolatility.toFixed(6),
        volumeChange: volumeChange.toFixed(2),
        exchangeCount: symbolRates.length
      },
      analysis: generateSentimentAnalysis(sentiment, sentimentScore, averageRate, rateVolatility)
    };
    
  } catch (error) {
    console.error('市場情緒預測錯誤:', error);
    throw error;
  }
}

// 輔助函數
function calculateArbitrageConfidence(spread, rates) {
  // 基於利差大小和數據一致性計算置信度
  const baseConfidence = Math.min(spread * 1000, 95); // 利差越大，置信度越高
  const dataConsistency = rates.length >= 3 ? 10 : 0; // 數據來源越多，置信度越高
  
  return Math.min(100, baseConfidence + dataConsistency);
}

function calculateUrgency(spread) {
  // 基於利差大小計算緊急程度
  if (spread > 0.01) return 'high';
  if (spread > 0.005) return 'medium';
  return 'low';
}

function assessArbitrageRisk(spread, rates) {
  // 簡化的風險評估
  const volatility = calculateVolatility(rates.map(item => parseFloat(item.currentRate)));
  
  if (volatility > 0.01 || spread < 0.002) return 'high';
  if (volatility > 0.005 || spread < 0.005) return 'medium';
  return 'low';
}

function generateArbitrageSummary(opportunities) {
  if (opportunities.length === 0) {
    return '目前沒有發現明顯的套利機會';
  }
  
  const totalOpportunities = opportunities.length;
  const avgReturn = opportunities.reduce((sum, opp) => sum + parseFloat(opp.expectedReturn), 0) / totalOpportunities;
  const highConfidenceCount = opportunities.filter(opp => parseFloat(opp.confidence) > 70).length;
  
  return `發現 ${totalOpportunities} 個套利機會，平均預期收益 ${avgReturn.toFixed(2)}%，其中 ${highConfidenceCount} 個高置信度機會`;
}

function calculateVolatility(data) {
  if (data.length < 2) return 0;
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
  return Math.sqrt(variance);
}

function calculateVolumeChange(volumeData) {
  // 簡化的交易量變化計算
  return volumeData ? (Math.random() - 0.5) * 2 : 0; // 模擬數據
}

function generateSentimentAnalysis(sentiment, score, averageRate, volatility) {
  const analysis = {
    bullish: '市場情緒偏向樂觀，資金費率為負值表明多頭佔優',
    slightly_bullish: '市場情緒略微樂觀，但需要謹慎觀察',
    neutral: '市場情緒中性，建議觀望',
    slightly_bearish: '市場情緒略微悲觀，資金費率為正值',
    bearish: '市場情緒偏向悲觀，空頭佔優'
  };
  
  return analysis[sentiment] || '無法確定市場情緒';
} 