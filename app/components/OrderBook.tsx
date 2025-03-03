'use client';

import { useEffect, useState } from 'react';
import { useBinanceData } from '../hooks/useBinanceData';

interface OrderBookData {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export default function OrderBook() {
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(null);

  const { data, error, isLoading } = useBinanceData<OrderBookData>({
    endpoint: 'depth',
    symbol: 'BTCUSDT',
    limit: 10,
    refreshInterval: 1000
  });

  useEffect(() => {
    if (data) {
      setOrderBookData(data);
    }
  }, [data]);

  if (error) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">订单簿</h3>
        <div className="text-red-500">加载失败</div>
      </div>
    );
  }

  if (isLoading || !orderBookData) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">订单簿</h3>
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">订单簿</h3>
      <div className="grid grid-cols-2 gap-4">
        {/* 卖单区域 */}
        <div>
          <div className="text-red-500 font-semibold mb-1">卖单</div>
          <div className="space-y-1">
            {orderBookData.asks.map(([price, amount], index) => (
              <div
                key={`ask-${index}`}
                className="flex justify-between text-sm"
              >
                <span className="text-red-500">{price}</span>
                <span>{amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 买单区域 */}
        <div>
          <div className="text-green-500 font-semibold mb-1">买单</div>
          <div className="space-y-1">
            {orderBookData.bids.map(([price, amount], index) => (
              <div
                key={`bid-${index}`}
                className="flex justify-between text-sm"
              >
                <span className="text-green-500">{price}</span>
                <span>{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 