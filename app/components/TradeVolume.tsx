'use client';

import React, { useState } from 'react';
import { useWebSocketManager } from '../hooks/useWebSocketManager';

interface VolumeData {
  superLarge: number;
  large: number;
  medium: number;
  small: number;
}

interface Props {
  symbol: string;
}

const TradeVolume: React.FC<Props> = ({ symbol }) => {
  const [volumeData, setVolumeData] = useState<VolumeData>({
    superLarge: 0,
    large: 0,
    medium: 0,
    small: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const { error } = useWebSocketManager(`${symbol}@aggTrade`, {
    onMessage: (trade) => {
      const volume = parseFloat(trade.q);
      const price = parseFloat(trade.p);
      const value = volume * price;

      setVolumeData(prev => {
        const newData = { ...prev };
        if (value > 100000) {
          newData.superLarge += volume;
        } else if (value > 10000) {
          newData.large += volume;
        } else if (value > 1000) {
          newData.medium += volume;
        } else {
          newData.small += volume;
        }
        return newData;
      });
      setIsLoading(false);
    },
    onOpen: () => setIsLoading(false)
  });

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading volume data...</div>
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

  return (
    <div className="trade-volume">
      <div className="volume-category">
        <span className="volume-label">Super Large (&gt;$100K)</span>
        <span className="volume-value">{volumeData.superLarge.toFixed(4)} BTC</span>
      </div>
      <div className="volume-category">
        <span className="volume-label">Large ($10K-$100K)</span>
        <span className="volume-value">{volumeData.large.toFixed(4)} BTC</span>
      </div>
      <div className="volume-category">
        <span className="volume-label">Medium ($1K-$10K)</span>
        <span className="volume-value">{volumeData.medium.toFixed(4)} BTC</span>
      </div>
      <div className="volume-category">
        <span className="volume-label">Small (&lt;$1K)</span>
        <span className="volume-value">{volumeData.small.toFixed(4)} BTC</span>
      </div>
    </div>
  );
};

export default TradeVolume; 