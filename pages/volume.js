import React from 'react';
import Head from 'next/head';
import styles from '../styles/Volume.module.css';
import { useRouter } from 'next/router';

export default function Volume() {
  const router = useRouter();
  
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
            <div className={styles.statsValue}>$--</div>
          </div>
          <div className={styles.statsCard}>
            <div className={styles.statsTitle}>現貨交易量</div>
            <div className={styles.statsValue}>$--</div>
          </div>
          <div className={styles.statsCard}>
            <div className={styles.statsTitle}>合約交易量</div>
            <div className={styles.statsValue}>$--</div>
          </div>
        </div>
        
        <p>數據即將上線，請稍後再來查看。</p>
      </div>
    </>
  );
} 