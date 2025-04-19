import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Volume.module.css';
import { useRouter } from 'next/router';

export default function Volume() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalVolume, setTotalVolume] = useState({
    total: 0,
    spot: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/volume-analysis');
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result.data);
        
        // 計算總交易量
        const total = result.data.reduce((acc, item) => {
          acc.total += item.totalVolume;
          acc.spot += item.spotVolume;
          return acc;
        }, { total: 0, spot: 0 });
        
        setTotalVolume(total);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分鐘更新一次
    return () => clearInterval(interval);
  }, []);

  const filteredData = data.filter(item =>
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatNumber = (num) => {
    if (!num) return '$0';
    
    // 將所有數值統一轉換為百萬美元為基本單位
    const value = num / 1000000;
    
    if (value >= 1000) {
      return '$' + (value / 1000).toFixed(2) + 'B';  // 十億
    }
    if (value >= 1) {
      return '$' + value.toFixed(2) + 'M';  // 百萬
    }
    if (value >= 0.001) {
      return '$' + (value * 1000).toFixed(2) + 'K';  // 千
    }
    return '$' + value.toFixed(2);
  };

  const formatPriceChange = (change) => {
    if (!change && change !== 0) return '-';
    const color = change >= 0 ? '#22c55e' : '#ef4444';
    const prefix = change >= 0 ? '+' : '';
    return <span style={{ color }}>{prefix}{change.toFixed(2)}%</span>;
  };

  // 計算市場分析數據
  const calculateMarketAnalysis = (data) => {
    if (!data || data.length === 0) return null;

    // 按交易量排序
    const sortedByVolume = [...data].sort((a, b) => b.totalVolume - a.totalVolume);
    const top5Volume = sortedByVolume.slice(0, 5);

    // 計算24小時漲幅最大的前5個
    const sortedByPriceChange = [...data].sort((a, b) => {
      const aChange = a.exchanges.binance.spot?.priceChange || 
                     a.exchanges.bybit.spot?.priceChange || 
                     a.exchanges.okx.spot?.priceChange || 0;
      const bChange = b.exchanges.binance.spot?.priceChange || 
                     b.exchanges.bybit.spot?.priceChange || 
                     b.exchanges.okx.spot?.priceChange || 0;
      return bChange - aChange;
    });
    const top5PriceChange = sortedByPriceChange.slice(0, 5);

    // 計算各交易所的交易量佔比
    const exchangeVolumes = data.reduce((acc, item) => {
      acc.binance += item.exchanges.binance.spot?.volume || 0;
      acc.bybit += item.exchanges.bybit.spot?.volume || 0;
      acc.okx += item.exchanges.okx.spot?.volume || 0;
      return acc;
    }, { binance: 0, bybit: 0, okx: 0 });

    const totalExchangeVolume = exchangeVolumes.binance + exchangeVolumes.bybit + exchangeVolumes.okx;
    
    return {
      top5Volume,
      top5PriceChange,
      exchangeShare: {
        binance: ((exchangeVolumes.binance / totalExchangeVolume) * 100).toFixed(2),
        bybit: ((exchangeVolumes.bybit / totalExchangeVolume) * 100).toFixed(2),
        okx: ((exchangeVolumes.okx / totalExchangeVolume) * 100).toFixed(2)
      }
    };
  };

  const marketAnalysis = calculateMarketAnalysis(data);

  return (
    <>
      <Head>
        <title>交易量 - 加密貨幣數據中心</title>
        <meta name="description" content="查看24小時交易量統計" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>交易量分析</h1>
          <button 
            className={styles.homeButton}
            onClick={() => router.push('/')}
          >
            返回主頁
          </button>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statsCard}>
            <div className={styles.statsTitle}>總24小時交易量</div>
            <div className={styles.statsValue}>{formatNumber(totalVolume.total)}</div>
          </div>
          <div className={styles.statsCard}>
            <div className={styles.statsTitle}>現貨交易量</div>
            <div className={styles.statsValue}>{formatNumber(totalVolume.spot)}</div>
          </div>
        </div>

        {marketAnalysis && (
          <div className={styles.analysisGrid}>
            <div className={styles.analysisCard}>
              <h3>交易量最大的幣種</h3>
              <ul>
                {marketAnalysis.top5Volume.map((item) => (
                  <li key={item.symbol}>
                    {item.symbol}: {formatNumber(item.totalVolume || 0)}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.analysisCard}>
              <h3>24小時漲跌幅</h3>
              <ul>
                {marketAnalysis.top5PriceChange.map((item) => (
                  <li key={item.symbol}>
                    {item.symbol}: {formatPriceChange(
                      item.exchanges.binance.spot?.priceChange || 
                      item.exchanges.bybit.spot?.priceChange || 
                      item.exchanges.okx.spot?.priceChange
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.analysisCard}>
              <h3>交易所交易量佔比</h3>
              <ul>
                <li>Binance: {marketAnalysis.exchangeShare.binance}%</li>
                <li>Bybit: {marketAnalysis.exchangeShare.bybit}%</li>
                <li>OKX: {marketAnalysis.exchangeShare.okx}%</li>
              </ul>
            </div>
          </div>
        )}

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="搜尋幣種..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>載入中...</div>
        ) : error ? (
          <div className={styles.error}>錯誤: {error}</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>幣種</th>
                  <th>總交易量</th>
                  <th>現貨交易量</th>
                  <th>Binance</th>
                  <th>Bybit</th>
                  <th>OKX</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.symbol}>
                    <td>{item.symbol}</td>
                    <td className={styles.totalVolume}>{formatNumber(item.totalVolume)}</td>
                    <td>{formatNumber(item.spotVolume)}</td>
                    <td>
                      <div className={styles.exchangeData}>
                        {item.exchanges.binance.spot && (
                          <div>
                            <div>交易量: {formatNumber(item.exchanges.binance.spot.volume)}</div>
                            <div>價格: {item.exchanges.binance.spot.price.toFixed(2)}</div>
                            <div>漲跌: {formatPriceChange(item.exchanges.binance.spot.priceChange)}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.exchangeData}>
                        {item.exchanges.bybit.spot && (
                          <div>
                            <div>交易量: {formatNumber(item.exchanges.bybit.spot.volume)}</div>
                            <div>價格: {item.exchanges.bybit.spot.price.toFixed(2)}</div>
                            <div>漲跌: {formatPriceChange(item.exchanges.bybit.spot.priceChange)}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.exchangeData}>
                        {item.exchanges.okx.spot && (
                          <div>
                            <div>交易量: {formatNumber(item.exchanges.okx.spot.volume)}</div>
                            <div>價格: {item.exchanges.okx.spot.price.toFixed(2)}</div>
                            <div>漲跌: {formatPriceChange(item.exchanges.okx.spot.priceChange)}</div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
} 