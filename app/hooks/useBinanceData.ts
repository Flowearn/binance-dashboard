import { useState, useEffect } from 'react';

interface UseBinanceDataProps {
  endpoint: 'kline' | 'orderbook' | 'ticker24h' | 'fundingRate' | 'trades';
  symbol?: string;
  interval?: string;
  limit?: number;
  refreshInterval?: number;
}

const API_ENDPOINTS = {
  kline: 'https://api.binance.com/api/v3/klines',
  orderbook: 'https://api.binance.com/api/v3/depth',
  ticker24h: 'https://api.binance.com/api/v3/ticker/24hr',
  fundingRate: 'https://fapi.binance.com/fapi/v1/fundingRate',
  trades: 'https://api.binance.com/api/v3/trades',
};

export function useBinanceData<T>({
  endpoint,
  symbol = 'BTCUSDT',
  interval = '1d',
  limit = 100,
  refreshInterval = 5000,
}: UseBinanceDataProps) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    async function fetchWithRetry(): Promise<T> {
      try {
        // 首先尝试从本地 API 获取数据
        const localResponse = await fetch(`/api/market-data?symbol=${symbol}&type=${endpoint}`);
        if (localResponse.ok) {
          const localData = await localResponse.json();
          if (localData && Object.keys(localData).length > 0) {
            return localData.data;
          }
        }

        // 如果本地没有数据，则从 Binance API 获取
        const params = new URLSearchParams({
          symbol,
          ...(endpoint === 'kline' && { interval }),
          limit: limit.toString(),
        });

        const response = await fetch(`${API_ENDPOINTS[endpoint]}?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // 存储数据到本地数据库
        await fetch('/api/market-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol,
            type: endpoint,
            data: result,
          }),
        });

        return result;
      } catch (err) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
          return fetchWithRetry();
        }
        throw err;
      }
    }

    async function fetchData() {
      if (!isMounted) return;
      
      try {
        const result = await fetchWithRetry();
        if (isMounted) {
          setData(result);
          setError(null);
          retryCount = 0;
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching data:', err);
          setError(err instanceof Error ? err : new Error('An error occurred'));
          if (!data) {
            setData(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    if (refreshInterval > 0) {
      timeoutId = setInterval(fetchData, refreshInterval);
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearInterval(timeoutId);
      }
    };
  }, [endpoint, symbol, interval, limit, refreshInterval]);

  return { data, error, isLoading };
} 