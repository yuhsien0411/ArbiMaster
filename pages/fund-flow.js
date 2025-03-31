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
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HomeIcon from '@mui/icons-material/Home';

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
                      <Typography variant="h6" textTransform="capitalize">
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