console.log('開始獲取 Bitget 槓桿現貨數據...');
    let bitgetData = [];
    let borrowablePairs = []; // 在外部定義 borrowablePairs
    try {
      const currenciesResponse = await axios.get('https://api.bitget.com/api/v2/margin/currencies');
      console.log('Bitget 支持的貨幣:', currenciesResponse.data);
      if (currenciesResponse.data.code === '00000' && Array.isArray(currenciesResponse.data.data)) {
        borrowablePairs = currenciesResponse.data.data
          .filter(item => item.isBorrowable && item.quoteCoin === 'USDT')
          .map(item => item.symbol);
      } else {
        console.error('Bitget API 返回數據格式錯誤:', currenciesResponse.data);
        // 使用預設交易對作為備用
        borrowablePairs = ['BTCUSDT', 'ETHUSDT'];
      }
      console.log('Bitget 可借貸交易對:', borrowablePairs);

      // 獲取每個交易對的利率數據
      for (const symbol of borrowablePairs) {
        // console.log('開始獲取 Bitget 利率數據...', symbol);
        try{
          const url = 'https://api.bitget.com/api/v2/margin/isolated/interest-rate-and-limit';
          const timestamp = Date.now().toString();
          
          const message = timestamp + 'GET' + `/api/v2/margin/isolated/interest-rate-and-limit?symbol=${symbol}`;
          const mac = crypto.createHmac('sha256', Buffer.from(process.env.BITGET_API_SECRET, 'utf8')).update(message);
          const sign = mac.digest('base64');
          
          const headers = {
            'ACCESS-KEY': process.env.BITGET_API_KEY,
            'ACCESS-SIGN': sign,
            'ACCESS-PASSPHRASE': process.env.BITGET_PASSPHRASE,
            'ACCESS-TIMESTAMP': timestamp,
            'Content-Type': 'application/json',
            'locale': 'zh-CN'
          }
          const params = new URLSearchParams({ symbol });
          const response = await axios.get(`${url}?${params}`, { headers });
          
          if (response.data.code === '00000' && response.data.data && response.data.data[0]) {
            const rateData = response.data.data[0];
            bitgetData.push({
              exchange: 'Bitget',
              pair: `${rateData.baseCoin}/USDT`,
              hourlyBorrowRate: (parseFloat(rateData.baseDailyInterestRate) / 24 * 100).toString(),
              maxLeverage: rateData.leverage,
              dailyInterestRate: rateData.baseDailyInterestRate,
              annuallyInterestRate: rateData.baseAnnuallyInterestRate,
              maxBorrowableAmount: rateData.baseMaxBorrowableAmount
            });
          }
          
        }catch(error){
          console.error('獲取 Bitget 利率數據失敗:', error.message);
          if (error.response?.data) {
            console.error('錯誤詳情:', error.response.data);
          }
        }
      }
      console.log('Bitget 數據獲取成功，數量:', bitgetData.length);
    
    } catch (error) {
      console.error('獲取 Bitget 數據失敗:', error.message);
      if (error.response?.data) {
        console.error('錯誤詳情:', error.response.data);
      }
    }