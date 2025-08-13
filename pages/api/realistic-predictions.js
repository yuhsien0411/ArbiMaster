import { RealisticPredictor } from '../../lib/predictors/RealisticPredictor.js';

// 全局預測器實例
const predictor = new RealisticPredictor();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只支援GET請求' });
  }

  const { symbol, exchange, action } = req.query;

  try {
    console.log(`🔮 實用預測請求: ${action} for ${symbol} on ${exchange}`);

    switch (action) {
      case 'predict':
        return await handlePrediction(req, res, symbol, exchange);
      
      case 'history':
        return await handleHistory(req, res, symbol, exchange);
      
      case 'performance':
        return await handlePerformance(req, res);
      
      case 'analysis':
        return await handleAnalysis(req, res, symbol, exchange);
      
      default:
        return await handlePrediction(req, res, symbol, exchange);
    }

  } catch (error) {
    console.error('❌ 實用預測API錯誤:', error);
    return res.status(500).json({
      error: '預測服務暫時不可用',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 處理預測請求
async function handlePrediction(req, res, symbol, exchange) {
  try {
    const prediction = await predictor.predictFundingRate(symbol, exchange);
    
    return res.status(200).json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('預測失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 處理歷史記錄請求
async function handleHistory(req, res, symbol, exchange) {
  try {
    const history = predictor.getPredictionHistory(symbol, exchange);
    
    return res.status(200).json({
      success: true,
      data: {
        symbol,
        exchange,
        history: history.slice(-20), // 最近20次預測
        totalPredictions: history.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('獲取歷史記錄失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 處理性能統計請求
async function handlePerformance(req, res) {
  try {
    const performance = predictor.getModelPerformance();
    
    return res.status(200).json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('獲取性能統計失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 處理綜合分析請求
async function handleAnalysis(req, res, symbol, exchange) {
  try {
    // 獲取預測
    const prediction = await predictor.predictFundingRate(symbol, exchange);
    
    // 獲取歷史記錄
    const history = predictor.getPredictionHistory(symbol, exchange);
    
    // 獲取性能統計
    const performance = predictor.getModelPerformance();
    
    // 生成綜合分析報告
    const analysis = generateComprehensiveAnalysis(prediction, history, performance);
    
    return res.status(200).json({
      success: true,
      data: {
        prediction,
        history: history.slice(-10), // 最近10次預測
        performance,
        analysis
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('綜合分析失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 生成綜合分析報告
function generateComprehensiveAnalysis(prediction, history, performance) {
  const analysis = {
    summary: '',
    keyInsights: [],
    recommendations: [],
    riskWarnings: [],
    marketContext: ''
  };

  // 生成摘要
  analysis.summary = `基於${performance.totalPredictions}次歷史預測（準確率${performance.accuracy.toFixed(1)}%），AI預測${prediction.symbol}在${prediction.exchange}的資金費率將從${prediction.currentRate}%${prediction.predictedChange > 0 ? '上升' : '下降'}至${prediction.predictedRate}%，置信度${prediction.confidence}%。`;

  // 關鍵洞察
  if (prediction.technicalIndicators) {
    analysis.keyInsights.push(`技術趨勢: ${prediction.technicalIndicators.trend === 'bullish' ? '看漲' : '看跌'}`);
    analysis.keyInsights.push(`RSI指標: ${prediction.technicalIndicators.rsi} (${parseFloat(prediction.technicalIndicators.rsi) > 70 ? '超買' : parseFloat(prediction.technicalIndicators.rsi) < 30 ? '超賣' : '正常'})`);
    analysis.keyInsights.push(`波動率: ${prediction.technicalIndicators.volatility} (${parseFloat(prediction.technicalIndicators.volatility) > 0.001 ? '高' : '正常'})`);
  }

  analysis.keyInsights.push(`市場情緒: ${prediction.marketSentiment.sentiment} (${prediction.marketSentiment.score.toFixed(1)}分)`);
  analysis.keyInsights.push(`交易建議: ${prediction.tradingAdvice.action.toUpperCase()} (預期收益: ${prediction.tradingAdvice.expectedReturn})`);

  // 建議
  if (prediction.tradingAdvice.action === 'long') {
    analysis.recommendations.push('考慮做多，預期資金費率上升');
    analysis.recommendations.push(`設置止損點: ${prediction.riskAssessment.stopLoss}%`);
  } else if (prediction.tradingAdvice.action === 'short') {
    analysis.recommendations.push('考慮做空，預期資金費率下降');
    analysis.recommendations.push(`設置止損點: ${prediction.riskAssessment.stopLoss}%`);
  } else {
    analysis.recommendations.push('建議觀望，等待更明確的信號');
  }

  if (prediction.confidence > 80) {
    analysis.recommendations.push('高置信度預測，可考慮增加倉位');
  } else if (prediction.confidence < 50) {
    analysis.recommendations.push('低置信度預測，建議謹慎操作');
  }

  // 風險警告
  if (prediction.riskAssessment.riskLevel === 'high') {
    analysis.riskWarnings.push('高風險環境，建議降低倉位');
    analysis.riskWarnings.push(`最大潛在損失: ${prediction.riskAssessment.maxLoss}`);
  }

  prediction.riskAssessment.riskFactors.forEach(factor => {
    analysis.riskWarnings.push(factor);
  });

  // 市場背景
  const currentRate = parseFloat(prediction.currentRate);
  if (currentRate < -0.001) {
    analysis.marketContext = '當前處於深度負費率環境，通常表示強烈的看漲情緒，但需注意可能的回調風險。';
  } else if (currentRate > 0.001) {
    analysis.marketContext = '當前處於正費率環境，通常表示看跌情緒，但需關注可能的反轉信號。';
  } else {
    analysis.marketContext = '當前費率處於正常範圍，市場情緒相對平衡。';
  }

  return analysis;
} 