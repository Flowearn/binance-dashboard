'use client';

import { useState, useEffect } from 'react';
import { useBinanceData } from '../hooks/useBinanceData';
import { useBinanceWebSocket } from '../hooks/useBinanceWebSocket';

interface OrderBookData {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

interface WebSocketDepthData {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  U: number; // First update ID
  u: number; // Final update ID
  b: [string, string][]; // Bids
  a: [string, string][]; // Asks
}

export default function OrderBook() {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  
  // 初始数据获取
  const { data: initialData, error: fetchError, isLoading } = useBinanceData<OrderBookData>({
    endpoint: 'orderbook',
    symbol: 'BTCUSDT',
    limit: 20,
    refreshInterval: 10000,
  });

  // WebSocket 实时更新
  const { data: wsData, error: wsError, isConnected } = useBinanceWebSocket<WebSocketDepthData>({
    symbol: 'BTCUSDT',
    stream: 'depth',
  });

  useEffect(() => {
    if (initialData) {
      setOrderBook(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    if (wsData && orderBook) {
      // 更新订单簿数据
      setOrderBook(prev => {
        if (!prev) return prev;
        return {
          lastUpdateId: wsData.u,
          bids: wsData.b.slice(0, 20),
          asks: wsData.a.slice(0, 20),
        };
      });
    }
  }, [wsData]);

  const formatNumber = (value: string, decimals: number = 2) => {
    return Number(value).toFixed(decimals);
  };

  if (isLoading) {
    return <div className="p-4">Loading order book...</div>;
  }

  if (fetchError || wsError) {
    return (
      <div className="p-4 text-red-500">
        Error: {(fetchError || wsError)?.message}
      </div>
    );
  }

  if (!orderBook) {
    return <div className="p-4">No order book data available</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Order Book</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-green-500 mb-2">Bids</h3>
          {orderBook.bids.map(([price, quantity], index) => (
            <div key={`bid-${index}`} className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-green-500">{formatNumber(price, 2)}</span>
              <span>{formatNumber(quantity, 4)}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-red-500 mb-2">Asks</h3>
          {orderBook.asks.map(([price, quantity], index) => (
            <div key={`ask-${index}`} className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-red-500">{formatNumber(price, 2)}</span>
              <span>{formatNumber(quantity, 4)}</span>
            </div>
          ))}
        </div>
      </div>
      {!isConnected && (
        <div className="mt-4 text-yellow-500">
          WebSocket disconnected. Attempting to reconnect...
        </div>
      )}
    </div>
  );
} 