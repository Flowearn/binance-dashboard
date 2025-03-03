'use client';

import KlineChart from './components/KlineChart';
import OrderBook from './components/OrderBook';
import TradeVolume from './components/TradeVolume';
import PriceChange from './components/PriceChange';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-gray-900 text-white">
      <div className="w-full max-w-7xl mx-auto space-y-4">
        {/* 第一行：K线图 */}
        <div className="w-full h-[600px] bg-gray-800 rounded-lg overflow-hidden">
          <KlineChart />
        </div>

        {/* 第二行：订单簿、成交量和价格变化 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <OrderBook />
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <TradeVolume />
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <PriceChange />
          </div>
        </div>
      </div>
    </main>
  );
} 