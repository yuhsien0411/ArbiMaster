import { UserTrainableModel } from '../../lib/training/UserTrainableModel.js';

// 全局模型實例
const userModel = new UserTrainableModel();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支援POST請求' });
  }

  const { action } = req.body;

  try {
    console.log(`🎓 用戶訓練請求: ${action}`);

    switch (action) {
      case 'train':
        return await handleTraining(req, res);
      
      case 'get_stats':
        return await handleGetStats(req, res);
      
      case 'get_progress':
        return await handleGetProgress(req, res);
      
      case 'reset':
        return await handleReset(req, res);
      
      case 'export':
        return await handleExport(req, res);
      
      case 'import':
        return await handleImport(req, res);
      
      default:
        return res.status(400).json({ error: '無效的操作' });
    }

  } catch (error) {
    console.error('❌ 用戶訓練API錯誤:', error);
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

    // 執行訓練
    const result = userModel.train({
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
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: '模型訓練成功',
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

// 獲取訓練統計
async function handleGetStats(req, res) {
  try {
    const stats = userModel.getTrainingStats();
    
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

// 獲取學習進度
async function handleGetProgress(req, res) {
  try {
    const progress = userModel.getLearningProgress();
    
    return res.status(200).json({
      success: true,
      data: progress,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('獲取進度失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 重置模型
async function handleReset(req, res) {
  try {
    userModel.resetModel();
    
    return res.status(200).json({
      success: true,
      message: '模型已重置',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('重置失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 導出模型
async function handleExport(req, res) {
  try {
    const modelData = userModel.exportModel();
    
    return res.status(200).json({
      success: true,
      data: modelData,
      message: '模型導出成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('導出失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 導入模型
async function handleImport(req, res) {
  try {
    const { modelData } = req.body;
    
    if (!modelData) {
      return res.status(400).json({
        error: '缺少模型數據'
      });
    }

    const success = userModel.importModel(modelData);
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: '模型導入成功',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: '模型導入失敗',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('導入失敗:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 