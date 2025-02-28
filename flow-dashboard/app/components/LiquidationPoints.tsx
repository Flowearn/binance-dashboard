'use client';

import { useState, useEffect } from 'react';

interface LiquidationPoint {
  price: number;
  amount: number;
  type: 'long' | 'short';
}

const LiquidationPoints = () => {
  const [points, setPoints] = useState<LiquidationPoint[]>([]);
  const [totalLong, setTotalLong] = useState(0);
  const [totalShort, setTotalShort] = useState(0);

  useEffect(() => {
    // Simulate real-time liquidation points
    const interval = setInterval(() => {
      const newPoint: LiquidationPoint = {
        price: 45000 + Math.random() * 1000,
        amount: Math.random() * 10,
        type: Math.random() > 0.5 ? 'long' : 'short',
      };

      setPoints(prev => {
        const newPoints = [...prev.slice(-19), newPoint];
        const longTotal = newPoints.reduce((sum, point) => 
          point.type === 'long' ? sum + point.amount : sum, 0);
        const shortTotal = newPoints.reduce((sum, point) => 
          point.type === 'short' ? sum + point.amount : sum, 0);
        
        setTotalLong(longTotal);
        setTotalShort(shortTotal);
        
        return newPoints;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const total = totalLong + totalShort;
  const longPercentage = total > 0 ? (totalLong / total) * 100 : 0;
  const shortPercentage = total > 0 ? (totalShort / total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">Liquidation Points Distribution</h2>
      
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <div>
            <span className="text-sm text-gray-600">Long</span>
            <div className="text-[#4CAF50] font-bold">{totalLong.toFixed(2)} BTC</div>
            <div className="text-sm text-gray-500">({longPercentage.toFixed(1)}%)</div>
          </div>
          <div className="text-right">
            <span className="text-sm text-gray-600">Short</span>
            <div className="text-[#F44336] font-bold">{totalShort.toFixed(2)} BTC</div>
            <div className="text-sm text-gray-500">({shortPercentage.toFixed(1)}%)</div>
          </div>
        </div>
        
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#4CAF50]" 
            style={{ width: `${longPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {points.map((point, index) => (
          <div
            key={index}
            className={`h-1 rounded-full ${point.type === 'long' ? 'bg-[#4CAF50]' : 'bg-[#F44336]'}`}
            style={{
              width: `${(point.amount / Math.max(...points.map(p => p.amount))) * 100}%`,
              marginLeft: point.type === 'long' ? '0' : 'auto',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LiquidationPoints; 