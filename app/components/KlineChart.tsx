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
  } = useBinanceData<KlineData[]>(klineOptions);

  // 使用CoinGecko API获取数据
  const [coingeckoData, setCoingeckoData] = useState<KlineData[] | null>(null);
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
                  您可以尝试使用CoinGecko API作为替代数据源：
                </p>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
                  onClick={() => handleDataSourceChange('coingecko')}
                >
                  切换到CoinGecko数据
                </button>
                <p className="text-gray-400 text-sm">
                  错误代码: {error.code}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-red-500 mb-4">加载K线数据失败</h3>
                <p className="text-gray-300 mb-4">
                  无法从{dataSource === 'binance' ? 'Binance' : 'CoinGecko'} API获取数据。请稍后再试。
                </p>
                {dataSource === 'binance' ? (
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
                    onClick={() => handleDataSourceChange('coingecko')}
                  >
                    尝试使用CoinGecko数据
                  </button>
                ) : (
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
                    onClick={() => handleDataSourceChange('binance')}
                  >
                    尝试使用Binance数据
                  </button>
                )}
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
  if (isLoading && !klineData) {
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
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center p-2 bg-gray-800 text-white">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold mr-2">BTC/USDT K线图</h3>
          {isDataSourceFallback && (
            <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
              使用CoinGecko数据
            </span>
          )}
        </div>
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
          <div className="border-l border-gray-600 mx-1"></div>
          <button
            className={`px-2 py-1 text-xs rounded ${
              dataSource === 'binance' && !isDataSourceFallback
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => handleDataSourceChange('binance')}
          >
            Binance
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${
              dataSource === 'coingecko' || isDataSourceFallback
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => handleDataSourceChange('coingecko')}
          >
            CoinGecko
          </button>
        </div>
      </div>
      <div
        ref={chartContainerRef}
        className="flex-1 relative"
        style={{ height: 'calc(100% - 50px)', width: '100%', overflow: 'hidden' }}
      >
      </div>
    </div>
  );
} 