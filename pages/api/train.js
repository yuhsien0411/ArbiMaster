import { SimplePredictor } from '../../lib/predictors/SimplePredictor';

// 全局預測器實例
let predictor = null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支援 POST 方法' });
  }

  try {
    const { action, trainingData } = req.body;

    console.log(`🚀 收到訓練請求: ${action}`);

    // 初始化預測器（如果還沒初始化）
    if (!predictor) {
      console.log('🔄 初始化預測器...');
      predictor = new SimplePredictor();
      await predictor.initialize();
    }

    let result;

    switch (action) {
      case 'train':
        console.log('🎯 開始模型訓練...');
        result = await predictor.trainModel(trainingData);
        break;

      case 'evaluate':
        console.log('📊 開始模型評估...');
        result = await predictor.evaluateModel(trainingData);
        break;

      case 'train_and_evaluate':
        console.log('🎯 開始訓練並評估...');
        const trainResult = await predictor.trainModel(trainingData);
        const evalResult = await predictor.evaluateModel(trainingData);
        result = {
          training: trainResult,
          evaluation: evalResult
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: '無效的操作',
          validActions: ['train', 'evaluate', 'train_and_evaluate']
        });
    }

    console.log(`✅ ${action} 完成`);

    res.status(200).json({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 訓練API錯誤:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 