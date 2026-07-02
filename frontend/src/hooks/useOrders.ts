import { useState, useEffect, useCallback } from 'react';
import { ordersApi, type Order } from '@/lib/payments-api';

export function useOrders() {
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ordersApi.list();
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  return { orders, isLoading, refetch: fetchOrders };
}
