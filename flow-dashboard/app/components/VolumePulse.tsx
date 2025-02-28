'use client';

import { useState, useEffect } from 'react';

interface VolumePulseData {
  timestamp: number;
  volume: number;
  type: 'buy' | 'sell';
}

const VolumePulse = () => {
  const [pulses, setPulses] = useState<VolumePulseData[]>([]);

  useEffect(() => {
    // Simulate real-time volume pulses
    const interval = setInterval(() => {
      const newPulse: VolumePulseData = {
        timestamp: Date.now(),
        volume: Math.random() * 10,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
      };

      setPulses(prev => [...prev.slice(-9), newPulse]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">Volume Pulse</h2>
      <div className="space-y-2">
        {pulses.map((pulse, index) => (
          <div
            key={pulse.timestamp}
            className="h-6 rounded transition-all duration-300"
            style={{
              width: `${Math.min(pulse.volume * 10, 100)}%`,
              backgroundColor: pulse.type === 'buy' ? '#4CAF50' : '#F44336',
              opacity: 0.2 + (index * 0.1),
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VolumePulse; 