import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import axiosRetry from 'axios-retry';

// 配置 axios 重試
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // 重試延遲時間遞增
  },
  retryCondition: (error) => {
    // 只在網絡錯誤、超時或特定 HTTP 狀態碼時重試
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.code === 'ECONNABORTED' ||
           (error.response && [408, 500, 502, 503, 504].includes(error.response.status));
  },
  shouldResetTimeout: true
});

export default function FundingRate() {
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
  const [selectedExchanges, setSelectedExchanges] = useState(new Set(['Binance', 'Bybit', 'OKX', 'Bitget', 'HyperLiquid']));
  const allExchanges = [
    { id: 'Binance', order: 1 },
    { id: 'Bybit', order: 2 },
    { id: 'Bitget', order: 3 },
    { id: 'OKX', order: 4 },
    { id: 'HyperLiquid', order: 5 }
  ];
  const [searchTerm, setSearchTerm] = useState('');  // 新增搜尋狀態

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
        
        const response = await fetch('/api/funding-rates');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          // 只更新已選擇的交易所數據
          setFundingRates(prevRates => {
            const newRates = data.data.filter(rate => selectedExchanges.has(rate.exchange));
            if (JSON.stringify(prevRates) !== JSON.stringify(newRates)) {
              return newRates;
            }
            return prevRates;
          });

          // 同樣只分組已選擇的交易所數據
          setGroupedRates(prevGrouped => {
            const newGrouped = data.data
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
          if (data.data.some(rate => rate.exchange === 'Bybit' && rate.isHourly)) {
            hourlySet.add('Bybit');
          }
          setHourlyExchanges(hourlySet);
        }
      } catch (error) {
        console.error('Error:', error);
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

  // 等待客戶端渲染
  if (!mounted) return null;

  return (
    <div className={`container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Head>
        <title>永續合約資金費率比較</title>
        <meta name="description" content="永續合約資金費率比較" />
      </Head>

      <main>
        <div className="header-container">
          <div className="title-container">
            <h1>永續合約資金費率比較</h1>
          </div>
          <div className="controls-container">
            <div className="search-container">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋幣種或費率..."
                className="search-input"
              />
            </div>
            <div className="controls">
              <div className="exchange-dropdown">
                <button className="dropdown-button">
                  交易所選擇 ({selectedExchanges.size})
                </button>
                <div className="dropdown-content">
                  {allExchanges.map(exchange => (
                    <label key={exchange.id} className="exchange-option">
                      <input
                        type="checkbox"
                        checked={selectedExchanges.has(exchange.id)}
                        onChange={() => handleExchangeToggle(exchange.id)}
                        disabled={selectedExchanges.size === 1 && selectedExchanges.has(exchange.id)}
                      />
                      {exchange.id}
                    </label>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setShowInterval(!showInterval)}
                className={`display-toggle ${showInterval ? 'active' : ''}`}
                title={showInterval ? "切換為星號顯示" : "切換為小時顯示"}
              >
                {showInterval ? "星號" : "小時"}
              </button>
              <button 
                onClick={() => setShowNormalized(!showNormalized)}
                className={`display-toggle ${showNormalized ? 'active' : ''}`}
                title={showNormalized ? "顯示當前費率" : "顯示8小時費率"}
              >
                {showNormalized ? "當前" : "8 H"}
              </button>
              <button 
                onClick={toggleTheme}
                className="theme-toggle"
                title={isDarkMode ? "切換至淺色模式" : "切換至深色模式"}
              >
                {isDarkMode ? '🌞' : '🌛'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="rates-table">
          {isLoading ? (
            <div className="loading">載入中...</div>
          ) : (
            <>
              {isUpdating && (
                <div className="updating-indicator">
                  更新中...
                </div>
              )}
              <table className={isUpdating ? 'updating' : ''}>
                <thead>
                  <tr>
                    <th onClick={() => handleSort('symbol')} className="sortable">
                      幣種 {sortConfig.key === 'symbol' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    {exchanges.map(exchange => (
                      <th 
                        key={exchange} 
                        onClick={() => handleExchangeSort(exchange)} 
                        className="sortable"
                      >
                        {exchange}
                        {hourlyExchanges.has(exchange) && (
                          <span style={{ marginLeft: '4px', color: '#ffd700' }} title="每1小時結算">
                            ★1h
                          </span>
                        )}
                        {exchangeSort.exchange === exchange ? 
                          (exchangeSort.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filterData(sortedSymbols.map(symbol => ({
                    symbol,
                    rates: groupedRates[symbol]
                  }))).map((item) => (
                    <tr key={item.symbol}>
                      <td>
                        <a
                          href={`/history/${item.symbol}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="symbol-link"
                        >
                          {item.symbol}
                        </a>
                      </td>
                      {exchanges.map(exchange => {
                        const data = item.rates[exchange];
                        return (
                          <td 
                            key={`${item.symbol}-${exchange}`}
                            className={data && parseFloat(data.currentRate) > 0 ? 'positive-rate' : 'negative-rate'}
                            style={{ textAlign: 'center' }}
                          >
                            {data ? (
                              <>
                                {showNormalized && data.settlementInterval && data.settlementInterval !== 8 ? (
                                  // 標準化為8小時費率
                                  `${(parseFloat(data.currentRate) * (8 / data.settlementInterval)).toFixed(4)}%`
                                ) : (
                                  `${parseFloat(data.currentRate)}%`
                                )}
                                {data.isSpecialInterval && (
                                  <span 
                                    style={{ color: '#ffd700' }} 
                                    title={`每${data.settlementInterval}小時結算${showNormalized ? ' (已轉換為8小時)' : ''}`}
                                  >
                                    {showInterval ? `${data.settlementInterval}H` : '*'}
                                  </span>
                                )}
                              </>
                            ) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </main>

      <style jsx global>{`
        :root {
          --bg-color: ${isDarkMode ? '#000000' : '#ffffff'};
          --text-color: ${isDarkMode ? '#ffffff' : '#000000'};
          --table-border: ${isDarkMode ? '#333333' : '#dddddd'};
          --hover-bg: ${isDarkMode ? '#2a2a2a' : '#f5f5f5'};
          --positive-color: ${isDarkMode ? '#4caf50' : '#4caf50'};
          --negative-color: ${isDarkMode ? '#f44336' : '#f44336'};
          --header-bg: ${isDarkMode ? '#000000' : '#f8f9fa'};
          --loading-bg: ${isDarkMode ? '#242424' : '#f8f9fa'};
          --th-bg: ${isDarkMode ? '#000000' : '#f8f9fa'};
          --td-bg: ${isDarkMode ? '#000000' : '#ffffff'};
        }

        body {
          background-color: var(--bg-color);
          color: var(--text-color);
          transition: background-color 0.3s, color 0.3s;
          margin: 0;
          padding: 0;
        }

        .container {
          min-height: 100vh;
          padding: 20px;
          background-color: var(--bg-color);
        }

        .header-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          width: 100%;
        }

        .title-container {
          text-align: center;
        }

        .controls-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          width: 100%;
        }

        .search-container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .search-input {
          width: 100%;
          padding: 10px 15px;
          border: 2px solid var(--table-border);
          border-radius: 6px;
          background: var(--bg-color);
          color: var(--text-color);
          font-size: 16px;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .search-input::placeholder {
          color: var(--text-color);
          opacity: 0.6;
        }

        .controls {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }

        .exchange-dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-button {
          padding: 5px 10px;
          border: 1px solid var(--table-border);
          border-radius: 4px;
          background: var(--bg-color);
          color: var(--text-color);
          cursor: pointer;
          min-width: 120px;
        }

        .dropdown-content {
          display: none;
          position: absolute;
          right: 0;
          background-color: var(--bg-color);
          min-width: 160px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
          padding: 8px;
          border-radius: 4px;
          border: 1px solid var(--table-border);
          z-index: 1;
        }

        .exchange-dropdown:hover .dropdown-content {
          display: block;
        }

        .exchange-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          cursor: pointer;
          white-space: nowrap;
        }

        .exchange-option:hover {
          background-color: var(--hover-bg);
        }

        .exchange-option input {
          cursor: pointer;
        }

        .exchange-option input:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .display-toggle {
          padding: 5px 10px;
          border: 1px solid var(--table-border);
          border-radius: 4px;
          background: var(--bg-color);
          cursor: pointer;
          color: var(--text-color);
          transition: all 0.3s ease;
          min-width: 56px;
          text-align: center;
          display: inline-block;
          font-size: 14px;
          line-height: 1.5;
        }

        .display-toggle:hover {
          background: var(--hover-bg);
        }

        .display-toggle.active {
          background: var(--text-color);
          color: var(--bg-color);
          border-color: var(--text-color);
        }

        /* 深色模式適配 */
        :global(.dark-mode) .display-toggle.active {
          background: var(--text-color);
          color: var(--bg-color);
        }

        .theme-toggle {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: background-color 0.3s;
          color: var(--text-color);
        }

        .theme-toggle:hover {
          background-color: var(--hover-bg);
        }

        .loading {
          padding: 20px;
          text-align: center;
          background-color: var(--loading-bg);
          border-radius: 8px;
          color: var(--text-color);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background-color: var(--bg-color) !important;
          border: 1px solid var(--table-border);
        }

        th, td {
          padding: 12px;
          text-align: center !important;
          border: 1px solid var(--table-border);
          color: var(--text-color);
          background-color: var(--td-bg) !important;
        }

        th {
          background-color: var(--th-bg) !important;
          font-weight: bold;
        }

        tr {
          background-color: var(--td-bg) !important;
        }

        tr:hover td {
          background-color: var(--hover-bg) !important;
        }

        .positive-rate {
          color: var(--positive-color) !important;
        }

        .negative-rate {
          color: var(--negative-color) !important;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
        }

        .sortable:hover {
          background-color: var(--hover-bg);
        }

        h1 {
          margin: 0;
          color: var(--text-color);
        }

        .dark-mode {
          background-color: var(--bg-color) !important;
        }

        td:first-child {
          text-align: center !important;
          font-weight: bold;
        }

        .updating-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 8px 16px;
          background-color: var(--header-bg);
          border-radius: 4px;
          opacity: 0.8;
          transition: opacity 0.3s;
        }

        .updating {
          transition: opacity 0.3s;
        }

        /* 數據變化時的過渡效果 */
        td {
          transition: background-color 0.3s, color 0.3s;
        }

        .positive-rate, .negative-rate {
          transition: color 0.3s;
        }

        /* 確保更新時不會有跳動 */
        table {
          table-layout: fixed;
          width: 100%;
        }

        td, th {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .exchange-dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-button {
          padding: 5px 10px;
          border: 1px solid var(--table-border);
          border-radius: 4px;
          background: var(--bg-color);
          color: var(--text-color);
          cursor: pointer;
          min-width: 120px;
        }

        .dropdown-content {
          display: none;
          position: absolute;
          right: 0;
          background-color: var(--bg-color);
          min-width: 160px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
          padding: 8px;
          border-radius: 4px;
          border: 1px solid var(--table-border);
          z-index: 1;
        }

        .exchange-dropdown:hover .dropdown-content {
          display: block;
        }

        .exchange-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          cursor: pointer;
          white-space: nowrap;
        }

        .exchange-option:hover {
          background-color: var(--hover-bg);
        }

        .exchange-option input {
          cursor: pointer;
        }

        .exchange-option input:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* 深色模式適配 */
        :global(.dark-mode) .dropdown-content {
          box-shadow: 0 8px 16px rgba(255,255,255,0.1);
        }

        .symbol-link {
          color: var(--text-color);
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.3s;
        }

        .symbol-link:hover {
          opacity: 0.7;
          text-decoration: underline;
        }

        /* 移動端適配 */
        @media (max-width: 768px) {
          .header-container {
            padding: 0 10px;
          }

          .controls-container {
            gap: 10px;
          }

          .controls {
            width: 100%;
            justify-content: space-between;
          }

          .search-input {
            font-size: 14px;
            padding: 8px 12px;
          }

          .display-toggle,
          .dropdown-button {
            padding: 6px 10px;
            font-size: 13px;
          }
        }

        /* 深色模式適配 */
        .dark-mode .search-input {
          background: var(--bg-color);
          border-color: var(--table-border);
        }

        .dark-mode .search-input:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
        }
      `}</style>
    </div>
  );
} 