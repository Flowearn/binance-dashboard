import { NextResponse } from 'next/server';
import { DataProcessingService } from '@/app/services/DataProcessingService';

export const dynamic = 'force-dynamic';

// 生成模拟数据的函数
const generateMockData = (symbol: string, type: string) => {
  console.log(`[${new Date().toISOString()}] Generating mock data for ${type} and symbol ${symbol}`);
  
  const currentPrice = symbol.includes('BTC') ? 65000 + Math.random() * 1000 : 3000 + Math.random() * 100;
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'orderbook':
      const bids = [];
      const asks = [];
      
      for (let i = 0; i < 10; i++) {
        const bidPrice = currentPrice - (i + 1) * 10 - Math.random() * 5;
        const bidQty = 0.1 + Math.random() * 2;
        bids.push([bidPrice, bidQty]);
        
        const askPrice = currentPrice + (i + 1) * 10 + Math.random() * 5;
        const askQty = 0.1 + Math.random() * 2;
        asks.push([askPrice, askQty]);
      }
      
      return {
        success: true,
        data: {
          symbol,
          timestamp,
          data: {
            bids,
            asks,
            lastUpdateId: Date.now()
          }
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
        
        klines.push({
          openTime: time,
          open: open.toString(),
          high: high.toString(),
          low: low.toString(),
          close: close.toString(),
          volume: volume.toString(),
          closeTime: time + 3600000,
          quoteVolume: (volume * close).toString(),
          trades: 500,
          takerBuyBaseVolume: (volume * 0.6).toString(),
          takerBuyQuoteVolume: (volume * close * 0.6).toString()
        });
      }
      
      return {
        success: true,
        data: {
          symbol,
          timestamp,
          data: {
            klines
          }
        }
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
          price: price.toString(),
          qty: qty.toString(),
          time: tradeTime - i * 1000,
          isBuyerMaker,
          isBestMatch: true
        });
      }
      
      return {
        success: true,
        data: {
          symbol,
          timestamp,
          data: trades
        }
      };
      
    case 'fundingRate':
      // 为资金费率生成模拟数据
      const fundingRateValue = (-0.001 + Math.random() * 0.002).toString();
      const nextFundingTime = Date.now() + 8 * 3600000; // 8小时后
      const mockFundingRateData = [
        {
          symbol,
          fundingRate: fundingRateValue,
          fundingTime: nextFundingTime,
          markPrice: currentPrice.toString()
        }
      ];
      
      return {
        success: true,
        data: {
          symbol,
          timestamp,
          data: mockFundingRateData
        }
      };
      
    default:
      return {
        success: true,
        data: {
          symbol,
          timestamp,
          data: {
            message: "Mock data for unknown type"
          }
        }
      };
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const type = searchParams.get('type') || 'kline';
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const aggregation = searchParams.get('aggregation') as 'hour' | 'day' | 'week' | null;

  try {
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
    } catch (dbError) {
      console.error('Database error, using mock data:', dbError);
      // 返回模拟数据
      const mockData = generateMockData(symbol, type);
      return NextResponse.json(mockData, {
        headers: {
          'X-Mock-Data': 'true'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching market data:', error);
    // 如果所有尝试都失败，返回错误
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

    try {
      await DataProcessingService.storeMarketData({
        symbol,
        type,
        data: processedData,
        timestamp: new Date(),
      });
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Database error when storing data:', dbError);
      // 即使数据库存储失败，也返回成功
      return NextResponse.json({ 
        success: true,
        warning: "Data was processed but not stored in database"
      });
    }
  } catch (error) {
    console.error('Error processing market data:', error);
    return NextResponse.json(
      { error: 'Failed to process market data' },
      { status: 500 }
    );
  }
} 