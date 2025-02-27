'use client';

import React, { useState, useEffect } from 'react';

interface LiquidationPoint {
  price: string;
  volume: string;
  type: 'long' | 'short';
}

interface LiquidationSummary {
  points: LiquidationPoint[];
  totalLong: string;
  totalShort: string;
  total: string;
}

const LiquidationPoints: React.FC = () => {
  const [liquidationData, setLiquidationData] = useState<LiquidationSummary>({
    points: [],
    totalLong: '0',
    totalShort: '0',
    total: '0'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate liquidation data updates
  useEffect(() => {
    const fetchData = () => {
      const basePrice = 40000;
      const points: LiquidationPoint[] = [];
      let totalLong = 0;
      let totalShort = 0;

      // Generate long liquidation points
      for (let i = 0; i < 3; i++) {
        const price = basePrice - (1000 + Math.random() * 2000);
        const volume = Math.random() * 1000000;
        totalLong += volume;
        points.push({
          price: price.toFixed(2),
          volume: volume.toFixed(0),
          type: 'long'
        });
      }

      // Generate short liquidation points
      for (let i = 0; i < 3; i++) {
        const price = basePrice + (1000 + Math.random() * 2000);
        const volume = Math.random() * 1000000;
        totalShort += volume;
        points.push({
          price: price.toFixed(2),
          volume: volume.toFixed(0),
          type: 'short'
        });
      }

      setLiquidationData({
        points: points.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
        totalLong: totalLong.toFixed(0),
        totalShort: totalShort.toFixed(0),
        total: (totalLong + totalShort).toFixed(0)
      });
      setIsLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading liquidation data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-text">{error}</div>
      </div>
    );
  }

  const maxVolume = Math.max(...liquidationData.points.map(p => parseFloat(p.volume)));

  return (
    <div>
      <div className="liquidation-points">
        {liquidationData.points.map((point, index) => {
          const percentage = (parseFloat(point.volume) / maxVolume * 100).toFixed(2);
          return (
            <div key={index} className={`liquidation-bar liquidation-${point.type}`}>
              <span className="liquidation-price">${point.price}</span>
              <div className="liquidation-volume">
                <div 
                  className="liquidation-fill"
                  style={{ width: `${percentage}%` }}
                />
                <span className="liquidation-value">
                  ${Number(point.volume).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', marginBottom: '15px' }}>
          Total Liquidation Value (24h)
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
          ${Number(liquidationData.total).toLocaleString()}
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-around' }}>
          <div>
            <div className="liquidation-type type-long">LONG</div>
            <div style={{ marginTop: '8px' }}>
              ${Number(liquidationData.totalLong).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="liquidation-type type-short">SHORT</div>
            <div style={{ marginTop: '8px' }}>
              ${Number(liquidationData.totalShort).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidationPoints; 