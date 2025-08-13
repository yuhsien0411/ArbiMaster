import axios from 'axios';

export class RealisticPredictor {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    this.predictionHistory = new Map();
    this.modelPerformance = {
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0,
      lastUpdated: null
    };
  }

  // 獲取真實的資金費率數據
  async getRealFundingRates(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/funding-rates`);
      if (response.data.success) {
        return response.data.data.filter(item => item.symbol === symbol);
      }
      throw new Error('無法獲取資金費率數據');
    } catch (error) {
      console.error('獲取資金費率失敗:', error);
      return [];
    }
  }

  // 獲取真實的交易量數據
  async getRealVolumeData(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/volume-analysis`);
      if (response.data.success) {
        return response.data.data.find(item => item.symbol === symbol);
      }
      throw new Error('無法獲取交易量數據');
    } catch (error) {
      console.error('獲取交易量失敗:', error);
      return null;
    }
  }

  // 獲取真實的持倉量數據
  async getRealOpenInterest(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/open-interest`);
      if (response.data.success) {
        return response.data.data.find(item => item.symbol === symbol);
      }
      throw new Error('無法獲取持倉量數據');
    } catch (error) {
      console.error('獲取持倉量失敗:', error);
      return null;
    }
  }

  // 計算技術指標
  calculateTechnicalIndicators(historicalRates) {
    if (historicalRates.length < 20) return null;

    const rates = historicalRates.map(r => parseFloat(r.fundingRate));
    
    // 移動平均線
    const ma7 = rates.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const ma14 = rates.slice(-14).reduce((a, b) => a + b, 0) / 14;
    
    // 波動率
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const variance = rates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rates.length;
    const volatility = Math.sqrt(variance);
    
    // RSI (簡化版)
    let gains = 0, losses = 0;
    for (let i = 1; i < rates.length; i++) {
      const change = rates[i] - rates[i-1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    const rsi = gains / (gains + losses) * 100;

    return {
      ma7: ma7.toFixed(6),
      ma14: ma14.toFixed(6),
      volatility: volatility.toFixed(6),
      rsi: rsi.toFixed(2),
      trend: ma7 > ma14 ? 'bullish' : 'bearish',
      momentum: (rates[rates.length - 1] - rates[rates.length - 7]).toFixed(6)
    };
  }

  // 預測資金費率變化
  async predictFundingRate(symbol, exchange) {
    try {
      console.log(`🔮 預測 ${symbol} 在 ${exchange} 的資金費率變化...`);
      
      // 獲取真實數據
      const fundingRates = await this.getRealFundingRates(symbol);
      const volumeData = await this.getRealVolumeData(symbol);
      const openInterestData = await this.getRealOpenInterest(symbol);
      
      if (fundingRates.length === 0) {
        throw new Error('無法獲取足夠的歷史數據');
      }

      // 找到指定交易所的數據
      const exchangeData = fundingRates.find(item => item.exchange === exchange);
      if (!exchangeData) {
        throw new Error(`無法找到 ${exchange} 的數據`);
      }

      const currentRate = parseFloat(exchangeData.currentRate);
      
      // 計算技術指標
      const technicalIndicators = this.calculateTechnicalIndicators(fundingRates);
      
      // 基於技術指標和市場數據的預測邏輯
      let predictedChange = 0;
      let confidence = 50;
      let reasoning = [];

      if (technicalIndicators) {
        // 趨勢分析
        if (technicalIndicators.trend === 'bullish') {
          predictedChange += 0.0001; // 看漲趨勢，費率可能上升
          reasoning.push('技術指標顯示看漲趨勢');
          confidence += 10;
        } else {
          predictedChange -= 0.0001; // 看跌趨勢，費率可能下降
          reasoning.push('技術指標顯示看跌趨勢');
          confidence += 10;
        }

        // 動量分析
        const momentum = parseFloat(technicalIndicators.momentum);
        if (Math.abs(momentum) > 0.0005) {
          predictedChange += momentum * 0.5;
          reasoning.push(`動量指標: ${momentum > 0 ? '正' : '負'}${Math.abs(momentum).toFixed(6)}`);
          confidence += 5;
        }

        // 波動率分析
        const volatility = parseFloat(technicalIndicators.volatility);
        if (volatility > 0.001) {
          confidence -= 10; // 高波動率降低置信度
          reasoning.push('高波動率環境，預測不確定性增加');
        }
      }

      // 交易量分析
      if (volumeData) {
        const volumeChange = parseFloat(volumeData.change24h || 0);
        if (Math.abs(volumeChange) > 20) {
          if (volumeChange > 0) {
            predictedChange += 0.00005;
            reasoning.push('交易量顯著增加，市場活躍度提升');
          } else {
            predictedChange -= 0.00005;
            reasoning.push('交易量顯著減少，市場活躍度下降');
          }
          confidence += 5;
        }
      }

      // 持倉量分析
      if (openInterestData) {
        const oiChange = parseFloat(openInterestData.change24h || 0);
        if (Math.abs(oiChange) > 10) {
          if (oiChange > 0) {
            predictedChange += 0.00003;
            reasoning.push('持倉量增加，市場參與度提升');
          } else {
            predictedChange -= 0.00003;
            reasoning.push('持倉量減少，市場參與度下降');
          }
          confidence += 3;
        }
      }

      // 市場情緒分析
      const marketSentiment = this.analyzeMarketSentiment(currentRate, technicalIndicators);
      reasoning.push(`市場情緒: ${marketSentiment.sentiment}`);

      // 計算預測費率
      const predictedRate = currentRate + predictedChange;
      
      // 限制置信度範圍
      confidence = Math.max(30, Math.min(95, confidence));

      // 生成交易建議
      const tradingAdvice = this.generateTradingAdvice(
        currentRate, 
        predictedRate, 
        confidence, 
        marketSentiment
      );

      // 風險評估
      const riskAssessment = this.assessRisk(
        currentRate, 
        predictedRate, 
        technicalIndicators, 
        volumeData
      );

      const result = {
        symbol,
        exchange,
        currentRate: currentRate.toFixed(6),
        predictedRate: predictedRate.toFixed(6),
        predictedChange: predictedChange.toFixed(6),
        confidence: confidence.toFixed(1),
        predictionTime: new Date().toISOString(),
        nextFundingTime: this.getNextFundingTime(exchange),
        
        // 技術分析
        technicalIndicators,
        
        // 市場分析
        marketSentiment,
        
        // 交易建議
        tradingAdvice,
        
        // 風險評估
        riskAssessment,
        
        // 預測依據
        reasoning: reasoning.length > 0 ? reasoning : ['基於歷史數據和技術指標分析'],
        
        // 模型信息
        modelInfo: {
          type: 'Realistic Multi-Factor Analysis',
          version: 'v1.0',
          dataSources: ['Funding Rates', 'Volume', 'Open Interest'],
          lastUpdated: new Date().toISOString()
        }
      };

      // 記錄預測歷史
      this.recordPrediction(symbol, exchange, result);
      
      console.log(`✅ 預測完成: ${result.predictedRate}% (置信度: ${result.confidence}%)`);
      
      return result;

    } catch (error) {
      console.error('❌ 預測失敗:', error);
      throw error;
    }
  }

  // 分析市場情緒
  analyzeMarketSentiment(currentRate, technicalIndicators) {
    let sentimentScore = 50;
    let sentiment = 'neutral';
    let indicators = [];

    // 基於當前費率
    if (currentRate < -0.0005) {
      sentimentScore += 20;
      indicators.push('負資金費率表示看漲情緒');
    } else if (currentRate > 0.0005) {
      sentimentScore -= 20;
      indicators.push('正資金費率表示看跌情緒');
    }

    // 基於技術指標
    if (technicalIndicators) {
      if (technicalIndicators.trend === 'bullish') {
        sentimentScore += 15;
        indicators.push('技術趨勢看漲');
      } else {
        sentimentScore -= 15;
        indicators.push('技術趨勢看跌');
      }

      const rsi = parseFloat(technicalIndicators.rsi);
      if (rsi > 70) {
        sentimentScore -= 10;
        indicators.push('RSI超買');
      } else if (rsi < 30) {
        sentimentScore += 10;
        indicators.push('RSI超賣');
      }
    }

    // 確定情緒類型
    if (sentimentScore >= 70) sentiment = 'bullish';
    else if (sentimentScore <= 30) sentiment = 'bearish';
    else sentiment = 'neutral';

    return {
      sentiment,
      score: Math.max(0, Math.min(100, sentimentScore)),
      indicators
    };
  }

  // 生成交易建議
  generateTradingAdvice(currentRate, predictedRate, confidence, marketSentiment) {
    const change = predictedRate - currentRate;
    const changePercent = (change / Math.abs(currentRate)) * 100;
    
    let advice = {
      action: 'hold',
      confidence: confidence,
      reasoning: [],
      riskLevel: 'medium',
      expectedReturn: '0%',
      timeHorizon: '8h'
    };

    // 基於預測變化幅度
    if (Math.abs(changePercent) > 20 && confidence > 70) {
      if (change > 0) {
        advice.action = 'long';
        advice.reasoning.push(`預測費率將上升 ${(changePercent).toFixed(2)}%`);
        advice.expectedReturn = `${(changePercent * 0.5).toFixed(2)}%`;
      } else {
        advice.action = 'short';
        advice.reasoning.push(`預測費率將下降 ${Math.abs(changePercent).toFixed(2)}%`);
        advice.expectedReturn = `${(Math.abs(changePercent) * 0.5).toFixed(2)}%`;
      }
    } else if (Math.abs(changePercent) > 10 && confidence > 60) {
      advice.action = change > 0 ? 'long' : 'short';
      advice.reasoning.push(`預測費率將${change > 0 ? '上升' : '下降'} ${Math.abs(changePercent).toFixed(2)}%`);
      advice.expectedReturn = `${(Math.abs(changePercent) * 0.3).toFixed(2)}%`;
    } else {
      advice.action = 'hold';
      advice.reasoning.push('預測變化幅度較小，建議觀望');
    }

    // 基於市場情緒
    if (marketSentiment.sentiment === 'bullish' && advice.action === 'long') {
      advice.confidence += 10;
      advice.reasoning.push('市場情緒支持做多');
    } else if (marketSentiment.sentiment === 'bearish' && advice.action === 'short') {
      advice.confidence += 10;
      advice.reasoning.push('市場情緒支持做空');
    } else if (marketSentiment.sentiment !== 'neutral') {
      advice.confidence -= 10;
      advice.reasoning.push('預測與市場情緒不一致，需謹慎');
    }

    // 風險評估
    if (confidence < 50) {
      advice.riskLevel = 'high';
      advice.reasoning.push('預測置信度較低，風險較高');
    } else if (confidence > 80) {
      advice.riskLevel = 'low';
    }

    return advice;
  }

  // 風險評估
  assessRisk(currentRate, predictedRate, technicalIndicators, volumeData) {
    let riskScore = 50;
    let riskFactors = [];
    let riskLevel = 'medium';

    // 基於預測變化幅度
    const change = Math.abs(predictedRate - currentRate);
    if (change > 0.001) {
      riskScore += 20;
      riskFactors.push('預測變化幅度較大');
    }

    // 基於波動率
    if (technicalIndicators && parseFloat(technicalIndicators.volatility) > 0.001) {
      riskScore += 15;
      riskFactors.push('市場波動率較高');
    }

    // 基於交易量
    if (volumeData && Math.abs(parseFloat(volumeData.change24h || 0)) > 50) {
      riskScore += 10;
      riskFactors.push('交易量變化劇烈');
    }

    // 基於費率絕對值
    if (Math.abs(currentRate) > 0.002) {
      riskScore += 10;
      riskFactors.push('當前費率處於極端水平');
    }

    // 確定風險等級
    if (riskScore >= 70) riskLevel = 'high';
    else if (riskScore <= 30) riskLevel = 'low';

    return {
      riskLevel,
      riskScore,
      riskFactors: riskFactors.length > 0 ? riskFactors : ['風險水平正常'],
      maxLoss: this.calculateMaxLoss(riskLevel, currentRate),
      stopLoss: this.calculateStopLoss(currentRate, predictedRate)
    };
  }

  // 計算最大損失
  calculateMaxLoss(riskLevel, currentRate) {
    const baseLoss = Math.abs(currentRate) * 100;
    switch (riskLevel) {
      case 'high': return (baseLoss * 2).toFixed(2) + '%';
      case 'medium': return (baseLoss * 1.5).toFixed(2) + '%';
      case 'low': return baseLoss.toFixed(2) + '%';
      default: return baseLoss.toFixed(2) + '%';
    }
  }

  // 計算止損點
  calculateStopLoss(currentRate, predictedRate) {
    const change = predictedRate - currentRate;
    const stopLossRate = currentRate + (change * 0.5); // 50%回撤止損
    return stopLossRate.toFixed(6);
  }

  // 獲取下一個資金費率結算時間
  getNextFundingTime(exchange) {
    const now = new Date();
    const nextFunding = new Date(now);
    
    // 資金費率通常每8小時結算一次
    const hoursUntilNext = 8 - (now.getUTCHours() % 8);
    nextFunding.setUTCHours(now.getUTCHours() + hoursUntilNext, 0, 0, 0);
    
    return nextFunding.toISOString();
  }

  // 記錄預測歷史
  recordPrediction(symbol, exchange, prediction) {
    const key = `${symbol}_${exchange}`;
    if (!this.predictionHistory.has(key)) {
      this.predictionHistory.set(key, []);
    }
    
    this.predictionHistory.get(key).push({
      timestamp: prediction.predictionTime,
      currentRate: parseFloat(prediction.currentRate),
      predictedRate: parseFloat(prediction.predictedRate),
      confidence: parseFloat(prediction.confidence),
      actualRate: null // 將在實際費率更新後填充
    });

    // 只保留最近100次預測
    if (this.predictionHistory.get(key).length > 100) {
      this.predictionHistory.get(key).shift();
    }
  }

  // 更新模型性能
  updateModelPerformance() {
    let totalPredictions = 0;
    let correctPredictions = 0;

    for (const [key, predictions] of this.predictionHistory) {
      for (const pred of predictions) {
        if (pred.actualRate !== null) {
          totalPredictions++;
          const error = Math.abs(pred.predictedRate - pred.actualRate);
          if (error < 0.0001) { // 誤差小於0.01%算正確
            correctPredictions++;
          }
        }
      }
    }

    this.modelPerformance = {
      accuracy: totalPredictions > 0 ? (correctPredictions / totalPredictions * 100) : 0,
      totalPredictions,
      correctPredictions,
      lastUpdated: new Date().toISOString()
    };
  }

  // 獲取預測歷史
  getPredictionHistory(symbol, exchange) {
    const key = `${symbol}_${exchange}`;
    return this.predictionHistory.get(key) || [];
  }

  // 獲取模型性能
  getModelPerformance() {
    this.updateModelPerformance();
    return this.modelPerformance;
  }
} 