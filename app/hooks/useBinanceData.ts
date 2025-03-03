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
  kline: [number, string, string, string, string, string, number, string, number, string, string, string][];
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
    // Parse the original query parameters
    const params = new URLSearchParams(url.split('?')[1]);
    const endpoint = params.get('endpoint') || 'kline';
    
    // Map the endpoint to the correct type parameter
    let type = endpoint;
    if (endpoint === 'ticker/24hr') {
      type = 'ticker';
    } else if (endpoint === 'depth') {
      type = 'orderbook';
    }
    
    // Construct new query parameters
    const newParams = new URLSearchParams();
    newParams.set('type', type);
    
    // Use Array.from to handle iteration
    Array.from(params.entries()).forEach(([key, value]) => {
      if (key !== 'endpoint') {
        newParams.append(key, value);
      }
    });
    
    // Make the request to market-data API
    const response = await fetch(`/api/market-data?${newParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }
    
    const result = await response.json();
    
    // Handle the success property in the response
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch market data');
    }
    
    // Transform the data based on the endpoint type
    switch (endpoint) {
      case 'kline':
        return result.data.map((item: any) => [
          item[0],
          item[1],
          item[2],
          item[3],
          item[4],
          item[5],
          item[6],
          item[7],
          item[8],
          item[9],
          item[10],
          item[11]
        ]);
      case 'depth':
        return {
          lastUpdateId: result.data.lastUpdateId,
          bids: result.data.bids,
          asks: result.data.asks
        };
      case 'ticker/24hr':
        return result.data;
      case 'trades':
        return result.data;
      default:
        return result.data;
    }
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