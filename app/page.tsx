import React from 'react';
import dynamic from 'next/dynamic';

const OrderBook = dynamic(() => import('./components/OrderBook'), { ssr: false });
const KlineChart = dynamic(() => import('./components/KlineChart'), { ssr: false });
const FundingRate = dynamic(() => import('./components/FundingRate'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Binance Data Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <OrderBook />
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <KlineChart />
          </div>
          <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <FundingRate />
          </div>
        </div>
      </div>
    </main>
  );
} 