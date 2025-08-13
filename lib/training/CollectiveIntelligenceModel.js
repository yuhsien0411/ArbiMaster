import fs from 'fs';
import path from 'path';

export class CollectiveIntelligenceModel {
  constructor() {
    this.baseModelPath = './models/collective_base_model.json';
    this.userPreferencesPath = './data/user_preferences.json';
    this.collectiveStatsPath = './data/collective_stats.json';
    
    // 集體基礎模型（所有人共享）
    this.baseWeights = {
      technicalIndicators: 0.3,
      volumeAnalysis: 0.2,
      sentimentAnalysis: 0.25,
      historicalPatterns: 0.25
    };
    
    // 用戶個人偏好（每個用戶獨有）
    this.userPreferences = new Map();
    
    // 集體統計
    this.collectiveStats = {
      totalContributors: 0,
      totalTrainingSessions: 0,
      averageAccuracy: 0,
      topContributors: [],
      lastUpdated: null
    };
    
    // 學習參數
    this.learningRate = 0.005; // 較小的學習率，避免劇烈變化
    this.contributionThreshold = 0.6; // 貢獻閾值
    this.stabilityFactor = 0.8; // 穩定性因子
    
    this.loadModels();
  }

  // 載入所有模型
  loadModels() {
    this.loadBaseModel();
    this.loadUserPreferences();
    this.loadCollectiveStats();
  }

  // 載入基礎模型
  loadBaseModel() {
    try {
      if (fs.existsSync(this.baseModelPath)) {
        const modelData = JSON.parse(fs.readFileSync(this.baseModelPath, 'utf8'));
        this.baseWeights = modelData.weights;
        console.log('✅ 載入集體基礎模型成功');
      } else {
        console.log('⚠️ 未找到基礎模型，使用預設參數');
      }
    } catch (error) {
      console.error('❌ 載入基礎模型失敗:', error);
    }
  }

  // 載入用戶偏好
  loadUserPreferences() {
    try {
      if (fs.existsSync(this.userPreferencesPath)) {
        const preferencesData = JSON.parse(fs.readFileSync(this.userPreferencesPath, 'utf8'));
        this.userPreferences = new Map(Object.entries(preferencesData));
        console.log('✅ 載入用戶偏好成功');
      }
    } catch (error) {
      console.error('❌ 載入用戶偏好失敗:', error);
    }
  }

  // 載入集體統計
  loadCollectiveStats() {
    try {
      if (fs.existsSync(this.collectiveStatsPath)) {
        const statsData = JSON.parse(fs.readFileSync(this.collectiveStatsPath, 'utf8'));
        this.collectiveStats = statsData;
        console.log('✅ 載入集體統計成功');
      }
    } catch (error) {
      console.error('❌ 載入集體統計失敗:', error);
    }
  }

  // 保存基礎模型
  saveBaseModel() {
    try {
      const dir = path.dirname(this.baseModelPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const modelData = {
        weights: this.baseWeights,
        lastUpdated: new Date().toISOString(),
        version: this.collectiveStats.totalTrainingSessions
      };
      
      fs.writeFileSync(this.baseModelPath, JSON.stringify(modelData, null, 2));
    } catch (error) {
      console.error('❌ 保存基礎模型失敗:', error);
    }
  }

  // 保存用戶偏好
  saveUserPreferences() {
    try {
      const dir = path.dirname(this.userPreferencesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const preferencesData = Object.fromEntries(this.userPreferences);
      fs.writeFileSync(this.userPreferencesPath, JSON.stringify(preferencesData, null, 2));
    } catch (error) {
      console.error('❌ 保存用戶偏好失敗:', error);
    }
  }

  // 保存集體統計
  saveCollectiveStats() {
    try {
      const dir = path.dirname(this.collectiveStatsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.collectiveStatsPath, JSON.stringify(this.collectiveStats, null, 2));
    } catch (error) {
      console.error('❌ 保存集體統計失敗:', error);
    }
  }

  // 獲取用戶ID（基於IP或會話）
  getUserId(req) {
    // 簡單的用戶識別（實際應用中應該用更安全的方式）
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}_${userAgent.substring(0, 20)}`;
  }

  // 預測（結合基礎模型和個人偏好）
  predict(inputData, userId = null) {
    const {
      technicalScore,
      volumeScore,
      sentimentScore,
      historicalScore
    } = inputData;

    // 獲取用戶偏好
    const userPrefs = userId ? this.userPreferences.get(userId) : null;
    
    // 計算最終權重（基礎模型 + 個人偏好）
    const finalWeights = this.calculateFinalWeights(userPrefs);
    
    // 加權計算預測結果
    const weightedScore = 
      technicalScore * finalWeights.technicalIndicators +
      volumeScore * finalWeights.volumeAnalysis +
      sentimentScore * finalWeights.sentimentAnalysis +
      historicalScore * finalWeights.historicalPatterns;

    // 計算置信度
    const confidence = Math.max(0.3, Math.min(0.95, Math.abs(weightedScore)));

    return {
      prediction: weightedScore > 0 ? 'bullish' : 'bearish',
      confidence: confidence,
      weightedScore: weightedScore,
      baseWeights: { ...this.baseWeights },
      userWeights: userPrefs ? { ...userPrefs } : null,
      finalWeights: finalWeights,
      modelType: 'Collective Intelligence'
    };
  }

  // 計算最終權重
  calculateFinalWeights(userPrefs) {
    if (!userPrefs) {
      return { ...this.baseWeights };
    }

    // 結合基礎模型和個人偏好
    const finalWeights = {};
    Object.keys(this.baseWeights).forEach(key => {
      const baseWeight = this.baseWeights[key];
      const userWeight = userPrefs[key] || baseWeight;
      
      // 個人偏好佔30%，基礎模型佔70%
      finalWeights[key] = baseWeight * 0.7 + userWeight * 0.3;
    });

    // 正規化
    const totalWeight = Object.values(finalWeights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(finalWeights).forEach(key => {
      finalWeights[key] = finalWeights[key] / totalWeight;
    });

    return finalWeights;
  }

  // 訓練模型（集體智慧）
  train(userFeedback, req) {
    console.log('🧠 集體智慧訓練開始...');
    
    const userId = this.getUserId(req);
    const {
      symbol,
      exchange,
      predictedDirection,
      actualDirection,
      userRating,
      features
    } = userFeedback;

    // 計算預測質量
    const predictionQuality = this.calculatePredictionQuality(
      predictedDirection, 
      actualDirection, 
      userRating
    );

    // 更新集體統計
    this.updateCollectiveStats(userId, predictionQuality);

    // 只有高質量的反饋才會影響基礎模型
    if (predictionQuality > this.contributionThreshold) {
      this.updateBaseModel(features, predictionQuality);
      console.log('✅ 高質量反饋已貢獻到基礎模型');
    }

    // 更新用戶個人偏好
    this.updateUserPreferences(userId, features, predictionQuality);

    // 保存所有數據
    this.saveBaseModel();
    this.saveUserPreferences();
    this.saveCollectiveStats();

    console.log('✅ 集體智慧訓練完成');
    
    return {
      success: true,
      contributionQuality: predictionQuality,
      isBaseModelUpdated: predictionQuality > this.contributionThreshold,
      collectiveStats: this.getCollectiveStats(),
      userStats: this.getUserStats(userId)
    };
  }

  // 計算預測質量
  calculatePredictionQuality(predictedDirection, actualDirection, userRating) {
    // 方向是否正確
    const directionCorrect = predictedDirection === actualDirection;
    
    // 用戶評分轉換為質量（5分=1.0，1分=0.0）
    const ratingQuality = (userRating - 1) / 4;
    
    // 綜合質量
    const quality = directionCorrect ? ratingQuality : ratingQuality * 0.5;
    
    return Math.min(1, Math.max(0, quality));
  }

  // 更新基礎模型
  updateBaseModel(features, quality) {
    const adjustment = this.learningRate * quality * this.stabilityFactor;
    
    // 根據特徵強度調整對應權重
    if (features.technicalStrength > 0.5) {
      this.baseWeights.technicalIndicators += adjustment;
    }
    if (features.volumeStrength > 0.5) {
      this.baseWeights.volumeAnalysis += adjustment;
    }
    if (features.sentimentStrength > 0.5) {
      this.baseWeights.sentimentAnalysis += adjustment;
    }
    if (features.historicalStrength > 0.5) {
      this.baseWeights.historicalPatterns += adjustment;
    }

    // 正規化權重
    this.normalizeWeights(this.baseWeights);
  }

  // 更新用戶偏好
  updateUserPreferences(userId, features, quality) {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, { ...this.baseWeights });
    }

    const userPrefs = this.userPreferences.get(userId);
    const adjustment = this.learningRate * quality * 2; // 個人偏好學習更快

    // 調整用戶偏好
    if (features.technicalStrength > 0.5) {
      userPrefs.technicalIndicators += adjustment;
    }
    if (features.volumeStrength > 0.5) {
      userPrefs.volumeAnalysis += adjustment;
    }
    if (features.sentimentStrength > 0.5) {
      userPrefs.sentimentAnalysis += adjustment;
    }
    if (features.historicalStrength > 0.5) {
      userPrefs.historicalPatterns += adjustment;
    }

    // 正規化用戶偏好
    this.normalizeWeights(userPrefs);
    this.userPreferences.set(userId, userPrefs);
  }

  // 正規化權重
  normalizeWeights(weights) {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(weights).forEach(key => {
      weights[key] = weights[key] / totalWeight;
    });
  }

  // 更新集體統計
  updateCollectiveStats(userId, quality) {
    this.collectiveStats.totalTrainingSessions++;
    
    // 更新貢獻者統計
    if (!this.collectiveStats.topContributors.find(c => c.userId === userId)) {
      this.collectiveStats.totalContributors++;
      this.collectiveStats.topContributors.push({
        userId,
        contributions: 0,
        averageQuality: 0
      });
    }

    // 更新用戶貢獻統計
    const contributor = this.collectiveStats.topContributors.find(c => c.userId === userId);
    if (contributor) {
      contributor.contributions++;
      contributor.averageQuality = (contributor.averageQuality * (contributor.contributions - 1) + quality) / contributor.contributions;
    }

    // 更新平均準確率
    this.collectiveStats.averageAccuracy = 
      (this.collectiveStats.averageAccuracy * (this.collectiveStats.totalTrainingSessions - 1) + quality) / this.collectiveStats.totalTrainingSessions;

    // 排序貢獻者
    this.collectiveStats.topContributors.sort((a, b) => b.averageQuality - a.averageQuality);
    
    // 只保留前10名
    this.collectiveStats.topContributors = this.collectiveStats.topContributors.slice(0, 10);
    
    this.collectiveStats.lastUpdated = new Date().toISOString();
  }

  // 獲取集體統計
  getCollectiveStats() {
    return {
      ...this.collectiveStats,
      baseWeights: { ...this.baseWeights },
      modelVersion: this.collectiveStats.totalTrainingSessions
    };
  }

  // 獲取用戶統計
  getUserStats(userId) {
    const contributor = this.collectiveStats.topContributors.find(c => c.userId === userId);
    const userPrefs = this.userPreferences.get(userId);
    
    return {
      userId,
      contributions: contributor ? contributor.contributions : 0,
      averageQuality: contributor ? contributor.averageQuality : 0,
      hasPreferences: !!userPrefs,
      preferences: userPrefs ? { ...userPrefs } : null
    };
  }

  // 獲取模型信息
  getModelInfo() {
    return {
      type: 'Collective Intelligence Model',
      version: this.collectiveStats.totalTrainingSessions,
      contributors: this.collectiveStats.totalContributors,
      totalSessions: this.collectiveStats.totalTrainingSessions,
      averageAccuracy: this.collectiveStats.averageAccuracy,
      baseWeights: { ...this.baseWeights },
      lastUpdated: this.collectiveStats.lastUpdated
    };
  }

  // 重置基礎模型
  resetBaseModel() {
    this.baseWeights = {
      technicalIndicators: 0.3,
      volumeAnalysis: 0.2,
      sentimentAnalysis: 0.25,
      historicalPatterns: 0.25
    };
    this.saveBaseModel();
    console.log('🔄 基礎模型已重置');
  }

  // 清除用戶偏好
  clearUserPreferences(userId) {
    this.userPreferences.delete(userId);
    this.saveUserPreferences();
    console.log('�� 用戶偏好已清除');
  }
} 