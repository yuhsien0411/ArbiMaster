import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

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
    <div className="container">
      <Head>
        <title>加密貨幣數據中心</title>
        <meta name="description" content="加密貨幣數據中心 - 提供資金費率、未平倉合約等數據" />
      </Head>

      <main>
        <div className="header-container">
          <div className="title-container">
            <h1>加密貨幣數據中心</h1>
            <button 
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDarkMode ? "切換至淺色模式" : "切換至深色模式"}
            >
              {isDarkMode ? '🌞' : '🌛'}
            </button>
          </div>
        </div>

        <div className="cards-container">
          <Link href="/funding-rate" className="card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h2>資金費率</h2>
              <p>查看各大交易所的資金費率數據及歷史資料</p>
            </div>
          </Link>

          <Link href="/fund-flow" className="card">
            <div className="card-icon">💹</div>
            <div className="card-content">
              <h2>資金流向</h2>
              <p>查看各大交易所的資金流入流出情況</p>
            </div>
          </Link>

          <Link href="/volume" className="card">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h2>交易量</h2>
              <p>查看24小時交易量統計</p>
            </div>
          </Link>

          <Link href="/open-interest" className="card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h2>未平倉合約</h2>
              <p>查看合約未平倉量數據</p>
            </div>
          </Link>

          <Link href="/fear-greed" className="card">
            <div className="card-icon">😨</div>
            <div className="card-content">
              <h2>貪婪恐懼指數</h2>
              <p>查看比特幣市場情緒指標及歷史走勢</p>
            </div>
          </Link>

          <Link href="/cexearn" className="card">
            <div className="card-icon">💵</div>
            <div className="card-content">
              <h2>CEX 理財收益</h2>
              <p>比較各大交易所的穩定幣活期理財收益率</p>
            </div>
          </Link>
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .cards-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .card {
          background-color: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 10px;
          padding: 20px;
          transition: transform 0.3s, box-shadow 0.3s;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: var(--text-color);
          height: 100%;
          min-height: 200px;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
          background-color: var(--card-hover);
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .card-content {
          flex: 1;
        }

        .card h2 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          opacity: 0.8;
        }

        .header-container {
          text-align: center;
          margin-bottom: 40px;
        }

        .title-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
        }

        .theme-toggle {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: background-color 0.3s;
        }

        .theme-toggle:hover {
          background-color: var(--card-hover);
        }

        /* 移動端適配 */
        @media (max-width: 768px) {
          .cards-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 