import { useEffect, useRef, useState } from 'react';

interface WebSocketConfig {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

const API_CONFIG = {
  WS_URL: 'wss://fstream.binance.com/ws',
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5
};

export function useWebSocketManager(endpoint: string, config: WebSocketConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    try {
      const wsEndpoint = `${API_CONFIG.WS_URL}/${endpoint}`;
      const ws = new WebSocket(wsEndpoint);

      ws.onopen = () => {
        console.log(`Connected to ${endpoint}`);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        config.onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          config.onMessage?.(data);
        } catch (error) {
          console.error('Error processing message:', error);
          setError('Error processing market data');
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket Error (${endpoint}):`, error);
        setError('WebSocket connection error');
        config.onError?.(error);
      };

      ws.onclose = () => {
        console.log(`WebSocket Closed (${endpoint})`);
        setIsConnected(false);
        config.onClose?.();

        // Attempt to reconnect
        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current <= API_CONFIG.MAX_RECONNECT_ATTEMPTS) {
          console.log(`Reconnecting... Attempt ${reconnectAttemptsRef.current}`);
          reconnectTimeoutRef.current = setTimeout(connect, API_CONFIG.RECONNECT_INTERVAL);
        } else {
          setError('Maximum reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setError('Failed to create WebSocket connection');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [endpoint]);

  return {
    isConnected,
    error
  };
} 