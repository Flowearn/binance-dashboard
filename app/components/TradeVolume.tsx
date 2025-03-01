'use client';

import { useBinanceData } from '../hooks/useBinanceData';
import type { TradeDataOptions } from '../hooks/useBinanceData';
import { useEffect, useState } from 'react';

interface Trade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

interface VolumeCategory {
  name: string;
  range: string;
  percentage: number;
  totalVolume: number;
}

const VOLUME_THRESHOLDS = {
  SUPER_LARGE: 1000000,    // >$1M
  LARGE: 100000,          // $100K-$1M
  MEDIUM: 10000,          // $10K-$100K
  SMALL: 1000,           // $1K-$10K
  // <$1K is SUPER_SMALL
};

export default function TradeVolume() {
  const { data: trades, error, isLoading } = useBinanceData<Trade[]>({
    endpoint: 'trades',
    symbol: 'BTCUSDT',
    limit: 100,
    refreshInterval: 5000, // 5秒更新一次
  } as TradeDataOptions);

  const [categories, setCategories] = useState<VolumeCategory[]>([
    { name: 'Super Large', range: '>$1M', percentage: 0, totalVolume: 0 },
    { name: 'Large', range: '$100K-$1M', percentage: 0, totalVolume: 0 },
    { name: 'Medium', range: '$10K-$100K', percentage: 0, totalVolume: 0 },
    { name: 'Small', range: '$1K-$10K', percentage: 0, totalVolume: 0 },
    { name: 'Super Small', range: '<$1K', percentage: 0, totalVolume: 0 },
  ]);

  useEffect(() => {
    if (!trades || trades.length === 0) return;

    const volumeCategories = {
      SUPER_LARGE: 0,
      LARGE: 0,
      MEDIUM: 0,
      SMALL: 0,
      SUPER_SMALL: 0,
    };

    // 计算每个交易的成交额并分类
    trades.forEach(trade => {
      const volume = parseFloat(trade.quoteQty); // 使用成交额（以USDT计）
      if (volume >= VOLUME_THRESHOLDS.SUPER_LARGE) {
        volumeCategories.SUPER_LARGE += volume;
      } else if (volume >= VOLUME_THRESHOLDS.LARGE) {
        volumeCategories.LARGE += volume;
      } else if (volume >= VOLUME_THRESHOLDS.MEDIUM) {
        volumeCategories.MEDIUM += volume;
      } else if (volume >= VOLUME_THRESHOLDS.SMALL) {
        volumeCategories.SMALL += volume;
      } else {
        volumeCategories.SUPER_SMALL += volume;
      }
    });

    // 计算总成交额
    const totalVolume = Object.values(volumeCategories).reduce((a, b) => a + b, 0);

    // 更新分类数据
    const updatedCategories = [
      {
        name: 'Super Large',
        range: '>$1M',
        percentage: (volumeCategories.SUPER_LARGE / totalVolume) * 100,
        totalVolume: volumeCategories.SUPER_LARGE,
      },
      {
        name: 'Large',
        range: '$100K-$1M',
        percentage: (volumeCategories.LARGE / totalVolume) * 100,
        totalVolume: volumeCategories.LARGE,
      },
      {
        name: 'Medium',
        range: '$10K-$100K',
        percentage: (volumeCategories.MEDIUM / totalVolume) * 100,
        totalVolume: volumeCategories.MEDIUM,
      },
      {
        name: 'Small',
        range: '$1K-$10K',
        percentage: (volumeCategories.SMALL / totalVolume) * 100,
        totalVolume: volumeCategories.SMALL,
      },
      {
        name: 'Super Small',
        range: '<$1K',
        percentage: (volumeCategories.SUPER_SMALL / totalVolume) * 100,
        totalVolume: volumeCategories.SUPER_SMALL,
      },
    ];

    setCategories(updatedCategories);
  }, [trades]);

  if (error) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-red-500">Error loading trade data</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="animate-pulse">Loading trade volume data...</div>
      </div>
    );
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      {categories.map((category, index) => (
        <div key={index}>
          <div className="flex justify-between items-center text-sm mb-1">
            <div className="flex items-center">
              <span className="font-medium">{category.name}</span>
              <span className="text-gray-500 ml-2">({category.range})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{category.percentage.toFixed(1)}%</span>
              <span className="text-gray-500 text-xs">
                {formatVolume(category.totalVolume)}
              </span>
            </div>
          </div>
          <div className="relative h-6">
            <div
              className="volume-bar absolute left-0 top-0 h-full bg-blue-500 opacity-70 rounded"
              style={{ width: `${category.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
} 