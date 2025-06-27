import * as tf from '@tensorflow/tfjs-node';
import { EnhancedFundingRatePredictor } from '../predictors/EnhancedFundingRatePredictor.js';
import { AdvancedDataCollector } from '../utils/AdvancedDataCollector.js';

export class AdvancedTrainingManager {
  constructor() {
    this.predictor = new EnhancedFundingRatePredictor();
    this.dataCollector = new AdvancedDataCollector();
    this.trainingHistory = [];
    this.modelVersions = new Map();
  }

  // 智能訓練策略
  async intelligentTraining(config = {}) {
    console.log('🧠 開始智能訓練...');
    
    const {
      symbols = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL'],
      days = 90,
      validationSplit = 0.2,
      maxEpochs = 200,
      patience = 30,
      minImprovement = 0.001
    } = config;

    try {
      // 1. 收集高品質數據
      console.log('📥 收集訓練數據...');
      const dataset = await this.dataCollector.generateComprehensiveDataset(symbols, days);
      
      if (dataset.data.length < 1000) {
        throw new Error('訓練數據不足，至少需要1000個樣本');
      }

      // 2. 數據品質檢查
      console.log('🔍 檢查數據品質...');
      const quality = dataset.quality;
      console.log(`數據品質: ${quality.overall.toFixed(1)}%`);
      
      if (quality.overall < 70) {
        console.warn('⚠️ 數據品質較低，可能影響模型性能');
      }

      // 3. 特徵工程
      console.log('🔧 進行特徵工程...');
      const features = await this.predictor.extractAdvancedFeatures(dataset.data);
      
      if (features.length === 0) {
        throw new Error('特徵提取失敗');
      }

      // 4. 數據分割
      const { trainFeatures, trainLabels, valFeatures, valLabels } = 
        this.splitData(features, dataset.data, validationSplit);

      // 5. 建立集成模型
      console.log('🏗️ 建立集成模型...');
      const inputShape = [trainFeatures.shape[1]];
      const ensembleModels = await this.predictor.buildEnsembleModel(inputShape);
      
      // 6. 訓練各個模型
      const trainingResults = [];
      
      for (let i = 0; i < ensembleModels.length; i++) {
        const modelName = ['LSTM', 'Transformer', 'DeepMLP'][i];
        console.log(`🎯 訓練 ${modelName} 模型...`);
        
        const result = await this.trainModel(
          ensembleModels[i],
          trainFeatures,
          trainLabels,
          valFeatures,
          valLabels,
          {
            maxEpochs,
            patience,
            minImprovement,
            modelName
          }
        );
        
        trainingResults.push(result);
      }

      // 7. 模型集成
      console.log('🔗 集成模型...');
      this.predictor.ensembleModels = ensembleModels;
      
      // 8. 驗證集成模型
      const ensemblePerformance = await this.validateEnsembleModel(
        valFeatures,
        valLabels
      );

      // 9. 保存模型
      await this.saveModels(ensembleModels, trainingResults);

      // 10. 記錄訓練歷史
      const trainingRecord = {
        timestamp: new Date().toISOString(),
        symbols,
        days,
        dataQuality: quality,
        trainingResults,
        ensemblePerformance,
        modelVersion: this.generateModelVersion()
      };
      
      this.trainingHistory.push(trainingRecord);
      this.saveTrainingHistory();

      console.log('✅ 智能訓練完成');
      
      return {
        success: true,
        trainingRecord,
        ensemblePerformance
      };

    } catch (error) {
      console.error('❌ 智能訓練失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 數據分割
  splitData(features, data, validationSplit) {
    const totalSamples = features.length;
    const valSize = Math.floor(totalSamples * validationSplit);
    const trainSize = totalSamples - valSize;

    // 隨機打亂數據
    const indices = tf.util.createShuffledIndices(totalSamples);
    
    const trainIndices = indices.slice(0, trainSize);
    const valIndices = indices.slice(trainSize);

    // 分割特徵
    const trainFeatures = [];
    const valFeatures = [];
    
    for (let i = 0; i < trainSize; i++) {
      trainFeatures.push(features[trainIndices[i]]);
    }
    
    for (let i = 0; i < valSize; i++) {
      valFeatures.push(features[valIndices[i]]);
    }

    // 分割標籤
    const trainLabels = [];
    const valLabels = [];
    
    for (let i = 0; i < trainSize; i++) {
      trainLabels.push(data[trainIndices[i]].fundingRate);
    }
    
    for (let i = 0; i < valSize; i++) {
      valLabels.push(data[valIndices[i]].fundingRate);
    }

    return {
      trainFeatures: tf.tensor2d(trainFeatures),
      trainLabels: tf.tensor2d(trainLabels, [trainLabels.length, 1]),
      valFeatures: tf.tensor2d(valFeatures),
      valLabels: tf.tensor2d(valLabels, [valLabels.length, 1])
    };
  }

  // 訓練單個模型
  async trainModel(model, trainFeatures, trainLabels, valFeatures, valLabels, config) {
    const { maxEpochs, patience, minImprovement, modelName } = config;
    
    let bestLoss = Infinity;
    let patienceCount = 0;
    let learningRate = 0.001;
    
    const history = {
      epochs: [],
      trainLoss: [],
      valLoss: [],
      trainMae: [],
      valMae: []
    };

    for (let epoch = 0; epoch < maxEpochs; epoch++) {
      // 動態調整學習率
      if (epoch > 0 && epoch % 50 === 0) {
        learningRate *= 0.5;
        const optimizer = tf.train.adamax(learningRate);
        model.compile({
          optimizer,
          loss: 'huberLoss',
          metrics: ['mae']
        });
      }

      // 訓練一個epoch
      const result = await model.fit(trainFeatures, trainLabels, {
        epochs: 1,
        batchSize: 32,
        validationData: [valFeatures, valLabels],
        shuffle: true,
        verbose: 0
      });

      const trainLoss = result.history.loss[0];
      const valLoss = result.history.val_loss[0];
      const trainMae = result.history.mae[0];
      const valMae = result.history.val_mae[0];

      // 記錄歷史
      history.epochs.push(epoch + 1);
      history.trainLoss.push(trainLoss);
      history.valLoss.push(valLoss);
      history.trainMae.push(trainMae);
      history.valMae.push(valMae);

      // 早停檢查
      if (valLoss < bestLoss - minImprovement) {
        bestLoss = valLoss;
        patienceCount = 0;
      } else {
        patienceCount++;
      }

      // 輸出進度
      if (epoch % 10 === 0) {
        console.log(`  Epoch ${epoch + 1}/${maxEpochs}: train_loss=${trainLoss.toFixed(6)}, val_loss=${valLoss.toFixed(6)}`);
      }

      // 早停
      if (patienceCount >= patience) {
        console.log(`  🛑 ${modelName} 早停於第 ${epoch + 1} 輪`);
        break;
      }
    }

    return {
      modelName,
      bestLoss,
      finalEpoch: history.epochs.length,
      history,
      learningRate
    };
  }

  // 驗證集成模型
  async validateEnsembleModel(valFeatures, valLabels) {
    const predictions = [];
    const actuals = valLabels.arraySync().flat();

    // 獲取每個模型的預測
    for (const model of this.predictor.ensembleModels) {
      const modelPredictions = model.predict(valFeatures);
      predictions.push(modelPredictions.arraySync().flat());
      modelPredictions.dispose();
    }

    // 計算集成預測
    const weights = [0.4, 0.35, 0.25]; // LSTM, Transformer, MLP
    const ensemblePredictions = [];
    
    for (let i = 0; i < actuals.length; i++) {
      let weightedPred = 0;
      for (let j = 0; j < predictions.length; j++) {
        weightedPred += predictions[j][i] * weights[j];
      }
      ensemblePredictions.push(weightedPred);
    }

    // 計算性能指標
    const mse = this.calculateMSE(ensemblePredictions, actuals);
    const mae = this.calculateMAE(ensemblePredictions, actuals);
    const rmse = Math.sqrt(mse);
    const r2 = this.calculateR2(ensemblePredictions, actuals);

    return {
      mse,
      mae,
      rmse,
      r2,
      predictions: ensemblePredictions,
      actuals
    };
  }

  // 性能指標計算
  calculateMSE(predictions, actuals) {
    let sum = 0;
    for (let i = 0; i < predictions.length; i++) {
      sum += Math.pow(predictions[i] - actuals[i], 2);
    }
    return sum / predictions.length;
  }

  calculateMAE(predictions, actuals) {
    let sum = 0;
    for (let i = 0; i < predictions.length; i++) {
      sum += Math.abs(predictions[i] - actuals[i]);
    }
    return sum / predictions.length;
  }

  calculateR2(predictions, actuals) {
    const mean = actuals.reduce((sum, val) => sum + val, 0) / actuals.length;
    
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < predictions.length; i++) {
      ssRes += Math.pow(predictions[i] - actuals[i], 2);
      ssTot += Math.pow(actuals[i] - mean, 2);
    }
    
    return 1 - (ssRes / ssTot);
  }

  // 保存模型
  async saveModels(models, trainingResults) {
    console.log('💾 保存模型...');
    
    const modelVersion = this.generateModelVersion();
    const basePath = `./models/ensemble_${modelVersion}`;
    
    for (let i = 0; i < models.length; i++) {
      const modelName = ['lstm', 'transformer', 'mlp'][i];
      const modelPath = `${basePath}/${modelName}`;
      
      await models[i].save(`file://${modelPath}`);
      
      // 保存訓練結果
      const resultPath = `${modelPath}/training_result.json`;
      const fs = require('fs');
      fs.writeFileSync(resultPath, JSON.stringify(trainingResults[i], null, 2));
    }

    // 保存集成配置
    const ensembleConfig = {
      version: modelVersion,
      timestamp: new Date().toISOString(),
      weights: [0.4, 0.35, 0.25],
      modelNames: ['lstm', 'transformer', 'mlp'],
      basePath
    };
    
    const configPath = `${basePath}/ensemble_config.json`;
    const fs = require('fs');
    fs.writeFileSync(configPath, JSON.stringify(ensembleConfig, null, 2));

    this.modelVersions.set(modelVersion, ensembleConfig);
    console.log(`✅ 模型已保存到 ${basePath}`);
  }

  // 生成模型版本
  generateModelVersion() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `v${timestamp}`;
  }

  // 保存訓練歷史
  saveTrainingHistory() {
    const fs = require('fs');
    const historyPath = './models/training_history.json';
    fs.writeFileSync(historyPath, JSON.stringify(this.trainingHistory, null, 2));
  }

  // 載入最佳模型
  async loadBestModel() {
    console.log('📂 載入最佳模型...');
    
    // 根據驗證損失選擇最佳模型
    if (this.trainingHistory.length === 0) {
      throw new Error('沒有可用的訓練歷史');
    }

    const bestRecord = this.trainingHistory.reduce((best, current) => {
      const currentLoss = current.ensemblePerformance.mse;
      const bestLoss = best.ensemblePerformance.mse;
      return currentLoss < bestLoss ? current : best;
    });

    const modelVersion = bestRecord.modelVersion;
    const config = this.modelVersions.get(modelVersion);
    
    if (!config) {
      throw new Error(`找不到模型版本: ${modelVersion}`);
    }

    // 載入各個模型
    const models = [];
    for (const modelName of config.modelNames) {
      const modelPath = `${config.basePath}/${modelName}`;
      const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      models.push(model);
    }

    this.predictor.ensembleModels = models;
    console.log(`✅ 已載入最佳模型版本: ${modelVersion}`);
    
    return {
      modelVersion,
      performance: bestRecord.ensemblePerformance
    };
  }

  // 模型性能比較
  compareModels() {
    if (this.trainingHistory.length < 2) {
      console.log('需要至少2個模型版本進行比較');
      return null;
    }

    const comparison = this.trainingHistory.map(record => ({
      version: record.modelVersion,
      timestamp: record.timestamp,
      mse: record.ensemblePerformance.mse,
      mae: record.ensemblePerformance.mae,
      r2: record.ensemblePerformance.r2,
      dataQuality: record.dataQuality.overall
    }));

    // 按MSE排序
    comparison.sort((a, b) => a.mse - b.mse);

    console.log('📊 模型性能比較:');
    comparison.forEach((model, index) => {
      console.log(`${index + 1}. ${model.version}: MSE=${model.mse.toFixed(6)}, R²=${model.r2.toFixed(3)}`);
    });

    return comparison;
  }

  // 自動化訓練流程
  async autoTraining() {
    console.log('🤖 開始自動化訓練流程...');
    
    const configs = [
      { symbols: ['BTC', 'ETH'], days: 30, maxEpochs: 100 },
      { symbols: ['BTC', 'ETH', 'BNB'], days: 60, maxEpochs: 150 },
      { symbols: ['BTC', 'ETH', 'BNB', 'XRP', 'SOL'], days: 90, maxEpochs: 200 }
    ];

    const results = [];
    
    for (const config of configs) {
      console.log(`\n🔄 嘗試配置: ${JSON.stringify(config)}`);
      
      const result = await this.intelligentTraining(config);
      results.push({
        config,
        result
      });

      if (result.success) {
        console.log(`✅ 配置成功，性能: MSE=${result.ensemblePerformance.mse.toFixed(6)}`);
      } else {
        console.log(`❌ 配置失敗: ${result.error}`);
      }
    }

    // 選擇最佳配置
    const successfulResults = results.filter(r => r.result.success);
    if (successfulResults.length > 0) {
      const bestResult = successfulResults.reduce((best, current) => {
        const currentMSE = current.result.ensemblePerformance.mse;
        const bestMSE = best.result.ensemblePerformance.mse;
        return currentMSE < bestMSE ? current : best;
      });

      console.log(`\n🏆 最佳配置: ${JSON.stringify(bestResult.config)}`);
      console.log(`最佳性能: MSE=${bestResult.result.ensemblePerformance.mse.toFixed(6)}`);
      
      return bestResult;
    } else {
      console.log('❌ 所有配置都失敗了');
      return null;
    }
  }
} 