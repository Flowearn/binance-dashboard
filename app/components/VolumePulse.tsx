'use client';

import React, { useEffect, useState } from 'react';
import { useWebSocketManager } from '../hooks/useWebSocketManager';

interface TimeWindow {
  volume: number;
  timestamp: number;
}

interface Props {
  symbol: string;
}

const WINDOW_SIZE = 20000; // 20 seconds
const NUM_WINDOWS = 3;

const VolumePulse: React.FC<Props> = ({ symbol }) => {
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>(
    Array(NUM_WINDOWS).fill(null).map(() => ({ volume: 0, timestamp: Date.now() }))
  );
  const [isLoading, setIsLoading] = useState(true);

  const { error } = useWebSocketManager(`${symbol}@aggTrade`, {
    onMessage: (trade) => {
      const volume = parseFloat(trade.q);
      const now = Date.now();

      setTimeWindows(prev => {
        const newWindows = [...prev];
        const currentWindowIndex = Math.floor((now % (WINDOW_SIZE * NUM_WINDOWS)) / WINDOW_SIZE);
        
        // Reset old windows
        for (let i = 0; i < NUM_WINDOWS; i++) {
          if (now - newWindows[i].timestamp > WINDOW_SIZE * NUM_WINDOWS) {
            newWindows[i] = { volume: 0, timestamp: now };
          }
        }

        // Update current window
        if (now - newWindows[currentWindowIndex].timestamp <= WINDOW_SIZE) {
          newWindows[currentWindowIndex].volume += volume;
        } else {
          newWindows[currentWindowIndex] = { volume, timestamp: now };
        }

        return newWindows;
      });
      setIsLoading(false);
    },
    onOpen: () => setIsLoading(false)
  });

  // Rotate windows periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTimeWindows(prev => {
        const newWindows = [...prev];
        const currentWindowIndex = Math.floor((now % (WINDOW_SIZE * NUM_WINDOWS)) / WINDOW_SIZE);
        newWindows[currentWindowIndex] = { volume: 0, timestamp: now };
        return newWindows;
      });
    }, WINDOW_SIZE);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-text">Loading volume pulse data...</div>
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

  const maxVolume = Math.max(...timeWindows.map(w => w.volume));

  return (
    <div className="volume-pulse">
      {timeWindows.map((window, index) => {
        const percentage = maxVolume > 0 ? (window.volume / maxVolume * 100).toFixed(2) : '0';
        const isSurge = maxVolume > 0 && window.volume > maxVolume * 0.8;

        return (
          <div key={index} className="pulse-bar">
            <div 
              className="pulse-fill"
              style={{ width: `${percentage}%` }}
            />
            <span className={`pulse-label ${isSurge ? 'volume-surge' : ''}`}>
              {window.volume.toFixed(4)} BTC
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default VolumePulse; 