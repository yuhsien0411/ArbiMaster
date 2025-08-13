import fs from 'fs';
import path from 'path';

export class UserTrainableModel {
  constructor() {
    this.modelPath = './models/user_trained_model.json';
    this.trainingDataPath = './data/training_data.json';
    this.userFeedbackPath = './data/user_feedback.json';
    
    // 模型參數（可以學習調整的權重）
    this.weights = {
      technicalIndicators: 0.3,    // 技術指標權重
      volumeAnalysis: 0.2,         // 交易量分析權重
      sentimentAnalysis: 0.25,     // 情緒分析權重
      historicalPatterns: 0.25     // 歷史模式權重
    };
    
    // 學習參數
    this.learningRate = 0.01;      // 學習速度
    this.minConfidence = 0.3;      // 最小置信度
    this.maxConfidence = 0.95;     // 最大置信度
    
    // 訓練統計
    this.trainingStats = {
      totalTrainingSessions: 0,
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      lastTrainingDate: null,
      improvementRate: 0
    };
    
    this.loadModel();
  }

  // 載入已訓練的模型
  loadModel() {
    try {
      if (fs.existsSync(this.modelPath)) {
        const modelData = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
        this.weights = modelData.weights;
        this.trainingStats = modelData.trainingStats;
        console.log('✅ 載入已訓練模型成功');
      } else {
        console.log('⚠️ 未找到已訓練模型，使用預設參數');
      }
    } catch (error) {
      console.error('❌ 載入模型失敗:', error);
    }
  }

  // 保存模型
  saveModel() {
    try {
      // 確保目錄存在
      const dir = path.dirname(this.modelPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const modelData = {
        weights: this.weights,
        trainingStats: this.trainingStats,
        lastSaved: new Date().toISOString()
      };
      
      fs.writeFileSync(this.modelPath, JSON.stringify(modelData, null, 2));
      console.log('✅ 模型保存成功');
    } catch (error) {
      console.error('❌ 保存模型失敗:', error);
    }
  }

  // 預測函數（使用當前權重）
  predict(inputData) {
    const {
      technicalScore,
      volumeScore,
      sentimentScore,
      historicalScore
    } = inputData;

    // 加權計算預測結果
    const weightedScore = 
      technicalScore * this.weights.technicalIndicators +
      volumeScore * this.weights.volumeAnalysis +
      sentimentScore * this.weights.sentimentAnalysis +
      historicalScore * this.weights.historicalPatterns;

    // 計算置信度
    const confidence = Math.max(
      this.minConfidence,
      Math.min(this.maxConfidence, Math.abs(weightedScore))
    );

    return {
      prediction: weightedScore > 0 ? 'bullish' : 'bearish',
      confidence: confidence,
      weightedScore: weightedScore,
      weights: { ...this.weights }
    };
  }

  // 訓練模型（基於用戶反饋）
  train(userFeedback) {
    console.log('🎓 開始訓練模型...');
    
    const {
      symbol,
      exchange,
      predictedDirection,
      actualDirection,
      userRating, // 1-5分，用戶對預測的評分
      features
    } = userFeedback;

    // 計算預測誤差
    const predictionError = this.calculatePredictionError(
      predictedDirection, 
      actualDirection, 
      userRating
    );

    // 調整權重（簡單的梯度下降）
    this.adjustWeights(features, predictionError);

    // 更新訓練統計
    this.updateTrainingStats(predictionError, userRating);

    // 保存模型
    this.saveModel();

    // 保存用戶反饋
    this.saveUserFeedback(userFeedback);

    console.log('✅ 模型訓練完成');
    
    return {
      success: true,
      newAccuracy: this.trainingStats.accuracy,
      improvement: this.trainingStats.improvementRate,
      message: '模型已根據您的反饋進行學習'
    };
  }

  // 計算預測誤差
  calculatePredictionError(predictedDirection, actualDirection, userRating) {
    // 方向是否正確
    const directionCorrect = predictedDirection === actualDirection;
    
    // 用戶評分轉換為誤差（5分=0誤差，1分=1誤差）
    const ratingError = (5 - userRating) / 4;
    
    // 綜合誤差
    const error = directionCorrect ? ratingError : (1 + ratingError);
    
    return Math.min(1, Math.max(0, error));
  }

  // 調整權重
  adjustWeights(features, error) {
    const adjustment = this.learningRate * error;
    
    // 根據特徵強度調整對應權重
    if (features.technicalStrength > 0.5) {
      this.weights.technicalIndicators += adjustment;
    }
    if (features.volumeStrength > 0.5) {
      this.weights.volumeAnalysis += adjustment;
    }
    if (features.sentimentStrength > 0.5) {
      this.weights.sentimentAnalysis += adjustment;
    }
    if (features.historicalStrength > 0.5) {
      this.weights.historicalPatterns += adjustment;
    }

    // 確保權重總和為1
    this.normalizeWeights();
  }

  // 正規化權重
  normalizeWeights() {
    const totalWeight = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);
    
    Object.keys(this.weights).forEach(key => {
      this.weights[key] = this.weights[key] / totalWeight;
    });
  }

  // 更新訓練統計
  updateTrainingStats(error, userRating) {
    this.trainingStats.totalTrainingSessions++;
    this.trainingStats.totalPredictions++;
    
    // 如果用戶評分>=4分，認為預測正確
    if (userRating >= 4) {
      this.trainingStats.correctPredictions++;
    }
    
    this.trainingStats.accuracy = 
      (this.trainingStats.correctPredictions / this.trainingStats.totalPredictions) * 100;
    
    this.trainingStats.lastTrainingDate = new Date().toISOString();
    
    // 計算改進率
    this.calculateImprovementRate();
  }

  // 計算改進率
  calculateImprovementRate() {
    // 這裡可以實現更複雜的改進率計算
    // 目前簡單地基於準確率變化
    this.trainingStats.improvementRate = this.trainingStats.accuracy;
  }

  // 保存用戶反饋
  saveUserFeedback(feedback) {
    try {
      const feedbackData = {
        ...feedback,
        timestamp: new Date().toISOString(),
        modelVersion: this.trainingStats.totalTrainingSessions
      };

      let allFeedback = [];
      if (fs.existsSync(this.userFeedbackPath)) {
        allFeedback = JSON.parse(fs.readFileSync(this.userFeedbackPath, 'utf8'));
      }

      allFeedback.push(feedbackData);

      // 只保留最近1000條反饋
      if (allFeedback.length > 1000) {
        allFeedback = allFeedback.slice(-1000);
      }

      // 確保目錄存在
      const dir = path.dirname(this.userFeedbackPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.userFeedbackPath, JSON.stringify(allFeedback, null, 2));
    } catch (error) {
      console.error('保存用戶反饋失敗:', error);
    }
  }

  // 獲取訓練統計
  getTrainingStats() {
    return {
      ...this.trainingStats,
      currentWeights: { ...this.weights },
      learningRate: this.learningRate
    };
  }

  // 獲取學習進度
  getLearningProgress() {
    const progress = {
      totalSessions: this.trainingStats.totalTrainingSessions,
      accuracy: this.trainingStats.accuracy,
      improvement: this.trainingStats.improvementRate,
      lastTraining: this.trainingStats.lastTrainingDate,
      weightDistribution: this.weights,
      learningStage: this.getLearningStage()
    };

    return progress;
  }

  // 判斷學習階段
  getLearningStage() {
    const sessions = this.trainingStats.totalTrainingSessions;
    const accuracy = this.trainingStats.accuracy;

    if (sessions < 10) return '初學者';
    if (sessions < 50) return '學習中';
    if (sessions < 100) return '進階學習';
    if (accuracy > 80) return '專家級';
    return '持續改進';
  }

  // 重置模型
  resetModel() {
    this.weights = {
      technicalIndicators: 0.3,
      volumeAnalysis: 0.2,
      sentimentAnalysis: 0.25,
      historicalPatterns: 0.25
    };
    
    this.trainingStats = {
      totalTrainingSessions: 0,
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      lastTrainingDate: null,
      improvementRate: 0
    };

    this.saveModel();
    console.log('🔄 模型已重置');
  }

  // 導出模型
  exportModel() {
    return {
      weights: this.weights,
      trainingStats: this.trainingStats,
      exportDate: new Date().toISOString()
    };
  }

  // 導入模型
  importModel(modelData) {
    try {
      this.weights = modelData.weights;
      this.trainingStats = modelData.trainingStats;
      this.saveModel();
      console.log('✅ 模型導入成功');
      return true;
    } catch (error) {
      console.error('❌ 模型導入失敗:', error);
      return false;
    }
  }
} 