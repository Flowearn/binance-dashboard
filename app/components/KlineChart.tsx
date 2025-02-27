'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, ISeriesApi, SeriesType, Time, CandlestickData, IChartApi } from 'lightweight-charts';
import { useWebSocketManager } from '../hooks/useWebSocketManager';

interface KlineData extends CandlestickData<Time> {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

const INTERVALS = [
  { label: '1m', value: '1m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1d' },
];

const KlineChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [currentInterval, setCurrentInterval] = useState('1m');
  const [isLoading, setIsLoading] = useState(true);
  const symbol = 'btcusdt';

  const { error } = useWebSocketManager(`${symbol}@kline_${currentInterval}`, {
    onMessage: (data) => {
      if (data.k) {
        const kline = data.k;
        const candleData: KlineData = {
          time: kline.t / 1000 as Time,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c)
        };
        updateChart(candleData);
      }
    },
    onOpen: () => setIsLoading(false),
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart: IChartApi = createChart(chartContainerRef.current);
    
    chart.applyOptions({
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: {
          color: '#f0f0f0',
          style: 1,
          visible: true,
        },
        horzLines: {
          color: '#f0f0f0',
          style: 1,
          visible: true,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#C3BCDB44',
          width: 1,
          style: 1,
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          color: '#C3BCDB44',
          width: 1,
          style: 1,
          visible: true,
          labelVisible: true,
        },
      },
      rightPriceScale: {
        borderColor: '#ddd',
        autoScale: true,
        mode: 0,
        alignLabels: true,
      },
      timeScale: {
        borderColor: '#ddd',
        rightOffset: 12,
        barSpacing: 12,
        minBarSpacing: 0.5,
        fixLeftEdge: true,
        fixRightEdge: true,
        visible: true,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries();
    candlestickSeries.applyOptions({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350'
    });

    seriesRef.current = candlestickSeries;

    // Fetch historical data
    fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=${currentInterval}&limit=1000`)
      .then(response => response.json())
      .then(data => {
        const historicalData = data.map((d: any) => ({
          time: d[0] / 1000 as Time,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4])
        }));
        candlestickSeries.setData(historicalData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching historical data:', error);
        setIsLoading(false);
      });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [currentInterval]);

  const updateChart = (candleData: KlineData) => {
    if (seriesRef.current) {
      seriesRef.current.update(candleData);
    }
  };

  const handleIntervalChange = (interval: string) => {
    setCurrentInterval(interval);
    setIsLoading(true);
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
      <h2>Price Chart</h2>
      <div className="chart-controls">
        <div className="interval-selector">
          {INTERVALS.map(interval => (
            <button
              key={interval.value}
              className={`interval-btn ${currentInterval === interval.value ? 'active' : ''}`}
              onClick={() => handleIntervalChange(interval.value)}
            >
              {interval.label}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default KlineChart; 