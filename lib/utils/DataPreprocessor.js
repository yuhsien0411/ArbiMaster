import * as tf from '@tensorflow/tfjs-node';

export class DataPreprocessor {
  constructor() {
    this.scalers = new Map();
    this.featureNames = [
      'currentRate', 'rateChange', 'volumeChange', 'openInterestChange',
      'rateMA5', 'rateMA20', 'rateVolatility', 'hourOfDay', 'dayOfWeek',
      'isWeekend', 'fearGreedIndex', 'marketSentiment'
    ];
  }

  // 數據標準化
  normalize(data, featureName = null) {
    if (Array.isArray(data)) {
      const mean = this.calculateMean(data);
      const std = this.calculateStd(data);
      
      if (featureName) {
        this.scalers.set(featureName, { mean, std });
      }
      
      return data.map(value => (value - mean) / std);
    }
    return data;
  }

  // 反標準化
  denormalize(normalizedData, featureName) {
    const scaler = this.scalers.get(featureName);
    if (!scaler) return normalizedData;
    
    return normalizedData.map(value => value * scaler.std + scaler.mean);
  }

  // 準備訓練數據
  async prepareData(rawData) {
    console.log('開始準備訓練數據...');
    
    const features = [];
    const labels = [];
    
    // 按時間排序
    const sortedData = rawData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // 建立時間序列數據
    for (let i = 20; i < sortedData.length; i++) {
      const currentData = sortedData[i];
      const historicalData = sortedData.slice(i - 20, i);
      
      // 提取特徵
      const featureVector = this.extractFeatures(currentData, historicalData);
      
      if (featureVector && !featureVector.some(val => isNaN(val) || !isFinite(val))) {
        features.push(featureVector);
        labels.push(currentData.fundingRate);
      }
    }
    
    console.log(`準備完成: ${features.length} 個樣本`);
    
    // 轉換為TensorFlow張量
    const featuresTensor = tf.tensor2d(features);
    const labelsTensor = tf.tensor2d(labels, [labels.length, 1]);
    
    return { features: featuresTensor, labels: labelsTensor };
  }

  // 提取特徵
  extractFeatures(currentData, historicalData) {
    try {
      const rates = historicalData.map(d => d.fundingRate);
      const volumes = historicalData.map(d => d.volume || 0);
      const openInterests = historicalData.map(d => d.openInterest || 0);
      
      const currentTime = new Date(currentData.timestamp);
      
      const features = [
        // 當前費率
        currentData.fundingRate || 0,
        
        // 費率變化
        this.calculateRateChange(rates),
        
        // 交易量變化
        this.calculateVolumeChange(volumes),
        
        // 持倉量變化
        this.calculateOIChange(openInterests),
        
        // 移動平均
        this.calculateMovingAverage(rates, 5),
        this.calculateMovingAverage(rates, 20),
        
        // 波動率
        this.calculateVolatility(rates),
        
        // 時間特徵
        currentTime.getHours() / 24,
        currentTime.getDay() / 7,
        [0, 6].includes(currentTime.getDay()) ? 1 : 0,
        
        // 市場情緒（簡化版本）
        this.calculateMarketSentiment(rates, volumes),
        
        // 恐懼貪婪指數（模擬）
        this.getFearGreedIndex(rates, volumes)
      ];
      
      return features;
    } catch (error) {
      console.error('特徵提取錯誤:', error);
      return null;
    }
  }

  // 計算費率變化
  calculateRateChange(rates) {
    if (rates.length < 2) return 0;
    return (rates[rates.length - 1] - rates[rates.length - 2]) / Math.abs(rates[rates.length - 2] || 1);
  }

  // 計算交易量變化
  calculateVolumeChange(volumes) {
    if (volumes.length < 2) return 0;
    const recentVolumes = volumes.slice(-5);
    const olderVolumes = volumes.slice(-10, -5);
    
    const recentAvg = this.calculateMean(recentVolumes);
    const olderAvg = this.calculateMean(olderVolumes);
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  // 計算持倉量變化
  calculateOIChange(openInterests) {
    if (openInterests.length < 2) return 0;
    const recentOI = openInterests.slice(-5);
    const olderOI = openInterests.slice(-10, -5);
    
    const recentAvg = this.calculateMean(recentOI);
    const olderAvg = this.calculateMean(olderOI);
    
    return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
  }

  // 計算移動平均
  calculateMovingAverage(data, period) {
    if (data.length < period) return data.length > 0 ? data[data.length - 1] : 0;
    const recentData = data.slice(-period);
    return this.calculateMean(recentData);
  }

  // 計算波動率
  calculateVolatility(data) {
    if (data.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      const return_ = (data[i] - data[i - 1]) / Math.abs(data[i - 1] || 1);
      returns.push(return_);
    }
    return this.calculateStd(returns);
  }

  // 計算市場情緒
  calculateMarketSentiment(rates, volumes) {
    if (rates.length < 5) return 0;
    
    // 基於費率趨勢和交易量計算情緒
    const recentRates = rates.slice(-5);
    const recentVolumes = volumes.slice(-5);
    
    const rateTrend = recentRates[recentRates.length - 1] - recentRates[0];
    const volumeTrend = this.calculateMean(recentVolumes) / (this.calculateMean(volumes) || 1);
    
    return (rateTrend * 0.7 + (volumeTrend - 1) * 0.3);
  }

  // 模擬恐懼貪婪指數
  getFearGreedIndex(rates, volumes) {
    if (rates.length < 10) return 50; // 中性
    
    const volatility = this.calculateVolatility(rates);
    const volumeRatio = this.calculateMean(volumes.slice(-5)) / (this.calculateMean(volumes) || 1);
    
    // 高波動率 = 恐懼，高交易量 = 貪婪
    let index = 50;
    index += (1 - Math.min(volatility * 100, 1)) * 25; // 波動率影響
    index += Math.min(volumeRatio - 1, 1) * 25; // 交易量影響
    
    return Math.max(0, Math.min(100, index));
  }

  // 計算平均值
  calculateMean(data) {
    if (data.length === 0) return 0;
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  // 計算標準差
  calculateStd(data) {
    if (data.length < 2) return 0;
    const mean = this.calculateMean(data);
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
  }

  // 數據品質檢查
  validateData(data) {
    const issues = [];
    
    if (!Array.isArray(data) || data.length === 0) {
      issues.push('數據為空或格式錯誤');
      return issues;
    }
    
    // 檢查缺失值
    const missingValues = data.filter(item => 
      !item.fundingRate || !item.timestamp || isNaN(item.fundingRate)
    );
    
    if (missingValues.length > 0) {
      issues.push(`發現 ${missingValues.length} 個缺失值`);
    }
    
    // 檢查異常值
    const rates = data.map(item => item.fundingRate).filter(rate => !isNaN(rate));
    if (rates.length > 0) {
      const mean = this.calculateMean(rates);
      const std = this.calculateStd(rates);
      const outliers = rates.filter(rate => Math.abs(rate - mean) > 3 * std);
      
      if (outliers.length > 0) {
        issues.push(`發現 ${outliers.length} 個異常值`);
      }
    }
    
    return issues;
  }
} 