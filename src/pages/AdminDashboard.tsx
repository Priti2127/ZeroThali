import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts';
import { TrendingDown, TrendingUp, Users, Star, Package, AlertTriangle } from 'lucide-react';

function StatCard({ icon, label, value, sub, color = 'text-primary' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
      <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl w-fit mb-2">{icon}</div>
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    total_receivers: 0,
    total_meals: 0,
    total_wastage_kg: 0,
    meals_saved: 0,
    avg_rating: 0,
    total_orders: 0,
    total_revenue: 0,
  });
  const [wastageChart, setWastageChart] = useState<any[]>([]);
  const [dishRankings, setDishRankings] = useState<any[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // Users stats
    const { data: users } = await supabase.from('users').select('role');
    const students = users?.filter((u: any) => u.role === 'student').length || 0;
    const receivers = users?.filter((u: any) => u.role === 'receiver').length || 0;

    // Meals stats
    const { data: meals } = await supabase
      .from('meals')
      .select('cooked_kg, leftover_kg, actual_registered_count')
      .not('leftover_kg', 'is', null);

    const totalWastage = meals?.reduce((sum: number, m: any) => sum + Number(m.leftover_kg || 0), 0) || 0;
    const mealsSaved = meals?.filter((m: any) => m.leftover_kg > 0).length || 0;

    // Feedback stats
    const { data: feedbacks } = await supabase.from('feedback').select('rating');
    const avgRating = feedbacks?.length
      ? feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / feedbacks.length
      : 0;

    // Orders/Revenue
    const { data: orders } = await supabase.from('orders').select('total_price, status');
    const totalRevenue = orders?.filter((o: any) => o.status === 'paid' || o.status === 'collected')
      .reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0) || 0;

    setStats({
      total_students: students,
      total_receivers: receivers,
      total_meals: meals?.length || 0,
      total_wastage_kg: Math.round(totalWastage * 10) / 10,
      meals_saved: mealsSaved,
      avg_rating: Math.round(avgRating * 10) / 10,
      total_orders: orders?.length || 0,
      total_revenue: Math.round(totalRevenue),
    });

    // Wastage chart (last 14 days)
    const { data: chartData } = await supabase
      .from('meals')
      .select('date, type, leftover_kg, cooked_kg')
      .not('leftover_kg', 'is', null)
      .order('date', { ascending: false })
      .limit(14);

    if (chartData) {
      const grouped = chartData.reduce((acc: Record<string, number>, m: any) => {
        const d = format(new Date(m.date), 'MM/dd');
        acc[d] = (acc[d] || 0) + Number(m.leftover_kg || 0);
        return acc;
      }, {});
      setWastageChart(Object.entries(grouped).map(([date, waste]) => ({ date, waste: Number(waste.toFixed(1)) })).reverse());
    }

    // Dish rankings from feedback
    const { data: dishFeedback } = await supabase
      .from('feedback')
      .select('rating, comment, meal_id');
    const { data: allMeals } = await supabase
      .from('meals')
      .select('id, type, leftover_kg, menu');

    if (dishFeedback && allMeals) {
      const mealMap = Object.fromEntries(allMeals.map((m: any) => [m.id, m]));
      const dishStats: Record<string, { ratings: number[]; wastage: number; count: number }> = {};

      allMeals.forEach((meal: any) => {
        if (meal.menu && meal.leftover_kg) {
          meal.menu.forEach((item: any) => {
            const dish = item.dish;
            if (!dishStats[dish]) dishStats[dish] = { ratings: [], wastage: 0, count: 0 };
            dishStats[dish].wastage += Number(meal.leftover_kg || 0) / (meal.menu?.length || 1);
            dishStats[dish].count++;
          });
        }
      });

      const rankings = Object.entries(dishStats)
        .map(([name, data]) => ({
          name,
          avgWastage: Math.round((data.wastage / data.count) * 10) / 10,
          count: data.count,
        }))
        .sort((a, b) => b.avgWastage - a.avgWastage)
        .slice(0, 8);
      setDishRankings(rankings);
    }

    // Recent feedback
    const { data: recentFb } = await supabase
      .from('feedback')
      .select('id, rating, comment, tags, created_at, users(full_name), meals(type, date)')
      .order('created_at', { ascending: false })
      .limit(5);
    setRecentFeedback(recentFb || []);

    // Generate insights
    const ins: string[] = [];
    if (totalWastage > 50) ins.push(`⚠️ Total wastage this period: ${totalWastage.toFixed(1)} kg. Consider reducing portion sizes.`);
    if (avgRating < 3) ins.push(`⚠️ Average meal rating is low (${avgRating.toFixed(1)}/5). Review feedback tags.`);
    if (avgRating >= 4) ins.push(`✅ Great meal ratings! Average: ${avgRating.toFixed(1)}/5`);
    setInsights(ins);

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-light dark:bg-dark-bg flex items-center justify-center">
        <div className="text-primary dark:text-saffron animate-pulse">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">Admin Dashboard 🛡️</h1>
          <p className="text-gray-500 dark:text-gray-400">System-wide metrics and insights</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard icon={<Users size={20} className="text-primary" />} label="Students" value={stats.total_students} />
          <StatCard icon={<Users size={20} className="text-saffron" />} label="Receivers" value={stats.total_receivers} color="text-saffron" />
          <StatCard icon={<TrendingDown size={20} className="text-brick" />} label="Total Waste" value={`${stats.total_wastage_kg} kg`} color="text-brick" />
          <StatCard icon={<Star size={20} className="text-saffron" />} label="Avg Rating" value={`${stats.avg_rating}/5`} color="text-saffron" />
          <StatCard icon={<Package size={20} className="text-green-600" />} label="Meals Saved" value={stats.meals_saved} color="text-green-600" />
          <StatCard icon={<Package size={20} className="text-primary" />} label="Total Meals" value={stats.total_meals} />
          <StatCard icon={<Package size={20} className="text-saffron" />} label="Orders" value={stats.total_orders} color="text-saffron" />
          <StatCard icon={<Package size={20} className="text-green-600" />} label="Revenue" value={`₹${stats.total_revenue}`} color="text-green-600" />
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="mb-6 space-y-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🔍 Insights</h2>
            {insights.map((ins, i) => (
              <div key={i} className="bg-white dark:bg-dark-surface rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">{ins}</p>
              </div>
            ))}
          </div>
        )}

        {/* Wastage Chart */}
        {wastageChart.length > 0 && (
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Wastage Trend (last 14 days, kg)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={wastageChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="waste" stroke="#B5543A" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Dish Rankings */}
        {dishRankings.length > 0 && (
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">🏆 Dishes by Avg Wastage</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dishRankings} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="avgWastage" fill="#B5543A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Feedback */}
        {recentFeedback.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Feedback</h2>
            <div className="space-y-3">
              {recentFeedback.map((fb: any) => (
                <div
                  key={fb.id}
                  className="bg-white dark:bg-dark-surface rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < fb.rating ? 'text-saffron fill-saffron' : 'text-gray-200'}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{fb.users?.full_name}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {fb.meals?.type} · {fb.meals?.date}
                    </span>
                  </div>
                  {fb.comment && <p className="text-sm text-gray-600 dark:text-gray-300">{fb.comment}</p>}
                  {fb.tags && fb.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {fb.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs bg-brick/10 text-brick px-2 py-0.5 rounded-full"
                        >
                          {tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
