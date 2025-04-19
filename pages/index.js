import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 從 localStorage 讀取主題設置
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme === 'dark');

    // 根據系統主題設置初始值
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    // 當主題改變時更新 document
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <div className={styles.appContainer}>
      <Head>
        <title>ArbiMaster</title>
        <meta name="description" content="加密貨幣套利分析工具" />
      </Head>

      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⚡️</span>
            <span>ArbiMaster</span>
          </div>
          <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
        </div>
      </nav>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            專業的加密貨幣
            <br />
            市場數據分析平台
          </h1>
          <p className={styles.heroSubtitle}>
            提供即時市場數據、交易所資訊、市場情緒指標等全方位分析工具
          </p>
        </section>

        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>市場分析工具</h2>
            <p className={styles.sectionDescription}>全方位的加密貨幣市場數據分析工具，助您洞察市場動向</p>
          </div>
          
          <div className={styles.featureGrid}>
            {[
              {
                href: '/funding-rate',
                icon: '💰',
                iconClass: styles.funding,
                stats: { label: '更新頻率', value: '每8小時' },
                title: '資金費率',
                description: '追蹤主流交易所的資金費率變化趨勢，掌握市場動向'
              },
              {
                href: '/fund-flow',
                icon: '💹',
                iconClass: styles.flow,
                stats: { label: '數據來源', value: '3+交易所' },
                title: '資金流向',
                description: '分析交易所資金流入流出趨勢，預測市場走向'
              },
              {
                href: '/volume',
                icon: '📈',
                iconClass: styles.volume,
                stats: { label: '更新頻率', value: '實時' },
                title: '交易量分析',
                description: '全面監控24小時交易量數據，了解市場活躍度'
              },
              {
                href: '/open-interest',
                icon: '📊',
                iconClass: styles.interest,
                stats: { label: '監控幣種', value: '50+' },
                title: '未平倉合約',
                description: '追蹤合約市場持倉變化，把握市場趨勢'
              },
              {
                href: '/fear-greed',
                icon: '😨',
                iconClass: styles.fear,
                stats: { label: '更新頻率', value: '每日' },
                title: '市場情緒指標',
                description: '追蹤比特幣市場恐慌指數，洞察市場情緒'
              },
              {
                href: '/cexearn',
                icon: '💵',
                iconClass: styles.earn,
                stats: { label: '支持幣種', value: 'USDT' },
                title: 'CEX 收益分析',
                description: '對比各大交易所理財收益，優化資產配置'
              },
              {
                href: '/leveraged-spot',
                icon: '🔄',
                iconClass: styles.leveraged,
                stats: { label: '槓桿倍數', value: '最高10x' },
                title: '槓桿現貨',
                description: '追蹤槓桿現貨交易數據，把握市場趨勢和投資機會'
              },
              {
                href: '/lending',
                icon: '💎',
                iconClass: styles.lending,
                stats: { label: '支持幣種', value: '10+' },
                title: '質押借貸',
                description: '比較各大交易所的質押借貸利率，優化資產利用效率'
              }
            ].map((feature, index) => (
              <Link href={feature.href} key={index} className={styles.featureCard}>
                <div className={styles.featureCardInner}>
                  <div className={styles.featureHeader}>
                    <div className={`${styles.featureIconWrapper} ${feature.iconClass}`}>
                      <span>{feature.icon}</span>
                    </div>
                    <div className={styles.featureStats}>
                      <span className={styles.statsLabel}>{feature.stats.label}</span>
                      <span className={styles.statsValue}>{feature.stats.value}</span>
                    </div>
                  </div>
                  <div className={styles.featureContent}>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <p className={styles.featureDescription}>{feature.description}</p>
                  </div>
                  <div className={styles.featureFooter}>
                    <span className={styles.viewMore}>查看詳情</span>
                    <span className={styles.arrow}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
} 