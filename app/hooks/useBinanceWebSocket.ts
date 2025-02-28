import { useState, useEffect, useCallback } from 'react';

interface UseBinanceWebSocketProps {
  symbol: string;
  stream: 'trade' | 'kline' | 'depth';
  interval?: string;
}

export function useBinanceWebSocket<T>({ symbol, stream, interval = '1m' }: UseBinanceWebSocketProps) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const getWebSocketUrl = useCallback(() => {
    const baseUrl = 'wss://stream.binance.com:9443/ws';
    switch (stream) {
      case 'trade':
        return `${baseUrl}/${symbol.toLowerCase()}@trade`;
      case 'kline':
        return `${baseUrl}/${symbol.toLowerCase()}@kline_${interval}`;
      case 'depth':
        return `${baseUrl}/${symbol.toLowerCase()}@depth`;
      default:
        return baseUrl;
    }
  }, [symbol, stream, interval]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;

    const connect = () => {
      try {
        ws = new WebSocket(getWebSocketUrl());

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
            setError(null);
          } catch (err) {
            console.error('Error parsing WebSocket data:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError(new Error('WebSocket connection error'));
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++;
              connect();
            }, RECONNECT_DELAY);
          } else {
            setError(new Error('Max reconnection attempts reached'));
          }
        };
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        setError(err instanceof Error ? err : new Error('Failed to create WebSocket'));
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [getWebSocketUrl]);

  return { data, error, isConnected };
} 