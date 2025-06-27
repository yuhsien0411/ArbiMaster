// 測試增強版AI系統的腳本
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 測試配置
const TEST_CONFIG = {
  symbol: 'BTC',
  exchange: 'Binance',
  symbols: ['BTC', 'ETH', 'BNB'],
  days: 30,
  maxEpochs: 50 // 測試用較少的epoch
};

async function testEnhancedAI() {
  console.log('🧠 開始測試增強版AI系統...\n');

  try {
    // 測試1: 數據收集
    await testDataCollection();
    
    // 測試2: 增強版預測
    await testEnhancedPredictions();
    
    // 測試3: 模型訓練
    await testModelTraining();
    
    // 測試4: 模型比較
    await testModelComparison();
    
    // 測試5: 自動化訓練
    await testAutoTraining();
    
    // 測試6: 綜合預測
    await testComprehensivePrediction();

    console.log('\n🎉 增強版AI系統測試完成！');

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
  }
}

// 測試數據收集
async function testDataCollection() {
  console.log('📥 測試1: 數據收集');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/enhanced-predictions`, {
      params: {
        action: 'collect_data',
        symbol: TEST_CONFIG.symbol,
        days: TEST_CONFIG.days
      }
    });

    if (response.data.success) {
      console.log('✅ 數據收集成功');
      console.log(`   記錄數量: ${response.data.dataset.recordCount}`);
      console.log(`   數據品質: ${response.data.dataset.quality.overall.toFixed(1)}%`);
      console.log(`   幣種: ${response.data.dataset.symbols.join(', ')}`);
      console.log(`   天數: ${response.data.dataset.days}`);
    } else {
      console.log('❌ 數據收集失敗');
    }
  } catch (error) {
    console.log('❌ 數據收集測試失敗:', error.message);
  }
  
  console.log('');
}

// 測試增強版預測
async function testEnhancedPredictions() {
  console.log('🔮 測試2: 增強版預測');
  
  const predictionTypes = ['funding_rate', 'arbitrage_opportunities', 'market_sentiment'];
  
  for (const type of predictionTypes) {
    try {
      console.log(`   測試 ${type} 預測...`);
      
      const response = await axios.get(`${BASE_URL}/api/enhanced-predictions`, {
        params: {
          action: 'predict',
          symbol: TEST_CONFIG.symbol,
          exchange: TEST_CONFIG.exchange,
          predictionType: type
        }
      });

      if (response.data.success) {
        console.log(`   ✅ ${type} 預測成功`);
        console.log(`      模型類型: ${response.data.modelInfo.type}`);
        console.log(`      版本: ${response.data.modelInfo.version}`);
        
        // 顯示具體預測結果
        displayPredictionResults(type, response.data.data);
      } else {
        console.log(`   ❌ ${type} 預測失敗`);
      }
    } catch (error) {
      console.log(`   ❌ ${type} 預測測試失敗:`, error.message);
    }
  }
  
  console.log('');
}

// 顯示預測結果
function displayPredictionResults(type, data) {
  switch (type) {
    case 'funding_rate':
      console.log(`      當前費率: ${data.currentRate}%`);
      console.log(`      預測費率: ${data.predictedRate}%`);
      console.log(`      置信度: ${data.confidence}%`);
      break;
      
    case 'arbitrage_opportunities':
      console.log(`      套利機會: ${data.totalOpportunities} 個`);
      console.log(`      平均收益: ${data.averageReturn}%`);
      console.log(`      市場條件: ${data.marketConditions.volatility}`);
      break;
      
    case 'market_sentiment':
      console.log(`      情緒評分: ${data.overallSentiment}`);
      console.log(`      情緒類型: ${data.sentimentDescription}`);
      console.log(`      置信度: ${data.confidence}%`);
      break;
  }
}

// 測試模型訓練
async function testModelTraining() {
  console.log('🎯 測試3: 模型訓練');
  
  try {
    console.log('   開始增強版模型訓練...');
    
    const response = await axios.get(`${BASE_URL}/api/enhanced-predictions`, {
      params: {
        action: 'train',
        symbols: TEST_CONFIG.symbols.join(','),
        days: TEST_CONFIG.days,
        maxEpochs: TEST_CONFIG.maxEpochs
      }
    });

    if (response.data.success) {
      console.log('   ✅ 模型訓練成功');
      console.log(`      性能 - MSE: ${response.data.performance.mse.toFixed(6)}`);
      console.log(`      性能 - MAE: ${response.data.performance.mae.toFixed(6)}`);
      console.log(`      性能 - R²: ${response.data.performance.r2.toFixed(3)}`);
      console.log(`      訓練樣本: ${response.data.trainingRecord.symbols.join(', ')}`);
    } else {
      console.log('   ❌ 模型訓練失敗:', response.data.error);
    }
  } catch (error) {
    console.log('   ❌ 模型訓練測試失敗:', error.message);
  }
  
  console.log('');
}

// 測試模型比較
async function testModelComparison() {
  console.log('📊 測試4: 模型比較');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/enhanced-predictions`, {
      params: {
        action: 'compare_models'
      }
    });

    if (response.data.success) {
      console.log('   ✅ 模型比較成功');
      console.log('   模型性能排名:');
      
      response.data.comparison.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.version}: MSE=${model.mse.toFixed(6)}, R²=${model.r2.toFixed(3)}`);
      });
    } else {
      console.log('   ⚠️ 模型比較: 沒有足夠的模型版本');
    }
  } catch (error) {
    console.log('   ❌ 模型比較測試失敗:', error.message);
  }
  
  console.log('');
}

// 測試自動化訓練
async function testAutoTraining() {
  console.log('🤖 測試5: 自動化訓練');
  
  try {
    console.log('   開始自動化訓練流程...');
    
    const response = await axios.get(`${BASE_URL}/api/enhanced-predictions`, {
      params: {
        action: 'auto_train'
      }
    });

    if (response.data.success) {
      console.log('   ✅ 自動化訓練成功');
      console.log(`      最佳配置: ${JSON.stringify(response.data.bestConfig)}`);
      console.log(`      最佳性能 - MSE: ${response.data.performance.mse.toFixed(6)}`);
      console.log(`      最佳性能 - R²: ${response.data.performance.r2.toFixed(3)}`);
    } else {
      console.log('   ❌ 自動化訓練失敗:', response.data.error);
    }
  } catch (error) {
    console.log('   ❌ 自動化訓練測試失敗:', error.message);
  }
  
  console.log('');
}

// 測試綜合預測
async function testComprehensivePrediction() {
  console.log('🎯 測試6: 綜合預測');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/enhanced-predictions`, {
      params: {
        action: 'predict',
        symbol: TEST_CONFIG.symbol,
        exchange: TEST_CONFIG.exchange,
        predictionType: 'comprehensive'
      }
    });

    if (response.data.success) {
      console.log('   ✅ 綜合預測成功');
      
      const data = response.data.data;
      console.log(`      綜合評分: ${data.analysis.overallScore}`);
      console.log(`      風險等級: ${data.analysis.riskLevel}`);
      console.log(`      關鍵洞察: ${data.analysis.keyInsights.length} 個`);
      console.log(`      建議數量: ${data.analysis.recommendations.length} 個`);
      
      // 顯示建議
      console.log('      建議:');
      data.analysis.recommendations.forEach((rec, index) => {
        console.log(`        ${index + 1}. ${rec}`);
      });
      
    } else {
      console.log('   ❌ 綜合預測失敗');
    }
  } catch (error) {
    console.log('   ❌ 綜合預測測試失敗:', error.message);
  }
  
  console.log('');
}

// 性能基準測試
async function benchmarkPerformance() {
  console.log('⚡ 性能基準測試');
  
  const testCases = [
    { symbol: 'BTC', exchange: 'Binance' },
    { symbol: 'ETH', exchange: 'Binance' },
    { symbol: 'BNB', exchange: 'Binance' }
  ];
  
  const startTime = Date.now();
  let successCount = 0;
  let totalTests = 0;
  
  for (const testCase of testCases) {
    for (const type of ['funding_rate', 'arbitrage_opportunities', 'market_sentiment']) {
      totalTests++;
      
      try {
        const response = await axios.get(`${BASE_URL}/api/enhanced-predictions`, {
          params: {
            action: 'predict',
            symbol: testCase.symbol,
            exchange: testCase.exchange,
            predictionType: type
          }
        });
        
        if (response.data.success) {
          successCount++;
        }
      } catch (error) {
        // 忽略錯誤，繼續測試
      }
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`   總測試數: ${totalTests}`);
  console.log(`   成功數: ${successCount}`);
  console.log(`   成功率: ${((successCount / totalTests) * 100).toFixed(1)}%`);
  console.log(`   總耗時: ${duration}ms`);
  console.log(`   平均耗時: ${(duration / totalTests).toFixed(1)}ms`);
  
  console.log('');
}

// 運行測試
async function runAllTests() {
  console.log('🚀 開始增強版AI系統全面測試\n');
  
  await testEnhancedAI();
  await benchmarkPerformance();
  
  console.log('🎊 所有測試完成！');
}

// 如果直接運行此腳本
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testEnhancedAI,
  benchmarkPerformance,
  runAllTests
}; 