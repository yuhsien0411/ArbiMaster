import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/MarketHeatmap.module.css';

export default function MarketHeatmap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/market-heatmap');
        if (!response.ok) {
          throw new Error('獲取數據失敗');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分鐘更新一次
    return () => clearInterval(interval);
  }, []);

  const getColorByChange = (change) => {
    if (change > 20) return '#00873c';
    if (change > 10) return '#26a248';
    if (change > 5) return '#5ac463';
    if (change > 0) return '#a0d8b3';
    if (change > -5) return '#ffb3b3';
    if (change > -10) return '#ff7f7f';
    if (change > -20) return '#ff4c4c';
    return '#cc0000';
  };

  const formatVolume = (volume) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>載入中...</div>
    </div>
  );

  if (error) return (
    <div className={styles.container}>
      <div className={styles.error}>錯誤: {error}</div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>市值熱力圖</h1>
        <Link href="/" className={styles.homeButton}>
          返回首頁
        </Link>
      </div>

      <div className={styles.heatmapContainer}>
        <div className={styles.heatmapGrid}>
          {data.map((item) => (
            <div
              key={item.symbol}
              className={styles.heatmapItem}
              style={{
                backgroundColor: getColorByChange(item.priceChange),
              }}
            >
              <div className={styles.symbol}>{item.symbol}</div>
              <div className={styles.price}>${item.price.toFixed(2)}</div>
              <div className={styles.change} style={{ color: item.priceChange >= 0 ? '#fff' : '#fff' }}>
                {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(2)}%
              </div>
              <div className={styles.volume}>
                ${formatVolume(item.volume)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendTitle}>漲跌幅顏色說明</div>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#00873c' }}></div>
            <span>&gt;20%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#26a248' }}></div>
            <span>10-20%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#5ac463' }}></div>
            <span>5-10%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#a0d8b3' }}></div>
            <span>0-5%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#ffb3b3' }}></div>
            <span>0-(-5)%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#ff7f7f' }}></div>
            <span>(-5)-(-10)%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#ff4c4c' }}></div>
            <span>(-10)-(-20)%</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: '#cc0000' }}></div>
            <span>&lt;-20%</span>
          </div>
        </div>
      </div>
    </div>
  );
} 