import { SimplePredictor } from '../../lib/predictors/SimplePredictor';

// 全局預測器實例
let predictor = null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支援 POST 方法' });
  }

  try {
    const { symbol, exchange } = req.body;

    if (!symbol || !exchange) {
      return res.status(400).json({ 
        error: '缺少必要參數',
        required: ['symbol', 'exchange'],
        received: { symbol, exchange }
      });
    }

    console.log(`🚀 收到預測請求: ${symbol} @ ${exchange}`);

    // 初始化預測器（如果還沒初始化）
    if (!predictor) {
      console.log('🔄 初始化預測器...');
      predictor = new SimplePredictor();
      await predictor.initialize();
    }

    // 執行預測
    const prediction = await predictor.predict(symbol, exchange);

    console.log(`✅ 預測完成: ${prediction.predictedRate}%`);

    res.status(200).json({
      success: true,
      data: prediction,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 預測API錯誤:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 