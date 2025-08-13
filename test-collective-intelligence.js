const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 模擬不同用戶的請求
function createMockRequest(userId) {
  return {
    headers: {
      'x-forwarded-for': `192.168.1.${userId}`,
      'user-agent': `UserAgent_${userId}`
    },
    connection: {
      remoteAddress: `192.168.1.${userId}`
    }
  };
}

async function testCollectiveIntelligence() {
  console.log('🧠 測試集體智慧模型...\n');

  // 測試獲取模型信息
  console.log('📊 測試獲取模型信息...');
  try {
    const infoRes = await axios.post(`${BASE_URL}/api/collective-training`, {
      action: 'get_model_info'
    });
    
    if (infoRes.data.success) {
      console.log('✅ 獲取模型信息成功');
      console.log(`   模型類型: ${infoRes.data.data.type}`);
      console.log(`   版本: ${infoRes.data.data.version}`);
      console.log(`   貢獻者: ${infoRes.data.data.contributors}`);
      console.log(`   總訓練次數: ${infoRes.data.data.totalSessions}`);
    }
  } catch (error) {
    console.log('❌ 獲取模型信息失敗:', error.response?.data?.error || error.message);
  }

  // 測試多個用戶訓練
  console.log('\n🎯 測試多個用戶訓練...');
  const users = [
    { id: 1, name: '用戶A', quality: 'high' },
    { id: 2, name: '用戶B', quality: 'medium' },
    { id: 3, name: '用戶C', quality: 'low' }
  ];

  for (const user of users) {
    console.log(`\n👤 ${user.name} 開始訓練...`);
    
    // 模擬多次訓練
    for (let i = 0; i < 3; i++) {
      try {
        const rating = user.quality === 'high' ? 4 + Math.floor(Math.random() * 2) : 
                      user.quality === 'medium' ? 3 + Math.floor(Math.random() * 2) : 
                      1 + Math.floor(Math.random() * 3);
        
        const trainRes = await axios.post(`${BASE_URL}/api/collective-training`, {
          action: 'train',
          symbol: 'BTC',
          exchange: 'Binance',
          predictedDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
          actualDirection: Math.random() > 0.5 ? 'bullish' : 'bearish',
          userRating: rating,
          features: {
            technicalStrength: 0.4 + Math.random() * 0.4,
            volumeStrength: 0.3 + Math.random() * 0.4,
            sentimentStrength: 0.4 + Math.random() * 0.3,
            historicalStrength: 0.3 + Math.random() * 0.4
          }
        });
        
        if (trainRes.data.success) {
          const result = trainRes.data.data;
          console.log(`   ✅ 訓練 ${i + 1} 成功`);
          console.log(`      貢獻質量: ${(result.contributionQuality * 100).toFixed(1)}%`);
          console.log(`      影響基礎模型: ${result.isBaseModelUpdated ? '是' : '否'}`);
        }
      } catch (error) {
        console.log(`   ❌ 訓練 ${i + 1} 失敗:`, error.response?.data?.error || error.message);
      }
    }
  }

  // 測試預測
  console.log('\n🔮 測試預測功能...');
  try {
    const predictRes = await axios.post(`${BASE_URL}/api/collective-training`, {
      action: 'predict',
      inputData: {
        technicalScore: 0.6,
        volumeScore: 0.4,
        sentimentScore: 0.5,
        historicalScore: 0.3
      }
    });
    
    if (predictRes.data.success) {
      const prediction = predictRes.data.data;
      console.log('✅ 預測成功');
      console.log(`   預測方向: ${prediction.prediction}`);
      console.log(`   置信度: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`   模型類型: ${prediction.modelType}`);
      console.log(`   基礎權重:`, prediction.baseWeights);
      console.log(`   個人權重:`, prediction.userWeights);
    }
  } catch (error) {
    console.log('❌ 預測失敗:', error.response?.data?.error || error.message);
  }

  // 查看最終統計
  console.log('\n📈 查看最終統計...');
  try {
    const statsRes = await axios.post(`${BASE_URL}/api/collective-training`, {
      action: 'get_stats'
    });
    
    if (statsRes.data.success) {
      const stats = statsRes.data.data;
      console.log('✅ 集體統計:');
      console.log(`   總貢獻者: ${stats.totalContributors}`);
      console.log(`   總訓練次數: ${stats.totalTrainingSessions}`);
      console.log(`   平均準確率: ${(stats.averageAccuracy * 100).toFixed(1)}%`);
      console.log(`   模型版本: ${stats.modelVersion}`);
      console.log(`   基礎權重:`, stats.baseWeights);
      
      if (stats.topContributors.length > 0) {
        console.log('🏆 頂級貢獻者:');
        stats.topContributors.slice(0, 3).forEach((contributor, index) => {
          console.log(`   ${index + 1}. 用戶${contributor.userId} - 貢獻:${contributor.contributions}, 質量:${(contributor.averageQuality * 100).toFixed(1)}%`);
        });
      }
    }
  } catch (error) {
    console.log('❌ 獲取統計失敗:', error.response?.data?.error || error.message);
  }

  // 測試用戶統計
  console.log('\n👤 測試用戶統計...');
  try {
    const userStatsRes = await axios.post(`${BASE_URL}/api/collective-training`, {
      action: 'get_user_stats'
    });
    
    if (userStatsRes.data.success) {
      const userStats = userStatsRes.data.data;
      console.log('✅ 用戶統計:');
      console.log(`   用戶ID: ${userStats.userId}`);
      console.log(`   貢獻次數: ${userStats.contributions}`);
      console.log(`   平均質量: ${(userStats.averageQuality * 100).toFixed(1)}%`);
      console.log(`   有個人偏好: ${userStats.hasPreferences ? '是' : '否'}`);
      if (userStats.preferences) {
        console.log(`   個人偏好:`, userStats.preferences);
      }
    }
  } catch (error) {
    console.log('❌ 獲取用戶統計失敗:', error.response?.data?.error || error.message);
  }

  console.log('\n🎉 集體智慧測試完成！');
}

// 性能測試
async function performanceTest() {
  console.log('\n⚡ 性能測試...');
  
  const startTime = Date.now();
  const promises = [];
  
  // 並發訓練測試
  for (let i = 0; i < 5; i++) {
    promises.push(
      axios.post(`${BASE_URL}/api/collective-training`, {
        action: 'train',
        symbol: 'BTC',
        exchange: 'Binance',
        predictedDirection: 'bullish',
        actualDirection: 'bullish',
        userRating: 4,
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
    console.log(`   平均響應時間: ${duration / 5}ms`);
    
    const successCount = results.filter(r => r.data.success).length;
    console.log(`   成功率: ${successCount}/5 (${(successCount/5*100).toFixed(1)}%)`);
    
    // 統計高質量貢獻
    const highQualityCount = results.filter(r => 
      r.data.success && r.data.data.contributionQuality > 0.6
    ).length;
    console.log(`   高質量貢獻: ${highQualityCount}/5 (${(highQualityCount/5*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.log('❌ 並發訓練測試失敗:', error.message);
  }
}

// 運行測試
async function runTests() {
  try {
    await testCollectiveIntelligence();
    await performanceTest();
  } catch (error) {
    console.error('測試運行失敗:', error.message);
  }
}

runTests(); 