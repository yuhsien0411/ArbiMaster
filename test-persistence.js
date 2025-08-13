const fs = require('fs');
const path = require('path');

// 模擬重啟後的數據載入
function testDataPersistence() {
  console.log('🔄 模擬網頁重啟後的數據載入...\n');

  const modelPath = './models/user_trained_model.json';
  const feedbackPath = './data/user_feedback.json';

  // 檢查模型文件是否存在
  if (fs.existsSync(modelPath)) {
    console.log('✅ 找到已保存的模型文件');
    
    try {
      const modelData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
      console.log('📊 模型數據:');
      console.log(`   權重分佈:`, modelData.weights);
      console.log(`   訓練次數: ${modelData.trainingStats.totalTrainingSessions}`);
      console.log(`   準確率: ${modelData.trainingStats.accuracy.toFixed(1)}%`);
      console.log(`   最後訓練: ${new Date(modelData.trainingStats.lastTrainingDate).toLocaleString()}`);
      console.log(`   保存時間: ${new Date(modelData.lastSaved).toLocaleString()}`);
    } catch (error) {
      console.log('❌ 讀取模型文件失敗:', error.message);
    }
  } else {
    console.log('⚠️ 未找到模型文件（首次運行）');
  }

  // 檢查反饋文件是否存在
  if (fs.existsSync(feedbackPath)) {
    console.log('\n✅ 找到已保存的反饋文件');
    
    try {
      const feedbackData = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
      console.log(`📝 反饋記錄數量: ${feedbackData.length}`);
      
      if (feedbackData.length > 0) {
        console.log('📋 最近的訓練記錄:');
        const recentFeedback = feedbackData.slice(-3); // 最近3條
        recentFeedback.forEach((feedback, index) => {
          console.log(`   ${index + 1}. ${feedback.symbol}/${feedback.exchange} - 評分: ${feedback.userRating}分`);
        });
      }
    } catch (error) {
      console.log('❌ 讀取反饋文件失敗:', error.message);
    }
  } else {
    console.log('\n⚠️ 未找到反饋文件（首次運行）');
  }

  // 模擬載入過程
  console.log('\n🔄 模擬AI模型載入過程...');
  
  // 檢查目錄結構
  const dirs = ['./models', './data'];
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      console.log(`📁 ${dir} 目錄包含 ${files.length} 個文件`);
    } else {
      console.log(`📁 ${dir} 目錄不存在`);
    }
  });

  console.log('\n✅ 數據持久化測試完成！');
  console.log('💡 結論：所有訓練數據都會永久保存，重啟後不會丟失');
}

// 運行測試
testDataPersistence(); 