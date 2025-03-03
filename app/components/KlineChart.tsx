'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, HistogramData } from 'lightweight-charts';
import { useBinanceData } from '../hooks/useBinanceData';
import type { KlineDataOptions, KlineInterval } from '../hooks/useBinanceData';

type KlineDataArray = [
  number,    // time
  string,    // open
  string,    // high
  string,    // low
  string,    // close
  string,    // volume
  number,    // closeTime
  string,    // quoteAssetVolume
  number,    // trades
  string,    // takerBuyBaseAssetVolume
  string,    // takerBuyQuoteAssetVolume
  string     // ignore
];

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
  const [dataSource, setDataSource] = useState<'binance' | 'coingecko'>('binance');
  const [isDataSourceFallback, setIsDataSourceFallback] = useState(false);

  // Binance API选项
  const klineOptions: KlineDataOptions = {
    endpoint: 'kline',
    symbol: 'BTCUSDT',
    interval: selectedInterval,
    limit: 200,
    refreshInterval: 30000, // 从5秒改为30秒更新一次
  };

  // 使用Binance API获取数据
  const { 
    data: binanceData, 
    error: binanceError, 
    isLoading: isBinanceLoading 
  } = useBinanceData<KlineDataArray[]>(klineOptions);

  // 使用CoinGecko API获取数据
  const [coingeckoData, setCoingeckoData] = useState<KlineDataArray[] | null>(null);
  const [coingeckoError, setCoingeckoError] = useState<Error | null>(null);
  const [isCoingeckoLoading, setIsCoingeckoLoading] = useState(false);

  // 获取CoinGecko数据
  useEffect(() => {
    const fetchCoingeckoData = async () => {
      if (dataSource !== 'coingecko' && !isDataSourceFallback) return;
      
      setIsCoingeckoLoading(true);
      setCoingeckoError(null);
      
      try {
        // 根据选择的时间间隔确定获取的天数
        let days = '30';
        switch (selectedInterval) {
          case '1m': days = '1'; break;
          case '15m': days = '7'; break;
          case '1h': days = '14'; break;
          case '4h': days = '30'; break;
          case '1d': days = '90'; break;
          default: days = '30';
        }
        
        const response = await fetch(`/api/crypto?endpoint=kline&coin=bitcoin&currency=usd&days=${days}`);
        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setCoingeckoData(data);
      } catch (error) {
        console.error('Error fetching CoinGecko data:', error);
        setCoingeckoError(error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        setIsCoingeckoLoading(false);
      }
    };
    
    fetchCoingeckoData();
  }, [dataSource, selectedInterval, isDataSourceFallback]);

  // 自动切换到CoinGecko，如果Binance API不可用
  useEffect(() => {
    // 检查是否是地理位置限制错误
    const isGeoRestrictedError = binanceError && 
      typeof binanceError === 'object' && 
      'code' in binanceError && 
      binanceError.code === 'BINANCE_GEO_RESTRICTED';
    
    if (isGeoRestrictedError && dataSource === 'binance') {
      console.log('Binance API geo-restricted, falling back to CoinGecko API');
      setIsDataSourceFallback(true);
    }
  }, [binanceError, dataSource]);

  // 确定当前使用的数据
  const klineData = dataSource === 'binance' && !isDataSourceFallback 
    ? binanceData 
    : coingeckoData;
  
  const error = dataSource === 'binance' && !isDataSourceFallback 
    ? binanceError 
    : coingeckoError;
  
  const isLoading = dataSource === 'binance' && !isDataSourceFallback 
    ? isBinanceLoading 
    : isCoingeckoLoading;

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
        background: { color: '#1a1a1a' },
        textColor: '#DDD',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
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

  // 更新图表数据
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || !klineData) return;

    const candleData = klineData.map((item) => ({
      time: item[0] / 1000 as Time,
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4])
    }));

    const volumeData = klineData.map((item) => ({
      time: item[0] / 1000 as Time,
      value: parseFloat(item[5]),
      color: parseFloat(item[4]) >= parseFloat(item[1]) ? '#26a69a' : '#ef5350'
    }));

    candlestickSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
  }, [klineData]);

  // 处理间隔变化
  const handleIntervalChange = (interval: KlineInterval) => {
    setSelectedInterval(interval);
  };

  // 处理数据源切换
  const handleDataSourceChange = (source: 'binance' | 'coingecko') => {
    setDataSource(source);
    setIsDataSourceFallback(false);
  };

  // 检查是否是地理位置限制错误
  const isGeoRestrictedError = error && 
    typeof error === 'object' && 
    'code' in error && 
    error.code === 'BINANCE_GEO_RESTRICTED';

  // 渲染错误信息
  if (error && !(isDataSourceFallback && dataSource === 'binance')) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">BTC/USDT</h2>
          <div className="flex space-x-2">
            {intervals.map(({ label, value }) => (
              <button
                key={value}
                className={`px-3 py-1 rounded ${
                  selectedInterval === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => handleIntervalChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-red-500">Error loading chart data</div>
      </div>
    );
  }

  // 加载中状态
  if (isLoading && !klineData) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">BTC/USDT</h2>
          <div className="flex space-x-2">
            {intervals.map(({ label, value }) => (
              <button
                key={value}
                className={`px-3 py-1 rounded ${
                  selectedInterval === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => handleIntervalChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="animate-pulse">Loading chart data...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">BTC/USDT</h2>
        <div className="flex space-x-2">
          {intervals.map(({ label, value }) => (
            <button
              key={value}
              className={`px-3 py-1 rounded ${
                selectedInterval === value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => handleIntervalChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
} 