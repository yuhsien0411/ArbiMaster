/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 禁用 webpack HMR (Hot Module Replacement)123
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: false,
        followSymlinks: false,
      };
    }
    return config;
  },
  // 添加自定義 headers 來防止不必要的請求
  async headers() {
    return [
      {
        source: '/socket.io/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        // Binance Futures API 重寫
        source: '/api/binance/funding-rates',
        destination: 'https://fapi.binance.com/fapi/v1/premiumIndex'
      },
      {
        // Binance Funding Info API 重寫
        source: '/api/binance/funding-info',
        destination: 'https://fapi.binance.com/fapi/v1/fundingInfo'
      },
      {
        // Bybit API 重寫 
        source: '/api/bybit/funding-rates',
        destination: 'https://api.bybit.com/v5/market/tickers'
      },
      {
        // Bybit Instruments API 重寫
        source: '/api/bybit/instruments',
        destination: 'https://api.bybit.com/v5/market/instruments-info'
      },
      {
        // Bitget API 重寫
        source: '/api/bitget/funding-rates', 
        destination: 'https://api.bitget.com/api/v2/mix/market/tickers'
      },
      {
        // Bitget Contracts API 重寫
        source: '/api/bitget/contracts',
        destination: 'https://api.bitget.com/api/v2/mix/market/contracts'
      },
      {
        // OKX API 重寫
        source: '/api/okx/tickers',
        destination: 'https://www.okx.com/api/v5/public/mark-price'
      },
      {
        // OKX Instruments API 重寫
        source: '/api/okx/instruments',
        destination: 'https://www.okx.com/api/v5/public/instruments'
      },
      {
        // OKX Funding Rate API 重寫
        source: '/api/okx/funding-rate/:instId',
        destination: 'https://www.okx.com/api/v5/public/funding-rate?instId=:instId'
      }
    ];
  },
}

module.exports = nextConfig