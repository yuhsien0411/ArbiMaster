import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import styles from '../styles/Lending.module.css';
import { useRouter } from 'next/router';

export default function Lending() {
  const router = useRouter();
  const [lendingData, setLendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'apy', direction: 'desc' });
  const [filterExchange, setFilterExchange] = useState('all');
  const [availableExchanges, setAvailableExchanges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 模擬數據 - 實際環境中應替換為真實 API 調用
        // const response = await axios.get('/api/lending');
        
        // 模擬數據結構
        const mockData = [
          { exchange: 'Binance', coin: 'BTC', apy: 3.5, minAmount: '0.1 BTC', maxAmount: '100 BTC', liquidationThreshold: '80%' },
          { exchange: 'Binance', coin: 'ETH', apy: 4.2, minAmount: '1 ETH', maxAmount: '1000 ETH', liquidationThreshold: '80%' },
          { exchange: 'Binance', coin: 'USDT', apy: 5.0, minAmount: '1000 USDT', maxAmount: '1000000 USDT', liquidationThreshold: '80%' },
          { exchange: 'Kucoin', coin: 'BTC', apy: 3.8, minAmount: '0.1 BTC', maxAmount: '50 BTC', liquidationThreshold: '75%' },
          { exchange: 'Kucoin', coin: 'ETH', apy: 4.5, minAmount: '1 ETH', maxAmount: '500 ETH', liquidationThreshold: '75%' },
          { exchange: 'Bybit', coin: 'BTC', apy: 3.2, minAmount: '0.1 BTC', maxAmount: '80 BTC', liquidationThreshold: '85%' },
          { exchange: 'Bybit', coin: 'ETH', apy: 3.9, minAmount: '1 ETH', maxAmount: '800 ETH', liquidationThreshold: '85%' },
          { exchange: 'OKX', coin: 'BTC', apy: 3.6, minAmount: '0.1 BTC', maxAmount: '60 BTC', liquidationThreshold: '80%' },
          { exchange: 'OKX', coin: 'ETH', apy: 4.3, minAmount: '1 ETH', maxAmount: '600 ETH', liquidationThreshold: '80%' },
        ];

        setLendingData(mockData);
        
        // 提取所有可用的交易所
        const exchanges = [...new Set(mockData.map(item => item.exchange))];
        setAvailableExchanges(exchanges);
        
        setLoading(false);
      } catch (err) {
        setError('獲取數據失敗，請稍後再試');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    
    // 設置定時刷新（每5分鐘）
    const intervalId = setInterval(fetchData, 300000);
    
    // 清理函數
    return () => clearInterval(intervalId);
  }, []);

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
    let sortableData = [...lendingData];
    
    // 應用篩選
    if (filterExchange !== 'all') {
      sortableData = sortableData.filter(item => item.exchange === filterExchange);
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

  // 獲取排序指示器
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>質押借貸 | 加密貨幣數據中心</title>
        <meta name="description" content="比較各大交易所的質押借貸利率" />
      </Head>

      <main>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>質押借貸</h1>
          <button 
            className={styles.homeButton}
            onClick={() => router.push('/')}
          >
            返回主頁
          </button>
        </div>
        
        <div className={styles.filterContainer}>
          <label htmlFor="exchange-filter">篩選交易所：</label>
          <select 
            id="exchange-filter" 
            value={filterExchange} 
            onChange={(e) => setFilterExchange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">全部交易所</option>
            {availableExchanges.map(exchange => (
              <option key={exchange} value={exchange}>{exchange}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className={styles.loading}>載入中...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
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
                    年化收益率 (%) {getSortIndicator('apy')}
                  </th>
                  <th onClick={() => requestSort('minAmount')}>
                    最小質押額 {getSortIndicator('minAmount')}
                  </th>
                  <th onClick={() => requestSort('maxAmount')}>
                    最大質押額 {getSortIndicator('maxAmount')}
                  </th>
                  <th onClick={() => requestSort('liquidationThreshold')}>
                    清算閾值 {getSortIndicator('liquidationThreshold')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedData().map((item, index) => (
                  <tr key={index}>
                    <td>{item.exchange}</td>
                    <td>{item.coin}</td>
                    <td className={styles.highlight}>{item.apy.toFixed(2)}%</td>
                    <td>{item.minAmount}</td>
                    <td>{item.maxAmount}</td>
                    <td>{item.liquidationThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.infoBox}>
          <h3>關於質押借貸</h3>
          <p>質押借貸允許您將持有的加密貨幣質押給交易所，以獲取借貸額度或賺取利息。本頁面展示了各大交易所提供的質押借貸服務及其相關參數。</p>
          <p>注意：質押借貸具有風險，請在充分了解風險後謹慎操作。清算閾值表示當質押資產價值低於該閾值時，您的質押資產可能被清算。</p>
        </div>
      </main>
    </div>
  );
} 