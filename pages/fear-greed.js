import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/FearGreed.module.css';

export default function FearGreed() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/fear-greed');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
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
    const interval = setInterval(fetchData, 300000); // 每5分鐘更新一次
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value) => {
    if (value <= 20) return '#FF4444';
    if (value <= 40) return '#FF8C42';
    if (value <= 60) return '#FFD700';
    if (value <= 80) return '#90EE90';
    return '#32CD32';
  };

  const getStatusText = (value) => {
    if (value <= 20) return '極度恐懼';
    if (value <= 40) return '恐懼';
    if (value <= 60) return '中性';
    if (value <= 80) return '貪婪';
    return '極度貪婪';
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
        <h1 className={styles.title}>貪婪恐懼指數</h1>
        <Link href="/" className={styles.homeButton}>
          返回首頁
        </Link>
      </div>

      <div className={styles.content}>
        <div className={styles.value} style={{ color: getStatusColor(data.value) }}>
          {data.value}
        </div>
        
        <div className={styles.status} style={{ color: getStatusColor(data.value) }}>
          {getStatusText(data.value)}
        </div>

        <div className={styles.meter}>
          <div className={styles.meterBackground}></div>
          <div className={styles.meterMarkers}>
            <div className={styles.marker}>
              <span>極度恐懼</span>
            </div>
            <div className={styles.marker}>
              <span>恐懼</span>
            </div>
            <div className={styles.marker}>
              <span>中性</span>
            </div>
            <div className={styles.marker}>
              <span>貪婪</span>
            </div>
            <div className={styles.marker}>
              <span>極度貪婪</span>
            </div>
          </div>
          <div 
            className={styles.pointer}
            style={{
              left: `${data.value}%`,
            }}
          />
        </div>

        <div className={styles.timestamp}>
          最後更新時間: {new Date(data.timestamp * 1000).toLocaleString()}
        </div>

        <div className={styles.legend}>
          <h2 className={styles.legendTitle}>什麼是貪婪恐懼指數？</h2>
          <p>
            貪婪恐懼指數是一個衡量加密貨幣市場情緒的指標，範圍從 0（極度恐懼）到 100（極度貪婪）。
            這個指標可以幫助投資者了解市場的整體情緒，並可能預示市場的轉折點。
          </p>
          <p>
            當指數處於極度恐懼區域時，可能意味著市場被過度拋售，可能是一個買入機會。
            相反，當指數處於極度貪婪區域時，可能意味著市場被過度炒作，需要謹慎行事。
          </p>
        </div>
      </div>
    </div>
  );
} 