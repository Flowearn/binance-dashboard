import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MarketData {
  symbol: string;
  timestamp: Date;
  data: any;
  type: 'orderbook' | 'kline' | 'trades' | 'ticker';
}

export class DataProcessingService {
  // 清洗订单簿数据
  static processOrderBookData(rawData: any, symbol: string) {
    const timestamp = new Date();
    return {
      symbol,
      timestamp,
      lastUpdateId: rawData.lastUpdateId,
      bids: rawData.bids.slice(0, 20).map(([price, quantity]: string[]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
      asks: rawData.asks.slice(0, 20).map(([price, quantity]: string[]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
      })),
    };
  }

  // 存储市场数据
  static async storeMarketData(data: MarketData) {
    try {
      // 存储数据
      await prisma.marketData.create({
        data: {
          symbol: data.symbol,
          timestamp: data.timestamp,
          data: data.data,
          type: data.type,
        },
      });

      // 清理90天前的数据
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      await prisma.marketData.deleteMany({
        where: {
          timestamp: {
            lt: ninetyDaysAgo,
          },
        },
      });
    } catch (error) {
      console.error('Error storing market data:', error);
      throw error;
    }
  }

  // 获取历史数据
  static async getHistoricalData(
    symbol: string,
    type: string,
    startTime: Date,
    endTime: Date
  ) {
    try {
      return await prisma.marketData.findMany({
        where: {
          symbol,
          type,
          timestamp: {
            gte: startTime,
            lte: endTime,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  // 获取最新数据
  static async getLatestData(symbol: string, type: string) {
    try {
      return await prisma.marketData.findFirst({
        where: {
          symbol,
          type,
        },
        orderBy: {
          timestamp: 'desc',
        },
      });
    } catch (error) {
      console.error('Error fetching latest data:', error);
      throw error;
    }
  }
} 