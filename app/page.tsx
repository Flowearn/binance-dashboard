'use client';

import KlineChart from './components/KlineChart';
import { OrderBook } from './components/OrderBook';
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
        {/* 第一行: K线图 */}
        <div className="box mb-4">
          <KlineChart />
        </div>

        {/* 第二行: 订单簿和交易量分类 */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-[65%] data-box p-5">
            <h2 className="data-box-title">Order Book</h2>
            <OrderBook symbol="BTCUSDT" />
          </div>
          <div className="w-full md:w-[35%] data-box p-5">
            <h2 className="data-box-title">Trade Volume Classification</h2>
            <TradeVolume />
          </div>
        </div>

        {/* 第三行: 资金费率和24小时价格变化 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="box mb-0">
            <FundingRate />
          </div>
          <div className="box mb-0">
            <PriceChange />
          </div>
        </div>

        {/* 第四行: 成交量脉冲和清算点分布 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="box mb-0">
            <VolumePulse />
          </div>
          <div className="box mb-0">
            <LiquidationPoints />
          </div>
        </div>

        {/* 第五行: 聊天框 */}
        <div className="box">
          <AskMeAnything />
        </div>
      </div>
    </main>
  );
} 