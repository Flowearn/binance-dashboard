'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import OrderBook from './components/OrderBook';
import FundingRate from './components/FundingRate';
import TradeVolume from './components/TradeVolume';
import VolumePulse from './components/VolumePulse';
import MarketAnalysis from './components/MarketAnalysis';
import LiquidationPoints from './components/LiquidationPoints';
import { ErrorBoundary } from 'react-error-boundary';
import dynamic from 'next/dynamic';

// Dynamically import KlineChart with no SSR
const KlineChart = dynamic(() => import('./components/KlineChart'), {
  ssr: false,
  loading: () => (
    <div className="box">
      <h2>Price Chart</h2>
      <div className="loading-container">
        <div className="loading-text">Loading chart...</div>
      </div>
    </div>
  )
});

interface Symbol {
  symbol: string;
  baseAsset: string;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="error-container">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default function Home() {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('https://fapi.binance.com/fapi/v1/exchangeInfo')
      .then(response => response.json())
      .then(data => {
        const usdtPairs = data.symbols
          .filter((s: any) => s.quoteAsset === 'USDT' && s.status === 'TRADING')
          .map((s: any) => ({
            symbol: s.symbol,
            baseAsset: s.baseAsset
          }));
        setSymbols(usdtPairs);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching symbols:', error);
        setIsLoading(false);
      });
  }, []);

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Binance Futures Dashboard</h2>
          <div className="relative">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="block appearance-none w-48 bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <option>Loading...</option>
              ) : (
                symbols.map(symbol => (
                  <option key={symbol.symbol} value={symbol.symbol}>
                    {symbol.baseAsset}/USDT
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <div className="col-span-2">
              <KlineChart symbol={selectedSymbol.toLowerCase()} />
            </div>
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <OrderBook symbol={selectedSymbol.toLowerCase()} />
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <FundingRate symbol={selectedSymbol.toLowerCase()} />
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <TradeVolume symbol={selectedSymbol.toLowerCase()} />
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <VolumePulse symbol={selectedSymbol.toLowerCase()} />
          </ErrorBoundary>

          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <LiquidationPoints symbol={selectedSymbol.toLowerCase()} />
          </ErrorBoundary>
        </div>
        
        <div className="grid">
          <div className="box">
            <h2>Market Analysis</h2>
            <MarketAnalysis />
          </div>
        </div>
      </div>
    </div>
  );
} 