'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'completed';
export type ClientType = 'kitchen' | 'customer';

export interface Order {
  id: number;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  orderNumber: number;
  estimatedTime?: number;
  startedAt?: string;
  completedAt?: string;
  kitchenNote?: string;
  priority: number;
  language: string;
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  name: string;
  nameAr?: string;
  quantity: number;
  price: number;
  customizations?: string[];
}

export interface WebSocketMessage {
  type: 'connection' | 'currentOrders' | 'newOrder' | 'orderUpdate' | 'ping' | 'pong' | 'error';
  message?: string;
  orders?: Order[];
  order?: Order;
  timestamp: string;
}

interface UseWebSocketOptions {
  clientType: ClientType;
  orderId?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export const useWebSocket = ({
  clientType,
  orderId,
  autoReconnect = true,
  reconnectInterval = 3000
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}/ws`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        setError(null);

        // Identify the client
        wsRef.current?.send(JSON.stringify({
          type: 'identify',
          clientType,
          orderId: orderId || undefined
        }));

        // Start ping interval
        startPingInterval();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          console.log('📨 WebSocket message received:', message);

          switch (message.type) {
            case 'currentOrders':
              if (message.orders) {
                setOrders(message.orders);
              }
              break;
            case 'newOrder':
              if (message.order) {
                setOrders(prev => [...prev, message.order!]);
              }
              break;
            case 'orderUpdate':
              if (message.order) {
                setOrders(prev => {
                  const index = prev.findIndex(order => order.id === message.order!.id);
                  if (index === -1) {
                    return [...prev, message.order!];
                  }
                  const newOrders = [...prev];
                  newOrders[index] = message.order!;
                  // Remove completed orders after 5 seconds
                  if (message.order!.status === 'completed') {
                    setTimeout(() => {
                      setOrders(prev => prev.filter(order => order.id !== message.order!.id));
                    }, 5000);
                  }
                  return newOrders;
                });
              }
              break;
            case 'pong':
              // Ping response received
              break;
            case 'error':
              setError(message.message || 'Unknown WebSocket error');
              break;
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        stopPingInterval();

        // Auto-reconnect if enabled
        if (autoReconnect && event.code !== 1000) {
          console.log(`🔄 Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection error');
      };
    } catch (err) {
      console.error('❌ Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [clientType, orderId, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopPingInterval();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const updateOrderStatus = useCallback((orderId: number, status: OrderStatus, kitchenNote?: string) => {
    return sendMessage({
      type: 'orderUpdate',
      orderId: orderId.toString(),
      status,
      kitchenNote
    });
  }, [sendMessage]);

  const notifyNewOrder = useCallback((order: Order) => {
    return sendMessage({
      type: 'newOrder',
      order
    });
  }, [sendMessage]);

  // Ping interval to keep connection alive
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPingInterval = () => {
    stopPingInterval();
    pingIntervalRef.current = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds
  };

  const stopPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopPingInterval();
    };
  }, []);

  return {
    isConnected,
    orders,
    lastMessage,
    error,
    updateOrderStatus,
    notifyNewOrder,
    sendMessage,
    connect,
    disconnect
  };
};