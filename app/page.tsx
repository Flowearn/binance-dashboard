'use client';

import KlineChart from './components/KlineChart';
import OrderBook from './components/OrderBook';
import TradeVolume from './components/TradeVolume';
import FundingRate from './components/FundingRate';
import VolumePulse from './components/VolumePulse';
import LiquidationPoints from './components/LiquidationPoints';
import PriceChange from './components/PriceChange';
import AskMeAnything from './components/AskMeAnything';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Banner */}
      <div className="banner">
        <div className="container flex items-center h-12">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 relative flex-shrink-0">
              <img 
                src="/flow-logo.png" 
                alt="Flow" 
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            <h1 className="text-white text-xl font-bold">Flow</h1>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {/* Kline Chart */}
        <div className="box mb-4">
          <KlineChart />
        </div>

        {/* Order Book & Trade Volume Classification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="box mb-0">
            <OrderBook />
          </div>
          <div className="box mb-0">
            <TradeVolume />
          </div>
        </div>

        {/* Funding Rate & 24h Change */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="box mb-0">
            <FundingRate />
          </div>
          <div className="box mb-0">
            <PriceChange />
          </div>
        </div>

        {/* Volume Pulse & Liquidation Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="box mb-0">
            <VolumePulse />
          </div>
          <div className="box mb-0">
            <LiquidationPoints />
          </div>
        </div>

        {/* Ask Me Anything */}
        <div className="box">
          <AskMeAnything />
        </div>
      </div>
    </main>
  );
} 