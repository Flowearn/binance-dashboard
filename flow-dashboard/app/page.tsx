import KlineChart from '@/components/KlineChart';
import OrderBook from '@/components/OrderBook';
import TradeVolume from '@/components/TradeVolume';
import FundingRate from '@/components/FundingRate';
import VolumePulse from '@/components/VolumePulse';
import LiquidationPoints from '@/components/LiquidationPoints';
import AskMeAnything from '@/components/AskMeAnything';
import PriceChange from '@/components/PriceChange';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#2962FF] to-[#1565C0] shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <img src="/flow-logo.png" alt="Flow" className="h-12 mr-4" />
          <h1 className="text-2xl font-bold text-white">Flow</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Kline Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Price Chart</h2>
            <div className="space-x-2">
              <button className="px-4 py-2 rounded bg-[#E3F2FD] text-[#2962FF] hover:bg-[#2962FF] hover:text-white transition-colors active:bg-[#2962FF] active:text-white">1D</button>
              <button className="px-4 py-2 rounded bg-[#E3F2FD] text-[#2962FF] hover:bg-[#2962FF] hover:text-white transition-colors">4H</button>
              <button className="px-4 py-2 rounded bg-[#E3F2FD] text-[#2962FF] hover:bg-[#2962FF] hover:text-white transition-colors">1H</button>
              <button className="px-4 py-2 rounded bg-[#E3F2FD] text-[#2962FF] hover:bg-[#2962FF] hover:text-white transition-colors">15M</button>
              <button className="px-4 py-2 rounded bg-[#E3F2FD] text-[#2962FF] hover:bg-[#2962FF] hover:text-white transition-colors">1M</button>
            </div>
          </div>
          <KlineChart />
        </div>

        {/* Order Book & Trade Volume Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <OrderBook />
          <TradeVolume />
        </div>

        {/* Funding Rate & Volume Pulse Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <FundingRate />
          <VolumePulse />
        </div>

        {/* Liquidation Points & 24h Change Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <LiquidationPoints />
          <PriceChange />
        </div>

        {/* Ask Me Anything */}
        <AskMeAnything />
      </div>
    </main>
  );
} 