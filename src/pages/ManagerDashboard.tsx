import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useMeals } from '../hooks/useMeals';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';
import {
  Users, TrendingDown, AlertTriangle, CheckCircle, ChefHat, Package, Plus, Minus
} from 'lucide-react';
import type { Meal } from '../types';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner'];

function StatCard({ icon, label, value, sub, color = 'text-primary' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl">{icon}</div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { meals, loading: mealsLoading, refetch: refetchMeals } = useMeals(today);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [confirmCounts, setConfirmCounts] = useState<Record<string, { confirmed: number; skipped: number; unconfirmed: number }>>({});
  const [walkins, setWalkins] = useState<Record<string, number>>({});
  const [wastageData, setWastageData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Meal form state
  const [menuForm, setMenuForm] = useState({ cooked_kg: '', leftover_kg: '', notes: '' });
  const [walkinInput, setWalkinInput] = useState('');

  const fetchConfirmCounts = useCallback(async () => {
    if (meals.length === 0) return;
    for (const meal of meals) {
      const { data } = await supabase
        .from('confirmations')
        .select('status')
        .eq('meal_id', meal.id);
      if (data) {
        const confirmed = data.filter((c: any) => c.status === 'confirmed').length;
        const skipped = data.filter((c: any) => c.status === 'skipped').length;
        const total = data.length;
        setConfirmCounts((prev) => ({
          ...prev,
          [meal.id]: { confirmed, skipped, unconfirmed: total - confirmed - skipped },
        }));
      }
    }
  }, [meals]);

  const fetchWalkins = useCallback(async () => {
    if (meals.length === 0) return;
    for (const meal of meals) {
      const { data } = await supabase
        .from('walkins')
        .select('count')
        .eq('meal_id', meal.id)
        .order('logged_at', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setWalkins((prev) => ({ ...prev, [meal.id]: data.count }));
      }
    }
  }, [meals]);

  const fetchWastageData = useCallback(async () => {
    const { data } = await supabase
      .from('meals')
      .select('date, type, cooked_kg, leftover_kg')
      .not('leftover_kg', 'is', null)
      .order('date', { ascending: false })
      .limit(14);
    if (data) {
      setWastageData(
        data.map((m: any) => ({
          date: format(new Date(m.date), 'MM/dd'),
          type: m.type,
          waste: Number(m.leftover_kg).toFixed(1),
        }))
      );
    }
  }, []);

  useEffect(() => {
    fetchConfirmCounts();
    fetchWalkins();
    fetchWastageData();
  }, [fetchConfirmCounts, fetchWalkins, fetchWastageData]);

  const handleUpdateMeal = async (mealId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('meals')
      .update({
        cooked_kg: menuForm.cooked_kg ? Number(menuForm.cooked_kg) : null,
        leftover_kg: menuForm.leftover_kg ? Number(menuForm.leftover_kg) : null,
        notes: menuForm.notes || null,
      })
      .eq('id', mealId);
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Meal data updated!');
      refetchMeals();
      fetchWastageData();
    }
  };

  const handleLogWalkin = async (mealId: string) => {
    const count = parseInt(walkinInput);
    if (isNaN(count) || count < 0) return toast.error('Enter a valid count');
    const { error } = await supabase.from('walkins').insert({
      meal_id: mealId,
      count,
      logged_by: user?.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Walk-ins logged: ${count}`);
      setWalkins((prev) => ({ ...prev, [mealId]: count }));
      setWalkinInput('');
    }
  };

  const handleLockCutoff = async (mealId: string) => {
    const { error } = await supabase.rpc('lock_meal_cutoff', { p_meal_id: mealId });
    if (error) toast.error(error.message);
    else {
      toast.success('Meal cutoff locked');
      refetchMeals();
    }
  };

  const totalConfirmed = Object.values(confirmCounts).reduce((sum, c) => sum + c.confirmed, 0);
  const totalWalkins = Object.values(walkins).reduce((sum, w) => sum + w, 0);

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">
            Manager Dashboard 👨‍🍳
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<Users size={20} className="text-primary" />} label="Confirmed" value={totalConfirmed} color="text-green-600" />
          <StatCard icon={<ChefHat size={20} className="text-saffron" />} label="Walk-ins" value={totalWalkins} color="text-saffron" />
          <StatCard icon={<Package size={20} className="text-brick" />} label="Total Expected" value={totalConfirmed + totalWalkins} color="text-brick" />
          <StatCard icon={<TrendingDown size={20} className="text-primary" />} label="Meals Today" value={meals.length} />
        </div>

        {/* Today's Meal Cards */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Today's Meals</h2>
        {mealsLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {MEAL_ORDER.filter((t) => meals.find((m) => m.type === t)).map((type) => {
              const meal = meals.find((m) => m.type === type)!;
              const counts = confirmCounts[meal.id] || { confirmed: 0, skipped: 0, unconfirmed: 0 };
              const predicted = meal.predicted_walkins || 0;
              const wk = walkins[meal.id] || 0;
              const totalExpected = counts.confirmed + (wk || predicted);

              return (
                <div
                  key={meal.id}
                  className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setSelectedMeal(selectedMeal?.id === meal.id ? null : meal)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {type === 'breakfast' ? '🌅' : type === 'lunch' ? '☀️' : '🌙'}
                        </span>
                        <h3 className="font-bold text-gray-900 dark:text-white capitalize">{type}</h3>
                        {meal.is_cutoff_locked && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">🔒 Locked</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                        Cutoff: {meal.cutoff_time.slice(0, 5)} · Cook for ~{totalExpected} plates
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-3 text-sm">
                        <span className="text-green-600 font-semibold">✓{counts.confirmed}</span>
                        <span className="text-red-400 font-semibold">✗{counts.skipped}</span>
                        <span className="text-gray-400">?{counts.unconfirmed}</span>
                      </div>
                    </div>
                  </div>

                  {selectedMeal?.id === meal.id && (
                    <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4">
                      {/* Prediction */}
                      <div className="bg-saffron/10 dark:bg-saffron/5 rounded-xl p-3">
                        <p className="text-sm font-semibold text-saffron mb-1">🔮 Prediction</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Confirmed: <strong>{counts.confirmed}</strong> + Predicted walk-ins:{' '}
                          <strong>{predicted}</strong> = Cook for about{' '}
                          <strong className="text-primary dark:text-saffron">{totalExpected} plates</strong>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Range: {Math.max(0, totalExpected - 5)} – {totalExpected + 10} plates
                        </p>
                      </div>

                      {/* Walk-in log */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Log actual walk-ins
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={walkinInput}
                            onChange={(e) => setWalkinInput(e.target.value)}
                            placeholder="Count"
                            min="0"
                            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={() => handleLogWalkin(meal.id)}
                            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition"
                          >
                            Log
                          </button>
                        </div>
                        {walkins[meal.id] !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">Last logged: {walkins[meal.id]} walk-ins</p>
                        )}
                      </div>

                      {/* Update meal data */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Meal quantities (kg)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Cooked (kg)"
                            value={menuForm.cooked_kg}
                            onChange={(e) => setMenuForm({ ...menuForm, cooked_kg: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="number"
                            placeholder="Leftover (kg)"
                            value={menuForm.leftover_kg}
                            onChange={(e) => setMenuForm({ ...menuForm, leftover_kg: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Notes (holiday, exam, etc.)"
                          value={menuForm.notes}
                          onChange={(e) => setMenuForm({ ...menuForm, notes: e.target.value })}
                          className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateMeal(meal.id)}
                          disabled={loading}
                          className="flex-1 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition"
                        >
                          {loading ? 'Saving...' : '💾 Save Meal Data'}
                        </button>
                        {!meal.is_cutoff_locked && (
                          <button
                            onClick={() => handleLockCutoff(meal.id)}
                            className="px-4 py-2 bg-brick text-white rounded-xl font-semibold text-sm hover:bg-brick/90 transition"
                          >
                            🔒 Lock
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Wastage Chart */}
        {wastageData.length > 0 && (
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Wastage (kg)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={wastageData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="waste" fill="#B5543A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Warning */}
        <div className="p-4 bg-brick/10 dark:bg-brick/5 rounded-xl border border-brick/20">
          <div className="flex gap-3">
            <AlertTriangle size={16} className="text-brick shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Anti-dependency reminder:</strong> Never intentionally cook surplus. 
              Leftover food alerts are for genuine surplus only. If surplus is high 2+ days in a row, 
              reduce quantities. 🌱
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
