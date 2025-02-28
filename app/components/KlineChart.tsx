'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { useWebSocketManager } from '../hooks/useWebSocketManager';

interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Props {
  symbol: string;
}

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1d' },
];

const KlineChart: React.FC<Props> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [currentInterval, setCurrentInterval] = useState('1m');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#2962FF',
          style: 0,
          labelBackgroundColor: '#2962FF',
        },
        horzLine: {
          width: 1,
          color: '#2962FF',
          style: 0,
          labelBackgroundColor: '#2962FF',
        },
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      rightPriceScale: {
        borderColor: '#ddd',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#ddd',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: 400,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Handle data updates
  useEffect(() => {
    if (!seriesRef.current) return;

    const fetchAndUpdateData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol.toUpperCase()}&interval=${currentInterval}&limit=1000`
        );
        const data = await response.json();
        
        const historicalData = data.map((d: any) => ({
          time: d[0] / 1000,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));

        seriesRef.current.setData(historicalData);
        chartRef.current?.timeScale().fitContent();
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setIsLoading(false);
      }
    };

    fetchAndUpdateData();
  }, [symbol, currentInterval]);

  // WebSocket connection for real-time updates
  const { error } = useWebSocketManager(`${symbol.toLowerCase()}@kline_${currentInterval}`, {
    onMessage: (data) => {
      if (data.k && seriesRef.current) {
        const kline = data.k;
        const candleData = {
          time: kline.t / 1000,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };
        seriesRef.current.update(candleData);
      }
    },
  });

  const handleIntervalChange = (interval: string) => {
    setCurrentInterval(interval);
  };

  if (isLoading) {
    return (
      <div className="box">
        <h2>Price Chart</h2>
        <div className="loading-container">
          <div className="loading-text">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="box">
        <h2>Price Chart</h2>
        <div className="error-container">
          <div className="error-text">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="box">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Price Chart</h2>
        <div className="interval-selector flex space-x-2">
          {INTERVALS.map(interval => (
            <button
              key={interval.value}
              className={`px-3 py-1 rounded ${
                currentInterval === interval.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => handleIntervalChange(interval.value)}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>
      <div 
        ref={chartContainerRef} 
        className="w-full" 
        style={{ 
          height: '400px',
          position: 'relative'
        }}
      >
        <style jsx>{`
          :global(.tv-lightweight-charts) {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
          :global(.tv-lightweight-charts canvas) {
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default KlineChart; 