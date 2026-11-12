import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { Bell, ShoppingBag, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import type { Leftover, Order } from '../types';

interface LeftoverWithMeal extends Leftover {
  meals?: { date: string; type: string; menu?: any[] };
}
interface OrderWithLeftover extends Order {
  leftovers?: LeftoverWithMeal;
}

const ReceiverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [available, setAvailable] = useState<LeftoverWithMeal[]>([]);
  const [myOrders, setMyOrders] = useState<OrderWithLeftover[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<Record<string, number>>({});

  const fetchAvailable = useCallback(async () => {
    const { data } = await supabase
      .from('leftovers')
      .select('*, meals(date, type, menu)')
      .eq('status', 'available')
      .order('created_at', { ascending: false });
    setAvailable(data || []);
  }, []);

  const fetchMyOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*, leftovers(*, meals(date, type, menu))')
      .eq('receiver_id', user.id)
      .in('status', ['pending', 'paid'])
      .order('created_at', { ascending: false });
    setMyOrders(data || []);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAvailable(), fetchMyOrders()]).finally(() => setLoading(false));

    // Realtime subscription
    const channel = supabase
      .channel('leftovers_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leftovers' }, () => {
        fetchAvailable();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchMyOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAvailable, fetchMyOrders]);

  const handleOrder = async (leftoverId: string) => {
    if (!user) return;
    const qty = quantity[leftoverId] || 1;
    if (qty < 1 || qty > 2) return toast.error('Max 2 plates per order');

    if (user.weekly_order_count >= 3) {
      return toast.error('Weekly limit reached (max 3 orders per week)');
    }

    setOrderLoading(leftoverId);
    const { data, error } = await supabase.rpc('place_leftover_order', {
      p_leftover_id: leftoverId,
      p_receiver_id: user.id,
      p_quantity: qty,
    });
    setOrderLoading(null);

    if (error || !data?.success) {
      toast.error(data?.error || error?.message || 'Order failed');
    } else {
      toast.success(`🎉 Order placed! Pickup code: ${data.pickup_code}`);
      await fetchAvailable();
      await fetchMyOrders();
    }
  };

  const getMenuLabel = (leftover: LeftoverWithMeal) => {
    if (leftover.meals?.menu && leftover.meals.menu.length > 0) {
      return leftover.meals.menu.map((m: any) => m.dish).join(', ');
    }
    return leftover.meals?.type ? `${leftover.meals.type} meal` : 'Meal';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light dark:bg-dark-bg flex items-center justify-center">
        <div className="text-primary dark:text-saffron animate-pulse">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">
            Surplus Food Alerts 🍱
          </h1>
          <p className="text-gray-500 dark:text-gray-400">First come, first served</p>
        </div>

        {/* Important disclaimer */}
        <div className="bg-saffron/10 dark:bg-saffron/5 border border-saffron/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ⚠️ <strong>Surplus food only</strong> — not guaranteed. Max 2 plates/order, 3 orders/week.
            Collect within 30 minutes. Food safety: cooked within 4 hours.
          </p>
        </div>

        {/* My active orders */}
        {myOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              My Active Orders
            </h2>
            <div className="space-y-3">
              {myOrders.map((order) => {
                const expiresAt = new Date(order.expires_at);
                const isExpired = expiresAt < new Date();
                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-dark-surface rounded-2xl p-4 border-2 border-green-300 dark:border-green-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl font-mono font-bold text-primary dark:text-saffron">
                          {order.pickup_code}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pickup Code</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {order.quantity} plate(s) · ₹{order.total_price}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-saffron/10 text-saffron'
                        }`}>
                          {order.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                        </div>
                        <div className={`text-xs mt-1 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                          {isExpired ? '⚠️ Expired' : `Pickup by ${format(expiresAt, 'h:mm a')}`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-xl">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Show this code to the mess manager. Collect within 30 minutes!
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available leftovers */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          <Bell size={18} className="inline mr-2 text-saffron" />
          Available Now
        </h2>

        {available.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="text-5xl mb-4">🍽️</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No surplus right now
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Alerts appear only when genuine surplus exists. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {available.map((leftover) => (
              <div
                key={leftover.id}
                className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {getMenuLabel(leftover)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {leftover.meals?.date && format(new Date(leftover.meals.date), 'd MMM')} ·{' '}
                        {leftover.meals?.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary dark:text-saffron">
                        {leftover.available_plates}
                      </div>
                      <div className="text-xs text-gray-500">plates left</div>
                    </div>
                  </div>

                  {/* Urgency bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Availability</span>
                      <span>{leftover.available_plates}/{leftover.quantity_plates}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
                        style={{ width: `${(leftover.available_plates / leftover.quantity_plates) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary dark:text-saffron">
                        ₹{leftover.price_per_plate}/plate
                      </span>
                      <span className="text-xs text-gray-500">· max 2 plates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setQuantity((prev) => ({ ...prev, [leftover.id]: Math.max(1, (prev[leftover.id] || 1) - 1) }))}
                          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          -
                        </button>
                        <span className="px-3 py-2 font-semibold text-sm">
                          {quantity[leftover.id] || 1}
                        </span>
                        <button
                          onClick={() => setQuantity((prev) => ({ ...prev, [leftover.id]: Math.min(2, (prev[leftover.id] || 1) + 1) }))}
                          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleOrder(leftover.id)}
                        disabled={orderLoading === leftover.id || leftover.available_plates === 0}
                        className="px-4 py-2 bg-saffron hover:bg-saffron/90 text-white rounded-xl font-semibold text-sm transition disabled:opacity-60"
                      >
                        {orderLoading === leftover.id ? 'Ordering...' : 'Order Now'}
                      </button>
                    </div>
                  </div>
                </div>

                {leftover.expires_at && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-brick">
                      <Clock size={12} className="inline mr-1" />
                      Expires {formatDistanceToNow(new Date(leftover.expires_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiverDashboard;
