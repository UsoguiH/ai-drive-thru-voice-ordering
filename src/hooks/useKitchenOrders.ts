'use client';

import { useEffect, useState, useCallback } from 'react';

export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'completed';

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

export const useKitchenOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/kds/orders?includeCompleted=false');

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();

      console.log('📋 Fetched orders:', data.orders);
      setOrders(data.orders || []);

    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatus = useCallback(async (orderId: number, status: OrderStatus, kitchenNote?: string) => {
    try {
      console.log(`🔄 Updating order ${orderId} to status: ${status}`);

      // Clear any existing errors before making the request
      setError(null);

      const response = await fetch(`/api/kds/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, kitchenNote })
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      console.log(`✅ Order ${orderId} updated to ${status}`);

      // Refetch orders after update to get latest data
      await fetchOrders();

      return true;
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
      return false;
    }
  }, [fetchOrders]);

  // Auto-refresh every 3 seconds for real-time updates
  useEffect(() => {
    console.log('🔄 Setting up kitchen orders polling...');
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);

    return () => {
      console.log('🛑 Cleaning up kitchen orders polling');
      clearInterval(interval);
    };
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    updateOrderStatus
  };
};