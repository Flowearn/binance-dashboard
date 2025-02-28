'use client';

import { useBinanceData } from '../hooks/useBinanceData';

interface OrderBookData {
  lastUpdateId: number;
  bids: string[][];  // [price, quantity]
  asks: string[][];  // [price, quantity]
}

export default function OrderBook() {
  const { data, error, isLoading } = useBinanceData<OrderBookData>({
    endpoint: 'orderbook',
    symbol: 'BTCUSDT',
    limit: 10,
    refreshInterval: 1000, // 1秒更新一次
  });

  const formatNumber = (num: string, decimals: number = 2) => {
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Order Book</h2>
        <div className="text-red-500">Error loading order book data</div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Order Book</h2>
        <div className="animate-pulse">Loading order book...</div>
      </div>
    );
  }

  // 获取当前价格（最高买价和最低卖价的中间值）
  const highestBid = Number(data.bids[0]?.[0] || 0);
  const lowestAsk = Number(data.asks[0]?.[0] || 0);
  const currentPrice = (highestBid + lowestAsk) / 2;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Order Book</h2>
      <div className="current-price text-xl">
        {formatNumber(currentPrice.toString())}
      </div>
      <div className="order-book-container">
        {/* Sell Orders */}
        <div className="order-book-column">
          <div className="sell space-y-1">
            {data.asks.slice(0, 10).map(([price, quantity], index) => (
              <div key={index} className="order-book-row">
                <span>{formatNumber(price)}</span>
                <span>{formatNumber(quantity, 4)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buy Orders */}
        <div className="order-book-column">
          <div className="buy space-y-1">
            {data.bids.slice(0, 10).map(([price, quantity], index) => (
              <div key={index} className="order-book-row">
                <span>{formatNumber(price)}</span>
                <span>{formatNumber(quantity, 4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 