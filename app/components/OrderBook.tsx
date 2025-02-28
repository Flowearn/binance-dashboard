'use client';

import { useState } from 'react';

interface Order {
  price: number;
  quantity: number;
}

export default function OrderBook() {
  const [currentPrice] = useState(45113.50);
  const [sellOrders] = useState<Order[]>([
    { price: 45123.50, quantity: 2.5431 },
    { price: 45122.30, quantity: 1.8765 },
    { price: 45121.10, quantity: 3.2145 },
    { price: 45120.40, quantity: 1.5432 },
    { price: 45119.80, quantity: 2.7654 },
    { price: 45118.90, quantity: 1.9876 },
    { price: 45117.60, quantity: 2.3456 },
    { price: 45116.40, quantity: 1.6789 },
    { price: 45115.20, quantity: 2.8901 },
    { price: 45114.00, quantity: 1.7654 },
  ]);

  const [buyOrders] = useState<Order[]>([
    { price: 45113.00, quantity: 2.1234 },
    { price: 45112.50, quantity: 1.5678 },
    { price: 45111.80, quantity: 2.9012 },
    { price: 45110.90, quantity: 1.3456 },
    { price: 45109.70, quantity: 2.7890 },
    { price: 45108.50, quantity: 1.2345 },
    { price: 45107.30, quantity: 2.6789 },
    { price: 45106.10, quantity: 1.4567 },
    { price: 45105.40, quantity: 2.8901 },
    { price: 45104.20, quantity: 1.6789 },
  ]);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Order Book</h2>
      <div className="current-price text-xl">
        {formatNumber(currentPrice)}
      </div>
      <div className="order-book-container">
        {/* Sell Orders */}
        <div className="order-book-column">
          <div className="sell space-y-1">
            {sellOrders.map((order, index) => (
              <div key={index} className="order-book-row">
                <span>{formatNumber(order.price)}</span>
                <span>{formatNumber(order.quantity, 4)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buy Orders */}
        <div className="order-book-column">
          <div className="buy space-y-1">
            {buyOrders.map((order, index) => (
              <div key={index} className="order-book-row">
                <span>{formatNumber(order.price)}</span>
                <span>{formatNumber(order.quantity, 4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 