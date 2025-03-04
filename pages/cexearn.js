import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

export default function CexEarn() {
  const [earnData, setEarnData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'apy', direction: 'desc' });
  const [filterCoin, setFilterCoin] = useState('all');
  const [availableCoins, setAvailableCoins] = useState([]);

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
        } else {
          throw new Error('無效的數據格式');
        }
        
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
    let sortableData = [...earnData];
    
    // 應用篩選
    if (filterCoin !== 'all') {
      sortableData = sortableData.filter(item => item.coin === filterCoin);
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
    <div className="container">
      <Head>
        <title>CEX 理財收益 | 加密貨幣數據中心</title>
        <meta name="description" content="比較各大交易所的穩定幣活期理財收益率" />
      </Head>

      <main>
        <h1 className="page-title">CEX 理財收益</h1>
        
        <div className="filter-container">
          <label htmlFor="coin-filter">篩選幣種：</label>
          <select 
            id="coin-filter" 
            value={filterCoin} 
            onChange={(e) => setFilterCoin(e.target.value)}
            className="filter-select"
          >
            <option value="all">全部幣種</option>
            {availableCoins.map(coin => (
              <option key={coin} value={coin}>{coin}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">載入中...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
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
                    最低金額 {getSortIndicator('minAmount')}
                  </th>
                  <th onClick={() => requestSort('lockPeriod')}>
                    鎖定期 {getSortIndicator('lockPeriod')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedData().map((item, index) => (
                  <tr key={index}>
                    <td>{item.exchange}</td>
                    <td>{item.coin}</td>
                    <td className="highlight">{item.apy.toFixed(2)}%</td>
                    <td>{item.minAmount}</td>
                    <td>{item.lockPeriod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="info-box">
          <h3>關於 CEX 理財收益</h3>
          <p>此頁面顯示各大中心化交易所 (CEX) 提供的穩定幣活期理財產品的年化收益率。數據每5分鐘更新一次，僅供參考，實際收益可能會有所不同。</p>
          <p>注意：投資有風險，理財需謹慎。請在投資前充分了解產品風險。</p>
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .page-title {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .filter-container {
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .filter-select {
          padding: 8px 12px;
          border-radius: 5px;
          border: 1px solid var(--card-border);
          background-color: var(--card-bg);
          color: var(--text-color);
        }
        
        .table-container {
          overflow-x: auto;
          margin-bottom: 30px;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid var(--card-border);
        }
        
        .data-table th, .data-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid var(--card-border);
        }
        
        .data-table th {
          background-color: var(--card-hover);
          cursor: pointer;
          user-select: none;
        }
        
        .data-table th:hover {
          background-color: var(--card-bg);
        }
        
        .data-table tr:hover {
          background-color: var(--card-hover);
        }
        
        .highlight {
          font-weight: bold;
          color: #4caf50;
        }
        
        .loading, .error {
          text-align: center;
          padding: 40px;
          font-size: 1.2rem;
        }
        
        .error {
          color: #f44336;
        }
        
        .info-box {
          background-color: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 10px;
          padding: 20px;
          margin-top: 30px;
        }
        
        .info-box h3 {
          margin-top: 0;
          margin-bottom: 15px;
        }
        
        .info-box p {
          margin-bottom: 10px;
        }
        
        @media (max-width: 768px) {
          .data-table {
            font-size: 0.9rem;
          }
          
          .data-table th, .data-table td {
            padding: 8px 10px;
          }
        }
      `}</style>
    </div>
  );
} 