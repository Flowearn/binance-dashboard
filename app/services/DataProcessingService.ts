// 数据类型定义
type DataType = 'orderbook' | 'kline' | 'trades' | 'ticker';

interface KlineData {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  trades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

interface OrderBookData {
  symbol: string;
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
}

interface TradeData {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

interface TickerData {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
}

export class DataProcessingService {
  static processKlineData(rawData: any[], symbol: string) {
    if (!Array.isArray(rawData)) {
      console.error('Invalid kline data format:', rawData);
      return null;
    }

    return {
      symbol,
      klines: rawData.map((item: any[]): KlineData => ({
        time: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
        closeTime: item[6],
        quoteAssetVolume: item[7],
        trades: item[8],
        takerBuyBaseAssetVolume: item[9],
        takerBuyQuoteAssetVolume: item[10],
        ignore: item[11]
      }))
    };
  }

  static processOrderBookData(rawData: any, symbol: string): OrderBookData | null {
    if (!rawData || !Array.isArray(rawData.bids) || !Array.isArray(rawData.asks)) {
      console.error('Invalid orderbook data:', rawData);
      return null;
    }

    return {
      symbol,
      lastUpdateId: rawData.lastUpdateId,
      bids: rawData.bids.slice(0, 10),
      asks: rawData.asks.slice(0, 10),
      timestamp: Date.now()
    };
  }

  static processTradeData(rawData: any[], symbol: string) {
    if (!Array.isArray(rawData)) {
      console.error('Invalid trade data:', rawData);
      return null;
    }

    return {
      symbol,
      trades: rawData.map((trade): TradeData => ({
        id: trade.id,
        price: trade.price,
        qty: trade.qty,
        quoteQty: trade.quoteQty,
        time: trade.time,
        isBuyerMaker: trade.isBuyerMaker,
        isBestMatch: trade.isBestMatch
      }))
    };
  }

  static processTickerData(rawData: any, symbol: string): TickerData | null {
    if (!rawData || typeof rawData !== 'object') {
      console.error('Invalid ticker data:', rawData);
      return null;
    }

    return {
      symbol,
      priceChange: rawData.priceChange,
      priceChangePercent: rawData.priceChangePercent,
      lastPrice: rawData.lastPrice,
      volume: rawData.volume,
      quoteVolume: rawData.quoteVolume
    };
  }

  static async processData(type: DataType, data: any[], symbol: string) {
    try {
      let processedData;
      switch (type) {
        case 'kline':
          processedData = this.processKlineData(data, symbol);
          break;
        case 'orderbook':
          processedData = this.processOrderBookData(data, symbol);
          break;
        case 'trades':
          processedData = this.processTradeData(data, symbol);
          break;
        case 'ticker':
          processedData = this.processTickerData(data, symbol);
          break;
        default:
          throw new Error(`Unsupported data type: ${type}`);
      }

      if (!processedData) {
        throw new Error(`Failed to process ${type} data`);
      }

      return processedData;
    } catch (error) {
      console.error(`Error processing ${type} data:`, error);
      throw error;
    }
  }

  static aggregateData(type: DataType, data: any[]) {
    try {
      switch (type) {
        case 'kline':
          return this.aggregateKlineData(data);
        case 'orderbook':
          return this.aggregateOrderBookData(data);
        case 'trades':
          return this.aggregateTradeData(data);
        case 'ticker':
          return this.aggregateTickerData(data);
        default:
          throw new Error(`Unsupported data type: ${type}`);
      }
    } catch (error) {
      console.error(`Error aggregating ${type} data:`, error);
      throw error;
    }
  }

  private static aggregateKlineData(data: any[]) {
    const klines = data.flatMap((item) => item.data.klines);
    return {
      highestPrice: Math.max(...klines.map((k: KlineData) => parseFloat(k.high))),
      lowestPrice: Math.min(...klines.map((k: KlineData) => parseFloat(k.low))),
      averageVolume: klines.reduce((sum: number, k: KlineData) => sum + parseFloat(k.volume), 0) / klines.length,
      priceChange: parseFloat(klines[klines.length - 1].close) - parseFloat(klines[0].open),
    };
  }

  private static aggregateOrderBookData(data: any[]) {
    const latestOrderBook = data[data.length - 1].data;
    return {
      bidCount: latestOrderBook.bids.length,
      askCount: latestOrderBook.asks.length,
      spreadPercentage: ((parseFloat(latestOrderBook.asks[0][0]) - parseFloat(latestOrderBook.bids[0][0])) / parseFloat(latestOrderBook.bids[0][0])) * 100
    };
  }

  private static aggregateTradeData(data: any[]) {
    const trades = data.flatMap((item) => item.data.trades);
    const buyVolume = trades
      .filter((t: TradeData) => !t.isBuyerMaker)
      .reduce((sum: number, t: TradeData) => sum + parseFloat(t.qty), 0);
    const sellVolume = trades
      .filter((t: TradeData) => t.isBuyerMaker)
      .reduce((sum: number, t: TradeData) => sum + parseFloat(t.qty), 0);
    
    return {
      totalTrades: trades.length,
      buyVolume,
      sellVolume,
      buyPercentage: (buyVolume / (buyVolume + sellVolume)) * 100
    };
  }

  private static aggregateTickerData(data: any[]) {
    const latestTicker = data[data.length - 1].data;
    return {
      priceChange: parseFloat(latestTicker.priceChange),
      priceChangePercent: parseFloat(latestTicker.priceChangePercent),
      volume24h: parseFloat(latestTicker.volume),
      quoteVolume24h: parseFloat(latestTicker.quoteVolume)
    };
  }
} 