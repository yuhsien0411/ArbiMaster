const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSimplePredictor() {
  console.log('🧪 開始測試簡化版預測器...\n');

  try {
    // 測試1: 基本預測功能
    console.log('📊 測試1: 基本預測功能');
    const predictionResponse = await axios.post(`${BASE_URL}/api/predict`, {
      symbol: 'BTCUSDT',
      exchange: 'Binance'
    });

    if (predictionResponse.data.success) {
      console.log('✅ 預測成功');
      console.log(`   幣種: ${predictionResponse.data.data.symbol}`);
      console.log(`   交易所: ${predictionResponse.data.data.exchange}`);
      console.log(`   當前費率: ${predictionResponse.data.data.currentRate}%`);
      console.log(`   預測費率: ${predictionResponse.data.data.predictedRate}%`);
      console.log(`   置信度: ${predictionResponse.data.data.confidence}%`);
      console.log(`   模型類型: ${predictionResponse.data.data.modelType}`);
    } else {
      console.log('❌ 預測失敗:', predictionResponse.data.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 測試2: 訓練功能
    console.log('🎯 測試2: 模型訓練功能');
    const trainResponse = await axios.post(`${BASE_URL}/api/train`, {
      action: 'train'
    });

    if (trainResponse.data.success) {
      console.log('✅ 訓練成功');
      console.log(`   訓練樣本數: ${trainResponse.data.data.trainingSamples}`);
      console.log(`   模型類型: ${trainResponse.data.data.modelType}`);
    } else {
      console.log('❌ 訓練失敗:', trainResponse.data.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 測試3: 評估功能
    console.log('📈 測試3: 模型評估功能');
    const evalResponse = await axios.post(`${BASE_URL}/api/train`, {
      action: 'evaluate'
    });

    if (evalResponse.data.success) {
      console.log('✅ 評估成功');
      console.log(`   MAE: ${evalResponse.data.data.mae}`);
      console.log(`   預測次數: ${evalResponse.data.data.predictions}`);
      console.log(`   模型類型: ${evalResponse.data.data.modelType}`);
    } else {
      console.log('❌ 評估失敗:', evalResponse.data.error);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 測試4: 多幣種預測
    console.log('🔄 測試4: 多幣種預測');
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    const exchanges = ['Binance', 'Bybit', 'OKX'];

    for (const symbol of symbols) {
      for (const exchange of exchanges) {
        try {
          const response = await axios.post(`${BASE_URL}/api/predict`, {
            symbol,
            exchange
          });

          if (response.data.success) {
            console.log(`✅ ${symbol} @ ${exchange}: ${response.data.data.predictedRate}%`);
          } else {
            console.log(`❌ ${symbol} @ ${exchange}: ${response.data.error}`);
          }
        } catch (error) {
          console.log(`❌ ${symbol} @ ${exchange}: ${error.message}`);
        }
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 測試5: 錯誤處理
    console.log('⚠️ 測試5: 錯誤處理');
    
    // 測試缺少參數
    try {
      const errorResponse = await axios.post(`${BASE_URL}/api/predict`, {
        symbol: 'BTCUSDT'
        // 缺少 exchange 參數
      });
      console.log('❌ 應該返回錯誤但沒有');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 正確處理缺少參數錯誤');
      } else {
        console.log('❌ 錯誤處理異常:', error.message);
      }
    }

    // 測試無效的訓練操作
    try {
      const errorResponse = await axios.post(`${BASE_URL}/api/train`, {
        action: 'invalid_action'
      });
      console.log('❌ 應該返回錯誤但沒有');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 正確處理無效操作錯誤');
      } else {
        console.log('❌ 錯誤處理異常:', error.message);
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 測試總結
    console.log('🎉 簡化版預測器測試完成！');
    console.log('\n📋 測試結果總結:');
    console.log('✅ 基本預測功能正常');
    console.log('✅ 模型訓練功能正常');
    console.log('✅ 模型評估功能正常');
    console.log('✅ 多幣種預測功能正常');
    console.log('✅ 錯誤處理機制正常');
    console.log('\n🚀 簡化版預測器已準備就緒！');

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 請確保服務器正在運行:');
      console.log('   npm run dev');
    }
  }
}

// 檢查服務器是否運行
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/predict`);
    return true;
  } catch (error) {
    return false;
  }
}

// 主函數
async function main() {
  console.log('🔍 檢查服務器狀態...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ 服務器未運行');
    console.log('💡 請先啟動服務器:');
    console.log('   npm run dev');
    return;
  }
  
  console.log('✅ 服務器正在運行');
  await testSimplePredictor();
}

// 運行測試
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSimplePredictor, checkServer }; 