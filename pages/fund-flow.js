import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Paper,
  Divider,
  Button,
  Alert,
  AlertTitle
} from '@mui/material';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HomeIcon from '@mui/icons-material/Home';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out',
}));

const FlowIndicator = styled(Box)(({ theme, ispositive }) => ({
  display: 'flex',
  alignItems: 'center',
  color: ispositive === 'true' ? theme.palette.success.main : theme.palette.error.main,
  '& svg': {
    marginRight: theme.spacing(1),
  },
}));

const InfoCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.grey[50],
  '& .MuiTypography-root': {
    marginBottom: theme.spacing(1),
  },
}));

const AnalysisCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
}));

export default function FundFlow() {
  const router = useRouter();
  const [flowData, setFlowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatFlow = (flow) => {
    if (flow === null || flow === undefined || isNaN(flow)) {
      return '0.00';
    }
    
    const absFlow = Math.abs(flow);
    if (absFlow >= 1e9) {
      return `${(flow / 1e9).toFixed(2)}B`;
    } else if (absFlow >= 1e6) {
      return `${(flow / 1e6).toFixed(2)}M`;
    } else if (absFlow >= 1e3) {
      return `${(flow / 1e3).toFixed(2)}K`;
    }
    return flow.toFixed(2);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/fund-flow');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setFlowData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分鐘更新一次
    return () => clearInterval(interval);
  }, []);

  // 添加市場趨勢分析函數
  const analyzeMarketTrend = (flowData) => {
    if (!flowData) return null;
    
    const { total } = flowData;
    const netFlow = total?.netFlow || 0;
    const volume24h = total?.volume24h || 0;
    
    // 計算資金流向強度（資金流向佔24小時成交量的百分比）
    const flowStrength = volume24h ? (Math.abs(netFlow) / volume24h) * 100 : 0;
    
    // 分析市場趨勢
    let trend = {
      direction: netFlow > 0 ? '淨流入' : '淨流出',
      strength: flowStrength < 1 ? '弱' : flowStrength < 5 ? '中等' : '強',
      signal: 'neutral'
    };
    
    // 根據大額交易和資金流向判斷信號
    if (netFlow > 0 && flowStrength > 3) {
      trend.signal = 'bullish';
    } else if (netFlow < 0 && flowStrength > 3) {
      trend.signal = 'bearish';
    }
    
    return trend;
  };

  const marketTrend = flowData ? analyzeMarketTrend(flowData) : null;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Head>
        <title>交易所資金流向 - 加密貨幣數據中心</title>
        <meta name="description" content="即時查看各大交易所的資金流向數據" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ mb: 0, fontWeight: 'bold' }}
          >
            交易所資金流向
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<HomeIcon />}
            onClick={() => router.push('/')}
          >
            返回主頁
          </Button>
        </Box>

        <AnalysisCard elevation={2}>
          <Box display="flex" alignItems="center" mb={2}>
            <ShowChartIcon color="primary" sx={{ mr: 2 }} />
            <Typography variant="h6" component="h2">
              市場趨勢分析
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="body1" paragraph>
                資金流向分析是觀察市場情緒和大戶行為的重要指標。通過監控交易所之間的資金流動，
                我們可以更好地理解市場參與者的行為和可能的價格走勢。
              </Typography>
              {marketTrend && (
                <Alert 
                  severity={
                    marketTrend.signal === 'bullish' ? 'success' : 
                    marketTrend.signal === 'bearish' ? 'error' : 
                    'info'
                  }
                  sx={{ mb: 2 }}
                >
                  <AlertTitle>當前市場趨勢</AlertTitle>
                  市場呈現{marketTrend.direction}趨勢，強度{marketTrend.strength}
                  {marketTrend.strength === '強' && '，建議密切關注市場變化'}
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    指標說明
                  </Typography>
                  <Typography variant="body2" paragraph>
                    • 淨流入：表示資金正在進入市場
                  </Typography>
                  <Typography variant="body2" paragraph>
                    • 淨流出：表示資金正在離開市場
                  </Typography>
                  <Typography variant="body2">
                    • 大額交易：單筆超過10萬USDT的交易
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </AnalysisCard>

        <InfoCard elevation={0}>
          <Box display="flex" alignItems="center" mb={1}>
            <InfoIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">數據說明</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            • 資金流向數據基於最近1000筆交易計算，反映當前市場趨勢
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 大額交易定義為單筆交易金額超過10萬USDT
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 數據每分鐘自動更新，確保及時性
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 目前支援 BTC/USDT 交易對的資金流向監控
          </Typography>
        </InfoCard>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5" gutterBottom>
                    總體資金流向
                  </Typography>
                  <Tooltip title="顯示所有交易所的淨流入/流出總和">
                    <IconButton size="small">
                      <HelpOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <FlowIndicator ispositive={((flowData?.total?.netFlow || 0) > 0).toString()}>
                  {(flowData?.total?.netFlow || 0) > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  <Typography variant="h4">
                    {formatFlow(flowData?.total?.netFlow)} USDT
                  </Typography>
                </FlowIndicator>
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    24小時成交量：{formatFlow(flowData?.total?.volume24h)} USDT
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    大額交易次數：{flowData?.total?.largeOrdersCount || 0} 次
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    最後更新：{new Date(flowData?.total?.timestamp || Date.now()).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>

          {Object.entries(flowData || {})
            .filter(([key]) => key !== 'total')
            .map(([exchange, data]) => (
              <Grid item xs={12} md={4} key={exchange}>
                <StyledCard>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" textTransform="uppercase">
                        {exchange}
                      </Typography>
                      <Chip
                        label={(data?.netFlow || 0) > 0 ? '淨流入' : '淨流出'}
                        color={(data?.netFlow || 0) > 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <FlowIndicator ispositive={((data?.netFlow || 0) > 0).toString()}>
                      {(data?.netFlow || 0) > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      <Typography variant="h6">
                        {formatFlow(data?.netFlow)} USDT
                      </Typography>
                    </FlowIndicator>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        24小時成交量：{formatFlow(data?.volume24h)} USDT
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        大額交易次數：{data?.largeOrdersCount || 0} 次
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        最後更新：{new Date(data?.timestamp || Date.now()).toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
        </Grid>
      </Container>
    </>
  );
} 