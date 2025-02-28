import { useState, useEffect } from 'react';

interface UseBinanceDataProps {
  endpoint: 'kline' | 'orderbook' | 'ticker24h' | 'fundingRate' | 'trades';
  symbol?: string;
  interval?: string;
  limit?: number;
  refreshInterval?: number;
}

export function useBinanceData<T>({
  endpoint,
  symbol = 'BTCUSDT',
  interval = '1d',
  limit = 100,
  refreshInterval = 5000, // 默认5秒刷新一次
}: UseBinanceDataProps) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    async function fetchData() {
      try {
        const params = new URLSearchParams({
          endpoint,
          symbol,
          interval,
          limit: limit.toString(),
        });

        const response = await fetch(`/api/binance?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('An error occurred'));
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
  }, [endpoint, symbol, interval, limit, refreshInterval]);

  return { data, error, isLoading };
} 