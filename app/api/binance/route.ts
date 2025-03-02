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

// 添加生成模拟数据的函数
const generateMockData = (endpoint: string, symbol: string) => {
  console.log(`[${new Date().toISOString()}] Generating mock data for ${endpoint} and symbol ${symbol}`);
  
  const currentPrice = symbol.includes('BTC') ? 85700 + Math.random() * 1000 : 3000 + Math.random() * 100;
  
  switch (endpoint) {
    case 'kline':
    case 'klines':
      const klines = [];
      const klineNow = Date.now();
      for (let i = 0; i < 100; i++) {
        const time = klineNow - (99 - i) * 60000;
        const open = currentPrice - 50 + Math.random() * 100;
        const close = open - 50 + Math.random() * 100;
        const high = Math.max(open, close) + Math.random() * 20;
        const low = Math.min(open, close) - Math.random() * 20;
        const volume = 10 + Math.random() * 100;
        
        klines.push({
          time,
          open,
          high,
          low,
          close,
          volume,
          closeTime: time + 60000,
          quoteVolume: volume * close,
          trades: Math.floor(10 + Math.random() * 100),
          buyBaseVolume: volume * 0.6,
          buyQuoteVolume: volume * close * 0.6
        });
      }
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

    try {
      const apiUrls = getApiUrls(endpoint, searchParams);
      console.log(`[${new Date().toISOString()}] Trying API URLs for ${endpoint}:`, apiUrls);

      const data = await fetchWithFallback(apiUrls, {
        cache: 'no-store'
      });
      
      console.log(`[${new Date().toISOString()}] ${endpoint} - Raw data:`, JSON.stringify(data).slice(0, 200) + '...');
      
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
      // 检查是否是地理位置限制错误
      if (error instanceof Error && error.message === 'GEO_RESTRICTED') {
        console.log(`[${new Date().toISOString()}] Using mock data due to geo-restriction`);
        const mockData = generateMockData(endpoint, symbol);
        
        return new NextResponse(
          JSON.stringify(mockData),
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
      
      // 其他错误继续抛出
      throw error;
    }
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