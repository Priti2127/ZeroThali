import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Leftover, Order, OrderResponse } from '../types';

export const useLeftovers = () => {
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeftovers();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leftovers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leftovers',
        },
        () => {
          fetchLeftovers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeftovers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leftovers')
        .select(`
          *,
          meal:meals(*)
        `)
        .eq('status', 'available')
        .gt('available_plates', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeftovers(data || []);
    } catch (err) {
      console.error('Error fetching leftovers:', err);
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async (
    leftoverId: string,
    receiverId: string,
    quantity: number
  ): Promise<OrderResponse> => {
    try {
      const { data, error } = await supabase.rpc('place_leftover_order', {
        p_leftover_id: leftoverId,
        p_receiver_id: receiverId,
        p_quantity: quantity,
      });

      if (error) throw error;

      // Refresh leftovers after order
      await fetchLeftovers();

      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to place order',
      };
    }
  };

  return { leftovers, loading, placeOrder, refetch: fetchLeftovers };
};

export const useOrders = (userId: string, role: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, role]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          leftover:leftovers(
            *,
            meal:meals(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (role === 'receiver') {
        query = query.eq('receiver_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (orderId: string, paymentId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          payment_id: paymentId,
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      await fetchOrders();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const collectOrder = async (pickupCode: string, managerId: string) => {
    try {
      const { data, error } = await supabase.rpc('collect_order', {
        p_pickup_code: pickupCode,
        p_manager_id: managerId,
      });

      if (error) throw error;

      await fetchOrders();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { orders, loading, markAsPaid, collectOrder, refetch: fetchOrders };
};
