const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testUserTraining() {
  console.log('🎓 測試用戶AI模型訓練系統...\n');

  // 測試獲取統計
  console.log('📊 測試獲取訓練統計...');
  try {
    const statsRes = await axios.post(`${BASE_URL}/api/user-training`, {
      action: 'get_stats'
    });
    
    if (statsRes.data.success) {
      console.log('✅ 獲取統計成功');
      console.log(`   總預測次數: ${statsRes.data.data.totalPredictions}`);
      console.log(`   準確率: ${statsRes.data.data.accuracy.toFixed(1)}%`);
    }
  } catch (error) {
    console.log('❌ 獲取統計失敗:', error.response?.data?.error || error.message);
  }

  // 測試獲取學習進度
  console.log('\n📈 測試獲取學習進度...');
  try {
    const progressRes = await axios.post(`${BASE_URL}/api/user-training`, {
      action: 'get_progress'
    });
    
    if (progressRes.data.success) {
      console.log('✅ 獲取進度成功');
      console.log(`   學習階段: ${progressRes.data.data.learningStage}`);
      console.log(`   訓練次數: ${progressRes.data.data.totalSessions}`);
    }
  } catch (error) {
    console.log('❌ 獲取進度失敗:', error.response?.data?.error || error.message);
  }

  // 測試訓練模型
  console.log('\n🎯 測試訓練模型...');
  try {
    const trainRes = await axios.post(`${BASE_URL}/api/user-training`, {
      action: 'train',
      symbol: 'BTC',
      exchange: 'Binance',
      predictedDirection: 'bullish',
      actualDirection: 'bullish',
      userRating: 4,
      features: {
        technicalStrength: 0.6,
        volumeStrength: 0.4,
        sentimentStrength: 0.5,
        historicalStrength: 0.5
      }
    });
    
    if (trainRes.data.success) {
      console.log('✅ 訓練成功');
      console.log(`   新準確率: ${trainRes.data.data.newAccuracy.toFixed(1)}%`);
      console.log(`   改進率: ${trainRes.data.data.improvement.toFixed(1)}%`);
    }
  } catch (error) {
    console.log('❌ 訓練失敗:', error.response?.data?.error || error.message);
  }

  // 測試多次訓練
  console.log('\n🔄 測試多次訓練...');
  const trainingData = [
    { symbol: 'ETH', exchange: 'Bybit', predicted: 'bearish', actual: 'bearish', rating: 5 },
    { symbol: 'BTC', exchange: 'Binance', predicted: 'bullish', actual: 'bearish', rating: 2 },
    { symbol: 'SOL', exchange: 'OKX', predicted: 'bullish', actual: 'bullish', rating: 4 },
    { symbol: 'XRP', exchange: 'Bitget', predicted: 'bearish', actual: 'bullish', rating: 1 }
  ];

  for (let i = 0; i < trainingData.length; i++) {
    const data = trainingData[i];
    try {
      const response = await axios.post(`${BASE_URL}/api/user-training`, {
        action: 'train',
        symbol: data.symbol,
        exchange: data.exchange,
        predictedDirection: data.predicted,
        actualDirection: data.actual,
        userRating: data.rating,
        features: {
          technicalStrength: 0.5 + Math.random() * 0.3,
          volumeStrength: 0.3 + Math.random() * 0.4,
          sentimentStrength: 0.4 + Math.random() * 0.3,
          historicalStrength: 0.4 + Math.random() * 0.3
        }
      });
      
      if (response.data.success) {
        console.log(`✅ 訓練 ${i + 1} 成功: ${data.symbol}/${data.exchange}`);
      }
    } catch (error) {
      console.log(`❌ 訓練 ${i + 1} 失敗:`, error.response?.data?.error || error.message);
    }
  }

  // 再次獲取統計看變化
  console.log('\n📊 查看訓練後的統計...');
  try {
    const finalStatsRes = await axios.post(`${BASE_URL}/api/user-training`, {
      action: 'get_stats'
    });
    
    if (finalStatsRes.data.success) {
      const stats = finalStatsRes.data.data;
      console.log('✅ 最終統計:');
      console.log(`   總預測次數: ${stats.totalPredictions}`);
      console.log(`   正確預測: ${stats.correctPredictions}`);
      console.log(`   準確率: ${stats.accuracy.toFixed(1)}%`);
      console.log(`   學習速度: ${(stats.learningRate * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.log('❌ 獲取最終統計失敗:', error.response?.data?.error || error.message);
  }

  // 測試導出模型
  console.log('\n💾 測試導出模型...');
  try {
    const exportRes = await axios.post(`${BASE_URL}/api/user-training`, {
      action: 'export'
    });
    
    if (exportRes.data.success) {
      console.log('✅ 模型導出成功');
      console.log(`   導出時間: ${exportRes.data.data.exportDate}`);
      console.log(`   權重分佈:`, exportRes.data.data.weights);
    }
  } catch (error) {
    console.log('❌ 導出失敗:', error.response?.data?.error || error.message);
  }

  // 測試錯誤處理
  console.log('\n🔍 測試錯誤處理...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/user-training`, {
      action: 'train',
      // 缺少必要參數
    });
    console.log('❌ 應該失敗但成功了');
  } catch (error) {
    console.log('✅ 正確處理了缺少參數的錯誤');
  }

  try {
    const response = await axios.post(`${BASE_URL}/api/user-training`, {
      action: 'train',
      symbol: 'BTC',
      exchange: 'Binance',
      predictedDirection: 'bullish',
      actualDirection: 'bearish',
      userRating: 6, // 無效評分
    });
    console.log('❌ 應該失敗但成功了');
  } catch (error) {
    console.log('✅ 正確處理了無效評分的錯誤');
  }

  console.log('\n🎉 用戶訓練測試完成！');
}

// 性能測試
async function performanceTest() {
  console.log('\n⚡ 性能測試...');
  
  const startTime = Date.now();
  const promises = [];
  
  // 並發訓練測試
  for (let i = 0; i < 3; i++) {
    promises.push(
      axios.post(`${BASE_URL}/api/user-training`, {
        action: 'train',
        symbol: 'BTC',
        exchange: 'Binance',
        predictedDirection: 'bullish',
        actualDirection: 'bullish',
        userRating: 3,
        features: {
          technicalStrength: 0.5,
          volumeStrength: 0.5,
          sentimentStrength: 0.5,
          historicalStrength: 0.5
        }
      })
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 並發訓練測試完成，耗時: ${duration}ms`);
    console.log(`   平均響應時間: ${duration / 3}ms`);
    
    const successCount = results.filter(r => r.data.success).length;
    console.log(`   成功率: ${successCount}/3 (${(successCount/3*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.log('❌ 並發訓練測試失敗:', error.message);
  }
}

// 運行測試
async function runTests() {
  try {
    await testUserTraining();
    await performanceTest();
  } catch (error) {
    console.error('測試運行失敗:', error.message);
  }
}

runTests(); 