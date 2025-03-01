import { NextResponse } from 'next/server';
import { DataProcessingService } from '@/app/services/DataProcessingService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const type = searchParams.get('type') || 'orderbook';
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const aggregation = searchParams.get('aggregation') as 'hour' | 'day' | 'week' | null;

  try {
    if (aggregation) {
      const data = await DataProcessingService.getAggregatedData(
        symbol,
        type,
        aggregation
      );
      return NextResponse.json(data);
    } else if (startTime && endTime) {
      const data = await DataProcessingService.getHistoricalData(
        symbol,
        type,
        new Date(startTime),
        new Date(endTime)
      );
      return NextResponse.json(data);
    } else {
      const data = await DataProcessingService.getLatestData(symbol, type);
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, type, data } = body;

    let processedData;
    switch (type) {
      case 'orderbook':
        processedData = DataProcessingService.processOrderBookData(data, symbol);
        break;
      case 'kline':
        processedData = DataProcessingService.processKlineData(data, symbol);
        break;
      case 'trades':
        processedData = DataProcessingService.processTradeData(data, symbol);
        break;
      default:
        processedData = data;
    }

    await DataProcessingService.storeMarketData({
      symbol,
      type,
      data: processedData,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing market data:', error);
    return NextResponse.json(
      { error: 'Failed to store market data' },
      { status: 500 }
    );
  }
} 