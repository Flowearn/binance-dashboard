const WebSocket = require('ws');
const EventEmitter = require('events');
const config = require('../config/config');
const axios = require('axios');

class BinanceService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map();
    this.symbol = config.binanceConfig.symbol;
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.intervals = ['1m', '15m', '1h', '4h', '1d']; // 支持的时间周期
  }

  connect() {
    // 连接所有时间周期的K线数据流
    this.intervals.forEach(interval => {
      this.connectToStream(`${this.symbol}@kline_${interval}`);
    });

    // 其他数据流保持不变
    const otherStreams = [
      `${this.symbol}@depth20@100ms`,
      `${this.symbol}@aggTrade`,
      `${this.symbol}@markPrice@1s`
    ];
    otherStreams.forEach(stream => this.connectToStream(stream));
  }

  connectToStream(endpoint) {
    const wsUrl = `${config.binanceConfig.wsBaseUrl}/${endpoint}`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log(`Connected to ${endpoint}`);
      this.reconnectAttempts.set(endpoint, 0);
    });

    ws.on('message', (data) => {
      try {
        const parsedData = JSON.parse(data);
        this.handleData(endpoint, parsedData);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      console.log(`Disconnected from ${endpoint}`);
      this.handleReconnect(endpoint);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${endpoint}:`, error);
    });

    this.connections.set(endpoint, ws);
  }

  handleReconnect(endpoint) {
    const attempts = (this.reconnectAttempts.get(endpoint) || 0) + 1;
    this.reconnectAttempts.set(endpoint, attempts);

    if (attempts <= this.maxReconnectAttempts) {
      console.log(`Reconnecting to ${endpoint}... Attempt ${attempts}`);
      setTimeout(() => this.connectToStream(endpoint), 5000);
    } else {
      console.error(`Max reconnection attempts reached for ${endpoint}`);
    }
  }

  handleData(endpoint, data) {
    const type = endpoint.split('@')[1].split('_')[0];
    this.emit('data', { type, data });
  }

  disconnect() {
    this.connections.forEach((ws, endpoint) => {
      ws.close();
      console.log(`Disconnected from ${endpoint}`);
    });
    this.connections.clear();
  }

  // 添加获取历史K线数据的方法
  async fetchHistoricalKlines(interval, limit = 1000) {
    try {
      const url = `${config.binanceConfig.restBaseUrl}/fapi/v1/klines`;
      const response = await axios.get(url, {
        params: {
          symbol: this.symbol.toUpperCase(),
          interval: interval,
          limit: limit
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching historical klines for ${interval}:`, error);
      return [];
    }
  }
}

module.exports = new BinanceService(); 