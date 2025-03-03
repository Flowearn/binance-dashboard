import { NextResponse } from 'next/server';

// CoinGecko API基础URL
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// 获取市场数据
async function getMarketData(coinId: string = 'bitcoin', vsCurrency: string = 'usd', days: string = '30') {
  try {
    const url = `${COINGECKO_API_URL}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}&interval=daily`;
    console.log(`[${new Date().toISOString()}] Fetching market data from CoinGecko: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching market data:`, error);
    throw error;
  }
}

// 将CoinGecko数据转换为K线格式
function convertToKlineFormat(marketData: any) {
  if (!marketData || !marketData.prices || !Array.isArray(marketData.prices)) {
    throw new Error('Invalid market data format');
  }
  
  // 确保数据按时间排序
  const sortedPrices = [...marketData.prices].sort((a, b) => a[0] - b[0]);
  const sortedVolumes = [...marketData.total_volumes].sort((a, b) => a[0] - b[0]);
  
  // 将价格和交易量数据合并为K线格式
  return sortedPrices.map((priceData, index) => {
    const timestamp = priceData[0]; // 时间戳（毫秒）
    const closePrice = priceData[1]; // 收盘价
    
    // 找到对应的交易量数据
    const volumeData = sortedVolumes.find(v => v[0] === timestamp) || [timestamp, 0];
    const volume = volumeData[1];
    
    // 如果有前一个数据点，使用它作为开盘价，否则使用当前收盘价
    const openPrice = index > 0 ? sortedPrices[index - 1][1] : closePrice;
    
    // 计算当天的最高价和最低价（这里简化处理，实际上CoinGecko不提供日内最高/最低价）
    // 在实际应用中，您可能需要获取更详细的数据
    const highPrice = Math.max(openPrice, closePrice) * 1.005; // 简化：假设最高价比开盘价和收盘价高0.5%
    const lowPrice = Math.min(openPrice, closePrice) * 0.995; // 简化：假设最低价比开盘价和收盘价低0.5%
    
    return {
      time: timestamp,
      open: openPrice.toString(),
      high: highPrice.toString(),
      low: lowPrice.toString(),
      close: closePrice.toString(),
      volume: volume.toString(),
      closeTime: timestamp + 86400000, // 假设是日K，收盘时间为开盘时间+1天
      quoteAssetVolume: (volume * closePrice).toString(),
      trades: Math.floor(volume / 10), // 简化：估算交易次数
      takerBuyBaseAssetVolume: (volume * 0.6).toString(), // 简化：假设60%是主动买入
      takerBuyQuoteAssetVolume: (volume * closePrice * 0.6).toString(),
      ignore: "0"
    };
  });
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coin') || 'bitcoin';
    const vsCurrency = searchParams.get('currency') || 'usd';
    const days = searchParams.get('days') || '30';
    const endpoint = searchParams.get('endpoint') || 'kline';
    
    console.log(`[${new Date().toISOString()}] CoinGecko API request:`, {
      coinId,
      vsCurrency,
      days,
      endpoint
    });
    
    if (endpoint !== 'kline') {
      return new NextResponse(
        JSON.stringify({
          error: 'Unsupported endpoint',
          message: 'Currently only kline endpoint is supported with CoinGecko API',
          code: 'UNSUPPORTED_ENDPOINT'
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
    
    // 获取市场数据
    const marketData = await getMarketData(coinId, vsCurrency, days);
    
    // 转换为K线格式
    const klineData = convertToKlineFormat(marketData);
    
    return new NextResponse(
      JSON.stringify(klineData),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-Data-Source': 'CoinGecko'
        }
      }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] CoinGecko API route error:`, error);
    
    const errorResponse = {
      error: 'Failed to fetch from CoinGecko API',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'COINGECKO_API_ERROR',
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