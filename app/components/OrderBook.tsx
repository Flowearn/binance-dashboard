'use client';

import { useBinanceData } from '../hooks/useBinanceData';
import type { OrderBookDataOptions } from '../hooks/useBinanceData';

interface OrderBookData {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export default function OrderBook() {
  const { data, error, isLoading } = useBinanceData<OrderBookData>({
    endpoint: 'depth',
    symbol: 'BTCUSDT',
    limit: 20,
    refreshInterval: 1000,
  } as OrderBookDataOptions);

  const formatNumber = (value: string | undefined, decimals: number = 2) => {
    if (!value) return '0.00';
    try {
      return Number(value).toFixed(decimals);
    } catch {
      return '0.00';
    }
  };

  const renderOrders = (orders: [string, string][] | undefined, type: 'bids' | 'asks') => {
    if (!Array.isArray(orders)) return null;
    const colorClass = type === 'bids' ? 'text-green-500' : 'text-red-500';
    
    return orders.map((order, index) => {
      if (!Array.isArray(order) || order.length < 2) return null;
      const [price, quantity] = order;
      
      return (
        <div key={`${type}-${index}`} className="grid grid-cols-2 gap-2 text-sm">
          <span className={colorClass}>{formatNumber(price, 2)}</span>
          <span>{formatNumber(quantity, 4)}</span>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Order Book</h2>
        <div className="animate-pulse">Loading order book...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Order Book</h2>
        <div className="text-red-500">
          Error: {error.message}
        </div>
      </div>
    );
  }

  if (!data || !data.bids || !data.asks) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Order Book</h2>
        <div>No order book data available</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Order Book</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-green-500 mb-2">Bids</h3>
          {renderOrders(data.bids, 'bids')}
        </div>
        <div>
          <h3 className="text-red-500 mb-2">Asks</h3>
          {renderOrders(data.asks, 'asks')}
        </div>
      </div>
    </div>
  );
} 