const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const binanceService = require('./services/binanceService');
const dataProcessor = require('./services/dataProcessor');
const storageService = require('./services/storageService');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Routes
app.get('/api/market-data', (req, res) => {
  const { type } = req.query;
  const data = storageService.getData(type);
  res.json(data);
});

app.get('/api/latest', (req, res) => {
  const data = storageService.getLatestData();
  res.json(data);
});

app.get('/api/klines', async (req, res) => {
  const { interval, timeframe } = req.query;
  const data = storageService.getData('klines', timeframe, interval);
  res.json(data);
});

app.get('/api/historical-klines', async (req, res) => {
  try {
    const { interval, limit } = req.query;
    const data = await binanceService.fetchHistoricalKlines(interval, limit);
    const processedData = data.map(k => ({
      timestamp: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      interval: interval
    }));
    res.json(processedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start WebSocket connections
binanceService.on('data', (data) => {
  const processedData = dataProcessor.processData(data.type, data.data);
  storageService.store(processedData);
});

binanceService.connect();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  binanceService.disconnect();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 