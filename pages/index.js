import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import FearGreedWidget from '../components/FearGreedWidget';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
    
    // 添加滾動監聽
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
        <title>ArbiMaster | 加密貨幣套利分析平台</title>
        <meta name="description" content="ArbiMaster是專業的加密貨幣套利分析工具，提供即時市場數據、交易所資訊和市場情緒指標等全方位分析" />
        <meta name="keywords" content="加密貨幣,套利,交易所,資金費率,市場分析,比特幣,以太坊" />
        <meta property="og:title" content="ArbiMaster | 加密貨幣套利分析平台" />
        <meta property="og:description" content="專業的加密貨幣套利與市場數據分析平台" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⚡️</span>
            <span className={styles.logoText}>ArbiMaster</span>
          </Link>
          <div className={styles.navRight}>
            <FearGreedWidget />
            <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleTheme} />
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              專業的加密貨幣
              <br />
              市場數據分析平台
            </h1>
            <p className={styles.heroSubtitle}>
              提供即時市場數據、交易所資訊、市場情緒指標等全方位分析工具
            </p>
            <div className={styles.heroCta}>
              <Link href="/funding-rate" className={styles.primaryButton}>
                查看資金費率
                <span className={styles.buttonIcon}>→</span>
              </Link>
              <Link href="/cexearn" className={styles.secondaryButton}>
                探索 CEX 收益
                <span className={styles.buttonIcon}>→</span>
              </Link>
            </div>
          </div>
          <div className={styles.heroGraphic}>
            <div className={styles.graphicCircle}></div>
            <div className={styles.graphicCircle}></div>
            <div className={styles.graphicCircle}></div>
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>市場分析工具</h2>
            <p className={styles.sectionDescription}>全方位的加密貨幣市場數據分析工具，助您洞察市場動向，把握投資良機</p>
          </div>
          
          <div className={styles.featureGrid}>
            {[
              {
                href: '/market-heatmap',
                icon: '🌡️',
                iconClass: styles.heatmap,
                stats: { label: '更新頻率', value: '實時' },
                title: '市值熱力圖',
                description: '直觀展示加密貨幣市場漲跌情況，快速把握市場動態'
              },
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
                href: '/predictions',
                icon: '🤖',
                iconClass: styles.predictions,
                stats: { label: 'AI模型', value: '機器學習' },
                title: 'AI 預測分析',
                description: '基於機器學習的資金費率預測、套利機會分析和市場情緒預測'
              },
              {
                href: '/realistic-predictions',
                icon: '📈',
                iconClass: styles.realisticPredictions,
                stats: { label: '數據來源', value: '真實數據' },
                title: 'AI 實用預測',
                description: '基於真實數據的多因子分析，提供具體交易建議和歷史表現追蹤'
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
        
        <section className={styles.aboutSection}>
          <div className={styles.aboutContent}>
            <h2 className={styles.aboutTitle}>關於 ArbiMaster</h2>
            <p className={styles.aboutDescription}>
              ArbiMaster 是專為加密貨幣交易者設計的綜合性分析平台，提供多維度數據，幫助您做出更明智的交易決策。
              我們持續監控多個主流交易所的市場數據，讓您輕鬆把握套利機會和市場趨勢。
            </p>
            <div className={styles.aboutStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>8+</span>
                <span className={styles.statLabel}>支持交易所</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>50+</span>
                <span className={styles.statLabel}>監控幣種</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>24/7</span>
                <span className={styles.statLabel}>即時更新</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.copyright}>© {new Date().getFullYear()} ArbiMaster. 保留所有權利。</p>
          <div className={styles.footerLinks}>
            <Link href="/privacy">隱私政策</Link>
            <Link href="/terms">使用條款</Link>
            <Link href="mailto:contact@arbimaster.com">聯絡我們</Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 