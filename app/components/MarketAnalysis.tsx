'use client';

import React, { useState, useRef, useEffect } from 'react';
import '../styles/market-analysis.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MarketData {
  price: string;
  volume24h: string;
  priceChange24h: string;
  fundingRate: string;
}

const MarketAnalysis: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！我是您的市场分析助手。我可以帮您分析当前市场状况，解答您的问题。',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // TODO: 这里将来会调用 AWS 上的 deepseek 模型
    // 目前先模拟一个响应
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我目前还在开发中。很快我就能为您提供专业的市场分析服务。',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="market-analysis-chat flex flex-col h-[500px]">
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`chat-message max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您的问题..."
            className="chat-input flex-1 p-2 rounded-lg focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="send-button px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </form>
    </div>
  );
};

export default MarketAnalysis; 