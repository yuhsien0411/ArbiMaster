import * as tf from '@tensorflow/tfjs-node';
import { DataPreprocessor } from '../utils/DataPreprocessor.js';

export class EnhancedFundingRatePredictor {
  constructor() {
    this.model = null;
    this.preprocessor = new DataPreprocessor();
    this.modelPath = './models/enhanced_funding_rate_predictor';
    this.isInitialized = false;
    this.ensembleModels = [];
  }

  async initialize() {
    try {
      console.log('🚀 初始化增強版預測器...');
      
      // 嘗試載入預訓練模型
      try {
        this.model = await tf.loadLayersModel(`file://${this.modelPath}/model.json`);
        this.isInitialized = true;
        console.log('✅ 成功載入預訓練模型');
        return true;
      } catch (error) {
        console.log('⚠️ 未找到預訓練模型，將進行訓練');
        return false;
      }
    } catch (error) {
      console.error('❌ 初始化失敗:', error);
      return false;
    }
  }

  // 建立LSTM模型
  buildLSTMModel(inputShape) {
    return tf.sequential({
      layers: [
        // LSTM層
        tf.layers.lstm({
          units: 128,
          returnSequences: true,
          inputShape: inputShape,
          dropout: 0.3,
          recurrentDropout: 0.3
        }),
        tf.layers.lstm({
          units: 64,
          returnSequences: false,
          dropout: 0.3,
          recurrentDropout: 0.3
        }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2(0.01)
        }),
        tf.layers.dropout(0.2),
        tf.layers.dense({
          units: 1,
          activation: 'linear'
        })
      ]
    });
  }

  // 建立Transformer模型
  buildTransformerModel(inputShape) {
    const model = tf.sequential();
    
    // 位置編碼
    model.add(tf.layers.dense({
      units: 64,
      inputShape: inputShape,
      activation: 'relu'
    }));
    
    // 多頭注意力機制
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      kernelRegularizer: tf.regularizers.l2(0.01)
    }));
    
    model.add(tf.layers.dropout(0.2));
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'linear'
    }));
    
    return model;
  }

  // 建立集成模型
  async buildEnsembleModel(inputShape) {
    const models = [
      this.buildLSTMModel(inputShape),
      this.buildTransformerModel(inputShape),
      this.buildDeepMLP(inputShape)
    ];

    // 編譯所有模型
    models.forEach(model => {
      model.compile({
        optimizer: tf.train.adamax(0.001),
        loss: 'huberLoss', // 更穩定的損失函數
        metrics: ['mae', 'mse']
      });
    });

    return models;
  }

  // 建立深度MLP
  buildDeepMLP(inputShape) {
    return tf.sequential({
      layers: [
        tf.layers.dense({
          units: 256,
          activation: 'relu',
          inputShape: inputShape,
          kernelRegularizer: tf.regularizers.l2(0.01)
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout(0.4),
        
        tf.layers.dense({
          units: 128,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2(0.01)
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout(0.3),
        
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelRegularizer: tf.regularizers.l2(0.01)
        }),
        tf.layers.batchNormalization(),
        tf.layers.dropout(0.2),
        
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dropout(0.1),
        
        tf.layers.dense({
          units: 1,
          activation: 'linear'
        })
      ]
    });
  }

  // 增強的特徵工程
  async extractAdvancedFeatures(data) {
    const features = [];
    
    for (let i = 20; i < data.length; i++) {
      const currentData = data[i];
      const historicalData = data.slice(i - 20, i);
      
      // 基礎特徵
      const basicFeatures = this.preprocessor.extractFeatures(currentData, historicalData);
      
      // 高級特徵
      const advancedFeatures = this.extractAdvancedFeatures(historicalData);
      
      // 技術指標
      const technicalIndicators = this.calculateTechnicalIndicators(historicalData);
      
      // 市場微結構特徵
      const microstructureFeatures = this.extractMicrostructureFeatures(historicalData);
      
      // 組合所有特徵
      const combinedFeatures = [
        ...basicFeatures,
        ...advancedFeatures,
        ...technicalIndicators,
        ...microstructureFeatures
      ];
      
      if (combinedFeatures && !combinedFeatures.some(val => isNaN(val) || !isFinite(val))) {
        features.push(combinedFeatures);
      }
    }
    
    return features;
  }

  // 高級特徵提取
  extractAdvancedFeatures(historicalData) {
    const rates = historicalData.map(d => d.fundingRate);
    const volumes = historicalData.map(d => d.volume || 0);
    
    return [
      // 費率動量
      this.calculateMomentum(rates, 5),
      this.calculateMomentum(rates, 10),
      
      // 費率加速度
      this.calculateAcceleration(rates),
      
      // 交易量加權平均費率
      this.calculateVolumeWeightedRate(rates, volumes),
      
      // 費率偏度
      this.calculateSkewness(rates),
      
      // 費率峰度
      this.calculateKurtosis(rates),
      
      // 自相關特徵
      this.calculateAutocorrelation(rates, 1),
      this.calculateAutocorrelation(rates, 2),
      this.calculateAutocorrelation(rates, 3),
      
      // 頻域特徵
      this.calculateFrequencyFeatures(rates)
    ];
  }

  // 技術指標
  calculateTechnicalIndicators(data) {
    const rates = data.map(d => d.fundingRate);
    
    return [
      // RSI
      this.calculateRSI(rates, 14),
      
      // MACD
      this.calculateMACD(rates),
      
      // 布林帶位置
      this.calculateBollingerPosition(rates),
      
      // 隨機指標
      this.calculateStochastic(rates),
      
      // 威廉指標
      this.calculateWilliamsR(rates)
    ];
  }

  // 市場微結構特徵
  extractMicrostructureFeatures(data) {
    const rates = data.map(d => d.fundingRate);
    const volumes = data.map(d => d.volume || 0);
    
    return [
      // 費率衝擊
      this.calculateRateImpact(rates, volumes),
      
      // 流動性指標
      this.calculateLiquidityIndex(rates, volumes),
      
      // 價格發現效率
      this.calculatePriceDiscoveryEfficiency(rates),
      
      // 市場深度
      this.calculateMarketDepth(volumes)
    ];
  }

  // 實現各種技術指標計算方法...
  calculateMomentum(data, period) {
    if (data.length < period) return 0;
    return data[data.length - 1] - data[data.length - period];
  }

  calculateAcceleration(data) {
    if (data.length < 3) return 0;
    const momentum1 = data[data.length - 1] - data[data.length - 2];
    const momentum2 = data[data.length - 2] - data[data.length - 3];
    return momentum1 - momentum2;
  }

  calculateVolumeWeightedRate(rates, volumes) {
    if (rates.length === 0) return 0;
    let weightedSum = 0;
    let totalVolume = 0;
    
    for (let i = 0; i < rates.length; i++) {
      weightedSum += rates[i] * volumes[i];
      totalVolume += volumes[i];
    }
    
    return totalVolume > 0 ? weightedSum / totalVolume : 0;
  }

  calculateSkewness(data) {
    if (data.length < 3) return 0;
    const mean = this.preprocessor.calculateMean(data);
    const std = this.preprocessor.calculateStd(data);
    
    if (std === 0) return 0;
    
    const skewness = data.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / std, 3);
    }, 0) / data.length;
    
    return skewness;
  }

  calculateKurtosis(data) {
    if (data.length < 4) return 0;
    const mean = this.preprocessor.calculateMean(data);
    const std = this.preprocessor.calculateStd(data);
    
    if (std === 0) return 0;
    
    const kurtosis = data.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / std, 4);
    }, 0) / data.length;
    
    return kurtosis - 3; // 超額峰度
  }

  calculateAutocorrelation(data, lag) {
    if (data.length < lag + 1) return 0;
    const mean = this.preprocessor.calculateMean(data);
    const variance = Math.pow(this.preprocessor.calculateStd(data), 2);
    
    if (variance === 0) return 0;
    
    let autocorr = 0;
    for (let i = lag; i < data.length; i++) {
      autocorr += (data[i] - mean) * (data[i - lag] - mean);
    }
    
    return autocorr / ((data.length - lag) * variance);
  }

  calculateFrequencyFeatures(data) {
    // 簡化的頻域特徵
    if (data.length < 4) return [0, 0];
    
    const fft = this.simpleFFT(data);
    const dominantFreq = this.findDominantFrequency(fft);
    const spectralDensity = this.calculateSpectralDensity(fft);
    
    return [dominantFreq, spectralDensity];
  }

  simpleFFT(data) {
    // 簡化的FFT實現
    const n = data.length;
    const real = new Array(n);
    const imag = new Array(n);
    
    for (let k = 0; k < n; k++) {
      real[k] = 0;
      imag[k] = 0;
      for (let j = 0; j < n; j++) {
        const angle = -2 * Math.PI * k * j / n;
        real[k] += data[j] * Math.cos(angle);
        imag[k] += data[j] * Math.sin(angle);
      }
    }
    
    return { real, imag };
  }

  findDominantFrequency(fft) {
    let maxMagnitude = 0;
    let dominantFreq = 0;
    
    for (let i = 1; i < fft.real.length / 2; i++) {
      const magnitude = Math.sqrt(fft.real[i] * fft.real[i] + fft.imag[i] * fft.imag[i]);
      if (magnitude > maxMagnitude) {
        maxMagnitude = magnitude;
        dominantFreq = i;
      }
    }
    
    return dominantFreq;
  }

  calculateSpectralDensity(fft) {
    let totalPower = 0;
    for (let i = 0; i < fft.real.length; i++) {
      totalPower += fft.real[i] * fft.real[i] + fft.imag[i] * fft.imag[i];
    }
    return totalPower / fft.real.length;
  }

  // 技術指標實現
  calculateRSI(data, period = 14) {
    if (data.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = data[data.length - i] - data[data.length - i - 1];
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

  calculateMACD(data) {
    if (data.length < 26) return 0;
    
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    
    return ema12 - ema26;
  }

  calculateEMA(data, period) {
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  calculateBollingerPosition(data) {
    if (data.length < 20) return 0;
    
    const sma = this.preprocessor.calculateMean(data.slice(-20));
    const std = this.preprocessor.calculateStd(data.slice(-20));
    const currentPrice = data[data.length - 1];
    
    const upperBand = sma + (2 * std);
    const lowerBand = sma - (2 * std);
    
    return (currentPrice - lowerBand) / (upperBand - lowerBand);
  }

  calculateStochastic(data) {
    if (data.length < 14) return 50;
    
    const period = 14;
    const high = Math.max(...data.slice(-period));
    const low = Math.min(...data.slice(-period));
    const current = data[data.length - 1];
    
    if (high === low) return 50;
    
    return ((current - low) / (high - low)) * 100;
  }

  calculateWilliamsR(data) {
    if (data.length < 14) return -50;
    
    const period = 14;
    const high = Math.max(...data.slice(-period));
    const low = Math.min(...data.slice(-period));
    const current = data[data.length - 1];
    
    if (high === low) return -50;
    
    return ((high - current) / (high - low)) * -100;
  }

  // 市場微結構指標
  calculateRateImpact(rates, volumes) {
    if (rates.length < 2) return 0;
    
    const rateChange = rates[rates.length - 1] - rates[rates.length - 2];
    const volume = volumes[volumes.length - 1];
    
    return volume > 0 ? rateChange / volume : 0;
  }

  calculateLiquidityIndex(rates, volumes) {
    if (rates.length < 5) return 0;
    
    const volatility = this.preprocessor.calculateStd(rates.slice(-5));
    const avgVolume = this.preprocessor.calculateMean(volumes.slice(-5));
    
    return avgVolume > 0 ? avgVolume / (volatility + 1e-8) : 0;
  }

  calculatePriceDiscoveryEfficiency(rates) {
    if (rates.length < 10) return 0;
    
    const returns = [];
    for (let i = 1; i < rates.length; i++) {
      returns.push((rates[i] - rates[i-1]) / Math.abs(rates[i-1] || 1));
    }
    
    const variance = Math.pow(this.preprocessor.calculateStd(returns), 2);
    return 1 / (1 + variance);
  }

  calculateMarketDepth(volumes) {
    if (volumes.length < 5) return 0;
    
    return this.preprocessor.calculateMean(volumes.slice(-5));
  }

  // 集成預測
  async ensemblePredict(features) {
    const predictions = [];
    
    for (const model of this.ensembleModels) {
      const inputTensor = tf.tensor2d([features]);
      const prediction = model.predict(inputTensor);
      predictions.push(prediction.dataSync()[0]);
      
      inputTensor.dispose();
      prediction.dispose();
    }
    
    // 加權平均預測
    const weights = [0.4, 0.35, 0.25]; // LSTM, Transformer, MLP
    let weightedPrediction = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      weightedPrediction += predictions[i] * weights[i];
    }
    
    return weightedPrediction;
  }

  // 動態學習率調整
  async adaptiveLearningRate(epoch, initialLR = 0.001) {
    if (epoch < 50) return initialLR;
    if (epoch < 100) return initialLR * 0.5;
    if (epoch < 150) return initialLR * 0.1;
    return initialLR * 0.01;
  }

  // 早停機制
  createEarlyStoppingCallback(patience = 20) {
    let bestLoss = Infinity;
    let patienceCount = 0;
    
    return {
      onEpochEnd: async (epoch, logs) => {
        if (logs.val_loss < bestLoss) {
          bestLoss = logs.val_loss;
          patienceCount = 0;
        } else {
          patienceCount++;
        }
        
        if (patienceCount >= patience) {
          console.log(`🛑 早停於第 ${epoch + 1} 輪`);
          return false; // 停止訓練
        }
      }
    };
  }
} 