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
    <main>
      {/* Banner */}
      <div className="banner text-white">
        <div className="container flex items-center">
          <img src="/flow-logo.png" alt="Flow" className="h-12 mr-4" />
          <h1 className="text-2xl font-bold">Flow</h1>
        </div>
      </div>

      <div className="container py-4">
        {/* Kline Chart */}
        <div className="box">
          <KlineChart />
        </div>

        {/* Order Book & Trade Volume Classification */}
        <div className="grid grid-cols-2 gap-4">
          <div className="box">
            <OrderBook />
          </div>
          <div className="box">
            <TradeVolume />
          </div>
        </div>

        {/* Funding Rate & Volume Pulse */}
        <div className="grid grid-cols-2 gap-4">
          <div className="box">
            <FundingRate />
          </div>
          <div className="box">
            <VolumePulse />
          </div>
        </div>

        {/* Liquidation Points & 24h Change */}
        <div className="grid grid-cols-2 gap-4">
          <div className="box">
            <LiquidationPoints />
          </div>
          <div className="box">
            <PriceChange />
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