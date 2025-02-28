'use client';

import { useState } from 'react';

interface Order {
  price: number;
  amount: number;
}

const OrderBook = () => {
  const [currentPrice] = useState(45113.50);
  const [sellOrders] = useState<Order[]>([
    { price: 45123.50, amount: 2.5431 },
    { price: 45122.30, amount: 1.8765 },
    { price: 45121.10, amount: 3.2145 },
    { price: 45120.40, amount: 1.5432 },
    { price: 45119.80, amount: 2.7654 },
    { price: 45118.90, amount: 1.9876 },
    { price: 45117.60, amount: 2.3456 },
    { price: 45116.40, amount: 1.6789 },
    { price: 45115.20, amount: 2.8901 },
    { price: 45114.00, amount: 1.7654 },
  ]);

  const [buyOrders] = useState<Order[]>([
    { price: 45113.00, amount: 2.1234 },
    { price: 45112.50, amount: 1.5678 },
    { price: 45111.80, amount: 2.9012 },
    { price: 45110.90, amount: 1.3456 },
    { price: 45109.70, amount: 2.7890 },
    { price: 45108.50, amount: 1.2345 },
    { price: 45107.30, amount: 2.6789 },
    { price: 45106.10, amount: 1.4567 },
    { price: 45105.40, amount: 2.8901 },
    { price: 45104.20, amount: 1.6789 },
  ]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">Order Book</h2>
      <div className="text-center py-2 bg-gray-100 rounded mb-4 text-xl font-bold text-gray-700">
        {currentPrice.toFixed(2)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Sell Orders */}
        <div className="space-y-1">
          {sellOrders.map((order, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 text-sm text-[#F44336]">
              <span>{order.price.toFixed(2)}</span>
              <span className="text-right">{order.amount.toFixed(4)}</span>
            </div>
          ))}
        </div>

        {/* Buy Orders */}
        <div className="space-y-1">
          {buyOrders.map((order, index) => (
            <div key={index} className="grid grid-cols-2 gap-4 text-sm text-[#4CAF50]">
              <span>{order.price.toFixed(2)}</span>
              <span className="text-right">{order.amount.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook; 