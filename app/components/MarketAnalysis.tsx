'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface MarketData {
  price: string;
  volume24h: string;
  priceChange24h: string;
  fundingRate: string;
}

const MarketAnalysis: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 获取市场数据
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT');
        const data = await response.json();
        
        // 获取资金费率
        const fundingResponse = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT');
        const fundingData = await fundingResponse.json();

        setMarketData({
          price: parseFloat(data.lastPrice).toFixed(2),
          volume24h: parseFloat(data.volume).toFixed(2),
          priceChange24h: parseFloat(data.priceChangePercent).toFixed(2),
          fundingRate: (parseFloat(fundingData.lastFundingRate) * 100).toFixed(4)
        });
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 构建发送给模型的上下文
      const context = marketData ? `Current market data:
- BTC Price: $${marketData.price}
- 24h Volume: ${marketData.volume24h} BTC
- 24h Price Change: ${marketData.priceChange24h}%
- Funding Rate: ${marketData.fundingRate}%

User question: ${input}` : input;

      const response = await fetch('https://your-aws-endpoint.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a cryptocurrency market analyst assistant. Analyze the provided market data and answer questions about market conditions, trends, and potential strategies.'
            },
            {
              role: 'user',
              content: context
            }
          ]
        })
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again later.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <h2 className="text-xl font-bold mb-4">Market Analysis Assistant</h2>
      
      {/* 市场数据显示 */}
      {marketData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">BTC Price</div>
            <div>${marketData.price}</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">24h Volume</div>
            <div>{marketData.volume24h} BTC</div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">24h Change</div>
            <div className={marketData.priceChange24h.startsWith('-') ? 'text-red-500' : 'text-green-500'}>
              {marketData.priceChange24h}%
            </div>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <div className="font-semibold">Funding Rate</div>
            <div className={marketData.fundingRate.startsWith('-') ? 'text-red-500' : 'text-green-500'}>
              {marketData.fundingRate}%
            </div>
          </div>
        </div>
      )}

      {/* 聊天记录 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded p-4"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
              <div className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-center text-gray-500">
            Thinking...
          </div>
        )}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about market conditions..."
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`px-6 py-2 rounded font-semibold ${
            isLoading || !input.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default MarketAnalysis; 