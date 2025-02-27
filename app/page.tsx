import React from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';

const OrderBook = dynamic(() => import('./components/OrderBook'), { ssr: false });
const KlineChart = dynamic(() => import('./components/KlineChart'), { ssr: false });
const FundingRate = dynamic(() => import('./components/FundingRate'), { ssr: false });
const TradeVolume = dynamic(() => import('./components/TradeVolume'), { ssr: false });
const VolumePulse = dynamic(() => import('./components/VolumePulse'), { ssr: false });
const MarketAnalysis = dynamic(() => import('./components/MarketAnalysis'), { ssr: false });

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-red-500">Something went wrong</h2>
      <pre className="text-sm text-red-600 mb-4">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Binance Data Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <OrderBook />
            </div>
          </ErrorBoundary>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <KlineChart />
            </div>
          </ErrorBoundary>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow-lg p-6">
              <FundingRate />
            </div>
          </ErrorBoundary>
          <div className="col-span-1 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <TradeVolume />
                </div>
              </ErrorBoundary>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <VolumePulse />
                </div>
              </ErrorBoundary>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <MarketAnalysis />
                </div>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 