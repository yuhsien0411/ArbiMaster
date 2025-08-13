import { CollectiveIntelligenceModel } from '../../lib/training/CollectiveIntelligenceModel.js';

// 全局集體智慧模型實例
const collectiveModel = new CollectiveIntelligenceModel();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支援POST請求' });
  }

  const { action } = req.body;

  try {
    console.log(`🧠 集體智慧訓練請求: ${action}`);

    switch (action) {
      case 'train':
        return await handleTraining(req, res);
      
      case 'predict':
        return await handlePrediction(req, res);
      
      case 'get_stats':
        return await handleGetStats(req, res);
      
      case 'get_user_stats':
        return await handleGetUserStats(req, res);
      
      case 'get_model_info':
        return await handleGetModelInfo(req, res);
      
      default:
        return res.status(400).json({ error: '無效的操作' });
    }

  } catch (error) {
    console.error('❌ 集體智慧訓練API錯誤:', error);
    return res.status(500).json({
      error: '訓練服務暫時不可用',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 處理訓練請求
async function handleTraining(req, res) {
  try {
    const {
      symbol,
      exchange,
      predictedDirection,
      actualDirection,
      userRating,
      features
    } = req.body;

    // 驗證輸入
    if (!symbol || !exchange || !predictedDirection || !actualDirection || !userRating) {
      return res.status(400).json({
        error: '缺少必要參數',
        required: ['symbol', 'exchange', 'predictedDirection', 'actualDirection', 'userRating']
      });
    }

    if (userRating < 1 || userRating > 5) {
      return res.status(400).json({
        error: '用戶評分必須在1-5之間'
      });
    }

    // 執行集體智慧訓練
    const result = collectiveModel.train({
      symbol,
      exchange,
      predictedDirection,
      actualDirection,
      userRating,
      features: features || {
        technicalStrength: 0.5,
        volumeStrength: 0.5,
        sentimentStrength: 0.5,
        historicalStrength: 0.5
      }
    }, req);

    return res.status(200).json({
      success: true,
      data: result,
      message: '集體智慧訓練成功',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('訓練失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 處理預測請求
async function handlePrediction(req, res) {
  try {
    const { inputData } = req.body;
    const userId = collectiveModel.getUserId(req);
    
    if (!inputData) {
      return res.status(400).json({
        error: '缺少預測數據'
      });
    }

    const prediction = collectiveModel.predict(inputData, userId);
    
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

// 獲取集體統計
async function handleGetStats(req, res) {
  try {
    const stats = collectiveModel.getCollectiveStats();
    
    return res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('獲取統計失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 獲取用戶統計
async function handleGetUserStats(req, res) {
  try {
    const userId = collectiveModel.getUserId(req);
    const userStats = collectiveModel.getUserStats(userId);
    
    return res.status(200).json({
      success: true,
      data: userStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('獲取用戶統計失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 獲取模型信息
async function handleGetModelInfo(req, res) {
  try {
    const modelInfo = collectiveModel.getModelInfo();
    
    return res.status(200).json({
      success: true,
      data: modelInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('獲取模型信息失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 