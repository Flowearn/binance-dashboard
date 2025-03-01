'use client';

import { useBinanceData } from '../hooks/useBinanceData';
import type { FundingRateDataOptions } from '../hooks/useBinanceData';

interface FundingRateData {
  symbol: string;
  fundingRate: string;      // 当前资金费率
  fundingTime: number;      // 下次收取资金费用的时间
  markPrice: string;        // 标记价格
}

export default function FundingRate() {
  const { data, error, isLoading } = useBinanceData<FundingRateData[]>({
    endpoint: 'fundingRate',
    symbol: 'BTCUSDT',
    refreshInterval: 60000, // 1分钟更新一次
  } as FundingRateDataOptions);

  const formatRate = (rate: string) => {
    // 转换为百分比并保留4位小数
    const percentage = (Number(rate) * 100).toFixed(4);
    const isPositive = Number(rate) >= 0;
    return {
      value: `${isPositive ? '+' : ''}${percentage}%`,
      isPositive
    };
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeRemaining = (fundingTime: number) => {
    const now = Date.now();
    const remaining = fundingTime - now;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m`;
  };

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Funding Rate</h2>
        <div className="text-red-500">Error loading funding rate data</div>
      </div>
    );
  }

  if (isLoading || !data || data.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Funding Rate</h2>
        <div className="animate-pulse">Loading funding rate...</div>
      </div>
    );
  }

  const currentRate = data[0];
  const { value: rateValue, isPositive } = formatRate(currentRate.fundingRate);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Funding Rate</h2>
      <div className="space-y-4">
        <div className={`text-3xl font-bold ${isPositive ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}>
          {rateValue}
        </div>
        <div className="text-gray-600">
          <div className="flex justify-between items-center text-sm">
            <span>Next Funding</span>
            <span className="font-mono">{formatTime(currentRate.fundingTime)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span>Time Remaining</span>
            <span className="font-mono">{getTimeRemaining(currentRate.fundingTime)}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span>Mark Price</span>
            <span className="font-mono">
              ${Number(currentRate.markPrice).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 