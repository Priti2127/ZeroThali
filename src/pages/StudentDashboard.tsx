import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useMeals, useConfirmations } from '../hooks/useMeals';
import { toast } from 'sonner';
import { format, isToday } from 'date-fns';
import { Clock, CheckCircle, XCircle, HelpCircle, Star, Bell } from 'lucide-react';
import type { Meal, ConfirmationStatus } from '../types';

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

function MealCard({
  meal,
  status,
  onConfirm,
  locked,
}: {
  meal: Meal;
  status: ConfirmationStatus | undefined;
  onConfirm: (mealId: string, status: 'confirmed' | 'skipped') => void;
  locked: boolean;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cutoffParts = meal.cutoff_time.split(':');
  const cutoff = new Date();
  cutoff.setHours(Number(cutoffParts[0]), Number(cutoffParts[1]), 0, 0);
  const isPast = now > cutoff || meal.is_cutoff_locked;
  const timeDiff = cutoff.getTime() - now.getTime();
  const hoursLeft = Math.floor(timeDiff / 3600000);
  const minsLeft = Math.floor((timeDiff % 3600000) / 60000);

  return (
    <div
      className={`rounded-2xl p-5 border-2 transition-all ${
        status === 'confirmed'
          ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
          : status === 'skipped'
          ? 'border-gray-300 bg-gray-50 dark:bg-gray-800/30'
          : 'border-saffron/40 bg-white dark:bg-dark-surface'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-3xl mb-1">{MEAL_ICONS[meal.type]}</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{MEAL_LABELS[meal.type]}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cutoff: {meal.cutoff_time.slice(0, 5)}
          </p>
        </div>
        <div className="text-right">
          {isPast ? (
            <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full font-medium">
              <Clock size={12} /> Cutoff closed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-saffron/10 text-saffron text-xs px-3 py-1 rounded-full font-medium">
              <Clock size={12} />
              {hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m left` : `${minsLeft}m left`}
            </span>
          )}
        </div>
      </div>

      {/* Menu */}
      {meal.menu && meal.menu.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Today's Menu
          </p>
          <div className="flex flex-wrap gap-2">
            {meal.menu.map((item, i) => (
              <span
                key={i}
                className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-green-300 px-2 py-1 rounded-full"
              >
                {item.dish}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation buttons */}
      {!isPast ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onConfirm(meal.id, 'confirmed')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${
              status === 'confirmed'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
            }`}
          >
            <CheckCircle size={18} />
            I'll Eat
          </button>
          <button
            onClick={() => onConfirm(meal.id, 'skipped')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${
              status === 'skipped'
                ? 'bg-red-400 text-white shadow-md'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
            }`}
          >
            <XCircle size={18} />
            Skip
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
          {status === 'confirmed' ? (
            <><CheckCircle size={18} className="text-green-500" /> Confirmed ✓</>
          ) : status === 'skipped' ? (
            <><XCircle size={18} className="text-red-400" /> Skipped</>
          ) : (
            <><HelpCircle size={18} /> No response (cutoff passed)</>
          )}
        </div>
      )}
    </div>
  );
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { meals, loading: mealsLoading } = useMeals(today);
  const { confirmations, updateConfirmation } = useConfirmations(user?.id || '', meals.map((m) => m.id));
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('feedback')
      .select('id, rating, comment, meal_id, created_at, meals(date, type)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setRecentFeedback(data || []));
  }, [user]);

  const handleConfirm = async (mealId: string, status: 'confirmed' | 'skipped') => {
    const result = await updateConfirmation(mealId, status);
    if (result.success) {
      toast.success(status === 'confirmed' ? '✅ Meal confirmed!' : '⏭️ Meal skipped');
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  const confirmedCount = Object.values(confirmations).filter((c) => c.status === 'confirmed').length;
  const skippedCount = Object.values(confirmations).filter((c) => c.status === 'skipped').length;

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">
            Namaste, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Confirmed', value: confirmedCount, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Skipped', value: skippedCount, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'Pending', value: meals.length - confirmedCount - skippedCount, color: 'text-saffron', bg: 'bg-saffron/10' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Today's meals */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Today's Meals
        </h2>

        {mealsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">🍽️</div>
            <p>No meals scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                status={confirmations[meal.id]?.status}
                onConfirm={handleConfirm}
                locked={meal.is_cutoff_locked}
              />
            ))}
          </div>
        )}

        {/* Recent feedback */}
        {recentFeedback.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Your Recent Feedback
            </h2>
            <div className="space-y-3">
              {recentFeedback.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-white dark:bg-dark-surface rounded-xl p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < fb.rating ? 'text-saffron fill-saffron' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {fb.meals?.type} · {fb.meals?.date}
                    </span>
                  </div>
                  {fb.comment && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{fb.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info note */}
        <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
          <div className="flex gap-3">
            <Bell size={16} className="text-primary dark:text-saffron shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Confirm your meals before the cutoff to help the mess manager plan quantities and reduce wastage. 
              Every confirmation matters! 🌱
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
