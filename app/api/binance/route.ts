import { NextResponse } from 'next/server';

// 定义基础URL
const BINANCE_API = {
  spot: 'https://api.binance.com/api/v3',
  futures: 'https://fapi.binance.com/fapi/v1',
};

// 数据格式化函数
const formatData = (data: any, endpoint: string) => {
  switch (endpoint) {
    case 'kline':
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
      return {
        lastUpdateId: data.lastUpdateId,
        bids: data.bids.map(([price, quantity]: string[]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
        asks: data.asks.map(([price, quantity]: string[]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
      };

    case 'trades':
      return data.map((trade: any) => ({
        id: trade.id,
        price: parseFloat(trade.price),
        quantity: parseFloat(trade.qty),
        time: trade.time,
        isBuyerMaker: trade.isBuyerMaker,
        isBestMatch: trade.isBestMatch,
      }));

    case 'ticker24h':
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
      return {
        symbol: data.symbol,
        fundingRate: parseFloat(data.fundingRate),
        fundingTime: data.fundingTime,
        markPrice: parseFloat(data.markPrice),
      };

    default:
      return data;
  }
};

// 构建API URL
const getApiUrl = (endpoint: string, params: URLSearchParams) => {
  const baseUrl = endpoint === 'fundingRate' ? BINANCE_API.futures : BINANCE_API.spot;
  
  // 确保K线图请求有默认interval
  if (endpoint === 'kline' && !params.get('interval')) {
    params.set('interval', '1d');
  }
  
  switch (endpoint) {
    case 'kline':
      return `${baseUrl}/klines?${params.toString()}`;
    case 'orderbook':
      return `${baseUrl}/depth?${params.toString()}`;
    case 'trades':
      return `${baseUrl}/trades?${params.toString()}`;
    case 'ticker24h':
      return `${baseUrl}/ticker/24hr?${params.toString()}`;
    case 'fundingRate':
      return `${baseUrl}/fundingRate?${params.toString()}`;
    default:
      throw new Error('Invalid endpoint');
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    const apiUrl = getApiUrl(endpoint, searchParams);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    const data = await response.json();
    const formattedData = formatData(data, endpoint);

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 