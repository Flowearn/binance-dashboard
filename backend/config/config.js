require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  binanceConfig: {
    wsBaseUrl: 'wss://fstream.binance.com/ws',
    restBaseUrl: 'https://fapi.binance.com',
    symbol: 'btcusdt'
  }
}; 