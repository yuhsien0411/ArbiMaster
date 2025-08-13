const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testRealisticPredictions() {
  console.log('🧪 測試實用AI預測系統...\n');

  const testCases = [
    {
      name: 'BTC/Binance 預測',
      params: { symbol: 'BTC', exchange: 'Binance', action: 'predict' }
    },
    {
      name: 'ETH/Bybit 預測',
      params: { symbol: 'ETH', exchange: 'Bybit', action: 'predict' }
    },
    {
      name: 'BTC/Binance 綜合分析',
      params: { symbol: 'BTC', exchange: 'Binance', action: 'analysis' }
    },
    {
      name: '模型性能統計',
      params: { action: 'performance' }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📊 測試: ${testCase.name}`);
      
      const response = await axios.get(`${BASE_URL}/api/realistic-predictions`, {
        params: testCase.params
      });

      if (response.data.success) {
        console.log('✅ 成功');
        
        if (testCase.params.action === 'predict') {
          const data = response.data.data;
          console.log(`   幣種: ${data.symbol}`);
          console.log(`   交易所: ${data.exchange}`);
          console.log(`   當前費率: ${data.currentRate}%`);
          console.log(`   預測費率: ${data.predictedRate}%`);
          console.log(`   預測變化: ${data.predictedChange}%`);
          console.log(`   置信度: ${data.confidence}%`);
          console.log(`   交易建議: ${data.tradingAdvice.action.toUpperCase()}`);
          console.log(`   風險等級: ${data.riskAssessment.riskLevel}`);
        } else if (testCase.params.action === 'analysis') {
          const data = response.data.data;
          console.log(`   預測置信度: ${data.prediction.confidence}%`);
          console.log(`   交易建議: ${data.prediction.tradingAdvice.action.toUpperCase()}`);
          console.log(`   模型準確率: ${data.performance.accuracy.toFixed(1)}%`);
          console.log(`   分析摘要: ${data.analysis.summary.substring(0, 100)}...`);
        } else if (testCase.params.action === 'performance') {
          const data = response.data.data;
          console.log(`   總預測次數: ${data.totalPredictions}`);
          console.log(`   正確預測: ${data.correctPredictions}`);
          console.log(`   準確率: ${data.accuracy.toFixed(1)}%`);
        }
      } else {
        console.log('❌ 失敗:', response.data.error);
      }
    } catch (error) {
      console.log('❌ 錯誤:', error.response?.data?.error || error.message);
    }
    
    console.log('');
  }

  // 測試錯誤處理
  console.log('🔍 測試錯誤處理...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/realistic-predictions`, {
      params: { symbol: 'INVALID', exchange: 'INVALID', action: 'predict' }
    });
    console.log('❌ 應該失敗但成功了');
  } catch (error) {
    console.log('✅ 正確處理了無效參數');
  }

  console.log('\n🎉 測試完成！');
}

// 性能測試
async function performanceTest() {
  console.log('\n⚡ 性能測試...');
  
  const startTime = Date.now();
  const promises = [];
  
  // 並發測試
  for (let i = 0; i < 5; i++) {
    promises.push(
      axios.get(`${BASE_URL}/api/realistic-predictions`, {
        params: { symbol: 'BTC', exchange: 'Binance', action: 'predict' }
      })
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 並發測試完成，耗時: ${duration}ms`);
    console.log(`   平均響應時間: ${duration / 5}ms`);
    
    const successCount = results.filter(r => r.data.success).length;
    console.log(`   成功率: ${successCount}/5 (${(successCount/5*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.log('❌ 並發測試失敗:', error.message);
  }
}

// 運行測試
async function runTests() {
  try {
    await testRealisticPredictions();
    await performanceTest();
  } catch (error) {
    console.error('測試運行失敗:', error.message);
  }
}

runTests(); 