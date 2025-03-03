import { NextResponse } from 'next/server';
import { DataProcessingService } from '@/app/services/DataProcessingService';

export const dynamic = 'force-dynamic';

// 生成模拟数据的函数
const generateMockData = (symbol: string, type: string) => {
  console.log(`[${new Date().toISOString()}] Generating mock data for ${type} and symbol ${symbol}`);
  
  const currentPrice = symbol.includes('BTC') ? 86000 + Math.random() * 1000 : 3000 + Math.random() * 100;
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'orderbook':
      const bids = [];
      const asks = [];
      
      for (let i = 0; i < 10; i++) {
        const bidPrice = currentPrice - (i + 1) * 10 - Math.random() * 5;
        const bidQty = 0.1 + Math.random() * 2;
        bids.push([bidPrice.toFixed(2), bidQty.toFixed(8)]);
        
        const askPrice = currentPrice + (i + 1) * 10 + Math.random() * 5;
        const askQty = 0.1 + Math.random() * 2;
        asks.push([askPrice.toFixed(2), askQty.toFixed(8)]);
      }
      
      return {
        success: true,
        data: {
          lastUpdateId: Date.now(),
          bids,
          asks
        }
      };
      
    case 'kline':
      const klines = [];
      const now = Date.now();
      
      for (let i = 0; i < 20; i++) {
        const time = now - (19 - i) * 3600000; // 每小时一个K线
        const open = currentPrice - 50 + Math.random() * 100;
        const close = open - 50 + Math.random() * 100;
        const high = Math.max(open, close) + Math.random() * 20;
        const low = Math.min(open, close) - Math.random() * 20;
        const volume = 10 + Math.random() * 100;
        
        klines.push([
          time,
          open.toFixed(2),
          high.toFixed(2),
          low.toFixed(2),
          close.toFixed(2),
          volume.toFixed(8),
          time + 3600000,
          (volume * close).toFixed(8),
          500,
          (volume * 0.6).toFixed(8),
          (volume * close * 0.6).toFixed(8),
          "0"
        ]);
      }
      
      return {
        success: true,
        data: klines
      };
      
    case 'trades':
      const trades = [];
      const tradeTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        const price = currentPrice - 50 + Math.random() * 100;
        const qty = 0.01 + Math.random() * 1;
        const isBuyerMaker = Math.random() > 0.5;
        
        trades.push({
          id: tradeTime - i,
          price: price.toFixed(2),
          qty: qty.toFixed(8),
          quoteQty: (price * qty).toFixed(8),
          time: tradeTime - i * 1000,
          isBuyerMaker,
          isBestMatch: true
        });
      }
      
      return {
        success: true,
        data: trades
      };
      
    case 'ticker':
      const priceChange = -100 + Math.random() * 200;
      const priceChangePercent = (priceChange / currentPrice * 100).toFixed(2);
      const volume = 1000 + Math.random() * 2000;
      
      return {
        success: true,
        data: {
          symbol,
          priceChange: priceChange.toFixed(2),
          priceChangePercent,
          lastPrice: currentPrice.toFixed(2),
          volume: volume.toFixed(8),
          quoteVolume: (volume * currentPrice).toFixed(8)
        }
      };
      
    default:
      return {
        success: true,
        data: {
          message: "Mock data for unknown type"
        }
      };
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const type = searchParams.get('type') || 'kline';

  try {
    const mockData = generateMockData(symbol, type);
    return NextResponse.json(mockData, {
      headers: {
        'X-Mock-Data': 'true'
      }
    });
  } catch (error) {
    console.error('Error generating mock data:', error);
    return NextResponse.json(
      { error: 'Failed to generate mock data' },
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
      case 'ticker':
        processedData = DataProcessingService.processTickerData(data, symbol);
        break;
      default:
        processedData = data;
    }

    return NextResponse.json({ 
      success: true,
      data: processedData
    });
  } catch (error) {
    console.error('Error processing market data:', error);
    return NextResponse.json(
      { error: 'Failed to process market data' },
      { status: 500 }
    );
  }
} 