'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import OrderBook from './components/OrderBook';
import FundingRate from './components/FundingRate';
import TradeVolume from './components/TradeVolume';
import VolumePulse from './components/VolumePulse';
import MarketAnalysis from './components/MarketAnalysis';
import LiquidationPoints from './components/LiquidationPoints';

// Dynamically import KlineChart to avoid SSR issues with TradingView
const KlineChart = dynamic(() => import('./components/KlineChart'), {
  ssr: false
});

export default function Home() {
  return (
    <div className="container">
      <header className="header">
        <div className="logo-container">
          <Image src="/assets/logo.svg" alt="Crypto Market Monitor Logo" width={50} height={50} className="logo" />
        </div>
        <h1>Crypto Market Monitor</h1>
        <p>BTC/USDT Perpetual Contract Real-time Data</p>
      </header>
      
      <div className="content">
        <div className="box">
          <h2>Price Chart</h2>
          <KlineChart />
        </div>
        
        <div className="grid">
          <OrderBook />
          <FundingRate />
        </div>
        
        <div className="grid">
          <div className="box">
            <h2>Trade Volume Classification</h2>
            <TradeVolume />
          </div>
          <div className="box">
            <h2>Volume Pulse</h2>
            <VolumePulse />
          </div>
        </div>
        
        <div className="grid">
          <div className="box">
            <h2>Liquidation Points Distribution</h2>
            <LiquidationPoints />
          </div>
          <div className="box">
            <h2>Market Analysis</h2>
            <MarketAnalysis />
          </div>
        </div>
      </div>
    </div>
  );
} 