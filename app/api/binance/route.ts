import { NextResponse } from 'next/server';
import { BinanceService } from '@/app/services/binance';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1d';
  const limit = Number(searchParams.get('limit')) || 100;

  try {
    let data;
    switch (endpoint) {
      case 'kline':
        data = await BinanceService.getKlineData(symbol, interval, limit);
        break;
      case 'orderbook':
        data = await BinanceService.getOrderBook(symbol, limit);
        break;
      case 'ticker24h':
        data = await BinanceService.get24hTicker(symbol);
        break;
      case 'fundingRate':
        data = await BinanceService.getFundingRate(symbol);
        break;
      case 'trades':
        data = await BinanceService.getRecentTrades(symbol, limit);
        break;
      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Binance' },
      { status: 500 }
    );
  }
} 