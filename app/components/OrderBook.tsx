'use client';

import React, { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

interface OrderBookEntry {
  price: string;
  quantity: string;
}

interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

const OrderBook: React.FC = () => {
  const [orderBook, setOrderBook] = useState<OrderBookData>({ bids: [], asks: [] });
  const symbol = 'btcusdt';
  const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@depth20@100ms`;

  const { lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      setOrderBook({
        bids: data.bids.map(([price, quantity]: string[]) => ({ price, quantity })),
        asks: data.asks.map(([price, quantity]: string[]) => ({ price, quantity })),
      });
    }
  }, [lastMessage]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Order Book (BTC/USDT)</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-green-600 font-semibold mb-2">Bids</h3>
          {orderBook.bids.map((bid, index) => (
            <div key={index} className="text-sm grid grid-cols-2">
              <span>{parseFloat(bid.price).toFixed(2)}</span>
              <span>{parseFloat(bid.quantity).toFixed(6)}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-red-600 font-semibold mb-2">Asks</h3>
          {orderBook.asks.map((ask, index) => (
            <div key={index} className="text-sm grid grid-cols-2">
              <span>{parseFloat(ask.price).toFixed(2)}</span>
              <span>{parseFloat(ask.quantity).toFixed(6)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook; 