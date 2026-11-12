import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import type { Order } from '../types';

interface OrderWithDetails extends Order {
  leftovers?: {
    meal_id: string;
    quantity_plates: number;
    price_per_plate: number;
    meals?: { date: string; type: string; menu?: any[] };
  };
}

const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*, leftovers(*, meals(date, type, menu))')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));

    const channel = supabase
      .channel('my_orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const activeOrders = orders.filter((o) => ['pending', 'paid'].includes(o.status));
  const historyOrders = orders.filter((o) => ['collected', 'expired', 'cancelled'].includes(o.status));
  const displayOrders = tab === 'active' ? activeOrders : historyOrders;

  const statusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'text-saffron', bg: 'bg-saffron/10', label: 'Awaiting Payment', icon: Clock };
      case 'paid': return { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Paid – Ready for Pickup', icon: CheckCircle };
      case 'collected': return { color: 'text-primary', bg: 'bg-primary/10', label: 'Collected ✓', icon: CheckCircle };
      case 'expired': return { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Expired', icon: XCircle };
      case 'cancelled': return { color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Cancelled', icon: XCircle };
      default: return { color: 'text-gray-500', bg: 'bg-gray-100', label: status, icon: Package };
    }
  };

  const getMenuLabel = (order: OrderWithDetails) => {
    const menu = order.leftovers?.meals?.menu;
    if (menu && menu.length > 0) return menu.map((m: any) => m.dish).join(', ');
    return order.leftovers?.meals?.type || 'Meal';
  };

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">My Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Weekly limit: {user?.weekly_order_count || 0}/3 orders used
          </p>
        </div>

        {/* Weekly limit bar */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Weekly orders</span>
            <span className="font-bold text-primary dark:text-saffron">
              {user?.weekly_order_count || 0} / 3
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-saffron rounded-full transition-all"
              style={{ width: `${((user?.weekly_order_count || 0) / 3) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">Resets every Monday. Max 2 plates per order.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm transition ${
              tab === 'active'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 rounded-xl font-semibold text-sm transition ${
              tab === 'history'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
            }`}
          >
            History ({historyOrders.length})
          </button>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 dark:text-gray-400">
              {tab === 'active' ? 'No active orders' : 'No order history yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order) => {
              const config = statusConfig(order.status);
              const StatusIcon = config.icon;
              const expiresAt = new Date(order.expires_at);
              const isActive = ['pending', 'paid'].includes(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  {/* Pickup code banner for active orders */}
                  {isActive && (
                    <div className="bg-primary dark:bg-primary/80 p-4 text-white">
                      <p className="text-xs opacity-80 mb-1">Pickup Code</p>
                      <div className="font-mono text-3xl font-bold tracking-widest">
                        {order.pickup_code}
                      </div>
                      <p className="text-xs opacity-80 mt-1">
                        Show this to the mess manager
                      </p>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {getMenuLabel(order)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.quantity} plate(s) · ₹{order.total_price}
                        </p>
                        {order.created_at && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Ordered {format(new Date(order.created_at), 'd MMM, h:mm a')}
                          </p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${config.bg} ${config.color}`}>
                        <StatusIcon size={12} />
                        {config.label}
                      </div>
                    </div>

                    {isActive && (
                      <div className={`text-xs flex items-center gap-1 ${expiresAt < new Date() ? 'text-red-500' : 'text-saffron'}`}>
                        <Clock size={12} />
                        {expiresAt < new Date()
                          ? '⚠️ Order expired!'
                          : `Collect by ${format(expiresAt, 'h:mm a')}`}
                      </div>
                    )}

                    {order.status === 'collected' && order.collected_at && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Collected at {format(new Date(order.collected_at), 'h:mm a, d MMM')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
