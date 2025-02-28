import useSWR from 'swr';
import { useState, useEffect } from 'react';

export type UseBinanceDataOptions = {
  endpoint: string;
  symbol?: string;
  limit?: number;
  refreshInterval?: number;
  interval?: string;
};

const fetcher = async (url: string) => {
  try {
    // 直接从Binance API获取实时数据
    const binanceResponse = await fetch(`/api/binance?${url.split('?')[1]}`);
    if (!binanceResponse.ok) {
      throw new Error('Failed to fetch from Binance API');
    }
    const binanceData = await binanceResponse.json();

    // 异步存储数据，不阻塞主流程
    (async () => {
      try {
        await fetch('/api/market-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symbol: new URLSearchParams(url.split('?')[1]).get('symbol') || 'BTCUSDT',
            type: new URLSearchParams(url.split('?')[1]).get('endpoint') || 'orderbook',
            data: binanceData,
          }),
        });
      } catch (error) {
        // 存储失败不影响前端展示
        console.warn('Failed to store market data:', error);
      }
    })();

    return binanceData;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export function useBinanceData<T>(options: UseBinanceDataOptions) {
  const { endpoint, symbol = 'BTCUSDT', limit = 20, refreshInterval = 1000, interval } = options; // 添加 interval
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const queryString = new URLSearchParams({
    endpoint,
    symbol,
    limit: limit.toString(),
    ...(interval && { interval }), // 有 interval 时才添加到查询参数
  }).toString();

  const { data, error, mutate } = useSWR(
    `binance?${queryString}`,
    fetcher,
    {
      refreshInterval: refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 100, // 降低重复请求的时间间隔
      onError: (err: Error) => {
        console.error('SWR Error:', err);
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            mutate();
          }, Math.pow(2, retryCount) * 500); // 减少重试等待时间
        }
      }
    }
  );

  useEffect(() => {
    return () => {
      setRetryCount(0);
    };
  }, []);

  return {
    data: data as T,
    error,
    isLoading: !error && !data,
  };
} 