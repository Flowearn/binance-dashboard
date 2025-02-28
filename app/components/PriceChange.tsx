'use client';

import { useBinanceData } from '../hooks/useBinanceData';

interface Ticker24hData {
  symbol: string;
  priceChange: string;       // 24小时价格变化
  priceChangePercent: string; // 24小时价格变化百分比
  lastPrice: string;         // 最新价格
  volume: string;           // 24小时交易量
  quoteVolume: string;      // 24小时交易额
}

export default function PriceChange() {
  const { data, error, isLoading } = useBinanceData<Ticker24hData>({
    endpoint: 'ticker24h',
    symbol: 'BTCUSDT',
    refreshInterval: 2000, // 2秒更新一次
  });

  const formatNumber = (num: string | number, decimals: number = 2) => {
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">24h Change</h2>
        <div className="text-red-500">Error loading price data</div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">24h Change</h2>
        <div className="animate-pulse">Loading price data...</div>
      </div>
    );
  }

  const isPositive = Number(data.priceChange) >= 0;
  const priceChangeAbs = formatNumber(Math.abs(Number(data.priceChange)));
  const percentChangeAbs = formatNumber(Math.abs(Number(data.priceChangePercent)));

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">24h Change</h2>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className={`text-3xl font-bold ${isPositive ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
            {isPositive ? '+' : '-'}${priceChangeAbs}
          </div>
          <div className={`text-2xl font-semibold ${isPositive ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
            ({isPositive ? '+' : '-'}{percentChangeAbs}%)
          </div>
        </div>
        <div className="text-gray-600">
          <div className="flex justify-between items-center text-sm">
            <span>Current Price</span>
            <span className="font-mono">${formatNumber(data.lastPrice)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span>24h Volume</span>
            <span className="font-mono">${formatNumber(Number(data.quoteVolume), 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 