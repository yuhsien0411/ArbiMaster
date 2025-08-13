import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Box, Card, CardContent, Typography, 
  Button, Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, Chip, Grid, Paper,
  Tabs, Tab, Divider, LinearProgress, Accordion,
  AccordionSummary, AccordionDetails, List, ListItem,
  ListItemText, ListItemIcon, AlertTitle
} from '@mui/material';
import { 
  TrendingUp, TrendingDown, Psychology, 
  Analytics, Warning, CheckCircle, Error,
  ExpandMore, Timeline, Assessment, Security,
  Lightbulb, Info, TrendingFlat, Speed
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

export default function RealisticPredictions() {
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [selectedExchange, setSelectedExchange] = useState('Binance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const symbols = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'DOGE', 'SUI', 'LINK', 'ADA', 'TRX'];
  const exchanges = ['Binance', 'Bybit', 'OKX', 'Bitget', 'Gate.io', 'HyperLiquid'];

  // 獲取綜合分析
  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/realistic-predictions', {
        params: {
          symbol: selectedSymbol,
          exchange: selectedExchange,
          action: 'analysis'
        }
      });
      
      if (response.data.success) {
        setPrediction(response.data.data.prediction);
        setHistory(response.data.data.history);
        setPerformance(response.data.data.performance);
        setAnalysis(response.data.data.analysis);
      }
    } catch (error) {
      setError(error.response?.data?.error || '獲取分析失敗');
    } finally {
      setLoading(false);
    }
  };

  // 獲取歷史記錄
  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/realistic-predictions', {
        params: {
          symbol: selectedSymbol,
          exchange: selectedExchange,
          action: 'history'
        }
      });
      
      if (response.data.success) {
        setHistory(response.data.data.history);
      }
    } catch (error) {
      console.error('獲取歷史記錄失敗:', error);
    }
  };

  // 獲取性能統計
  const fetchPerformance = async () => {
    try {
      const response = await axios.get('/api/realistic-predictions', {
        params: { action: 'performance' }
      });
      
      if (response.data.success) {
        setPerformance(response.data.data);
      }
    } catch (error) {
      console.error('獲取性能統計失敗:', error);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [selectedSymbol, selectedExchange]);

  useEffect(() => {
    fetchPerformance();
  }, []);

  // 渲染預測摘要
  const renderPredictionSummary = () => {
    if (!prediction) return null;

    const getChangeColor = (change) => {
      const numChange = parseFloat(change);
      return numChange > 0 ? 'success' : numChange < 0 ? 'error' : 'default';
    };

    const getConfidenceColor = (confidence) => {
      const numConfidence = parseFloat(confidence);
      if (numConfidence >= 80) return 'success';
      if (numConfidence >= 60) return 'warning';
      return 'error';
    };

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🔮 AI 預測摘要
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="primary">
                  {prediction.symbol} / {prediction.exchange}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  預測時間: {new Date(prediction.predictionTime).toLocaleString()}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ mr: 2 }}>
                  {prediction.currentRate}%
                </Typography>
                <Chip 
                  label={`${prediction.predictedChange > 0 ? '+' : ''}${prediction.predictedChange}%`}
                  color={getChangeColor(prediction.predictedChange)}
                  icon={prediction.predictedChange > 0 ? <TrendingUp /> : <TrendingDown />}
                />
                <Typography variant="h4" sx={{ ml: 2 }}>
                  → {prediction.predictedRate}%
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  預測置信度
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={parseFloat(prediction.confidence)}
                    size={80}
                    color={getConfidenceColor(prediction.confidence)}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h6" component="div">
                      {prediction.confidence}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // 渲染交易建議
  const renderTradingAdvice = () => {
    if (!prediction?.tradingAdvice) return null;

    const getActionColor = (action) => {
      switch (action) {
        case 'long': return 'success';
        case 'short': return 'error';
        default: return 'warning';
      }
    };

    const getActionIcon = (action) => {
      switch (action) {
        case 'long': return <TrendingUp />;
        case 'short': return <TrendingDown />;
        default: return <TrendingFlat />;
      }
    };

    const getRiskColor = (riskLevel) => {
      switch (riskLevel) {
        case 'high': return 'error';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'default';
      }
    };

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            💡 交易建議
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  建議操作
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={prediction.tradingAdvice.action.toUpperCase()}
                    color={getActionColor(prediction.tradingAdvice.action)}
                    icon={getActionIcon(prediction.tradingAdvice.action)}
                    size="large"
                  />
                </Box>
                <Typography variant="body1" gutterBottom>
                  預期收益: {prediction.tradingAdvice.expectedReturn}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  時間週期: {prediction.tradingAdvice.timeHorizon}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  風險評估
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={`風險等級: ${prediction.tradingAdvice.riskLevel.toUpperCase()}`}
                    color={getRiskColor(prediction.tradingAdvice.riskLevel)}
                    icon={<Security />}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  最大損失: {prediction.riskAssessment.maxLoss}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  止損點: {prediction.riskAssessment.stopLoss}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              建議理由
            </Typography>
            <List dense>
              {prediction.tradingAdvice.reasoning.map((reason, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Lightbulb color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={reason} />
                </ListItem>
              ))}
            </List>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // 渲染技術分析
  const renderTechnicalAnalysis = () => {
    if (!prediction?.technicalIndicators) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            📊 技術分析
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  MA7
                </Typography>
                <Typography variant="h4">
                  {prediction.technicalIndicators.ma7}%
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  MA14
                </Typography>
                <Typography variant="h4">
                  {prediction.technicalIndicators.ma14}%
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  RSI
                </Typography>
                <Typography variant="h4">
                  {prediction.technicalIndicators.rsi}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  波動率
                </Typography>
                <Typography variant="h4">
                  {prediction.technicalIndicators.volatility}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              趨勢分析
            </Typography>
            <Chip
              label={`趨勢: ${prediction.technicalIndicators.trend === 'bullish' ? '看漲' : '看跌'}`}
              color={prediction.technicalIndicators.trend === 'bullish' ? 'success' : 'error'}
              icon={prediction.technicalIndicators.trend === 'bullish' ? <TrendingUp /> : <TrendingDown />}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              動量: {prediction.technicalIndicators.momentum}%
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // 渲染市場情緒
  const renderMarketSentiment = () => {
    if (!prediction?.marketSentiment) return null;

    const getSentimentColor = (sentiment) => {
      switch (sentiment) {
        case 'bullish': return 'success';
        case 'bearish': return 'error';
        default: return 'warning';
      }
    };

    const getSentimentIcon = (sentiment) => {
      switch (sentiment) {
        case 'bullish': return <TrendingUp />;
        case 'bearish': return <TrendingDown />;
        default: return <TrendingFlat />;
      }
    };

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🧠 市場情緒分析
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  情緒評分
                </Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={prediction.marketSentiment.score}
                    size={100}
                    color={getSentimentColor(prediction.marketSentiment.sentiment)}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" component="div">
                      {prediction.marketSentiment.score}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={prediction.marketSentiment.sentiment === 'bullish' ? '看漲' : 
                         prediction.marketSentiment.sentiment === 'bearish' ? '看跌' : '中性'}
                  color={getSentimentColor(prediction.marketSentiment.sentiment)}
                  icon={getSentimentIcon(prediction.marketSentiment.sentiment)}
                  size="large"
                />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                情緒指標
              </Typography>
              <List dense>
                {prediction.marketSentiment.indicators.map((indicator, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Psychology color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={indicator} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // 渲染模型性能
  const renderModelPerformance = () => {
    if (!performance) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            📈 模型性能統計
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  預測準確率
                </Typography>
                <Typography variant="h3" color="success.main">
                  {performance.accuracy.toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  總預測次數
                </Typography>
                <Typography variant="h3" color="info.main">
                  {performance.totalPredictions}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  正確預測
                </Typography>
                <Typography variant="h3" color="success.main">
                  {performance.correctPredictions}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              最後更新: {performance.lastUpdated ? new Date(performance.lastUpdated).toLocaleString() : '未知'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // 渲染綜合分析
  const renderComprehensiveAnalysis = () => {
    if (!analysis) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            📋 綜合分析報告
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">分析摘要</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                {analysis.summary}
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">關鍵洞察</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {analysis.keyInsights.map((insight, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Lightbulb color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={insight} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">交易建議</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {analysis.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">風險警告</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {analysis.riskWarnings.map((warning, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Warning color="error" />
                    </ListItemIcon>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">市場背景</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1">
                {analysis.marketContext}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Head>
        <title>AI 實用預測分析 - ArbiMaster</title>
        <meta name="description" content="基於真實數據的AI資金費率預測分析，提供交易建議和風險評估" />
      </Head>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          🤖 AI 實用預測分析
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          基於真實市場數據的多因子分析，提供資金費率預測、交易建議和風險評估
        </Typography>

        {/* 控制面板 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>選擇幣種</InputLabel>
                  <Select
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    label="選擇幣種"
                  >
                    {symbols.map((symbol) => (
                      <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>選擇交易所</InputLabel>
                  <Select
                    value={selectedExchange}
                    onChange={(e) => setSelectedExchange(e.target.value)}
                    label="選擇交易所"
                  >
                    {exchanges.map((exchange) => (
                      <MenuItem key={exchange} value={exchange}>{exchange}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  onClick={fetchAnalysis}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? <CircularProgress size={20} /> : '更新分析'}
                </Button>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  onClick={fetchHistory}
                  fullWidth
                >
                  查看歷史
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 錯誤提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <AlertTitle>錯誤</AlertTitle>
            {error}
          </Alert>
        )}

        {/* 載入中 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {/* 內容區域 */}
        {prediction && !loading && (
          <>
            {renderPredictionSummary()}
            {renderTradingAdvice()}
            {renderTechnicalAnalysis()}
            {renderMarketSentiment()}
            {renderModelPerformance()}
            {renderComprehensiveAnalysis()}
          </>
        )}

        {/* 免責聲明 */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>免責聲明</AlertTitle>
          本AI預測系統僅供參考，不構成投資建議。投資有風險，請謹慎決策。
        </Alert>
      </Box>
    </>
  );
} 