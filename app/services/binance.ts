const BINANCE_API_URL = 'https://api.binance.com';
const BINANCE_FUTURES_API_URL = 'https://fapi.binance.com';

export class BinanceService {
  static async getKlineData(symbol: string = 'BTCUSDT', interval: string = '1d', limit: number = 100) {
    try {
      const response = await fetch(
        `${BINANCE_API_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching kline data:', error);
      throw error;
    }
  }

  static async getOrderBook(symbol: string = 'BTCUSDT', limit: number = 20) {
    try {
      const response = await fetch(
        `${BINANCE_API_URL}/api/v3/depth?symbol=${symbol}&limit=${limit}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching order book:', error);
      throw error;
    }
  }

  static async get24hTicker(symbol: string = 'BTCUSDT') {
    try {
      const response = await fetch(
        `${BINANCE_API_URL}/api/v3/ticker/24hr?symbol=${symbol}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching 24h ticker:', error);
      throw error;
    }
  }

  static async getFundingRate(symbol: string = 'BTCUSDT') {
    try {
      const response = await fetch(
        `${BINANCE_FUTURES_API_URL}/fapi/v1/fundingRate?symbol=${symbol}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching funding rate:', error);
      throw error;
    }
  }

  static async getRecentTrades(symbol: string = 'BTCUSDT', limit: number = 100) {
    try {
      const response = await fetch(
        `${BINANCE_API_URL}/api/v3/trades?symbol=${symbol}&limit=${limit}`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      throw error;
    }
  }
} 