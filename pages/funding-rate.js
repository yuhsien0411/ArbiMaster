import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import styles from '../styles/FundingRate.module.css';

// 配置 axios 重試
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.code === 'ECONNABORTED' ||
           (error.response && [408, 500, 502, 503, 504].includes(error.response.status)) ||
           error.message.includes('timeout');
  },
  shouldResetTimeout: true,
  timeout: 15000
});

export default function FundingRate() {
  const router = useRouter();
  // 狀態管理
  const [fundingRates, setFundingRates] = useState([]); // 原始資金費率數據
  const [groupedRates, setGroupedRates] = useState({}); // 按幣種分組的資金費率
  const [exchanges, setExchanges] = useState([]); // 交易所列表
  const [isLoading, setIsLoading] = useState(true); // 載入狀態
  const [sortConfig, setSortConfig] = useState({ key: 'symbol', direction: 'asc' }); // 幣種排序配置
  const [exchangeSort, setExchangeSort] = useState({ exchange: null, direction: 'desc' }); // 交易所排序配置
  const [hourlyExchanges, setHourlyExchanges] = useState(new Set(['HyperLiquid'])); // 1小時結算的交易所集合
  const [isDarkMode, setIsDarkMode] = useState(false); // 深色模式狀態
  const [mounted, setMounted] = useState(false); // 組件掛載狀態，用於解決 SSR 問題
  const [isUpdating, setIsUpdating] = useState(false); // 添加更新狀態
  const [showInterval, setShowInterval] = useState(false); // 添加顯示模式狀態
  const [showNormalized, setShowNormalized] = useState(false); // 添加標準化顯示狀態
  const [selectedExchanges, setSelectedExchanges] = useState(new Set(['Binance', 'Bybit', 'Bitget', 'OKX', 'Gate.io', 'HyperLiquid']));
  const allExchanges = [
    { id: 'Binance', order: 1 },
    { id: 'Bybit', order: 2 },
    { id: 'Bitget', order: 3 },
    { id: 'OKX', order: 4 },
    { id: 'Gate.io', order: 5 },
    { id: 'HyperLiquid', order: 6 }
  ];
  const [searchTerm, setSearchTerm] = useState('');  // 新增搜尋狀態
  const [error, setError] = useState(null); // 新增錯誤狀態

  // 初始化主題設置
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }
    }
  }, []);

  // 監聽深色模式變化，更新 HTML class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // 修改數據獲取邏輯
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isLoading) {
          setIsUpdating(true);
        }
        
        const response = await axios.get('/api/funding-rates', {
          timeout: 15000,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.data.success && Array.isArray(response.data.data)) {
          // 只更新已選擇的交易所數據
          setFundingRates(prevRates => {
            const newRates = response.data.data.filter(rate => selectedExchanges.has(rate.exchange));
            if (JSON.stringify(prevRates) !== JSON.stringify(newRates)) {
              return newRates;
            }
            return prevRates;
          });

          // 同樣只分組已選擇的交易所數據
          setGroupedRates(prevGrouped => {
            const newGrouped = response.data.data
              .filter(rate => selectedExchanges.has(rate.exchange))
              .reduce((acc, rate) => {
                if (!acc[rate.symbol]) {
                  acc[rate.symbol] = {};
                }
                acc[rate.symbol][rate.exchange] = rate;
                return acc;
              }, {});

            if (JSON.stringify(prevGrouped) !== JSON.stringify(newGrouped)) {
              return newGrouped;
            }
            return prevGrouped;
          });
          
          // 設置 1 小時結算的交易所
          const hourlySet = new Set(['HyperLiquid']);
          if (response.data.data.some(rate => rate.exchange === 'Bybit' && rate.isHourly)) {
            hourlySet.add('Bybit');
          }
          setHourlyExchanges(hourlySet);
        } else {
          console.error('數據格式錯誤:', response.data);
          // 顯示錯誤信息給用戶
          setError('數據獲取失敗，請稍後重試');
        }
      } catch (error) {
        console.error('Error:', error);
        // 顯示具體錯誤信息給用戶
        setError(error.response?.data?.error || '連接超時，請稍後重試');
      } finally {
        setIsLoading(false);
        setIsUpdating(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedExchanges]); // 添加 selectedExchanges 作為依賴

  // 處理幣種排序
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setExchangeSort({ exchange: null, direction: 'desc' });
  };

  // 處理交易所排序
  const handleExchangeSort = (exchange) => {
    setExchangeSort(prev => ({
      exchange,
      direction: prev.exchange === exchange && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
    setSortConfig({ key: null, direction: null });
  };

  // 排序邏輯
  const sortedSymbols = Object.keys(groupedRates).sort((a, b) => {
    // 檢查是否有數據
    const aHasData = exchangeSort.exchange ? 
      !!groupedRates[a][exchangeSort.exchange] : 
      exchanges.some(e => !!groupedRates[a][e]);
    
    const bHasData = exchangeSort.exchange ? 
      !!groupedRates[b][exchangeSort.exchange] : 
      exchanges.some(e => !!groupedRates[b][e]);

    // 有數據的排在前面
    if (aHasData !== bHasData) {
      return aHasData ? -1 : 1;
    }

    // 按幣種或費率排序
    if (sortConfig.key === 'symbol') {
      return sortConfig.direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    } else if (exchangeSort.exchange) {
      const aData = groupedRates[a][exchangeSort.exchange];
      const bData = groupedRates[b][exchangeSort.exchange];
      
      // 獲取費率（考慮標準化顯示）
      const getRate = (data) => {
        if (!data) return -999;
        const baseRate = parseFloat(data.currentRate);
        if (showNormalized && data.settlementInterval && data.settlementInterval !== 8) {
          return baseRate * (8 / data.settlementInterval);
        }
        return baseRate;
      };

      const aRate = getRate(aData);
      const bRate = getRate(bData);

      return exchangeSort.direction === 'asc' ? 
        aRate - bRate : 
        bRate - aRate;
    }
    return 0;
  });

  // 切換主題
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // 處理交易所選擇
  const handleExchangeToggle = (exchangeId) => {
    setSelectedExchanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exchangeId)) {
        newSet.delete(exchangeId);
      } else {
        newSet.add(exchangeId);
      }
      return newSet;
    });
  };

  // 在 useEffect 中更新 exchanges，保持順序
  useEffect(() => {
    const sortedExchanges = allExchanges
      .filter(exchange => selectedExchanges.has(exchange.id))
      .sort((a, b) => a.order - b.order)
      .map(exchange => exchange.id);
    setExchanges(sortedExchanges);
  }, [selectedExchanges]);

  // 新增搜尋過濾函數
  const filterData = (data) => {
    if (!searchTerm) return data;
    
    const searchLower = searchTerm.toLowerCase();
    return data.filter(item => {
      // 搜尋幣種名稱
      if (item.symbol.toLowerCase().includes(searchLower)) return true;
      
      // 搜尋費率值
      for (const exchange of exchanges) {
        const rate = item.rates[exchange]?.rate;
        if (rate && rate.toString().includes(searchLower)) return true;
      }
      
      return false;
    });
  };

  // 添加導航到歷史頁面的函數
  const navigateToHistory = (symbol) => {
    router.push(`/history/${symbol}`);
  };

  // 等待客戶端渲染
  if (!mounted) return null;

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.darkMode : ''}`}>
      <Head>
        <title>永續合約資金費率比較 | ArbiMaster</title>
        <meta name="description" content="實時監控主流交易所資金費率，掌握市場動向" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>永續合約資金費率比較</h1>
          <p className={styles.subtitle}>實時監控主流交易所資金費率，掌握市場動向</p>
        </div>
        <div className={styles.controls}>
          <button 
            className={styles.themeToggle} 
            onClick={toggleTheme}
            aria-label={isDarkMode ? "切換至淺色模式" : "切換至深色模式"}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="搜尋幣種..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className={styles.buttonsContainer}>
          <button
            onClick={() => setShowInterval(!showInterval)}
            className={`${styles.controlButton} ${showInterval ? styles.active : ''}`}
          >
            顯示結算週期
          </button>
          <button
            onClick={() => setShowNormalized(!showNormalized)}
            className={`${styles.controlButton} ${showNormalized ? styles.active : ''}`}
          >
            標準化費率
          </button>
        </div>
      </div>

      <main>
        <div className={styles.exchangesContainer}>
          <div className={styles.exchangesHeader}>
            <h2>交易所選擇</h2>
            <p>選擇要顯示的交易所資料</p>
          </div>
          <div className={styles.exchangeButtons}>
            {allExchanges.map(({ id }) => (
              <button
                key={id}
                onClick={() => handleExchangeToggle(id)}
                className={`${styles.exchangeButton} ${selectedExchanges.has(id) ? styles.selected : ''}`}
              >
                {id}
                {hourlyExchanges.has(id) && (
                  <span className={styles.hourlyBadge}>1H</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(true);
                fetchData();
              }}
              className={styles.retryButton}
            >
              重試
            </button>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>載入資料中...</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('symbol')} className={`${styles.th} ${styles.sortable}`}>
                    幣種
                    {sortConfig.key === 'symbol' && (
                      <span className={styles.sortIndicator}>
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  {exchanges.map(exchange => (
                    <th
                      key={exchange}
                      onClick={() => handleExchangeSort(exchange)}
                      className={`${styles.th} ${styles.sortable} ${exchangeSort.exchange === exchange ? styles.active : ''}`}
                    >
                      {exchange}
                      {exchangeSort.exchange === exchange && (
                        <span className={styles.sortIndicator}>
                          {exchangeSort.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                      {hourlyExchanges.has(exchange) && (
                        <span className={styles.hourlyIndicator}>1H</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedSymbols
                  .filter(symbol => !searchTerm || symbol.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(symbol => (
                    <tr key={symbol}>
                      <td 
                        className={`${styles.td} ${styles.symbolCell} ${styles.clickable}`}
                        onClick={() => navigateToHistory(symbol)}
                      >
                        {symbol}
                      </td>
                      {exchanges.map(exchange => {
                        const data = groupedRates[symbol]?.[exchange];
                        if (!data) return <td key={exchange} className={`${styles.td} ${styles.emptyCell}`}>-</td>;

                        const rate = parseFloat(data.currentRate);
                        const normalizedRate = showNormalized && data.settlementInterval && data.settlementInterval !== 8
                          ? rate * (8 / data.settlementInterval)
                          : rate;

                        const displayRate = normalizedRate.toFixed(4);
                        const rateClass = normalizedRate > 0 ? styles.positive : normalizedRate < 0 ? styles.negative : '';

                        return (
                          <td 
                            key={exchange} 
                            className={`${styles.td} ${styles.rateCell} ${rateClass} ${styles.clickable}`}
                            onClick={() => navigateToHistory(symbol)}
                          >
                            <span className={styles.rateValue}>{displayRate}%</span>
                            {showInterval && data.settlementInterval && (
                              <span className={styles.intervalBadge}>{data.settlementInterval}H</span>
                            )}
                            {!showInterval && data.settlementInterval && data.settlementInterval !== 8 && exchange !== 'HyperLiquid' && (
                              <span className={styles.nonStandardBadge}>*</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <style jsx global>{`
        :root {
          --bg-primary: ${isDarkMode ? '#0a0b0d' : '#ffffff'};
          --bg-card: ${isDarkMode ? '#16181d' : '#ffffff'};
          --bg-highlight: ${isDarkMode ? '#1c2128' : '#f8faff'};
          --text-primary: ${isDarkMode ? '#e6edf3' : '#16181d'};
          --text-secondary: ${isDarkMode ? '#8b949e' : '#6b7280'};
          --text-accent: ${isDarkMode ? '#3b82f6' : '#2563eb'};
          --border-color: ${isDarkMode ? '#30363d' : '#e5e7eb'};
          --border-highlight: ${isDarkMode ? '#3b82f6' : '#2563eb'};
          --border-highlight-alpha: ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.2)'};
          --hover-bg: ${isDarkMode ? '#2a2a2a' : '#f5f5f5'};
          --color-positive: ${isDarkMode ? '#4ade80' : '#16a34a'};
          --color-negative: ${isDarkMode ? '#f87171' : '#dc2626'};
          --text-gradient: ${isDarkMode ? 
            'linear-gradient(135deg, #60a5fa, #3b82f6)' : 
            'linear-gradient(135deg, #1d4ed8, #2563eb)'};
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background-color: var(--bg-primary);
          color: var(--text-primary);
          line-height: 1.5;
        }

        ::selection {
          background-color: var(--text-accent);
          color: white;
        }
      `}</style>
    </div>
  );
} 