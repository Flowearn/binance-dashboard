'use client';

import { useState } from 'react';

const FundingRate = () => {
  const [rate] = useState(0.01);
  const isPositive = rate >= 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">Funding Rate</h2>
      <div className={`text-3xl font-bold ${isPositive ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
        {isPositive ? '+' : ''}{rate.toFixed(2)}%
      </div>
    </div>
  );
};

export default FundingRate; 