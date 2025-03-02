import { NextResponse } from 'next/server';

// 定义基础URL
const BINANCE_API = {
  spot: {
    primary: 'https://api.binance.com/api/v3',
    backup1: 'https://api1.binance.com/api/v3',
    backup2: 'https://api2.binance.com/api/v3'
  },
  futures: {
    primary: 'https://fapi.binance.com/fapi/v1',
    backup1: 'https://fapi1.binance.com/fapi/v1',
    backup2: 'https://fapi2.binance.com/fapi/v1'
  }
};

// 数据格式化函数
const formatData = (endpoint: string, data: any) => {
  if (!data) {
    console.error(`[${new Date().toISOString()}] No data received from Binance API for endpoint: ${endpoint}`);
    return null;
  }

  // Normalize the endpoint for matching
  const normalizedEndpoint = decodeURIComponent(endpoint).replace('/', '');
  console.log(`[${new Date().toISOString()}] Formatting data for normalized endpoint: ${normalizedEndpoint}`);

  try {
    switch (normalizedEndpoint) {
      case 'kline':
        if (!Array.isArray(data)) {
          console.error('Invalid kline data format:', data);
          throw new Error('Invalid kline data format');
        }
        return data.map((item: any[]) => ({
          time: item[0],
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
          closeTime: item[6],
          quoteVolume: parseFloat(item[7]),
          trades: item[8],
          buyBaseVolume: parseFloat(item[9]),
          buyQuoteVolume: parseFloat(item[10]),
        }));

      case 'orderbook':
      case 'depth':
        if (!data || !Array.isArray(data.bids) || !Array.isArray(data.asks)) {
          console.error('Invalid orderbook data:', data);
          throw new Error('Invalid orderbook data format');
        }
        return {
          lastUpdateId: data.lastUpdateId,
          bids: data.bids.slice(0, 10).map((bid: string[]) => [parseFloat(bid[0]), parseFloat(bid[1])]),
          asks: data.asks.slice(0, 10).map((ask: string[]) => [parseFloat(ask[0]), parseFloat(ask[1])]),
          timestamp: Date.now()
        };

      case 'trades':
        if (!Array.isArray(data)) {
          console.error('Invalid trades data:', data);
          throw new Error('Invalid trades data format');
        }
        return data.map((trade: any) => ({
          id: trade.id,
          price: parseFloat(trade.price),
          quantity: parseFloat(trade.qty),
          time: trade.time,
          isBuyerMaker: trade.isBuyerMaker,
          isBestMatch: trade.isBestMatch,
          type: trade.isBuyerMaker ? 'sell' : 'buy'
        }));

      case 'ticker24hr':
      case 'ticker/24hr':
        if (!data || typeof data !== 'object') {
          console.error('Invalid ticker data:', data);
          throw new Error('Invalid ticker data format');
        }
        return {
          symbol: data.symbol,
          priceChange: parseFloat(data.priceChange),
          priceChangePercent: parseFloat(data.priceChangePercent),
          lastPrice: parseFloat(data.lastPrice),
          highPrice: parseFloat(data.highPrice),
          lowPrice: parseFloat(data.lowPrice),
          volume: parseFloat(data.volume),
          quoteVolume: parseFloat(data.quoteVolume),
        };

      case 'fundingRate':
        if (!data || typeof data !== 'object') {
          console.error('Invalid funding rate data:', data);
          throw new Error('Invalid funding rate data format');
        }
        return {
          symbol: data.symbol,
          fundingRate: parseFloat(data.fundingRate),
          fundingTime: data.fundingTime,
          markPrice: parseFloat(data.markPrice),
        };

      default:
        console.error(`[${new Date().toISOString()}] Unknown endpoint: ${normalizedEndpoint}`);
        throw new Error(`Unknown endpoint: ${normalizedEndpoint}`);
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error formatting ${endpoint} data:`, error);
    console.error('Raw data:', JSON.stringify(data, null, 2));
    throw error;
  }
};

// 添加缓存对象，用于存储生成的K线数据
let klineDataCache: { [key: string]: any[] } = {};
let lastUpdateTime: { [key: string]: number } = {};

const generateMockData = (endpoint: string, symbol: string) => {
  console.log(`[${new Date().toISOString()}] Generating mock data for ${endpoint} and symbol ${symbol}`);
  
  // 更新BTC价格到当前实际市场价格范围
  const currentPrice = symbol.includes('BTC') ? 86000 + Math.random() * 1000 : 3000 + Math.random() * 100;
  
  switch (endpoint) {
    case 'kline':
    case 'klines':
      // 检查缓存中是否已有数据，以及上次更新时间是否超过10分钟
      const cacheKey = `${endpoint}_${symbol}`;
      const now = Date.now();
      const shouldRefreshCache = !klineDataCache[cacheKey] || 
                                !lastUpdateTime[cacheKey] || 
                                (now - lastUpdateTime[cacheKey]) > 600000; // 10分钟更新一次完整数据
      
      // 如果缓存有效，只更新最后一个K线
      if (!shouldRefreshCache) {
        const cachedData = [...klineDataCache[cacheKey]];
        const lastItem = cachedData[cachedData.length - 1];
        
        // 更新最后一个K线的收盘价和成交量
        const volatility = lastItem.close * 0.001; // 小波动
        const priceChange = (Math.random() - 0.5) * 2 * volatility;
        lastItem.close = Math.max(lastItem.close + priceChange, lastItem.close * 0.999);
        lastItem.high = Math.max(lastItem.high, lastItem.close);
        lastItem.low = Math.min(lastItem.low, lastItem.close);
        lastItem.volume += Math.random() * 5;
        
        console.log(`[${new Date().toISOString()}] Updated last K-line data for ${symbol}`);
        return cachedData;
      }
      
      // 需要生成全新的数据
      const klines = [];
      const klineNow = Date.now();
      
      // 设置初始价格
      let lastClose = currentPrice;
      const volatility = currentPrice * 0.005; // 0.5% 波动率
      
      for (let i = 0; i < 100; i++) {
        // 时间是从过去到现在，每个间隔1小时
        const time = klineNow - (99 - i) * 3600000; // 1小时 = 3600000毫秒
        
        // 开盘价是上一个蜡烛的收盘价
        const open = lastClose;
        
        // 收盘价在开盘价的基础上有一定波动
        const priceChange = (Math.random() - 0.5) * 2 * volatility;
        const close = Math.max(open + priceChange, open * 0.99); // 确保价格不会下跌太多
        
        // 最高价和最低价基于开盘价和收盘价
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        
        // 成交量也应该有一定的连续性
        const volume = 10 + Math.random() * 100;
        
        klines.push({
          time,
          open,
          high,
          low,
          close,
          volume,
          closeTime: time + 3600000, // 收盘时间是开盘时间+1小时
          quoteVolume: volume * close,
          trades: Math.floor(10 + Math.random() * 100),
          buyBaseVolume: volume * 0.6,
          buyQuoteVolume: volume * close * 0.6
        });
        
        // 更新lastClose为当前蜡烛的收盘价
        lastClose = close;
      }
      
      // 更新缓存
      klineDataCache[cacheKey] = klines;
      lastUpdateTime[cacheKey] = now;
      
      console.log(`[${new Date().toISOString()}] Generated new K-line data for ${symbol}`);
      return klines;
      
    case 'orderbook':
    case 'depth':
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
        lastUpdateId: Date.now(),
        bids,
        asks,
        timestamp: Date.now()
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
          price,
          quantity: qty,
          time: tradeTime - i * 1000,
          isBuyerMaker,
          isBestMatch: true,
          type: isBuyerMaker ? 'sell' : 'buy'
        });
      }
      return trades;
      
    case 'ticker24hr':
    case 'ticker/24hr':
      return {
        symbol,
        priceChange: -100 + Math.random() * 200,
        priceChangePercent: -1 + Math.random() * 2,
        lastPrice: currentPrice,
        highPrice: currentPrice + 100,
        lowPrice: currentPrice - 100,
        volume: 1000 + Math.random() * 5000,
        quoteVolume: (1000 + Math.random() * 5000) * currentPrice,
      };
      
    case 'fundingRate':
      return [
        {
          symbol,
          fundingRate: (-0.001 + Math.random() * 0.002).toString(),
          fundingTime: Date.now() + 8 * 3600000,
          markPrice: currentPrice.toString()
        }
      ];
      
    default:
      throw new Error(`Unknown endpoint for mock data: ${endpoint}`);
  }
};

// 修改fetchWithFallback函数，检测地理位置限制错误
async function fetchWithFallback(urls: string[], options: RequestInit = {}) {
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;
  let lastResponseText: string | null = null;
  let isGeoRestricted = false;

  for (const url of urls) {
    try {
      console.log(`[${new Date().toISOString()}] Attempting to fetch from: ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          ...options.headers,
        }
      });

      clearTimeout(timeout);
      lastResponse = response;
      lastResponseText = await response.text();

      if (!response.ok) {
        console.error(`[${new Date().toISOString()}] HTTP error from ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          body: lastResponseText
        });
        
        // 检查是否是地理位置限制错误
        try {
          const errorData = JSON.parse(lastResponseText);
          if (
            errorData.code === 0 && 
            errorData.msg && 
            (errorData.msg.includes('restricted location') || 
             errorData.msg.includes('Service unavailable from a restricted location'))
          ) {
            console.log(`[${new Date().toISOString()}] Detected geo-restriction from Binance API`);
            isGeoRestricted = true;
            break; // 如果检测到地理位置限制，立即停止尝试其他URL
          }
        } catch (e) {
          // 解析错误响应失败，继续尝试下一个URL
        }
        
        continue;
      }

      try {
        const data = JSON.parse(lastResponseText);
        console.log(`[${new Date().toISOString()}] Successfully fetched from: ${url}`);
        return data;
      } catch (parseError) {
        console.error(`[${new Date().toISOString()}] Error parsing JSON from ${url}:`, parseError);
        console.error('Response text:', lastResponseText);
        throw new Error(`Invalid JSON response from ${url}`);
      }
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Network error for ${url}:`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (error.name === 'AbortError') {
        console.log(`[${new Date().toISOString()}] Request timeout for ${url}`);
      }
    }
  }

  // 如果检测到地理位置限制，抛出特定错误
  if (isGeoRestricted) {
    throw new Error('GEO_RESTRICTED');
  }

  // 如果所有 URL 都失败了，返回详细的错误信息
  const errorDetails = {
    lastResponse: lastResponse ? {
      status: lastResponse.status,
      statusText: lastResponse.statusText,
      headers: Object.fromEntries(lastResponse.headers.entries()),
      body: lastResponseText
    } : null,
    lastError: lastError ? {
      message: lastError.message,
      stack: lastError.stack
    } : null,
    timestamp: new Date().toISOString()
  };

  console.error('[API Error Details]', JSON.stringify(errorDetails, null, 2));
  throw new Error(`All API endpoints failed. Details: ${JSON.stringify(errorDetails)}`);
}

// 构建API URL
const getApiUrls = (endpoint: string, params: URLSearchParams): string[] => {
  const isSpot = endpoint !== 'fundingRate';
  const apis = isSpot ? BINANCE_API.spot : BINANCE_API.futures;
  
  const queryParams = new URLSearchParams(params);
  queryParams.delete('endpoint');
  
  const symbol = queryParams.get('symbol');
  if (!symbol) {
    throw new Error('Symbol parameter is required');
  }
  
  const formattedSymbol = symbol.toUpperCase();
  
  // Normalize the endpoint by removing any forward slashes and decoding
  const normalizedEndpoint = decodeURIComponent(endpoint).replace('/', '');
  console.log(`[${new Date().toISOString()}] Normalized endpoint: ${normalizedEndpoint} from original: ${endpoint}`);
  
  let path: string;
  switch (normalizedEndpoint) {
    case 'kline':
      const interval = queryParams.get('interval') || '1d';
      const limit = queryParams.get('limit') || '500';
      path = `/klines?symbol=${formattedSymbol}&interval=${interval}&limit=${limit}`;
      break;
    case 'orderbook':
    case 'depth':
      path = `/depth?symbol=${formattedSymbol}&limit=10`;
      break;
    case 'trades':
      path = `/trades?symbol=${formattedSymbol}&limit=50`;
      break;
    case 'ticker24hr':
    case 'ticker/24hr':
      path = `/ticker/24hr?symbol=${formattedSymbol}`;
      break;
    case 'fundingRate':
      path = `/premiumIndex?symbol=${formattedSymbol}`;
      break;
    default:
      console.error(`[${new Date().toISOString()}] Invalid endpoint requested: ${normalizedEndpoint}`);
      throw new Error(`Invalid endpoint: ${normalizedEndpoint}`);
  }

  const urls = [apis.primary, apis.backup1, apis.backup2].map(baseUrl => `${baseUrl}${path}`);
  console.log(`[${new Date().toISOString()}] Generated URLs for ${normalizedEndpoint}:`, urls);
  return urls;
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const symbol = searchParams.get('symbol');
    
    console.log(`[${new Date().toISOString()}] Request params:`, {
      endpoint,
      symbol,
      interval: searchParams.get('interval'),
      limit: searchParams.get('limit'),
      allParams: Object.fromEntries(searchParams.entries()),
      headers: Object.fromEntries(request.headers)
    });
    
    if (!endpoint) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Missing endpoint parameter',
          code: 'MISSING_ENDPOINT'
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }

    if (!symbol) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Missing symbol parameter',
          code: 'MISSING_SYMBOL'
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        }
      );
    }

    // 设置一个标志，表示是否使用模拟数据
    let useMockData = false;
    let data;

    try {
      const apiUrls = getApiUrls(endpoint, searchParams);
      console.log(`[${new Date().toISOString()}] Trying API URLs for ${endpoint}:`, apiUrls);

      data = await fetchWithFallback(apiUrls, {
        cache: 'no-store'
      });
      
      console.log(`[${new Date().toISOString()}] ${endpoint} - Raw data:`, JSON.stringify(data).slice(0, 200) + '...');
    } catch (error) {
      // 检查是否是地理位置限制错误或其他API错误
      console.error(`[${new Date().toISOString()}] Error fetching from Binance API:`, error);
      useMockData = true;
    }

    // 如果需要使用模拟数据
    if (useMockData) {
      console.log(`[${new Date().toISOString()}] Using mock data for ${endpoint}`);
      data = generateMockData(endpoint, symbol);
      
      return new NextResponse(
        JSON.stringify(data),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-Mock-Data': 'true'
          }
        }
      );
    }
    
    // 处理实时API数据
    const formattedData = formatData(endpoint, data);
    console.log(`[${new Date().toISOString()}] ${endpoint} - Formatted data:`, JSON.stringify(formattedData).slice(0, 200) + '...');

    if (!formattedData) {
      throw new Error('Failed to format data');
    }

    return new NextResponse(
      JSON.stringify(formattedData),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] API route error:`, error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorResponse = {
      error: 'Failed to fetch from Binance API',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'API_ERROR',
      timestamp: new Date().toISOString()
    };
    
    console.error('[Error Response]', JSON.stringify(errorResponse, null, 2));
    
    return new NextResponse(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
} 