'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

const intervals = ['1D', '4H', '1H', '15M', '1M'];

export default function KlineChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [activeInterval, setActiveInterval] = useState('1D');

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#4CAF50',
      downColor: '#F44336',
      borderVisible: false,
      wickUpColor: '#4CAF50',
      wickDownColor: '#F44336',
    });

    // Sample data - replace with real data from API
    const data = [
      { time: '2024-02-27', open: 45000, high: 45500, low: 44800, close: 45200 },
      { time: '2024-02-28', open: 45200, high: 46000, low: 45100, close: 45800 },
      // Add more data points...
    ];

    candlestickSeries.setData(data);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [activeInterval]); // Add activeInterval as dependency

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Price Chart</h2>
        <div className="space-x-2">
          {intervals.map((interval) => (
            <button
              key={interval}
              className={`interval-button ${activeInterval === interval ? 'active' : ''}`}
              onClick={() => setActiveInterval(interval)}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="chart-container rounded-lg border border-gray-100" />
    </div>
  );
} 