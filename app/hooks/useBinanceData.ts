import useSWR from 'swr';
import { useState, useEffect } from 'react';

// 基础配置类型
interface BaseOptions {
  symbol?: string;
  limit?: number;
  refreshInterval?: number;
}

// 时间间隔类型
export type KlineInterval = '1d' | '4h' | '1h' | '15m' | '1m';

// K线数据选项
export interface KlineDataOptions extends BaseOptions {
  endpoint: 'kline';
  interval: KlineInterval;
}

// 订单簿数据选项
export interface OrderBookDataOptions extends BaseOptions {
  endpoint: 'depth';
}

// 24小时行情数据选项
export interface TickerDataOptions extends BaseOptions {
  endpoint: 'ticker/24hr';
}

// 交易数据选项
export interface TradeDataOptions extends BaseOptions {
  endpoint: 'trades';
}

// 资金费率数据选项
export interface FundingRateDataOptions extends BaseOptions {
  endpoint: 'fundingRate';
}

// 联合类型
export type UseBinanceDataOptions =
  | KlineDataOptions
  | OrderBookDataOptions
  | TickerDataOptions
  | TradeDataOptions
  | FundingRateDataOptions;

// 响应数据类型映射
type DataTypeMap = {
  kline: Array<{
    time: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    closeTime: number;
    quoteAssetVolume: string;
    trades: number;
    takerBuyBaseAssetVolume: string;
    takerBuyQuoteAssetVolume: string;
    ignore: string;
  }>;
  depth: {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
  };
  'ticker/24hr': {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    lastPrice: string;
    volume: string;
    quoteVolume: string;
  };
  trades: Array<{
    id: number;
    price: string;
    qty: string;
    quoteQty: string;
    time: number;
    isBuyerMaker: boolean;
    isBestMatch: boolean;
  }>;
  fundingRate: Array<{
    symbol: string;
    fundingRate: string;
    fundingTime: number;
    markPrice: string;
  }>;
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

export function useBinanceData<T extends DataTypeMap[keyof DataTypeMap]>(
  options: UseBinanceDataOptions
) {
  const { endpoint, symbol = 'BTCUSDT', limit = 20, refreshInterval = 1000 } = options;
  
  // 使用类型守卫来处理不同的选项类型
  function isKlineOptions(opts: UseBinanceDataOptions): opts is KlineDataOptions {
    return opts.endpoint === 'kline';
  }

  const interval = isKlineOptions(options) ? options.interval : undefined;
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const queryString = new URLSearchParams({
    endpoint,
    symbol,
    limit: limit.toString(),
    ...(interval && { interval }),
  }).toString();

  const { data, error, mutate } = useSWR(
    `binance?${queryString}`,
    fetcher,
    {
      refreshInterval: refreshInterval,
      revalidateOnFocus: false,
      dedupingInterval: 100,
      onError: (err: Error) => {
        console.error('SWR Error:', err);
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            mutate();
          }, Math.pow(2, retryCount) * 500);
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