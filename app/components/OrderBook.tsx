'use client';

import React, { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

interface OrderBookEntry {
  price: string;
  quantity: string;
  total: string;
}

interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

interface Props {
  symbol: string;
}

const OrderBook: React.FC<Props> = ({ symbol }) => {
  const [orderBookData, setOrderBookData] = useState<OrderBookData>({ bids: [], asks: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsUrl = `wss://fstream.binance.com/ws/${symbol}@depth20@100ms`;

  const { lastMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => {
      console.log('WebSocket connected');
      setIsLoading(false);
      setError(null);
    },
    onError: () => {
      console.error('WebSocket error');
      setError('Failed to connect to WebSocket. Please try again later.');
      setIsLoading(false);
    },
    onClose: () => {
      console.log('WebSocket disconnected');
      setError('WebSocket connection closed. Please refresh the page.');
      setIsLoading(false);
    },
    shouldReconnect: (closeEvent) => true,
    reconnectInterval: 3000
  });

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        // Calculate running totals
        let askTotal = 0;
        let bidTotal = 0;
        
        const processedAsks = data.asks.map(([price, quantity]: string[]) => {
          askTotal += parseFloat(quantity);
          return {
            price,
            quantity,
            total: askTotal.toFixed(6)
          };
        });

        const processedBids = data.bids.map(([price, quantity]: string[]) => {
          bidTotal += parseFloat(quantity);
          return {
            price,
            quantity,
            total: bidTotal.toFixed(6)
          };
        });

        setOrderBookData({
          asks: processedAsks,
          bids: processedBids,
        });
      } catch (err) {
        console.error('Error parsing message:', err);
        setError('Error processing market data. Please refresh the page.');
      }
    }
  }, [lastMessage]);

  if (isLoading) {
    return (
      <div className="box">
        <h2>Order Book ({symbol})</h2>
        <div className="loading-container">
          <div className="loading-text">Connecting to market data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="box">
        <h2>Order Book ({symbol})</h2>
        <div className="error-container">
          <div className="error-text">{error}</div>
        </div>
      </div>
    );
  }

  // Calculate max total for depth visualization
  const maxTotal = Math.max(
    parseFloat(orderBookData.asks[orderBookData.asks.length - 1]?.total || '0'),
    parseFloat(orderBookData.bids[orderBookData.bids.length - 1]?.total || '0')
  );

  return (
    <div className="box">
      <h2>Order Book ({symbol})</h2>
      <div className="orderbook-container">
        <div>
          <div className="orderbook-header">
            <span>Price(USDT)</span>
            <span>Amount(BTC)</span>
            <span>Total</span>
          </div>
          <div>
            {orderBookData.asks.map((ask, index) => {
              const depthWidth = (parseFloat(ask.total) / maxTotal * 100).toFixed(2);
              return (
                <div key={index} className="orderbook-row trend-down">
                  <div 
                    className="depth-visualization" 
                    style={{
                      width: `${depthWidth}%`,
                      backgroundColor: 'rgba(244, 67, 54, 0.1)'
                    }}
                  />
                  <span className="orderbook-price">${parseFloat(ask.price).toFixed(2)}</span>
                  <span className="orderbook-amount">{parseFloat(ask.quantity).toFixed(6)}</span>
                  <span className="orderbook-total">{ask.total}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="orderbook-header">
            <span>Price(USDT)</span>
            <span>Amount(BTC)</span>
            <span>Total</span>
          </div>
          <div>
            {orderBookData.bids.map((bid, index) => {
              const depthWidth = (parseFloat(bid.total) / maxTotal * 100).toFixed(2);
              return (
                <div key={index} className="orderbook-row trend-up">
                  <div 
                    className="depth-visualization" 
                    style={{
                      width: `${depthWidth}%`,
                      backgroundColor: 'rgba(76, 175, 80, 0.1)'
                    }}
                  />
                  <span className="orderbook-price">${parseFloat(bid.price).toFixed(2)}</span>
                  <span className="orderbook-amount">{parseFloat(bid.quantity).toFixed(6)}</span>
                  <span className="orderbook-total">{bid.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook; 