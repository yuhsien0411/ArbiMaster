import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Container, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, LinearProgress, Card, Grid,
  FormControl, InputLabel, Select, MenuItem, Chip, Button, Tooltip,
  IconButton, useTheme, useMediaQuery
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { io } from 'socket.io-client';

export default function OpenInterest() {
  const [loading, setLoading] = useState(true);
  const [openInterestData, setOpenInterestData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [error, setError] = useState(null);
  const [selectedExchange, setSelectedExchange] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [counts, setCounts] = useState({
    binance: 0,
    bybit: 0,
    bitget: 0,
    total: 0
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 初始化暗黑模式（從本地存儲讀取）
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // 切換暗黑模式時保存到本地存儲
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    document.body.style.backgroundColor = darkMode ? '#121212' : '#f5f5f5';
  }, [darkMode]);

  // 格式化金額為易讀格式
  const formatAmount = (amount) => {
    // 檢查amount是否為null或undefined
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00';
    }
    
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`;
    } else {
      return amount.toFixed(2);
    }
  };

  // 格式化時間為相對時間
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diff = Math.floor((now - updateTime) / 1000);
    
    if (diff < 60) {
      return `${diff}秒前`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}分鐘前`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)}小時前`;
    } else {
      return `${Math.floor(diff / 86400)}天前`;
    }
  };

  // 獲取未平倉合約數據
  const fetchOpenInterestData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/open-interest');
      const data = await response.json();
      
      if (data.success) {
        setOpenInterestData(data.data || []);
        setLastUpdated(data.lastUpdated);
        setCounts(data.counts || {
          binance: 0,
          bybit: 0,
          bitget: 0,
          total: 0
        });
      } else {
        setError(data.error || '獲取數據失敗');
      }
    } catch (err) {
      setError('獲取數據時發生錯誤: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加載數據
  useEffect(() => {
    fetchOpenInterestData();
    
    // 設置 WebSocket 連接
    let socket;
    try {
      socket = io();
      
      socket.on('connect', () => {
        console.log('WebSocket connected');
      });
      
      socket.on('open-interest-update', (data) => {
        if (data && data.data) {
          setOpenInterestData(data.data);
          setLastUpdated(data.lastUpdated);
          setCounts(data.counts || {
            binance: 0,
            bybit: 0,
            bitget: 0,
            total: 0
          });
        }
        setLoading(false);
      });
      
      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });
      
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (err) {
      console.error('WebSocket initialization error:', err);
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // 篩選數據
  const filteredData = (openInterestData || []).map(item => {
    if (!item || !item.exchangeData) {
      return null;
    }
    
    if (selectedExchange === 'all') {
      return item;
    } else {
      const filteredExchangeData = item.exchangeData.filter(exchange => exchange && exchange.exchange === selectedExchange);
      if (filteredExchangeData.length > 0) {
        return {
          ...item,
          exchangeData: filteredExchangeData
        };
      }
      return null;
    }
  }).filter(item => item !== null && item.exchangeData && item.exchangeData.length > 0);

  // 獲取表格行背景顏色
  const getRowBackground = (index, darkMode) => {
    if (darkMode) {
      return index % 2 === 0 ? '#2a2a2a' : '#333333';
    }
    return index % 2 === 0 ? '#f9f9f9' : '#ffffff';
  };

  return (
    <>
      <Head>
        <title>未平倉合約 - 加密貨幣數據中心</title>
        <meta name="description" content="查看合約未平倉量數據" />
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: darkMode ? '#ffffff' : '#333333' }}>
            未平倉合約
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Tooltip title={darkMode ? "切換到亮色模式" : "切換到暗色模式"}>
              <IconButton onClick={() => setDarkMode(!darkMode)} size="small">
                {darkMode ? <LightModeIcon sx={{ color: '#ffffff' }} /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={fetchOpenInterestData}
              disabled={loading}
              sx={{ 
                borderColor: darkMode ? '#666' : '#ccc',
                color: darkMode ? '#fff' : '#333'
              }}
            >
              刷新數據
            </Button>
          </Box>
        </Box>

        {/* 數據統計卡片 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 2, 
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#333',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ color: darkMode ? '#bbb' : '#666' }}>
                數據更新時間
              </Typography>
              <Typography variant="h6">
                {lastUpdated ? formatTime(lastUpdated) : '加載中...'}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 2, 
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#333',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ color: darkMode ? '#bbb' : '#666' }}>
                交易對數量
              </Typography>
              <Typography variant="h6">
                {openInterestData ? openInterestData.length : 0}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 2, 
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#333',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ color: darkMode ? '#bbb' : '#666' }}>
                各交易所數據
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip label={`Binance: ${counts.binance || 0}`} size="small" 
                  sx={{ backgroundColor: darkMode ? '#444' : '#e0f7fa', color: darkMode ? '#fff' : '#00796b' }} />
                <Chip label={`Bybit: ${counts.bybit || 0}`} size="small" 
                  sx={{ backgroundColor: darkMode ? '#444' : '#fff8e1', color: darkMode ? '#fff' : '#ff8f00' }} />
                <Chip label={`Bitget: ${counts.bitget || 0}`} size="small" 
                  sx={{ backgroundColor: darkMode ? '#444' : '#e8f5e9', color: darkMode ? '#fff' : '#2e7d32' }} />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 2, 
              backgroundColor: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#333',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="subtitle2" color="textSecondary" sx={{ color: darkMode ? '#bbb' : '#666' }}>
                篩選交易所
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <Select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  sx={{ 
                    backgroundColor: darkMode ? '#222' : '#fff',
                    color: darkMode ? '#fff' : '#333',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? '#666' : '#ddd',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? '#999' : '#bbb',
                    },
                  }}
                >
                  <MenuItem value="all">全部交易所</MenuItem>
                  <MenuItem value="Binance">Binance</MenuItem>
                  <MenuItem value="Bybit">Bybit</MenuItem>
                  <MenuItem value="Bitget">Bitget</MenuItem>
                </Select>
              </FormControl>
            </Card>
          </Grid>
        </Grid>

        {/* 錯誤提示 */}
        {error && (
          <Paper 
            sx={{ 
              p: 2, 
              mb: 3, 
              backgroundColor: darkMode ? '#422' : '#ffebee',
              color: darkMode ? '#f88' : '#c62828'
            }}
          >
            <Typography>{error}</Typography>
          </Paper>
        )}

        {/* 數據加載提示 */}
        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* 數據表格 */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            overflow: 'auto',
            backgroundColor: darkMode ? '#222' : '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: darkMode ? '#333' : '#f5f5f5' }}>
                <TableCell sx={{ color: darkMode ? '#fff' : '#333', fontWeight: 'bold' }}>排名</TableCell>
                <TableCell sx={{ color: darkMode ? '#fff' : '#333', fontWeight: 'bold' }}>交易對</TableCell>
                <TableCell sx={{ color: darkMode ? '#fff' : '#333', fontWeight: 'bold' }}>總未平倉量</TableCell>
                <TableCell sx={{ color: darkMode ? '#fff' : '#333', fontWeight: 'bold' }}>交易所分佈</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRow 
                    key={item.symbol || index}
                    sx={{ 
                      backgroundColor: getRowBackground(index, darkMode),
                      '&:hover': { backgroundColor: darkMode ? '#444' : '#f5f5f5' }
                    }}
                  >
                    <TableCell sx={{ color: darkMode ? '#ddd' : '#333' }}>{index + 1}</TableCell>
                    <TableCell sx={{ color: darkMode ? '#ddd' : '#333' }}>
                      <strong>{item.symbol || '未知'}</strong>
                    </TableCell>
                    <TableCell sx={{ color: darkMode ? '#ddd' : '#333' }}>
                      {formatAmount(item.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {(item.exchangeData || []).map((exchange, idx) => (
                          <Chip 
                            key={`${exchange.exchange || 'unknown'}-${idx}`}
                            size="small"
                            label={`${exchange.exchange || '未知'}: ${formatAmount(exchange.amount)}`}
                            sx={{ 
                              backgroundColor: 
                                exchange.exchange === 'Binance' ? (darkMode ? '#1a2536' : '#e3f2fd') :
                                exchange.exchange === 'Bybit' ? (darkMode ? '#33261a' : '#fff3e0') :
                                (darkMode ? '#1a2e1a' : '#e8f5e9'),
                              color: darkMode ? '#bbb' : '#333'
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: darkMode ? '#bbb' : '#666' }}>
                    {loading ? '正在加載數據...' : '沒有找到未平倉合約數據'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 底部備註 */}
        <Box sx={{ mt: 3, color: darkMode ? '#bbb' : '#666', fontSize: '0.875rem' }}>
          <Typography variant="caption" display="block">
            * 未平倉量單位根據各交易所返回格式，可能是合約數量或是合約價值(美元)
          </Typography>
          <Typography variant="caption" display="block">
            * 數據每1分鐘自動更新一次，也可手動點擊刷新按鈕獲取最新數據
          </Typography>
        </Box>
      </Container>
    </>
  );
} 