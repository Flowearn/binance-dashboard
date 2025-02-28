'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, HistogramData } from 'lightweight-charts';
import { useBinanceData } from '../hooks/useBinanceData';
import type { UseBinanceDataOptions } from '../hooks/useBinanceData';

interface KlineData {
  time: number;  // 开盘时间
  open: string;  // 开盘价
  high: string;  // 最高价
  low: string;   // 最低价
  close: string; // 收盘价
  volume: string;// 成交量
  closeTime: number; // 收盘时间
  quoteAssetVolume: string; // 成交额
  trades: number; // 成交笔数
  takerBuyBaseAssetVolume: string; // 主动买入成交量
  takerBuyQuoteAssetVolume: string; // 主动买入成交额
  ignore: string;
}

const intervals = [
  { label: '1D', value: '1d' },
  { label: '4H', value: '4h' },
  { label: '1H', value: '1h' },
  { label: '15M', value: '15m' },
  { label: '1M', value: '1m' },
];

export default function KlineChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [selectedInterval, setSelectedInterval] = useState('1d');

  const { data: klineData, error, isLoading } = useBinanceData<KlineData[]>({
    endpoint: 'kline',
    symbol: 'BTCUSDT',
    interval: selectedInterval,
    limit: 200,
    refreshInterval: 5000, // 5秒更新一次
  } as UseBinanceDataOptions);

  // 初始化图表
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'white' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    // 添加K线图系列
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#4CAF50',
      downColor: '#F44336',
      borderVisible: false,
      wickUpColor: '#4CAF50',
      wickDownColor: '#F44336',
    });

    // 添加成交量系列
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // 在单独的面板中显示
    });

    // 设置成交量面板的高度
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8, // 主图表占80%
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // 响应式调整
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // 更新数据
  useEffect(() => {
    if (!klineData || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    const candleData = klineData.map((item): CandlestickData => ({
      time: (item.time / 1000) as Time,
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
    }));

    const volumeData = klineData.map((item): HistogramData => ({
      time: (item.time / 1000) as Time,
      value: parseFloat(item.volume),
      color: parseFloat(item.close) >= parseFloat(item.open) ? '#4CAF50' : '#F44336',
    }));

    candlestickSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
  }, [klineData]);

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Price Chart</h2>
        <div className="text-red-500">Error loading chart data</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Price Chart</h2>
        <div className="space-x-2">
          {intervals.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setSelectedInterval(value)}
              className={`interval-button ${selectedInterval === value ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="chart-container relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
            <div className="animate-pulse">Loading chart data...</div>
          </div>
        )}
      </div>
    </div>
  );
} 