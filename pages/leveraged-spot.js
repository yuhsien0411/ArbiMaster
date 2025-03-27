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
  const [bybitData, setBybitData] = useState([]);
  const [ratePeriod, setRatePeriod] = useState('1h');

  const exchanges = ['Binance', 'Bybit', 'Bitget', 'OKX', 'Gate.io'];
  const ratePeriods = [
    { value: '1h', label: '1小時' },
    { value: '1d', label: '1天' },
    { value: '1y', label: '1年' }
  ];

  const calculateRate = (hourlyRate, period) => {
    const rate = parseFloat(hourlyRate);
    switch (period) {
      case '1h':
        return rate;
      case '1d':
        return rate * 24;
      case '1y':
        return rate * 24 * 365;
      default:
        return rate;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/leveraged-spot');
        
        if (response.data.success) {
          setLeveragedData(response.data.data);
          setAvailableExchanges(exchanges);
        } else {
          setError('獲取數據失敗，請稍後再試');
        }
        setLoading(false);
      } catch (err) {
        setError('獲取數據失敗，請稍後再試');
        setLoading(false);
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
    
    const intervalId = setInterval(fetchData, 300000);
    
    return () => clearInterval(intervalId);
  }, []);

  const getAllCurrencies = () => {
    const currencies = new Set();
    leveragedData.forEach(item => {
      const currency = item.pair.split('/')[0];
      currencies.add(currency);
    });
    return Array.from(currencies).sort();
  };

  const getExchangeData = (exchange, currency) => {
    const data = leveragedData.find(item => item.exchange === exchange && item.pair.startsWith(currency)) || null;
    if (data) {
      const hourlyRate = parseFloat(data.hourlyBorrowRate);
      const calculatedRate = calculateRate(hourlyRate, ratePeriod);
      return `${calculatedRate.toFixed(8)}%`;
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>槓桿現貨利率 | 加密貨幣數據中心</title>
        <meta name="description" content="比較各大交易所的槓桿現貨利率" />
      </Head>

      <main>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>槓桿現貨利率</h1>
          <button 
            className={styles.homeButton}
            onClick={() => router.push('/')}
          >
            返回主頁
          </button>
        </div>

        <div className={styles.ratePeriodSelector}>
          {ratePeriods.map(period => (
            <button
              key={period.value}
              className={`${styles.ratePeriodButton} ${ratePeriod === period.value ? styles.active : ''}`}
              onClick={() => setRatePeriod(period.value)}
            >
              {period.label}
            </button>
          ))}
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
                  <th>幣種</th>
                  {exchanges.map(exchange => (
                    <th key={exchange}>{exchange}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getAllCurrencies().map(currency => (
                  <tr key={currency}>
                    <td className={styles.currencyCell}>{currency}</td>
                    {exchanges.map(exchange => {
                      const rate = getExchangeData(exchange, currency);
                      return (
                        <td key={`${exchange}-${currency}`} className={styles.exchangeCell}>
                          {rate || <span className={styles.noData}>無數據</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.infoBox}>
          <h3>關於槓桿現貨利率</h3>
          <p>本頁面展示了各大交易所的槓桿現貨借貸利率。您可以選擇查看不同時間週期的利率：</p>
          <ul>
            <li>1小時：每小時的借貸利率</li>
            <li>1天：每天的借貸利率（小時利率 × 24）</li>
            <li>1年：每年的借貸利率（小時利率 × 24 × 365）</li>
          </ul>
          <p>注意：實際借貸利率可能會根據市場情況和您的 VIP 等級而有所不同。</p>
        </div>
      </main>
    </div>
  );
} 