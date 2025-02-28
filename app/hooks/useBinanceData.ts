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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

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

    async function fetchWithRetry(): Promise<T> {
      try {
        const params = new URLSearchParams({
          symbol,
          ...(endpoint === 'kline' && { interval }),
          limit: limit.toString(),
        });

        const response = await fetch(`${API_ENDPOINTS[endpoint]}?${params}`, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        retryCount = 0; // Reset retry count on success
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
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching data:', err);
          setError(err instanceof Error ? err : new Error('An error occurred'));
          // Keep the old data if available
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

    async function refreshData() {
      await fetchData();
      if (isMounted) {
        timeoutId = setTimeout(refreshData, refreshInterval);
      }
    }

    refreshData();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [endpoint, symbol, interval, limit, refreshInterval, data]);

  return { data, error, isLoading };
} 