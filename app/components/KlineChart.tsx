'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, HistogramData } from 'lightweight-charts';
import { useBinanceData } from '../hooks/useBinanceData';
import type { KlineDataOptions, KlineInterval } from '../hooks/useBinanceData';

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

const intervals: { label: string; value: KlineInterval }[] = [
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
  const [selectedInterval, setSelectedInterval] = useState<KlineInterval>('1d');

  const klineOptions: KlineDataOptions = {
    endpoint: 'kline',
    symbol: 'BTCUSDT',
    interval: selectedInterval,
    limit: 200,
    refreshInterval: 30000, // 从5秒改为30秒更新一次
  };

  const { data: klineData, error, isLoading } = useBinanceData<KlineData[]>(klineOptions);

  // 初始化图表
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 清除旧图表
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.1)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.1)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(197, 203, 206, 0.4)',
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.4)',
      },
      crosshair: {
        mode: 0,
      },
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

    // 添加窗口大小变化监听器
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 400,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // 更新数据
  useEffect(() => {
    if (!klineData || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    // 确保数据按时间排序
    const sortedData = [...klineData].sort((a, b) => a.time - b.time);

    const candleData = sortedData.map((item): CandlestickData => ({
      // 确保时间戳正确转换为秒级时间戳
      time: Math.floor(item.time / 1000) as Time,
      open: typeof item.open === 'string' ? parseFloat(item.open) : item.open,
      high: typeof item.high === 'string' ? parseFloat(item.high) : item.high,
      low: typeof item.low === 'string' ? parseFloat(item.low) : item.low,
      close: typeof item.close === 'string' ? parseFloat(item.close) : item.close,
    }));

    const volumeData = sortedData.map((item): HistogramData => ({
      time: Math.floor(item.time / 1000) as Time,
      value: typeof item.volume === 'string' ? parseFloat(item.volume) : item.volume,
      color: (typeof item.close === 'string' ? parseFloat(item.close) : item.close) >= 
             (typeof item.open === 'string' ? parseFloat(item.open) : item.open) 
             ? '#4CAF50' : '#F44336',
    }));

    console.log('Processed K-line data:', { 
      originalLength: klineData.length,
      processedLength: candleData.length,
      firstItem: candleData[0],
      lastItem: candleData[candleData.length - 1]
    });

    candlestickSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
  }, [klineData]);

  // 处理间隔变化
  const handleIntervalChange = (interval: KlineInterval) => {
    setSelectedInterval(interval);
  };

  // 检查是否是地理位置限制错误
  const isGeoRestrictedError = error && 
    typeof error === 'object' && 
    'code' in error && 
    error.code === 'BINANCE_GEO_RESTRICTED';

  // 渲染错误信息
  if (error) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center p-2 bg-gray-800 text-white">
          <h3 className="text-lg font-semibold">BTC/USDT K线图</h3>
          <div className="flex space-x-1">
            {intervals.map((interval) => (
              <button
                key={interval.value}
                className={`px-2 py-1 text-xs rounded ${
                  selectedInterval === interval.value
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => handleIntervalChange(interval.value)}
              >
                {interval.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-4">
          <div className="text-center p-6 bg-gray-800 rounded-lg max-w-md">
            {isGeoRestrictedError ? (
              <>
                <h3 className="text-xl font-bold text-red-500 mb-4">Binance API 地理位置限制</h3>
                <p className="text-gray-300 mb-4">
                  您所在的地区无法访问Binance API。这可能是由于Binance的地区限制政策导致的。
                </p>
                <p className="text-gray-300 mb-4">
                  可能的解决方案:
                </p>
                <ul className="text-left text-gray-300 mb-4 list-disc pl-5">
                  <li>使用VPN或代理服务器</li>
                  <li>使用其他支持您所在地区的加密货币交易所API</li>
                  <li>联系Binance客服获取更多信息</li>
                </ul>
                <p className="text-gray-400 text-sm">
                  错误代码: {error.code}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-red-500 mb-4">加载K线数据失败</h3>
                <p className="text-gray-300 mb-4">
                  无法从Binance API获取数据。请稍后再试。
                </p>
                <p className="text-gray-400 text-sm">
                  错误信息: {error.message || JSON.stringify(error)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 加载中状态
  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center p-2 bg-gray-800 text-white">
          <h3 className="text-lg font-semibold">BTC/USDT K线图</h3>
          <div className="flex space-x-1">
            {intervals.map((interval) => (
              <button
                key={interval.value}
                className={`px-2 py-1 text-xs rounded ${
                  selectedInterval === interval.value
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => handleIntervalChange(interval.value)}
              >
                {interval.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
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
      <div 
        ref={chartContainerRef} 
        className="chart-container relative" 
        style={{ height: 'calc(100% - 50px)', width: '100%', overflow: 'hidden' }}
      >
      </div>
    </div>
  );
} 