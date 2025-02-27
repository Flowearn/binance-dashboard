class StorageService {
  constructor() {
    this.data = {
      klines: {
        '1m': [],
        '15m': [],
        '1h': [],
        '4h': [],
        '1d': []
      },
      orderbook: null,
      trades: [],
      funding: [],
      volumes: {
        superLarge: 0,
        large: 0,
        medium: 0,
        small: 0
      }
    };

    // 3个月的数据存储配置
    const THREE_MONTHS = 90 * 24 * 60 * 60 * 1000; // 90天的毫秒数
    
    this.maxAge = THREE_MONTHS;
    this.maxItems = {
      klines: {
        '1m': 129600,   // 90天的1分钟线
        '15m': 8640,    // 90天的15分钟线
        '1h': 2160,     // 90天的小时线
        '4h': 540,      // 90天的4小时线
        '1d': 90        // 90天的日线
      },
      trades: 1000000,   // 存储100万条交易记录
      funding: 2160,     // 90天的资金费率 (90 * 24)
    };

    // 定期清理过期数据
    setInterval(() => this.cleanOldData(), 60 * 60 * 1000); // 每小时清理一次
  }

  cleanOldData() {
    const now = Date.now();
    const cutoff = now - this.maxAge;

    // 清理K线数据
    Object.keys(this.data.klines).forEach(interval => {
      this.data.klines[interval] = this.data.klines[interval].filter(k => k.timestamp > cutoff);
    });

    // 清理交易数据
    this.data.trades = this.data.trades.filter(t => t.timestamp > cutoff);

    // 清理资金费率数据
    this.data.funding = this.data.funding.filter(f => f.timestamp > cutoff);

    // 重置交易量统计（每天凌晨）
    const today = new Date();
    if (today.getHours() === 0 && today.getMinutes() === 0) {
      this.data.volumes = {
        superLarge: 0,
        large: 0,
        medium: 0,
        small: 0
      };
    }

    console.log(`Data cleaned at ${new Date().toISOString()}`);
    console.log(`Remaining items: `, {
      klines: Object.values(this.data.klines).reduce((acc, klines) => acc + klines.length, 0),
      trades: this.data.trades.length,
      funding: this.data.funding.length
    });
  }

  store(processedData) {
    const { type } = processedData;
    
    switch(type) {
      case 'kline':
        this.storeKline(processedData);
        break;
      case 'orderbook':
        this.data.orderbook = processedData;
        break;
      case 'trade':
        this.storeTrade(processedData);
        break;
      case 'funding':
        this.storeFunding(processedData);
        break;
    }
  }

  storeKline(kline) {
    const interval = kline.interval;
    if (!this.data.klines[interval]) {
      this.data.klines[interval] = [];
    }
    
    this.data.klines[interval].push(kline);
    if (this.data.klines[interval].length > this.maxItems.klines[interval]) {
      this.data.klines[interval].shift();
    }
  }

  storeTrade(trade) {
    this.data.trades.push(trade);
    if (this.data.trades.length > this.maxItems.trades) {
      this.data.trades.shift();
    }
    this.updateVolumeClassification(trade);
  }

  storeFunding(funding) {
    this.data.funding.push(funding);
    if (this.data.funding.length > this.maxItems.funding) {
      this.data.funding.shift();
    }
  }

  updateVolumeClassification(trade) {
    const value = trade.price * trade.quantity;
    if (value > 100000) {
      this.data.volumes.superLarge += trade.quantity;
    } else if (value > 10000) {
      this.data.volumes.large += trade.quantity;
    } else if (value > 1000) {
      this.data.volumes.medium += trade.quantity;
    } else {
      this.data.volumes.small += trade.quantity;
    }
  }

  getData(type, timeframe, interval) {
    if (type === 'klines' && interval) {
      const klines = this.data.klines[interval] || [];
      if (!timeframe) return klines;
      
      const now = Date.now();
      const cutoff = now - this.parseTimeframe(timeframe);
      return klines.filter(k => k.timestamp > cutoff);
    }

    if (!timeframe) {
      return this.data[type];
    }

    const now = Date.now();
    const cutoff = now - this.parseTimeframe(timeframe);
    
    switch(type) {
      case 'trades':
        return this.data.trades.filter(t => t.timestamp > cutoff);
      case 'funding':
        return this.data.funding.filter(f => f.timestamp > cutoff);
      default:
        return this.data[type];
    }
  }

  parseTimeframe(timeframe) {
    const value = parseInt(timeframe.slice(0, -1));
    const unit = timeframe.slice(-1).toLowerCase();
    
    switch(unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      case 'm': return value * 30 * 24 * 60 * 60 * 1000;
      default: return this.maxAge;
    }
  }

  getLatestData() {
    return {
      orderbook: this.data.orderbook,
      lastPrice: this.data.trades[this.data.trades.length - 1]?.price,
      volumes: this.data.volumes,
      fundingRate: this.data.funding[this.data.funding.length - 1]
    };
  }
}

module.exports = new StorageService(); 