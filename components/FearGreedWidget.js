import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/FearGreedWidget.module.css';

export default function FearGreedWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Error fetching fear and greed index:', err);
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

  if (loading || !data) {
    return <div className={styles.widget}>載入中...</div>;
  }

  return (
    <Link href="/fear-greed" className={styles.widget}>
      <div className={styles.label}>市場情緒</div>
      <div className={styles.content}>
        <div className={styles.value} style={{ color: getStatusColor(data.value) }}>
          {data.value}
        </div>
        <div className={styles.status} style={{ color: getStatusColor(data.value) }}>
          {getStatusText(data.value)}
        </div>
      </div>
    </Link>
  );
} 