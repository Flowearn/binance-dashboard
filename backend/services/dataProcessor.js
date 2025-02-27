class DataProcessor {
  processData(type, data) {
    if (type.startsWith('kline')) {
      return this.processKlineData(data);
    }
    switch(type) {
      case 'depth20':
        return this.processOrderBookData(data);
      case 'aggTrade':
        return this.processTradeData(data);
      case 'markPrice':
        return this.processFundingRateData(data);
      default:
        return data;
    }
  }

  processKlineData(data) {
    const k = data.k;
    return {
      type: 'kline',
      interval: k.i,
      timestamp: k.t,
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
      volume: parseFloat(k.v),
      isClosed: k.x
    };
  }

  processOrderBookData(data) {
    return {
      type: 'orderbook',
      timestamp: Date.now(),
      asks: data.asks.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity)
      })),
      bids: data.bids.map(([price, quantity]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity)
      }))
    };
  }

  processTradeData(data) {
    return {
      type: 'trade',
      timestamp: data.T,
      price: parseFloat(data.p),
      quantity: parseFloat(data.q),
      isBuyerMaker: data.m
    };
  }

  processFundingRateData(data) {
    return {
      type: 'funding',
      timestamp: data.E,
      rate: parseFloat(data.r),
      markPrice: parseFloat(data.p)
    };
  }
}

module.exports = new DataProcessor(); 