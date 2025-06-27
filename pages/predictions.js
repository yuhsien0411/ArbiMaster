import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Box, Card, CardContent, Typography, 
  Table, TableBody, TableCell, TableHead, TableRow,
  Button, Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, Chip, Grid, Paper,
  Tabs, Tab, Divider, LinearProgress
} from '@mui/material';
import { 
  TrendingUp, TrendingDown, Psychology, 
  Analytics, Warning, CheckCircle, Error 
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

export default function Predictions() {
  const [predictions, setPredictions] = useState({});
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [selectedExchange, setSelectedExchange] = useState('Binance');
  const [predictionType, setPredictionType] = useState('funding_rate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);

  const symbols = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'DOGE', 'SUI', 'LINK', 'ADA', 'TRX'];
  const exchanges = ['Binance', 'Bybit', 'OKX', 'Bitget', 'Gate.io', 'HyperLiquid'];
  const predictionTypes = [
    { value: 'funding_rate', label: '資金費率預測', icon: <TrendingUp /> },
    { value: 'arbitrage_opportunity', label: '套利機會預測', icon: <Analytics /> },
    { value: 'market_sentiment', label: '市場情緒預測', icon: <Psychology /> }
  ];

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/predictions', {
        params: {
          symbol: selectedSymbol,
          exchange: selectedExchange,
          predictionType
        }
      });
      
      setPredictions(response.data.data);
    } catch (error) {
      setError(error.response?.data?.error || '預測失敗');
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    setTrainingStatus('training');
    try {
      const response = await axios.get('/api/predictions', {
        params: { action: 'train' }
      });
      setTrainingStatus('completed');
      alert('模型訓練完成！');
    } catch (error) {
      setTrainingStatus('failed');
      alert('模型訓練失敗：' + error.response?.data?.error);
    }
  };

  const evaluateModel = async () => {
    try {
      const response = await axios.get('/api/predictions', {
        params: { action: 'evaluate' }
      });
      setEvaluationResult(response.data.data);
    } catch (error) {
      alert('模型評估失敗：' + error.response?.data?.error);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [selectedSymbol, selectedExchange, predictionType]);

  const renderFundingRatePrediction = () => {
    if (!predictions.currentRate) return null;
    
    const chartData = {
      labels: ['當前費率', '預測費率'],
      datasets: [{
        label: '資金費率 (%)',
        data: [parseFloat(predictions.currentRate), parseFloat(predictions.predictedRate)],
        backgroundColor: ['#4CAF50', '#2196F3'],
        borderColor: ['#4CAF50', '#2196F3'],
        borderWidth: 2
      }]
    };

    const confidenceData = {
      labels: ['置信度', '不確定性'],
      datasets: [{
        data: [parseFloat(predictions.confidence), 100 - parseFloat(predictions.confidence)],
        backgroundColor: ['#4CAF50', '#f5f5f5'],
        borderWidth: 0
      }]
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                資金費率預測結果
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="body1">
                    當前費率: <strong>{predictions.currentRate}%</strong>
                  </Typography>
                  <Typography variant="body1">
                    預測費率: <strong>{predictions.predictedRate}%</strong>
                  </Typography>
                  <Typography variant="body1">
                    置信度: <strong>{predictions.confidence}%</strong>
                  </Typography>
                </Box>
                <Box width={200}>
                  <Bar data={chartData} height={100} />
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                特徵重要性
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {predictions.features && Object.entries(predictions.features).map(([feature, importance]) => (
                  <Chip 
                    key={feature}
                    label={`${feature}: ${importance}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                預測置信度
              </Typography>
              <Box width={150} height={150} mx="auto">
                <Doughnut data={confidenceData} />
              </Box>
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  數據品質: {predictions.dataQuality ? (predictions.dataQuality * 100).toFixed(1) + '%' : 'N/A'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  下次結算: {predictions.nextFundingTime ? new Date(predictions.nextFundingTime).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderArbitragePrediction = () => {
    if (!predictions.opportunities) return null;
    
    const getRiskColor = (risk) => {
      switch (risk) {
        case 'high': return 'error';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'default';
      }
    };

    const getUrgencyIcon = (urgency) => {
      switch (urgency) {
        case 'high': return <Warning color="error" />;
        case 'medium': return <Warning color="warning" />;
        case 'low': return <CheckCircle color="success" />;
        default: return null;
      }
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                套利機會預測
              </Typography>
              
              {predictions.opportunities.length === 0 ? (
                <Alert severity="info">
                  目前沒有發現明顯的套利機會
                </Alert>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>套利類型</TableCell>
                      <TableCell>做多交易所</TableCell>
                      <TableCell>做空交易所</TableCell>
                      <TableCell>預期收益</TableCell>
                      <TableCell>置信度</TableCell>
                      <TableCell>緊急程度</TableCell>
                      <TableCell>風險等級</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {predictions.opportunities.map((opp, index) => (
                      <TableRow key={index}>
                        <TableCell>{opp.type}</TableCell>
                        <TableCell>{opp.longExchange}</TableCell>
                        <TableCell>{opp.shortExchange}</TableCell>
                        <TableCell>
                          <Typography color="primary" fontWeight="bold">
                            {opp.expectedReturn}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <LinearProgress 
                            variant="determinate" 
                            value={parseFloat(opp.confidence)} 
                            sx={{ width: 60 }}
                          />
                          <Typography variant="caption">
                            {opp.confidence}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getUrgencyIcon(opp.urgency)}
                            <Typography variant="caption">
                              {opp.urgency}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={opp.risk} 
                            color={getRiskColor(opp.risk)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {predictions.summary && (
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    {predictions.summary}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderMarketSentimentPrediction = () => {
    if (!predictions.sentiment) return null;
    
    const getSentimentColor = (sentiment) => {
      switch (sentiment) {
        case 'bullish': return 'success';
        case 'slightly_bullish': return 'success';
        case 'neutral': return 'default';
        case 'slightly_bearish': return 'warning';
        case 'bearish': return 'error';
        default: return 'default';
      }
    };

    const getSentimentIcon = (sentiment) => {
      switch (sentiment) {
        case 'bullish':
        case 'slightly_bullish':
          return <TrendingUp color="success" />;
        case 'bearish':
        case 'slightly_bearish':
          return <TrendingDown color="error" />;
        default:
          return <Psychology color="default" />;
      }
    };

    const sentimentData = {
      labels: ['看漲', '中性', '看跌'],
      datasets: [{
        data: [
          predictions.sentiment.includes('bullish') ? 60 : 20,
          predictions.sentiment === 'neutral' ? 60 : 20,
          predictions.sentiment.includes('bearish') ? 60 : 20
        ],
        backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
        borderWidth: 0
      }]
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                市場情緒分析
              </Typography>
              
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {getSentimentIcon(predictions.sentiment)}
                <Typography variant="h5">
                  情緒評分: {predictions.score}
                </Typography>
                <Chip 
                  label={predictions.sentiment} 
                  color={getSentimentColor(predictions.sentiment)}
                />
              </Box>
              
              <Typography variant="body1" paragraph>
                {predictions.analysis}
              </Typography>
              
              {predictions.indicators && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    市場指標
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        平均資金費率: {predictions.indicators.averageFundingRate}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        費率波動率: {predictions.indicators.rateVolatility}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        交易量變化: {predictions.indicators.volumeChange}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        交易所數量: {predictions.indicators.exchangeCount}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                情緒分布
              </Typography>
              <Box width={200} height={200} mx="auto">
                <Doughnut data={sentimentData} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', p: 3 }}>
      <Head>
        <title>AI 預測分析 | ArbiMaster</title>
        <meta name="description" content="基於機器學習的加密貨幣市場預測分析" />
      </Head>

      <Typography variant="h4" gutterBottom>
        🤖 AI 預測分析
      </Typography>

      {/* 控制面板 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>幣種</InputLabel>
                <Select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  label="幣種"
                >
                  {symbols.map(symbol => (
                    <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>交易所</InputLabel>
                <Select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  label="交易所"
                >
                  {exchanges.map(exchange => (
                    <MenuItem key={exchange} value={exchange}>{exchange}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>預測類型</InputLabel>
                <Select
                  value={predictionType}
                  onChange={(e) => setPredictionType(e.target.value)}
                  label="預測類型"
                >
                  {predictionTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box display="flex" gap={1}>
                <Button 
                  variant="contained" 
                  onClick={fetchPredictions}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={20} /> : '更新預測'}
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {/* 模型管理按鈕 */}
          <Box mt={2} display="flex" gap={2}>
            <Button 
              variant="outlined" 
              onClick={trainModel}
              disabled={trainingStatus === 'training'}
            >
              {trainingStatus === 'training' ? <CircularProgress size={20} /> : '訓練模型'}
            </Button>
            <Button 
              variant="outlined" 
              onClick={evaluateModel}
            >
              評估模型
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 模型評估結果 */}
      {evaluationResult && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              模型評估結果
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Typography variant="body2">損失函數: {evaluationResult.loss}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2">平均絕對誤差: {evaluationResult.mae}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2">準確率: {evaluationResult.accuracy}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2">測試樣本: {evaluationResult.testSamples}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 預測結果 */}
      <Box mt={3}>
        {predictionType === 'funding_rate' && renderFundingRatePrediction()}
        {predictionType === 'arbitrage_opportunity' && renderArbitragePrediction()}
        {predictionType === 'market_sentiment' && renderMarketSentimentPrediction()}
      </Box>
    </Box>
  );
} 