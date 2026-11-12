import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useMeals, useConfirmations } from '../hooks/useMeals';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Meal, ConfirmationStatus } from '../types';

const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };

const MealConfirmation: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { meals, loading } = useMeals(selectedDate);
  const { confirmations, updateConfirmation } = useConfirmations(
    user?.id || '',
    meals.map((m) => m.id)
  );
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleConfirm = async (mealId: string, status: 'confirmed' | 'skipped') => {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;

    // Check cutoff
    const cutoffParts = meal.cutoff_time.split(':');
    const cutoff = new Date(selectedDate);
    cutoff.setHours(Number(cutoffParts[0]), Number(cutoffParts[1]), 0, 0);
    if (now > cutoff || meal.is_cutoff_locked) {
      return toast.error('Cutoff time has passed. Cannot change your choice.');
    }

    const result = await updateConfirmation(mealId, status);
    if (result.success) {
      toast.success(status === 'confirmed' ? '✅ Confirmed! See you at the mess.' : '⏭️ Meal skipped');
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const isFuture = selectedDate > format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">Meal Confirmation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Confirm before cutoff to help reduce wastage 🌱
          </p>
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-between bg-white dark:bg-dark-surface rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
          <button
            onClick={prevDay}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="text-center">
            <p className="font-bold text-gray-900 dark:text-white">
              {format(new Date(selectedDate + 'T00:00:00'), 'EEEE')}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(selectedDate + 'T00:00:00'), 'd MMMM yyyy')}
            </p>
            {isToday && (
              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">Today</span>
            )}
          </div>
          <button
            onClick={nextDay}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { status: 'confirmed' as ConfirmationStatus, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', label: 'Confirmed' },
            { status: 'skipped' as ConfirmationStatus, color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400', label: 'Skipped' },
          ].map(({ status, color, label }) => {
            const count = Object.values(confirmations).filter((c) => c.status === status).length;
            if (count === 0) return null;
            return (
              <span key={status} className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>
                {label}: {count}
              </span>
            );
          })}
        </div>

        {/* Meal cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-500 dark:text-gray-400">No meals scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meals.map((meal) => {
              const cutoffParts = meal.cutoff_time.split(':');
              const cutoff = new Date(selectedDate + 'T00:00:00');
              cutoff.setHours(Number(cutoffParts[0]), Number(cutoffParts[1]), 0, 0);
              const isPast = isToday ? now > cutoff || meal.is_cutoff_locked : !isFuture;
              const timeDiff = cutoff.getTime() - now.getTime();
              const hoursLeft = Math.floor(timeDiff / 3600000);
              const minsLeft = Math.floor((timeDiff % 3600000) / 60000);
              const status = confirmations[meal.id]?.status;

              return (
                <div
                  key={meal.id}
                  className={`rounded-2xl border-2 overflow-hidden transition-all ${
                    status === 'confirmed'
                      ? 'border-green-400'
                      : status === 'skipped'
                      ? 'border-gray-200 dark:border-gray-700'
                      : 'border-saffron/40'
                  }`}
                >
                  <div className="bg-white dark:bg-dark-surface p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{MEAL_ICONS[meal.type]}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                            {meal.type}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Cutoff: {meal.cutoff_time.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      {isToday && !isPast ? (
                        <span className="text-xs bg-saffron/10 text-saffron px-3 py-1 rounded-full font-medium">
                          <Clock size={11} className="inline mr-1" />
                          {hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`} left
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-3 py-1 rounded-full font-medium">
                          🔒 Closed
                        </span>
                      )}
                    </div>

                    {/* Menu */}
                    {meal.menu && meal.menu.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          Menu
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {meal.menu.map((item, i) => (
                            <span
                              key={i}
                              className="text-sm bg-primary/10 dark:bg-primary/20 text-primary dark:text-green-300 px-3 py-1 rounded-full"
                            >
                              🍛 {item.dish}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    {!isPast ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleConfirm(meal.id, 'confirmed')}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition ${
                            status === 'confirmed'
                              ? 'bg-green-500 text-white shadow'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200'
                          }`}
                        >
                          <CheckCircle size={18} />
                          {status === 'confirmed' ? '✓ Confirmed' : "I'll Eat"}
                        </button>
                        <button
                          onClick={() => handleConfirm(meal.id, 'skipped')}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition ${
                            status === 'skipped'
                              ? 'bg-red-400 text-white shadow'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
                          }`}
                        >
                          <XCircle size={18} />
                          {status === 'skipped' ? '✓ Skipped' : 'Skip Meal'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm font-medium">
                        {status === 'confirmed' ? (
                          <><CheckCircle size={16} className="text-green-500" /> <span className="text-green-600 dark:text-green-400">Confirmed</span></>
                        ) : status === 'skipped' ? (
                          <><XCircle size={16} className="text-red-400" /> <span className="text-red-500">Skipped</span></>
                        ) : (
                          <><HelpCircle size={16} className="text-gray-400" /> <span className="text-gray-500">No response (cutoff passed)</span></>
                        )}
                      </div>
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

export default MealConfirmation;
