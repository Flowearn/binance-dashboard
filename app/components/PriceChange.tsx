'use client';

import { useState } from 'react';

export default function PriceChange() {
  const [priceChange] = useState(2150.25);
  const [percentageChange] = useState(4.76);
  const isPositive = priceChange >= 0;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">24h Change</h2>
      <div className="flex items-center space-x-4">
        <div className={`text-3xl font-bold ${isPositive ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)}
        </div>
        <div className={`text-2xl font-semibold ${isPositive ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
          ({isPositive ? '+' : ''}{percentageChange.toFixed(2)}%)
        </div>
      </div>
    </div>
  );
} 