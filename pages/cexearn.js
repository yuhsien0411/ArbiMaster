import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import axios from 'axios';
import styles from '../styles/CexEarn.module.css';
import { useRouter } from 'next/router';

export default function CexEarn() {
  const router = useRouter();
  const [earnData, setEarnData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'apy', direction: 'desc' });
  const [filterCoin, setFilterCoin] = useState('all');
  const [availableCoins, setAvailableCoins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [quickSearchCoin, setQuickSearchCoin] = useState('');
  const [quickSearchResults, setQuickSearchResults] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const quickSearchResultsRef = useRef(null);

  useEffect(() => {
    // 從本地存儲中讀取深色模式設置
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    } else {
      // 如果沒有設置，檢查用戶系統偏好
      const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDarkMode);
    }
  }, []);

  // 監視深色模式變化並更新文檔樣式
  useEffect(() => {
    // 將深色模式設置保存到本地存儲
    localStorage.setItem('darkMode', darkMode);
    
    // 更新文檔類名
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // 切換深色/淺色模式
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 使用我們創建的API端點
        const response = await axios.get('/api/cexearn');
        
        if (response.data && response.data.success && response.data.data) {
          const data = response.data.data;
          setEarnData(data);
          
          // 提取所有可用的幣種
          const coins = [...new Set(data.map(item => item.coin))];
          setAvailableCoins(coins);
          
          // 設置最後更新時間
          setLastUpdated(new Date());
        } else {
          throw new Error('無效的數據格式');
        }
        
        setLoading(false);
        setRefreshing(false);
      } catch (err) {
        setError('獲取數據失敗，請稍後再試');
        setLoading(false);
        setRefreshing(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    
    // 設置定時刷新（每5分鐘）
    const intervalId = setInterval(fetchData, 300000);
    
    // 清理函數
    return () => clearInterval(intervalId);
  }, []);

  // 手動刷新數據
  const handleRefresh = () => {
    setRefreshing(true);
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/cexearn');
        
        if (response.data && response.data.success && response.data.data) {
          const data = response.data.data;
          setEarnData(data);
          
          // 提取所有可用的幣種
          const coins = [...new Set(data.map(item => item.coin))];
          setAvailableCoins(coins);
          
          // 設置最後更新時間
          setLastUpdated(new Date());
        } else {
          throw new Error('無效的數據格式');
        }
        
        setRefreshing(false);
      } catch (err) {
        setError('獲取數據失敗，請稍後再試');
        setRefreshing(false);
        console.error('Error fetching data:', err);
      }
    };
    
    fetchData();
  };

  // 排序功能
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 應用排序和篩選
  const getSortedData = () => {
    let sortableData = [...earnData];
    
    // 應用篩選
    if (filterCoin !== 'all') {
      sortableData = sortableData.filter(item => item.coin === filterCoin);
    }
    
    // 應用搜索
    if (searchTerm.trim() !== '') {
      const term = searchTerm.trim().toLowerCase();
      sortableData = sortableData.filter(
        item => 
          item.exchange.toLowerCase().includes(term) || 
          item.coin.toLowerCase().includes(term)
      );
    }
    
    // 應用排序
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchTerm('');
  };

  // 清除快速搜索
  const clearQuickSearch = () => {
    setQuickSearchCoin('');
    setQuickSearchResults(null);
  };

  // 執行快速搜索
  const handleQuickSearch = () => {
    if (!quickSearchCoin.trim()) {
      setQuickSearchResults(null);
      return;
    }

    const coinUpper = quickSearchCoin.trim().toUpperCase();
    const results = earnData.filter(item => item.coin.toUpperCase() === coinUpper);
    
    if (results.length > 0) {
      // 按收益率排序
      results.sort((a, b) => b.apy - a.apy);
      setQuickSearchResults(results);
    } else {
      setQuickSearchResults([]);
    }
  };

  // 處理輸入後按Enter執行搜索
  const handleQuickSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleQuickSearch();
    }
  };

  // 獲取排序指示器
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // 格式化最後更新時間
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString();
  };

  // 獲取處理後的數據
  const sortedData = getSortedData();

  return (
    <div className={styles.container}>
      <Head>
        <title>CEX 理財收益 | 加密貨幣數據中心</title>
        <meta name="description" content="比較各大交易所的穩定幣及加密貨幣活期理財收益率" />
      </Head>

      <main>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>CEX 理財收益</h1>
          <div className={styles.headerControls}>
            <button 
              className={styles.refreshButton}
              onClick={handleRefresh}
              disabled={refreshing}
              title="刷新數據"
            >
              {refreshing ? '刷新中...' : '刷新數據'}
              <span className={`${styles.refreshIcon} ${refreshing ? styles.spinning : ''}`}>
                ↻
              </span>
            </button>
            <button 
              className={styles.darkModeToggle}
              onClick={toggleDarkMode}
              title={darkMode ? "切換至淺色模式" : "切換至深色模式"}
            >
              {darkMode ? "🌞" : "🌙"}
            </button>
            <button 
              className={styles.homeButton}
              onClick={() => router.push('/')}
            >
              返回主頁
            </button>
          </div>
        </div>
        
        {lastUpdated && (
          <div className={styles.lastUpdated}>
            最後更新時間: {formatLastUpdated()}
          </div>
        )}
        
        <div className={styles.quickSearchContainer}>
          <div className={styles.quickSearchBox}>
            <h3>查詢幣種當前利率</h3>
            <div className={styles.quickSearchInputGroup}>
              <input 
                type="text" 
                value={quickSearchCoin} 
                onChange={(e) => setQuickSearchCoin(e.target.value)}
                onKeyPress={handleQuickSearchKeyPress}
                placeholder="輸入幣種代號 (如: USDT)"
                className={styles.quickSearchInput}
                autoComplete="off"
              />
              <button 
                className={styles.quickSearchButton}
                onClick={handleQuickSearch}
                title="搜尋幣種收益率"
              >
                查詢
              </button>
              {quickSearchCoin && (
                <button 
                  className={styles.clearQuickSearchBtn}
                  onClick={clearQuickSearch}
                  title="清除搜尋"
                >
                  清除
                </button>
              )}
            </div>

            <div className={styles.searchIndicator}>
              {quickSearchCoin && !quickSearchResults && (
                <span className={styles.searchHint}>輸入幣種代號並點擊「查詢」按鈕</span>
              )}
            </div>
            
            <div className={styles.coinSuggestions}>
              <span>快速選擇：</span>
              {['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'XRP', 'BNB', 'DOT', 'ADA', 'DOGE', 'AVAX', 'MATIC', 'LINK'].map(coin => (
                <button 
                  key={coin}
                  className={styles.coinSuggestionBtn}
                  onClick={() => {
                    setQuickSearchCoin(coin);
                    if (coin) {
                      const coinUpper = coin.trim().toUpperCase();
                      const results = earnData.filter(item => item.coin.toUpperCase() === coinUpper);
                      
                      if (results.length > 0) {
                        // 按收益率排序
                        results.sort((a, b) => b.apy - a.apy);
                        setQuickSearchResults(results);
                      } else {
                        setQuickSearchResults([]);
                      }
                    }
                  }}
                  title={`查詢${coin}收益率`}
                >
                  {coin}
                </button>
              ))}
            </div>
          </div>

          {quickSearchResults && (
            <div className={styles.quickSearchResults} ref={quickSearchResultsRef}>
              {quickSearchResults.length > 0 ? (
                <>
                  <h4>「{quickSearchCoin.toUpperCase()}」當前利率 (排序依收益率)</h4>
                  <table className={styles.quickResultTable}>
                    <thead>
                      <tr>
                        <th>交易所</th>
                        <th>年化利率 (%)</th>
                        <th>最低金額</th>
                        <th>鎖定期</th>
                        <th>平均借貸金額($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quickSearchResults.map((item, index) => (
                        <tr key={index} className={index === 0 ? styles.bestRate : ''}>
                          <td>{item.exchange}</td>
                          <td className={styles.highlight}>{item.apy.toFixed(2)}%
                            {index === 0 && <span className={styles.bestRateBadge}>最高</span>}
                          </td>
                          <td>{item.minAmount}</td>
                          <td>{item.lockPeriod}</td>
                          <td>
                            {item.avgAmtUsd ? (
                              <span className={styles.borrowAmount}>
                                ${Number(item.avgAmtUsd).toLocaleString()}
                                {item.avgAmt && (
                                  <span className={styles.nativeBorrowAmount}>
                                    ({Number(item.avgAmt).toLocaleString()} {item.coin})
                                  </span>
                                )}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className={styles.noResults}>
                  未找到「{quickSearchCoin.toUpperCase()}」的理財產品。請確認代號是否正確或嘗試其他幣種。
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <label htmlFor="coin-filter">篩選幣種：</label>
            <select 
              id="coin-filter" 
              value={filterCoin} 
              onChange={(e) => setFilterCoin(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">全部幣種</option>
              {availableCoins.map(coin => (
                <option key={coin} value={coin}>{coin}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.searchGroup}>
            <label htmlFor="search-input">搜索：</label>
            <div className={styles.searchInputWrapper}>
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索交易所或幣種"
                className={styles.searchInput}
              />
              {searchTerm && (
                <button 
                  className={styles.clearSearchBtn}
                  onClick={clearSearch}
                  aria-label="清除搜索"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>載入中，請稍候...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={handleRefresh} className={styles.retryButton}>
              重試
            </button>
          </div>
        ) : (
          <>
            {searchTerm.trim() !== '' && (
              <div className={styles.searchResults}>
                找到 <span className={styles.highlight}>{sortedData.length}</span> 個結果
                {filterCoin !== 'all' && <span>（已篩選幣種: {filterCoin}）</span>}
              </div>
            )}
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th onClick={() => requestSort('exchange')}>
                      交易所 {getSortIndicator('exchange')}
                    </th>
                    <th onClick={() => requestSort('coin')}>
                      幣種 {getSortIndicator('coin')}
                    </th>
                    <th onClick={() => requestSort('apy')}>
                      年化利率 (%) {getSortIndicator('apy')}
                    </th>
                    <th onClick={() => requestSort('minAmount')}>
                      最低金額 {getSortIndicator('minAmount')}
                    </th>
                    <th onClick={() => requestSort('lockPeriod')}>
                      鎖定期 {getSortIndicator('lockPeriod')}
                    </th>
                    <th onClick={() => requestSort('avgAmtUsd')}>
                      平均借貸金額($) {getSortIndicator('avgAmtUsd')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length > 0 ? (
                    sortedData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.exchange}</td>
                        <td>{item.coin}</td>
                        <td className={styles.highlight}>{item.apy.toFixed(2)}%</td>
                        <td>{item.minAmount}</td>
                        <td>{item.lockPeriod}</td>
                        <td>
                          {item.avgAmtUsd ? (
                            <span className={styles.borrowAmount}>
                              ${Number(item.avgAmtUsd).toLocaleString()}
                              {item.avgAmt && (
                                <span className={styles.nativeBorrowAmount}>
                                  ({Number(item.avgAmt).toLocaleString()} {item.coin})
                                </span>
                              )}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className={styles.noDataMessage}>
                        未找到符合條件的數據。請嘗試調整搜索條件。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className={styles.infoBox}>
          <h3>關於 CEX 理財收益</h3>
          <p>此頁面顯示各大中心化交易所 (CEX) 提供的加密貨幣活期理財產品的年化收益率。數據每5分鐘更新一次，僅供參考，實際收益可能會有所不同。</p>
          <p>支援所有交易所提供的理財產品，包括比特幣(BTC)、以太坊(ETH)、穩定幣(USDT/USDC)及其他主流加密貨幣。使用上方的搜索功能可以直接查詢特定幣種的收益率。</p>
          <p><strong>年化利率說明</strong>：對於OKX交易所的數據，我們顯示的是過去24小時內的實際平均借出利率，而不是預估利率。這能更準確地反映當前市場的實際狀況。</p>
          <p><strong>平均借貸金額</strong>：僅顯示OKX交易所中平均借貸金額超過1萬美元的幣種，數據反映24小時內平均借貸量。較高的借貸量通常意味著較活躍的市場和更穩定的利率。</p>
          <p>注意：投資有風險，理財需謹慎。請在投資前充分了解產品風險。</p>
        </div>
      </main>
    </div>
  );
} 