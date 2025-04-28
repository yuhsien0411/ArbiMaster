import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Container, Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, LinearProgress, Card, Grid,
  FormControl, InputLabel, Select, MenuItem, Chip, Button, Tooltip,
  IconButton, useTheme, useMediaQuery, TextField, InputAdornment
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import { useRouter } from 'next/router';
import BinanceOpenInterestHistoryChart from '../components/BinanceOpenInterestHistoryChart';

// 預設顯示的九個幣種
const DEFAULT_COINS = ['BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'DOGE', 'SUI', 'LINK', 'ADA', 'TRX'];

// 定義顏色主題
const customTheme = {
  light: {
    background: '#f8f9fa',
    paper: '#ffffff',
    text: {
      primary: '#2c3e50',
      secondary: '#6c757d'
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    tableHeader: '#f8f9fa',
    tableRow: {
      even: '#ffffff',
      odd: '#ffffff',
      hover: '#f8f9fa'
    },
    card: {
      background: '#ffffff',
      text: '#2c3e50'
    }
  },
  dark: {
    background: '#0d1117',
    paper: '#161b22',
    text: {
      primary: '#e6edf3',
      secondary: '#8b949e'
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    tableHeader: '#21262d',
    tableRow: {
      even: '#0d1117',
      odd: '#161b22',
      hover: '#1c2128'
    },
    card: {
      background: '#161b22',
      text: '#e6edf3'
    }
  }
};

export default function OpenInterest() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [openInterestData, setOpenInterestData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [error, setError] = useState(null);
  const [selectedExchange, setSelectedExchange] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [counts, setCounts] = useState({
    binance: 0,
    bybit: 0,
    okx: 0,
    total: 0
  });
  const [exchangeStatus, setExchangeStatus] = useState({
    binance: true,
    bybit: true,
    okx: true
  });
  const [selectedSymbol, setSelectedSymbol] = useState(DEFAULT_COINS[0]);

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 獲取當前主題顏色
  const currentTheme = darkMode ? customTheme.dark : customTheme.light;

  // 初始化暗黑模式
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // 處理搜尋
  const handleSearch = async (value) => {
    setSearchQuery(value);
    
    // 清除之前的計時器
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // 如果搜尋欄為空，回到顯示預設數據
    if (!value.trim()) {
      setIsSearching(false);
      fetchOpenInterestData();
      return;
    }
    
    // 設置新的計時器，延遲 500ms 後執行搜尋
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setLoading(true);
      
      try {
        const response = await fetch(`/api/open-interest?search=${encodeURIComponent(value)}`);
        const data = await response.json();
        
        if (data.success) {
          setOpenInterestData(data.data || []);
          setLastUpdated(data.lastUpdated);
        } else {
          setError(data.error || '搜尋失敗');
        }
      } catch (err) {
        setError('搜尋時發生錯誤: ' + err.message);
      } finally {
        setLoading(false);
      }
    }, 500);
    
    setSearchTimeout(timeoutId);
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
          okx: 0,
          total: 0
        });
        // 設置交易所狀態
        if (data.exchangeStatus) {
          setExchangeStatus(data.exchangeStatus);
        }
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
    
    // 創建一個輪詢任務來獲取最新數據
    const interval = setInterval(() => {
      fetchOpenInterestData();
    }, 60000); // 每分鐘更新一次
    
    return () => {
      // 清除輪詢任務
      clearInterval(interval);
      
      // 清除搜尋計時器
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

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

  // 篩選數據
  const filteredData = (openInterestData || [])
    .filter(item => {
      if (!item || !item.exchangeData) {
        return false;
      }

      const symbol = item.symbol?.toUpperCase() || '';
      const searchUpperCase = searchQuery.toUpperCase();
      const isDefaultCoin = DEFAULT_COINS.includes(symbol.replace('USDT', ''));

      // 如果有搜尋關鍵字，只搜尋非預設幣種
      if (searchQuery) {
        return !isDefaultCoin && symbol.includes(searchUpperCase);
      }
      
      // 沒有搜尋關鍵字時，只顯示預設幣種
      return isDefaultCoin;
    })
    .map(item => {
      if (selectedExchange === 'all') {
        return item;
      }
      
      const filteredExchangeData = item.exchangeData.filter(
        exchange => exchange && exchange.exchange === selectedExchange
      );
      
      if (filteredExchangeData.length > 0) {
        return {
          ...item,
          exchangeData: filteredExchangeData
        };
      }
      return null;
    })
    .filter(item => item !== null);

  // 獲取表格行背景顏色
  const getRowBackground = (index) => {
    return index % 2 === 0 ? currentTheme.tableRow.even : currentTheme.tableRow.odd;
  };

  // 在表格行點擊處理函數中添加
  const handleRowClick = (symbol) => {
    setSelectedSymbol(symbol);
  };

  return (
    <Box sx={{ bgcolor: currentTheme.background, minHeight: '100vh', pb: 4 }}>
      <Head>
        <title>未平倉合約數據中心 | ArbiMaster</title>
        <meta name="description" content="即時查詢各大交易所永續合約未平倉合約數據，掌握市場走勢" />
      </Head>
      
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 2 }}>
          <Typography variant="h4" component="h1" color={currentTheme.text.primary} sx={{ fontWeight: 600, mr: 2 }}>
            未平倉合約數據
          </Typography>
          
          <Box sx={{ flex: 1, mr: 2, minWidth: { xs: '100%', md: 'auto' }, order: { xs: 3, md: 2 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="搜尋幣種..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: currentTheme.text.secondary }} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: currentTheme.paper,
                  color: currentTheme.text.primary,
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: currentTheme.divider,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? '#30363d' : '#1a1a1a',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3b82f6',
                  }
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, order: { xs: 2, md: 3 } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<HomeIcon />}
              onClick={() => router.push('/')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              返回主頁
            </Button>
            <Tooltip title={darkMode ? "切換到亮色模式" : "切換到暗色模式"}>
              <IconButton
                onClick={() => {
                  const newDarkMode = !darkMode;
                  setDarkMode(newDarkMode);
                  localStorage.setItem('darkMode', newDarkMode.toString());
                }}
                sx={{ 
                  color: currentTheme.text.primary,
                  backgroundColor: currentTheme.paper,
                  border: darkMode ? '1px solid #30363d' : 'none',
                  '&:hover': {
                    backgroundColor: darkMode ? '#1c2128' : '#f0f0f0',
                  }
                }}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="刷新數據">
              <span>
                <IconButton
                  onClick={fetchOpenInterestData}
                  disabled={loading}
                  sx={{ 
                    color: loading ? currentTheme.text.secondary : currentTheme.text.primary,
                    backgroundColor: currentTheme.paper,
                    border: darkMode ? '1px solid #30363d' : 'none',
                    '&:hover': {
                      backgroundColor: darkMode ? '#1c2128' : '#f0f0f0',
                    }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* 搜尋結果提示 */}
        {searchQuery && (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" color={currentTheme.text.primary}>
              搜尋 "{searchQuery}" 的結果: {filteredData.length} 個交易對
            </Typography>
            {filteredData.length > 0 && searchQuery && (
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                  fetchOpenInterestData();
                }}
                sx={{ 
                  borderColor: currentTheme.divider,
                  color: currentTheme.text.primary,
                  '&:hover': {
                    borderColor: currentTheme.text.primary,
                    backgroundColor: 'transparent'
                  }
                }}
              >
                清除搜尋
              </Button>
            )}
          </Box>
        )}
        
        {/* 數據統計卡片 */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 3, 
              backgroundColor: currentTheme.card.background,
              color: currentTheme.card.text,
              boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
              border: darkMode ? '1px solid #30363d' : 'none',
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: darkMode ? 'none' : '0 4px 20px rgba(0,0,0,0.08)'
              }
            }}>
              <Typography variant="subtitle2" sx={{ 
                color: currentTheme.text.secondary,
                fontSize: '0.875rem',
                marginBottom: 1
              }}>
                數據更新時間
              </Typography>
              <Typography variant="h6" sx={{ 
                color: currentTheme.text.primary,
                fontWeight: 600,
                fontSize: '1.1rem'
              }}>
                {lastUpdated ? formatTime(lastUpdated) : '加載中...'}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 3, 
              backgroundColor: currentTheme.card.background,
              color: currentTheme.card.text,
              boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
              border: darkMode ? '1px solid #30363d' : 'none',
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: darkMode ? 'none' : '0 4px 20px rgba(0,0,0,0.08)'
              }
            }}>
              <Typography variant="subtitle2" sx={{ 
                color: currentTheme.text.secondary,
                fontSize: '0.875rem',
                marginBottom: 1
              }}>
                交易對數量
              </Typography>
              <Typography variant="h6" sx={{ 
                color: currentTheme.text.primary,
                fontWeight: 600,
                fontSize: '1.1rem'
              }}>
                {openInterestData ? openInterestData.length : 0}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 3, 
              backgroundColor: currentTheme.card.background,
              color: currentTheme.card.text,
              boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
              border: darkMode ? '1px solid #30363d' : 'none',
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: darkMode ? 'none' : '0 4px 20px rgba(0,0,0,0.08)'
              }
            }}>
              <Typography variant="subtitle2" sx={{ 
                color: currentTheme.text.secondary,
                fontSize: '0.875rem',
                marginBottom: 1
              }}>
                各交易所數據
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip 
                  label={`Binance: ${counts.binance || 0}`} 
                  size="small"
                  sx={{ 
                    backgroundColor: darkMode ? (exchangeStatus.binance ? '#1a2536' : '#3d1818') : (exchangeStatus.binance ? '#e3f2fd' : '#ffebee'),
                    color: darkMode ? (exchangeStatus.binance ? '#c9d1d9' : '#ff8a80') : (exchangeStatus.binance ? '#00796b' : '#c62828'),
                    border: darkMode ? '1px solid #30363d' : 'none'
                  }}
                />
                <Chip 
                  label={`Bybit: ${counts.bybit || 0}`} 
                  size="small"
                  sx={{ 
                    backgroundColor: darkMode ? (exchangeStatus.bybit ? '#33261a' : '#3d1818') : (exchangeStatus.bybit ? '#fff3e0' : '#ffebee'),
                    color: darkMode ? (exchangeStatus.bybit ? '#c9d1d9' : '#ff8a80') : (exchangeStatus.bybit ? '#ff8f00' : '#c62828'),
                    border: darkMode ? '1px solid #30363d' : 'none'
                  }}
                />
                <Chip 
                  label={`OKX: ${counts.okx || 0}`} 
                  size="small"
                  sx={{ 
                    backgroundColor: darkMode ? '#1a2e1a' : '#e8f5e9',
                    color: darkMode ? '#c9d1d9' : '#1a1a1a',
                    border: darkMode ? '1px solid #30363d' : 'none'
                  }}
                />
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              p: 3, 
              backgroundColor: currentTheme.card.background,
              color: currentTheme.card.text,
              boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
              border: darkMode ? '1px solid #30363d' : 'none',
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: darkMode ? 'none' : '0 4px 20px rgba(0,0,0,0.08)'
              }
            }}>
              <Typography variant="subtitle2" sx={{ 
                color: currentTheme.text.secondary,
                fontSize: '0.875rem',
                marginBottom: 1
              }}>
                篩選交易所
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <Select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  sx={{ 
                    backgroundColor: currentTheme.paper,
                    color: currentTheme.text.primary,
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: currentTheme.divider,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? '#30363d' : '#1a1a1a',
                    },
                  }}
                >
                  <MenuItem value="all">全部交易所</MenuItem>
                  <MenuItem value="Binance">Binance</MenuItem>
                  <MenuItem value="Bybit">Bybit</MenuItem>
                  <MenuItem value="OKX">OKX</MenuItem>
                </Select>
              </FormControl>
            </Card>
          </Grid>
        </Grid>

        {/* 交易所狀態提示 */}
        {(!exchangeStatus.binance || !exchangeStatus.bybit || !exchangeStatus.okx) && (
          <Paper 
            sx={{ 
              p: 3, 
              mb: 4, 
              backgroundColor: darkMode ? 'rgba(255, 185, 0, 0.1)' : '#fff8e1',
              border: '1px solid',
              borderColor: darkMode ? '#d29922' : '#ffd54f',
              color: darkMode ? '#ffd54f' : '#b45309',
              borderRadius: '12px'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <InfoIcon sx={{ color: 'inherit' }} />
              <Typography sx={{ lineHeight: 1.6 }}>
                部分交易所數據暫時無法獲取：
                {!exchangeStatus.binance && ' Binance'}
                {!exchangeStatus.bybit && ' Bybit'}
                。這是暫時性的，請稍後再試。
              </Typography>
            </Box>
          </Paper>
        )}

        {/* 錯誤提示 */}
        {error && (
          <Paper 
            sx={{ 
              p: 3, 
              mb: 4, 
              backgroundColor: currentTheme.paper,
              color: currentTheme.text.secondary
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
            backgroundColor: currentTheme.paper,
            boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
            border: darkMode ? '1px solid #30363d' : 'none',
            borderRadius: '12px',
            mb: 4
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: currentTheme.tableHeader,
                '& th': {
                  borderBottom: `2px solid ${currentTheme.divider}`,
                  padding: '16px'
                }
              }}>
                <TableCell sx={{ 
                  color: currentTheme.text.primary, 
                  fontWeight: 600,
                  width: '80px'
                }}>排名</TableCell>
                <TableCell sx={{ 
                  color: currentTheme.text.primary, 
                  fontWeight: 600
                }}>交易對</TableCell>
                <TableCell sx={{ 
                  color: currentTheme.text.primary, 
                  fontWeight: 600
                }}>總未平倉量(美元)</TableCell>
                <TableCell sx={{ 
                  color: currentTheme.text.primary, 
                  fontWeight: 600
                }}>交易所分佈</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRow 
                    key={item.symbol || index}
                    onClick={() => handleRowClick(item.symbol)}
                    sx={{ 
                      backgroundColor: getRowBackground(index),
                      '&:hover': { backgroundColor: currentTheme.tableRow.hover },
                      '& td': {
                        borderBottom: `1px solid ${currentTheme.divider}`
                      },
                      cursor: 'pointer'
                    }}
                  >
                    <TableCell sx={{ color: currentTheme.text.primary }}>{index + 1}</TableCell>
                    <TableCell sx={{ color: currentTheme.text.primary }}>
                      <strong>{item.symbol || '未知'}</strong>
                    </TableCell>
                    <TableCell sx={{ color: currentTheme.text.primary }}>
                      {formatAmount(item.totalNotionalValue || 0)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {(item.exchangeData || [])
                          .map((exchange, idx) => (
                            <Chip 
                              key={`${exchange.exchange || 'unknown'}-${idx}`}
                              size="small"
                              label={`${exchange.exchange || '未知'}: ${formatAmount(exchange.notionalValue || 0)}`}
                              sx={{ 
                                backgroundColor: darkMode ? (
                                  exchange.exchange === 'Binance' ? '#1a2536' :
                                  '#33261a'
                                ) : (
                                  exchange.exchange === 'Binance' ? '#e3f2fd' :
                                  '#fff3e0'
                                ),
                                color: darkMode ? '#c9d1d9' : '#1a1a1a',
                                border: darkMode ? '1px solid #30363d' : 'none'
                              }}
                            />
                          ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={4} 
                    align="center" 
                    sx={{ 
                      color: currentTheme.text.secondary,
                      borderBottom: `1px solid ${currentTheme.divider}`
                    }}
                  >
                    {loading ? '正在加載數據...' : '沒有找到未平倉合約數據'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 畢安合約持倉價值與價格對比圖表 */}
        <div style={{ marginTop: '40px' }}>
          <BinanceOpenInterestHistoryChart symbol={selectedSymbol} />
        </div>

        {/* 底部備註 */}
        <Box sx={{ 
          mt: 4, 
          color: currentTheme.text.secondary, 
          fontSize: '0.875rem',
          backgroundColor: currentTheme.paper,
          padding: 3,
          borderRadius: '12px',
          border: darkMode ? '1px solid #30363d' : 'none'
        }}>
          <Typography variant="caption" display="block" sx={{ mb: 1, lineHeight: 1.6 }}>
            * 未平倉量顯示為美元價值，由各交易所返回的合約數量乘以當前價格計算
          </Typography>
          <Typography variant="caption" display="block" sx={{ lineHeight: 1.6 }}>
            * 數據每1分鐘自動更新一次，也可手動點擊刷新按鈕獲取最新數據
          </Typography>
        </Box>
      </Container>
    </Box>
  );
} 