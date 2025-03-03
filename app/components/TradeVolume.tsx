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

export default function TradeVolume() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState({
    buyVolume: 0,
    sellVolume: 0,
    totalTrades: 0,
    averagePrice: 0
  });

  const { data, error, isLoading } = useBinanceData<Trade[]>({
    endpoint: 'trades',
    symbol: 'BTCUSDT',
    limit: 50,
    refreshInterval: 1000
  } as TradeDataOptions);

  useEffect(() => {
    if (data) {
      setTrades(data);
      
      const buyTrades = data.filter(trade => !trade.isBuyerMaker);
      const sellTrades = data.filter(trade => trade.isBuyerMaker);
      
      const buyVolume = buyTrades.reduce((sum, trade) => sum + parseFloat(trade.qty), 0);
      const sellVolume = sellTrades.reduce((sum, trade) => sum + parseFloat(trade.qty), 0);
      const totalVolume = buyVolume + sellVolume;
      
      const averagePrice = data.reduce((sum, trade) => sum + parseFloat(trade.price), 0) / data.length;
      
      setStats({
        buyVolume,
        sellVolume,
        totalTrades: data.length,
        averagePrice
      });
    }
  }, [data]);

  const formatNumber = (num: number, decimals: number = 4) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Trade Volume</h2>
        <div className="text-red-500">Error loading trade data</div>
      </div>
    );
  }

  if (isLoading || !trades.length) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Trade Volume</h2>
        <div className="animate-pulse">Loading trade data...</div>
      </div>
    );
  }

  const buyPercentage = (stats.buyVolume / (stats.buyVolume + stats.sellVolume)) * 100;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Trade Volume</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">Buy/Sell Ratio</div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${buyPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-green-500">{formatNumber(buyPercentage)}%</span>
            <span className="text-red-500">{formatNumber(100 - buyPercentage)}%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Buy Volume</div>
            <div className="text-lg font-bold text-green-500">
              {formatNumber(stats.buyVolume)} BTC
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Sell Volume</div>
            <div className="text-lg font-bold text-red-500">
              {formatNumber(stats.sellVolume)} BTC
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Total Trades</div>
            <div className="text-lg font-bold">{stats.totalTrades}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Average Price</div>
            <div className="text-lg font-bold">${formatNumber(stats.averagePrice, 2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 