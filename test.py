import requests
import time
import hmac
import hashlib
import base64

def get_bitget_leverage_spot():
    url = 'https://api.bitget.com/api/v2/spot/leverage/info'
    headers = {
        'Content-Type': 'application/json',
        'locale': 'zh-CN'
    }
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Bitget API 調用失敗: {response.status_code} - {response.text}')
        return None

def get_isolated_margin_info(symbol, api_key, api_secret, passphrase):
    url = 'https://api.bitget.com/api/v2/margin/isolated/interest-rate-and-limit'
    timestamp = str(int(time.time() * 1000))
    
    # 準備簽名
    message = timestamp + 'GET' + f'/api/v2/margin/isolated/interest-rate-and-limit?symbol={symbol}'
    mac = hmac.new(
        bytes(api_secret, encoding='utf8'),
        bytes(message, encoding='utf-8'),
        digestmod='sha256'
    )
    sign = base64.b64encode(mac.digest()).decode()
    
    headers = {
        'ACCESS-KEY': api_key,
        'ACCESS-SIGN': sign,
        'ACCESS-PASSPHRASE': passphrase,
        'ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
        'locale': 'zh-CN'
    }
    
    params = {
        'symbol': symbol
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f'Bitget API 調用失敗: {response.status_code} - {response.text}')
        return None

# 使用範例
if __name__ == "__main__":
    import os
    from dotenv import load_dotenv

    load_dotenv()  # 載入 .env 檔案中的環境變數

    API_KEY = os.getenv("BITGET_API_KEY")  # 從環境變數獲取 API_KEY
    API_SECRET = os.getenv("BITGET_API_SECRET")  # 從環境變數獲取 API_SECRET
    PASSPHRASE = os.getenv("BITGET_PASSPHRASE")  # 從環境變數獲取 PASSPHRASE
    
    # 獲取槓桿現貨交易對
    leverage_info = get_bitget_leverage_spot()
    if leverage_info:
        print("可交易的槓桿現貨交易對：")
        for item in leverage_info.get('data', []):
            print(f"交易對: {item.get('symbol')}, 槓桿倍數: {item.get('leverage')}")
    
    # 獲取特定交易對的槓桿利率和最大可借額度
    symbol = "BTCUSDT"
    margin_info = get_isolated_margin_info(symbol, API_KEY, API_SECRET, PASSPHRASE)
    if margin_info:
        print(f"\n{symbol} 的槓桿資訊：")
        print(margin_info)
