// 測試預測系統的腳本
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPredictions() {
  console.log('🧪 開始測試預測系統...\n');

  try {
    // 測試1: 資金費率預測
    console.log('📊 測試1: 資金費率預測');
    const fundingRateResponse = await axios.get(`${BASE_URL}/api/predictions`, {
      params: {
        symbol: 'BTC',
        exchange: 'Binance',
        predictionType: 'funding_rate'
      }
    });
    
    if (fundingRateResponse.data.success) {
      console.log('✅ 資金費率預測成功');
      console.log('   當前費率:', fundingRateResponse.data.data.currentRate + '%');
      console.log('   預測費率:', fundingRateResponse.data.data.predictedRate + '%');
      console.log('   置信度:', fundingRateResponse.data.data.confidence + '%');
    } else {
      console.log('❌ 資金費率預測失敗');
    }

    // 測試2: 套利機會預測
    console.log('\n📈 測試2: 套利機會預測');
    const arbitrageResponse = await axios.get(`${BASE_URL}/api/predictions`, {
      params: {
        symbol: 'BTC',
        predictionType: 'arbitrage_opportunity'
      }
    });
    
    if (arbitrageResponse.data.success) {
      console.log('✅ 套利機會預測成功');
      console.log('   發現機會數量:', arbitrageResponse.data.data.opportunities.length);
      console.log('   摘要:', arbitrageResponse.data.data.summary);
    } else {
      console.log('❌ 套利機會預測失敗');
    }

    // 測試3: 市場情緒預測
    console.log('\n😊 測試3: 市場情緒預測');
    const sentimentResponse = await axios.get(`${BASE_URL}/api/predictions`, {
      params: {
        symbol: 'BTC',
        predictionType: 'market_sentiment'
      }
    });
    
    if (sentimentResponse.data.success) {
      console.log('✅ 市場情緒預測成功');
      console.log('   情緒類型:', sentimentResponse.data.data.sentiment);
      console.log('   情緒評分:', sentimentResponse.data.data.score);
      console.log('   分析:', sentimentResponse.data.data.analysis);
    } else {
      console.log('❌ 市場情緒預測失敗');
    }

    // 測試4: 模型訓練
    console.log('\n🎯 測試4: 模型訓練');
    try {
      const trainResponse = await axios.get(`${BASE_URL}/api/predictions`, {
        params: { action: 'train' }
      });
      
      if (trainResponse.data.success) {
        console.log('✅ 模型訓練成功');
        console.log('   訓練樣本數:', trainResponse.data.data.trainingSamples);
      } else {
        console.log('❌ 模型訓練失敗');
      }
    } catch (error) {
      console.log('⚠️ 模型訓練可能需要較長時間，跳過此測試');
    }

    // 測試5: 模型評估
    console.log('\n📋 測試5: 模型評估');
    try {
      const evaluateResponse = await axios.get(`${BASE_URL}/api/predictions`, {
        params: { action: 'evaluate' }
      });
      
      if (evaluateResponse.data.success) {
        console.log('✅ 模型評估成功');
        console.log('   損失函數:', evaluateResponse.data.data.loss);
        console.log('   平均絕對誤差:', evaluateResponse.data.data.mae);
        console.log('   準確率:', evaluateResponse.data.data.accuracy);
      } else {
        console.log('❌ 模型評估失敗');
      }
    } catch (error) {
      console.log('⚠️ 模型評估失敗，可能需要先訓練模型');
    }

    console.log('\n🎉 測試完成！');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    if (error.response) {
      console.error('   錯誤詳情:', error.response.data);
    }
  }
}

// 執行測試
testPredictions(); 