import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import styles from '../styles/LeveragedSpot.module.css';
import { useRouter } from 'next/router';

export default function LeveragedSpot() {
  const router = useRouter();
  const [leveragedData, setLeveragedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'leverage', direction: 'desc' });
  const [filterExchange, setFilterExchange] = useState('all');
  const [availableExchanges, setAvailableExchanges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 模擬數據 - 實際環境中應替換為真實 API 調用
        // const response = await axios.get('/api/leveraged-spot');
        
        // 模擬數據結構
        const mockData = [
          { exchange: 'Binance', pair: 'BTC/USDT', leverage: 10, fee: '0.10%', minNotional: '5 USDT', liquidationThreshold: '80%' },
          { exchange: 'Binance', pair: 'ETH/USDT', leverage: 10, fee: '0.10%', minNotional: '5 USDT', liquidationThreshold: '80%' },
          { exchange: 'Binance', pair: 'BNB/USDT', leverage: 5, fee: '0.10%', minNotional: '5 USDT', liquidationThreshold: '80%' },
          { exchange: 'Kucoin', pair: 'BTC/USDT', leverage: 5, fee: '0.10%', minNotional: '10 USDT', liquidationThreshold: '75%' },
          { exchange: 'Kucoin', pair: 'ETH/USDT', leverage: 5, fee: '0.10%', minNotional: '10 USDT', liquidationThreshold: '75%' },
          { exchange: 'Bybit', pair: 'BTC/USDT', leverage: 10, fee: '0.12%', minNotional: '15 USDT', liquidationThreshold: '85%' },
          { exchange: 'Bybit', pair: 'ETH/USDT', leverage: 10, fee: '0.12%', minNotional: '15 USDT', liquidationThreshold: '85%' },
          { exchange: 'OKX', pair: 'BTC/USDT', leverage: 5, fee: '0.15%', minNotional: '10 USDT', liquidationThreshold: '80%' },
          { exchange: 'OKX', pair: 'ETH/USDT', leverage: 5, fee: '0.15%', minNotional: '10 USDT', liquidationThreshold: '80%' },
        ];

        setLeveragedData(mockData);
        
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
    let sortableData = [...leveragedData];
    
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
        <title>槓桿現貨 | 加密貨幣數據中心</title>
        <meta name="description" content="比較各大交易所的槓桿現貨交易數據" />
      </Head>

      <main>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>槓桿現貨</h1>
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
                  <th onClick={() => requestSort('pair')}>
                    交易對 {getSortIndicator('pair')}
                  </th>
                  <th onClick={() => requestSort('leverage')}>
                    最大槓桿 {getSortIndicator('leverage')}
                  </th>
                  <th onClick={() => requestSort('fee')}>
                    手續費 {getSortIndicator('fee')}
                  </th>
                  <th onClick={() => requestSort('minNotional')}>
                    最小交易額 {getSortIndicator('minNotional')}
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
                    <td>{item.pair}</td>
                    <td className={styles.highlight}>{item.leverage}x</td>
                    <td>{item.fee}</td>
                    <td>{item.minNotional}</td>
                    <td>{item.liquidationThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.infoBox}>
          <h3>關於槓桿現貨</h3>
          <p>槓桿現貨交易允許您以初始資金的倍數進行交易，提高投資效率。本頁面展示了各大交易所提供的槓桿現貨服務及其相關參數。</p>
          <p>注意：槓桿交易具有高風險，可能導致本金快速損失。請在充分了解風險後謹慎操作。</p>
        </div>
      </main>
    </div>
  );
} 