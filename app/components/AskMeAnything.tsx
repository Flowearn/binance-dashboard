'use client';

import { useState } from 'react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AskMeAnything() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now(),
        text: 'This is a simulated response. In production, this would be replaced with actual AI responses.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Ask Me Anything</h2>
      <div className="chat-container bg-gray-50 rounded-lg p-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${message.isUser ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
                message.isUser ? 'bg-blue-500 text-white' : 'bg-white'
              }`}
            >
              <p>{message.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="inline-block bg-white rounded-lg px-4 py-2">
              <p className="animate-pulse">AI is thinking...</p>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="focus:outline-none"
        />
        <button type="submit">
          Send
        </button>
      </form>
    </div>
  );
} 