import React, { useState, useEffect } from 'react';
import {
  Line,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line as LineChart } from 'react-chartjs-2';
import { Box, FormControl, InputLabel, Select, MenuItem, Paper, Typography, Card, CardContent } from '@mui/material';
import { zhTW } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const BinanceOpenInterestHistoryChart = ({ symbol }) => {
  const [openInterestData, setOpenInterestData] = useState([]);
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('1h');
  const [timeRange, setTimeRange] = useState('default');

  // 根據所選時間週期獲取可用的時間範圍選項
  const getTimeRangeOptions = () => {
    switch (period) {
      case '5m':
      case '15m':
      case '30m':
        return [
          { value: 'default', label: '預設' },
          { value: '2days', label: '2天' }
        ];
      case '1h':
      case '2h':
      case '4h':
      case '6h':
      case '12h':
      case '1d':
        return [
          { value: 'default', label: '預設' },
          { value: '7days', label: '7天' },
          { value: '14days', label: '14天' },
          { value: '30days', label: '30天' }
        ];
      default:
        return [{ value: 'default', label: '預設' }];
    }
  };

  // 當時間週期改變時，檢查並調整時間範圍
  useEffect(() => {
    const timeRangeOptions = getTimeRangeOptions();
    // 如果當前選擇的時間範圍在新的週期中不可用，則重置為預設
    if (!timeRangeOptions.some(option => option.value === timeRange)) {
      setTimeRange('default');
    }
  }, [period]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 處理幣對名稱
        // 1. 去除非USDT的後綴，如果有（例如 TIAUSDC -> TIA）
        // 2. 確保以USDT結尾
        let symbolForRequest = symbol;
        
        // 檢查幣對是否以其他非USDT穩定幣結尾
        const stablecoins = ['USDC', 'BUSD', 'TUSD', 'DAI'];
        for (const stablecoin of stablecoins) {
          if (symbol.endsWith(stablecoin)) {
            // 去除非USDT穩定幣後綴
            symbolForRequest = symbol.slice(0, -stablecoin.length);
            break;
          }
        }
        
        // 確保以USDT結尾
        if (!symbolForRequest.endsWith('USDT')) {
          symbolForRequest = symbolForRequest + 'USDT';
        }
        
        // 計算根據時間範圍所需的數據點數
        let calculatedLimit = '100'; // 預設值
        
        // 根據時間範圍計算所需的數據點數
        if (timeRange !== 'default') {
          calculatedLimit = calculateLimitByTimeRange(timeRange, period);
        }
        
        // 獲取持倉量數據
        const openInterestResponse = await fetch(`/api/binance-open-interest-history?symbol=${symbolForRequest}&period=${period}&limit=${calculatedLimit}`);
        
        if (!openInterestResponse.ok) {
          throw new Error(`持倉量數據API請求失敗: ${openInterestResponse.status}`);
        }
        
        const openInterestResult = await openInterestResponse.json();

        // 獲取價格數據
        const priceResponse = await fetch(`/api/binance-klines?symbol=${symbolForRequest}&interval=${getPriceInterval(period)}&limit=${calculatedLimit}`);
        
        if (!priceResponse.ok) {
          throw new Error(`價格數據API請求失敗: ${priceResponse.status}`);
        }
        
        const priceResult = await priceResponse.json();

        if (openInterestResult.success && priceResult.success) {
          setOpenInterestData(openInterestResult.data);
          setPriceData(priceResult.data);
        } else {
          setError(openInterestResult.error || priceResult.error || '獲取數據失敗');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchData();
    }
  }, [symbol, period, timeRange]);
  
  // 計算基於時間範圍的數據點數
  const calculateLimitByTimeRange = (range, periodValue) => {
    switch (range) {
      case '2days':
        switch (periodValue) {
          case '5m': return 576;  // 2 * 24 * 12 (2天 * 24小時 * 每小時12個5分鐘)
          case '15m': return 192; // 2 * 24 * 4 (2天 * 24小時 * 每小時4個15分鐘)
          case '30m': return 96;  // 2 * 24 * 2 (2天 * 24小時 * 每小時2個30分鐘)
          default: return 100;
        }
      case '7days':
        switch (periodValue) {
          case '1h': return 168;  // 7 * 24 (7天 * 24小時)
          case '2h': return 84;   // 7 * 12 (7天 * 每天12個2小時)
          case '4h': return 42;   // 7 * 6 (7天 * 每天6個4小時)
          case '6h': return 28;   // 7 * 4 (7天 * 每天4個6小時)
          case '12h': return 14;  // 7 * 2 (7天 * 每天2個12小時)
          case '1d': return 7;    // 7天
          default: return 100;
        }
      case '14days':
        switch (periodValue) {
          case '1h': return 336;  // 14 * 24 (14天 * 24小時)
          case '2h': return 168;  // 14 * 12 (14天 * 每天12個2小時)
          case '4h': return 84;   // 14 * 6 (14天 * 每天6個4小時)
          case '6h': return 56;   // 14 * 4 (14天 * 每天4個6小時)
          case '12h': return 28;  // 14 * 2 (14天 * 每天2個12小時)
          case '1d': return 14;   // 14天
          default: return 100;
        }
      case '30days':
        switch (periodValue) {
          case '1h': return 720;  // 30 * 24 (30天 * 24小時)
          case '2h': return 360;  // 30 * 12 (30天 * 每天12個2小時)
          case '4h': return 180;  // 30 * 6 (30天 * 每天6個4小時)
          case '6h': return 120;  // 30 * 4 (30天 * 每天4個6小時)
          case '12h': return 60;  // 30 * 2 (30天 * 每天2個12小時)
          case '1d': return 30;   // 30天
          default: return 100;
        }
      default:
        return 100; // default情況返回固定值100
    }
  };

  // 將持倉量數據的時間週期轉換為價格K線的時間週期
  const getPriceInterval = (period) => {
    const periodMap = {
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '2h': '2h',
      '4h': '4h',
      '6h': '6h',
      '12h': '12h',
      '1d': '1d'
    };
    return periodMap[period] || '1h';
  };

  const chartData = {
    datasets: [
      {
        label: '持倉價值 (USD)',
        data: openInterestData.map(item => ({
          x: new Date(item.timestamp),
          y: item.sumOpenInterestValue
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        yAxisID: 'y'
      },
      {
        label: `${symbol} 價格 (USD)`,
        data: priceData.map(item => ({
          x: new Date(item.timestamp),
          y: item.close
        })),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: period === '1d' ? 'day' : 
                period === '4h' || period === '6h' || period === '12h' ? 'hour' : 
                'minute',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MM-dd HH:mm',
            day: 'MM-dd'
          }
        },
        adapters: {
          date: {
            locale: zhTW
          }
        },
        title: {
          display: true,
          text: '時間'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: '持倉價值 (USD)'
        },
        ticks: {
          callback: function(value) {
            if (value >= 1000000000) {
              return (value / 1000000000).toFixed(1) + 'B';
            } else if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value;
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '價格 (USD)'
        },
        grid: {
          drawOnChartArea: false,
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            
            const value = context.parsed.y;
            if (value !== null) {
              if (context.dataset.label.includes('持倉價值')) {
                if (value >= 1000000000) {
                  label += (value / 1000000000).toFixed(2) + 'B';
                } else if (value >= 1000000) {
                  label += (value / 1000000).toFixed(2) + 'M';
                } else if (value >= 1000) {
                  label += (value / 1000).toFixed(2) + 'K';
                } else {
                  label += value.toFixed(2);
                }
              } else {
                label += value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
              }
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">
          Binance {symbol} 合約持倉價值與價格對比
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>時間週期</InputLabel>
            <Select
              value={period}
              label="時間週期"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="5m">5分鐘</MenuItem>
              <MenuItem value="15m">15分鐘</MenuItem>
              <MenuItem value="30m">30分鐘</MenuItem>
              <MenuItem value="1h">1小時</MenuItem>
              <MenuItem value="2h">2小時</MenuItem>
              <MenuItem value="4h">4小時</MenuItem>
              <MenuItem value="6h">6小時</MenuItem>
              <MenuItem value="12h">12小時</MenuItem>
              <MenuItem value="1d">1天</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>時間範圍</InputLabel>
            <Select
              value={timeRange}
              label="時間範圍"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {getTimeRangeOptions().map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {loading ? (
        <Typography>加載中...</Typography>
      ) : error ? (
        <Typography color="error">錯誤: {error}</Typography>
      ) : openInterestData.length === 0 || priceData.length === 0 ? (
        <Typography>無數據</Typography>
      ) : (
        <>
          <LineChart data={chartData} options={options} />
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>當前持倉價值</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {openInterestData[openInterestData.length - 1] ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    notation: 'compact',
                    compactDisplay: 'short'
                  }).format(openInterestData[openInterestData.length - 1].sumOpenInterestValue) : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography color="textSecondary" gutterBottom>當前價格</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {priceData[priceData.length - 1] ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(priceData[priceData.length - 1].close) : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default BinanceOpenInterestHistoryChart; 