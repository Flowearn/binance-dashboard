import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MarketData {
  symbol: string;
  timestamp: Date;
  data: any;
  type: 'orderbook' | 'kline' | 'trades' | 'ticker';
}

interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
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

  // 清洗K线数据
  static processKlineData(rawData: any[], symbol: string) {
    const timestamp = new Date();
    return {
      symbol,
      timestamp,
      klines: rawData.map((item: any[]): KlineData => ({
        openTime: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
        closeTime: item[6],
        quoteVolume: item[7],
        trades: item[8],
        takerBuyBaseVolume: item[9],
        takerBuyQuoteVolume: item[10],
      })),
    };
  }

  // 清洗交易数据
  static processTradeData(rawData: any[], symbol: string) {
    const timestamp = new Date();
    return {
      symbol,
      timestamp,
      trades: rawData.map((trade: any) => ({
        id: trade.id,
        price: parseFloat(trade.price),
        quantity: parseFloat(trade.qty),
        time: new Date(trade.time),
        isBuyerMaker: trade.isBuyerMaker,
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

  // 获取聚合数据
  static async getAggregatedData(
    symbol: string,
    type: string,
    interval: 'hour' | 'day' | 'week'
  ) {
    try {
      const now = new Date();
      let startTime = new Date();

      switch (interval) {
        case 'hour':
          startTime.setHours(now.getHours() - 1);
          break;
        case 'day':
          startTime.setDate(now.getDate() - 1);
          break;
        case 'week':
          startTime.setDate(now.getDate() - 7);
          break;
      }

      const data = await prisma.marketData.findMany({
        where: {
          symbol,
          type,
          timestamp: {
            gte: startTime,
            lte: now,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      return this.aggregateData(data, type);
    } catch (error) {
      console.error('Error fetching aggregated data:', error);
      throw error;
    }
  }

  // 聚合数据处理
  private static aggregateData(data: any[], type: string) {
    switch (type) {
      case 'trades':
        return this.aggregateTradeData(data);
      case 'orderbook':
        return this.aggregateOrderBookData(data);
      case 'kline':
        return this.aggregateKlineData(data);
      default:
        return data;
    }
  }

  // 聚合交易数据
  private static aggregateTradeData(data: any[]) {
    const trades = data.flatMap((item) => item.data.trades);
    return {
      totalTrades: trades.length,
      totalVolume: trades.reduce((sum: number, trade: any) => sum + parseFloat(trade.quantity), 0),
      averagePrice: trades.reduce((sum: number, trade: any) => sum + parseFloat(trade.price), 0) / trades.length,
      buyerMakerRatio: trades.filter((trade: any) => trade.isBuyerMaker).length / trades.length,
    };
  }

  // 聚合订单簿数据
  private static aggregateOrderBookData(data: any[]) {
    const latestData = data[data.length - 1].data;
    return {
      bidDepth: latestData.bids.reduce((sum: number, [, quantity]: string[]) => sum + parseFloat(quantity), 0),
      askDepth: latestData.asks.reduce((sum: number, [, quantity]: string[]) => sum + parseFloat(quantity), 0),
      spreadAverage: data.reduce((sum, item) => {
        const bestBid = parseFloat(item.data.bids[0][0]);
        const bestAsk = parseFloat(item.data.asks[0][0]);
        return sum + (bestAsk - bestBid);
      }, 0) / data.length,
    };
  }

  // 聚合K线数据
  private static aggregateKlineData(data: any[]) {
    const klines = data.flatMap((item) => item.data.klines);
    return {
      highestPrice: Math.max(...klines.map((k: KlineData) => parseFloat(k.high))),
      lowestPrice: Math.min(...klines.map((k: KlineData) => parseFloat(k.low))),
      averageVolume: klines.reduce((sum: number, k: KlineData) => sum + parseFloat(k.volume), 0) / klines.length,
      priceChange: parseFloat(klines[klines.length - 1].close) - parseFloat(klines[0].open),
    };
  }
} 