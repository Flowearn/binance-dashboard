'use client';

import React from 'react';
import KlineChart from './components/KlineChart';
import OrderBook from './components/OrderBook';
import TradeVolume from './components/TradeVolume';
import FundingRate from './components/FundingRate';
import VolumePulse from './components/VolumePulse';
import LiquidationPoints from './components/LiquidationPoints';
import AskMeAnything from './components/AskMeAnything';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <div className="space-y-4">
        <KlineChart />
        <div className="grid grid-cols-2 gap-4">
          <OrderBook />
          <TradeVolume />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FundingRate />
          <VolumePulse />
          <LiquidationPoints />
        </div>
        <AskMeAnything />
      </div>
    </main>
  );
} 