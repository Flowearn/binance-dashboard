'use client';

import { useBinanceData } from '../hooks/useBinanceData';
import type { TickerDataOptions } from '../hooks/useBinanceData';

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
    endpoint: 'ticker/24hr',
    symbol: 'BTCUSDT',
    refreshInterval: 1000,
  } as TickerDataOptions);

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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">24h Change</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">Price Change</div>
          <div className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : '-'}${priceChangeAbs}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Percent Change</div>
          <div className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : '-'}{percentChangeAbs}%
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Last Price</div>
          <div className="text-lg font-bold">${formatNumber(data.lastPrice)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">24h Volume</div>
          <div className="text-lg font-bold">{formatNumber(data.volume)} BTC</div>
        </div>
      </div>
    </div>
  );
} 