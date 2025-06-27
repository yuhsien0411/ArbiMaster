// 簡化版預測器 - 不依賴TensorFlow.js
export class SimplePredictor {
  constructor() {
    this.isInitialized = false;
    this.modelWeights = null;
  }

  async initialize() {
    try {
      console.log('🚀 初始化簡化版預測器...');
      
      // 初始化簡單的線性回歸權重
      this.modelWeights = {
        bias: 0.001,
        weights: [
          0.1,  // 當前費率權重
          0.2,  // 費率變化權重
          0.15, // 交易量變化權重
          0.1,  // 持倉量變化權重
          0.05, // 時間特徵權重
          0.1,  // 技術指標權重
          0.1,  // 市場情緒權重
          0.1   // 波動率權重
        ]
      };
      
      this.isInitialized = true;
      console.log('✅ 簡化版預測器初始化完成');
      return true;
    } catch (error) {
      console.error('❌ 初始化失敗:', error);
      return false;
    }
  }

  // 簡單的特徵提取
  extractFeatures(data) {
    if (!data || data.length < 10) {
      return null;
    }

    const currentData = data[data.length - 1];
    const historicalData = data.slice(-10);
    
    const rates = historicalData.map(d => d.fundingRate || 0);
    const volumes = historicalData.map(d => d.volume || 1000000);
    
    // 計算基本特徵
    const currentRate = rates[rates.length - 1];
    const rateChange = rates.length > 1 ? (rates[rates.length - 1] - rates[rates.length - 2]) : 0;
    const volumeChange = this.calculateVolumeChange(volumes);
    const oiChange = this.calculateOIChange(historicalData);
    
    // 時間特徵
    const hour = new Date(currentData.timestamp).getHours();
    const timeFeature = Math.sin(2 * Math.PI * hour / 24); // 24小時週期
    
    // 技術指標
    const technicalIndicator = this.calculateRSI(rates);
    
    // 市場情緒（簡化）
    const sentiment = this.calculateSimpleSentiment(rates, volumes);
    
    // 波動率
    const volatility = this.calculateVolatility(rates);
    
    return [
      currentRate,
      rateChange,
      volumeChange,
      oiChange,
      timeFeature,
      technicalIndicator,
      sentiment,
      volatility
    ];
  }

  // 計算交易量變化
  calculateVolumeChange(volumes) {
    if (volumes.length < 5) return 0;
    
    const recentAvg = volumes.slice(-3).reduce((sum, v) => sum + v, 0) / 3;
    const olderAvg = volumes.slice(-6, -3).reduce((sum, v) => sum + v, 0) / 3;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  // 計算持倉量變化
  calculateOIChange(data) {
    if (data.length < 5) return 0;
    
    const recentOI = data.slice(-3).map(d => d.openInterest || 1000000);
    const olderOI = data.slice(-6, -3).map(d => d.openInterest || 1000000);
    
    const recentAvg = recentOI.reduce((sum, oi) => sum + oi, 0) / recentOI.length;
    const olderAvg = olderOI.reduce((sum, oi) => sum + oi, 0) / olderOI.length;
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  // 計算RSI
  calculateRSI(data, period = 14) {
    if (data.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = data.length - period; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // 計算簡單情緒
  calculateSimpleSentiment(rates, volumes) {
    if (rates.length < 5) return 0;
    
    const rateTrend = rates[rates.length - 1] - rates[0];
    const volumeTrend = volumes[volumes.length - 1] / (volumes[0] || 1);
    
    return (rateTrend * 0.7 + (volumeTrend - 1) * 0.3) * 100;
  }

  // 計算波動率
  calculateVolatility(data) {
    if (data.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const return_ = (data[i] - data[i - 1]) / Math.abs(data[i - 1] || 1);
      returns.push(return_);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  // 預測
  async predict(symbol, exchange) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('預測器未初始化');
      }
    }

    try {
      console.log(`🔮 預測 ${symbol} 在 ${exchange} 的資金費率...`);
      
      // 生成模擬數據
      const mockData = this.generateMockData(symbol, exchange);
      
      // 提取特徵
      const features = this.extractFeatures(mockData);
      
      if (!features) {
        throw new Error('特徵提取失敗');
      }
      
      // 簡單線性預測
      const prediction = this.linearPredict(features);
      
      // 計算置信度
      const confidence = this.calculateConfidence(mockData, prediction);
      
      const result = {
        symbol,
        exchange,
        currentRate: mockData[mockData.length - 1].fundingRate,
        predictedRate: prediction.toFixed(6),
        confidence: confidence.toFixed(2),
        predictionTime: new Date().toISOString(),
        nextFundingTime: this.getNextFundingTime(exchange),
        modelType: 'Simple Linear Regression',
        features: this.getFeatureImportance(features)
      };
      
      console.log(`✅ 預測完成: ${result.predictedRate}% (置信度: ${result.confidence}%)`);
      
      return result;
      
    } catch (error) {
      console.error('❌ 預測失敗:', error);
      throw error;
    }
  }

  // 線性預測
  linearPredict(features) {
    let prediction = this.modelWeights.bias;
    
    for (let i = 0; i < features.length && i < this.modelWeights.weights.length; i++) {
      prediction += features[i] * this.modelWeights.weights[i];
    }
    
    // 限制預測範圍
    return Math.max(-0.1, Math.min(0.1, prediction));
  }

  // 計算置信度
  calculateConfidence(data, prediction) {
    // 基於數據品質和預測穩定性計算置信度
    const dataQuality = Math.min(100, data.length * 10);
    const predictionStability = Math.max(20, 100 - Math.abs(prediction) * 1000);
    
    return (dataQuality + predictionStability) / 2;
  }

  // 獲取下一個資金費率時間
  getNextFundingTime(exchange) {
    const now = new Date();
    const nextTime = new Date(now);
    
    // 資金費率每8小時結算一次
    const hoursUntilNext = 8 - (now.getHours() % 8);
    nextTime.setHours(now.getHours() + hoursUntilNext, 0, 0, 0);
    
    return nextTime.toISOString();
  }

  // 獲取特徵重要性
  getFeatureImportance(features) {
    const featureNames = [
      '當前費率', '費率變化', '交易量變化', '持倉量變化',
      '時間特徵', '技術指標', '市場情緒', '波動率'
    ];
    
    return features.map((value, index) => ({
      name: featureNames[index] || `特徵${index}`,
      value: value.toFixed(6),
      importance: this.modelWeights.weights[index] || 0.1
    }));
  }

  // 生成模擬數據
  generateMockData(symbol, exchange) {
    const data = [];
    const baseRate = 0.0001; // 0.01%
    const volatility = 0.00005; // 波動率
    
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(Date.now() - (20 - i) * 8 * 60 * 60 * 1000);
      
      // 生成隨機費率
      const randomFactor = (Math.random() - 0.5) * 2;
      const fundingRate = baseRate + randomFactor * volatility;
      
      data.push({
        timestamp: timestamp.toISOString(),
        symbol,
        exchange,
        fundingRate: fundingRate * 100,
        volume: 1000000 + Math.random() * 5000000,
        openInterest: 500000 + Math.random() * 2000000,
        price: 50000 + Math.random() * 50000
      });
    }
    
    return data;
  }

  // 訓練模型（簡化版）
  async trainModel(trainingData = null) {
    console.log('🎯 開始簡化版模型訓練...');
    
    try {
      // 生成訓練數據
      const data = trainingData || this.generateTrainingData();
      
      // 簡單的權重調整（模擬訓練過程）
      console.log('   調整模型權重...');
      await this.simulateTraining(data);
      
      console.log('✅ 簡化版模型訓練完成');
      
      return {
        success: true,
        trainingSamples: data.length,
        modelType: 'Simple Linear Regression'
      };
      
    } catch (error) {
      console.error('❌ 訓練失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 生成訓練數據
  generateTrainingData() {
    const data = [];
    const symbols = ['BTC', 'ETH', 'BNB'];
    const exchanges = ['Binance', 'Bybit', 'OKX'];
    
    for (const symbol of symbols) {
      for (const exchange of exchanges) {
        const historicalData = this.generateMockData(symbol, exchange, 50);
        data.push(...historicalData);
      }
    }
    
    return data;
  }

  // 模擬訓練過程
  async simulateTraining(data) {
    // 模擬訓練時間
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 簡單的權重調整
    this.modelWeights.weights = this.modelWeights.weights.map(w => 
      w + (Math.random() - 0.5) * 0.01
    );
  }

  // 評估模型
  async evaluateModel(testData = null) {
    console.log('📊 評估簡化版模型...');
    
    try {
      const data = testData || this.generateTrainingData().slice(-100);
      
      let totalError = 0;
      let predictions = 0;
      
      for (let i = 10; i < data.length; i++) {
        const features = this.extractFeatures(data.slice(0, i + 1));
        if (features) {
          const prediction = this.linearPredict(features);
          const actual = data[i].fundingRate;
          totalError += Math.abs(prediction - actual);
          predictions++;
        }
      }
      
      const mae = predictions > 0 ? totalError / predictions : 0;
      
      console.log(`✅ 評估完成 - MAE: ${mae.toFixed(6)}`);
      
      return {
        mae,
        predictions,
        modelType: 'Simple Linear Regression'
      };
      
    } catch (error) {
      console.error('❌ 評估失敗:', error);
      return {
        error: error.message
      };
    }
  }
} 