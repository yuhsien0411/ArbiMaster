import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Box, Card, CardContent, Typography, 
  Button, Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, Chip, Grid, Paper,
  Slider, Rating, TextField, Divider, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { 
  School, TrendingUp, TrendingDown, Psychology, 
  Analytics, Warning, CheckCircle, Error,
  ExpandMore, Timeline, Assessment, Security,
  Lightbulb, Info, TrendingFlat, Speed,
  Star, StarBorder, Refresh, Download, Upload
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function UserTraining() {
  const [trainingStats, setTrainingStats] = useState(null);
  const [learningProgress, setLearningProgress] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [selectedExchange, setSelectedExchange] = useState('Binance');
  const [predictedDirection, setPredictedDirection] = useState('bullish');
  const [actualDirection, setActualDirection] = useState('bullish');
  const [userRating, setUserRating] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const symbols = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'DOGE', 'SUI', 'LINK', 'ADA', 'TRX'];
  const exchanges = ['Binance', 'Bybit', 'OKX', 'Bitget', 'Gate.io', 'HyperLiquid'];

  // 載入訓練統計和進度
  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      const [statsRes, progressRes] = await Promise.all([
        axios.post('/api/user-training', { action: 'get_stats' }),
        axios.post('/api/user-training', { action: 'get_progress' })
      ]);

      if (statsRes.data.success) {
        setTrainingStats(statsRes.data.data);
      }

      if (progressRes.data.success) {
        setLearningProgress(progressRes.data.data);
      }
    } catch (error) {
      console.error('載入訓練數據失敗:', error);
    }
  };

  // 訓練模型
  const trainModel = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/user-training', {
        action: 'train',
        symbol: selectedSymbol,
        exchange: selectedExchange,
        predictedDirection,
        actualDirection,
        userRating,
        features: {
          technicalStrength: 0.6,
          volumeStrength: 0.4,
          sentimentStrength: 0.5,
          historicalStrength: 0.5
        }
      });

      if (response.data.success) {
        setSuccess('模型訓練成功！');
        loadTrainingData(); // 重新載入數據
      }
    } catch (error) {
      setError(error.response?.data?.error || '訓練失敗');
    } finally {
      setLoading(false);
    }
  };

  // 重置模型
  const resetModel = async () => {
    if (!confirm('確定要重置模型嗎？這將清除所有訓練數據。')) {
      return;
    }

    try {
      const response = await axios.post('/api/user-training', {
        action: 'reset'
      });

      if (response.data.success) {
        setSuccess('模型已重置');
        loadTrainingData();
      }
    } catch (error) {
      setError('重置失敗');
    }
  };

  // 導出模型
  const exportModel = async () => {
    try {
      const response = await axios.post('/api/user-training', {
        action: 'export'
      });

      if (response.data.success) {
        const modelData = response.data.data;
        const blob = new Blob([JSON.stringify(modelData, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_model_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccess('模型導出成功');
      }
    } catch (error) {
      setError('導出失敗');
    }
  };

  // 渲染學習進度
  const renderLearningProgress = () => {
    if (!learningProgress) return null;

    const getStageColor = (stage) => {
      switch (stage) {
        case '初學者': return 'warning';
        case '學習中': return 'info';
        case '進階學習': return 'primary';
        case '專家級': return 'success';
        default: return 'default';
      }
    };

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🎓 學習進度
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  學習階段
                </Typography>
                <Chip
                  label={learningProgress.learningStage}
                  color={getStageColor(learningProgress.learningStage)}
                  size="large"
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  訓練次數
                </Typography>
                <Typography variant="h3" color="success.main">
                  {learningProgress.totalSessions}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  準確率
                </Typography>
                <Typography variant="h3" color="info.main">
                  {learningProgress.accuracy.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  改進率
                </Typography>
                <Typography variant="h3" color="success.main">
                  {learningProgress.improvement.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              權重分佈
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(learningProgress.weightDistribution).map(([key, value]) => (
                <Grid item xs={6} md={3} key={key}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {key === 'technicalIndicators' ? '技術指標' :
                       key === 'volumeAnalysis' ? '交易量分析' :
                       key === 'sentimentAnalysis' ? '情緒分析' : '歷史模式'}
                    </Typography>
                    <Typography variant="h6">
                      {(value * 100).toFixed(1)}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={value * 100} 
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // 渲染訓練統計
  const renderTrainingStats = () => {
    if (!trainingStats) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            📊 訓練統計
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  總預測次數
                </Typography>
                <Typography variant="h4">
                  {trainingStats.totalPredictions}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  正確預測
                </Typography>
                <Typography variant="h4" color="success.main">
                  {trainingStats.correctPredictions}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  準確率
                </Typography>
                <Typography variant="h4" color="info.main">
                  {trainingStats.accuracy.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  學習速度
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {(trainingStats.learningRate * 100).toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {trainingStats.lastTrainingDate && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                最後訓練: {new Date(trainingStats.lastTrainingDate).toLocaleString()}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // 渲染訓練界面
  const renderTrainingInterface = () => {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🎯 訓練AI模型
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            通過提供反饋來訓練AI模型，讓它更了解您的交易偏好和市場判斷
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>幣種</InputLabel>
                <Select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  label="幣種"
                >
                  {symbols.map((symbol) => (
                    <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>交易所</InputLabel>
                <Select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  label="交易所"
                >
                  {exchanges.map((exchange) => (
                    <MenuItem key={exchange} value={exchange}>{exchange}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>AI預測方向</InputLabel>
                <Select
                  value={predictedDirection}
                  onChange={(e) => setPredictedDirection(e.target.value)}
                  label="AI預測方向"
                >
                  <MenuItem value="bullish">看漲 (Bullish)</MenuItem>
                  <MenuItem value="bearish">看跌 (Bearish)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>實際方向</InputLabel>
                <Select
                  value={actualDirection}
                  onChange={(e) => setActualDirection(e.target.value)}
                  label="實際方向"
                >
                  <MenuItem value="bullish">看漲 (Bullish)</MenuItem>
                  <MenuItem value="bearish">看跌 (Bearish)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                您對這個預測的評分 (1-5分)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating
                  value={userRating}
                  onChange={(event, newValue) => setUserRating(newValue)}
                  size="large"
                />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  {userRating} 分
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                1分 = 完全不準確，5分 = 非常準確
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={trainModel}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <School />}
                fullWidth
                size="large"
              >
                {loading ? '訓練中...' : '訓練模型'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // 渲染模型管理
  const renderModelManagement = () => {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            ⚙️ 模型管理
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                onClick={resetModel}
                startIcon={<Refresh />}
                fullWidth
                color="warning"
              >
                重置模型
              </Button>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                onClick={exportModel}
                startIcon={<Download />}
                fullWidth
                color="primary"
              >
                導出模型
              </Button>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                fullWidth
                color="info"
                disabled
              >
                導入模型
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              💡 提示：定期導出模型可以備份您的訓練成果
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Head>
        <title>AI模型訓練 - ArbiMaster</title>
        <meta name="description" content="訓練您的專屬AI模型，提升預測準確率" />
      </Head>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🎓 AI模型訓練中心
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          通過提供反饋來訓練您的專屬AI模型，讓它更了解您的交易風格和市場判斷
        </Typography>

        {/* 錯誤和成功提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* 學習進度 */}
        {renderLearningProgress()}

        {/* 訓練統計 */}
        {renderTrainingStats()}

        {/* 訓練界面 */}
        {renderTrainingInterface()}

        {/* 模型管理 */}
        {renderModelManagement()}

        {/* 說明 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">🤔 如何訓練AI模型？</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              <strong>1. 提供預測反饋</strong><br/>
              當AI做出預測後，您可以告訴它實際結果如何，並給出1-5分的評分。
            </Typography>
            
            <Typography variant="body1" paragraph>
              <strong>2. 模型學習</strong><br/>
              AI會根據您的反饋調整內部權重，學習您的判斷標準。
            </Typography>
            
            <Typography variant="body1" paragraph>
              <strong>3. 持續改進</strong><br/>
              隨著訓練次數增加，AI會越來越了解您的交易偏好，預測也會更準確。
            </Typography>
            
            <Typography variant="body1">
              <strong>4. 個性化</strong><br/>
              每個用戶的模型都是獨特的，反映個人的交易風格和風險偏好。
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* 免責聲明 */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>免責聲明：</strong>AI模型訓練僅供學習和研究使用，不構成投資建議。投資有風險，請謹慎決策。
          </Typography>
        </Alert>
      </Box>
    </>
  );
} 