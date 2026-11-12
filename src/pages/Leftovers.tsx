import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Bell, AlertTriangle, Package, Plus } from 'lucide-react';
import type { Leftover, Meal } from '../types';

interface LeftoverWithMeal extends Leftover {
  meals?: { date: string; type: string; menu?: any[] };
}

const Leftovers: React.FC = () => {
  const { user } = useAuth();
  const [leftovers, setLeftovers] = useState<LeftoverWithMeal[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    meal_id: '',
    quantity_plates: '',
    price_per_plate: '10',
  });
  const [submitting, setSubmitting] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchLeftovers = useCallback(async () => {
    const { data } = await supabase
      .from('leftovers')
      .select('*, meals(date, type, menu)')
      .order('created_at', { ascending: false })
      .limit(20);
    setLeftovers(data || []);
  }, []);

  const fetchTodayMeals = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('date', today)
      .order('type');
    setMeals(data || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchLeftovers(), fetchTodayMeals()]).finally(() => setLoading(false));

    const channel = supabase
      .channel('leftovers_manager')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leftovers' }, fetchLeftovers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchLeftovers)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLeftovers, fetchTodayMeals]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meal_id || !form.quantity_plates || !form.price_per_plate) {
      return toast.error('Fill all required fields');
    }
    const qty = parseInt(form.quantity_plates);
    if (isNaN(qty) || qty < 1) return toast.error('Enter valid plate count');

    // Anti-dependency: check if surplus was high yesterday too
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    const { data: prevSurplus } = await supabase
      .from('leftovers')
      .select('quantity_plates')
      .gte('created_at', yesterday + 'T00:00:00')
      .lt('created_at', yesterday + 'T23:59:59');

    if (prevSurplus && prevSurplus.length > 0 && prevSurplus.reduce((s: number, l: any) => s + l.quantity_plates, 0) > 20) {
      toast.warning('⚠️ Surplus was high yesterday too! Consider reducing quantities to avoid dependency.');
    }

    setSubmitting(true);
    // Add random delay (anti-predictability)
    const delay = Math.random() * 5 * 60 * 1000; // 0-5 mins
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const { error } = await supabase.from('leftovers').insert({
      meal_id: form.meal_id,
      quantity_plates: qty,
      available_plates: qty,
      price_per_plate: Number(form.price_per_plate),
      status: 'available',
      expires_at: expiresAt,
    });

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('🍱 Surplus food alert published!');
      setForm({ meal_id: '', quantity_plates: '', price_per_plate: '10' });
      fetchLeftovers();
    }
  };

  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return toast.error('Enter pickup code');
    setVerifying(true);

    const { data, error } = await supabase.rpc('collect_order', {
      p_pickup_code: verifyCode.trim().toUpperCase(),
      p_manager_id: user?.id,
    });

    setVerifying(false);
    if (error || !data?.success) {
      toast.error(data?.error || error?.message || 'Invalid code');
    } else {
      toast.success('✅ Order collected successfully!');
      setVerifyCode('');
    }
  };

  const getMenuLabel = (leftover: LeftoverWithMeal) => {
    if (leftover.meals?.menu && leftover.meals.menu.length > 0) {
      return leftover.meals.menu.map((m: any) => m.dish).join(', ');
    }
    return leftover.meals?.type || 'Meal';
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'sold_out': return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      case 'expired': return 'bg-red-50 dark:bg-red-900/20 text-red-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">Leftover Food Alerts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Publish genuine surplus · First come, first served
          </p>
        </div>

        {/* Anti-dependency warning */}
        <div className="bg-brick/10 dark:bg-brick/5 border border-brick/20 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertTriangle size={16} className="text-brick shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 dark:text-gray-300">
              <strong>Anti-dependency:</strong> Publish only genuine surplus. Never plan to have leftovers.
              Surplus food is not a regular service.
            </p>
          </div>
        </div>

        {/* Publish form */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700 p-5 mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell size={18} className="text-saffron" />
            Publish Surplus Alert
          </h2>
          <form onSubmit={handlePublish} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meal *
              </label>
              <select
                value={form.meal_id}
                onChange={(e) => setForm({ ...form, meal_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select today's meal</option>
                {meals.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.type === 'breakfast' ? '🌅' : m.type === 'lunch' ? '☀️' : '🌙'}{' '}
                    {m.type.charAt(0).toUpperCase() + m.type.slice(1)}
                    {m.menu && m.menu.length > 0 && ` — ${m.menu.map((item: any) => item.dish).join(', ')}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plates available *
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity_plates}
                  onChange={(e) => setForm({ ...form, quantity_plates: e.target.value })}
                  placeholder="e.g. 12"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price per plate (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.price_per_plate}
                  onChange={(e) => setForm({ ...form, price_per_plate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-saffron hover:bg-saffron/90 text-white rounded-xl font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Bell size={18} />
              {submitting ? 'Publishing...' : 'Publish Alert'}
            </button>
          </form>
        </div>

        {/* Verify pickup code */}
        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700 p-5 mb-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">✅ Verify Pickup Code</h2>
          <form onSubmit={handleVerifyPickup} className="flex gap-3">
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={verifying}
              className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition"
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>

        {/* Recent leftovers */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          <Package size={18} className="inline mr-2" />
          Recent Alerts
        </h2>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl" />)}
          </div>
        ) : leftovers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p>No surplus alerts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leftovers.map((leftover) => (
              <div
                key={leftover.id}
                className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{getMenuLabel(leftover)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {leftover.meals?.date && format(new Date(leftover.meals.date), 'd MMM')} ·{' '}
                      {leftover.meals?.type}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {leftover.available_plates}/{leftover.quantity_plates} plates · ₹{leftover.price_per_plate}/plate
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(leftover.status)}`}>
                    {leftover.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leftovers;
