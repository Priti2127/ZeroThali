import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useMeals } from '../hooks/useMeals';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Star, MessageSquare, Tag } from 'lucide-react';
import type { Meal, FeedbackTag } from '../types';

const FEEDBACK_TAGS: { value: FeedbackTag; label: string; emoji: string }[] = [
  { value: 'too_salty', label: 'Too Salty', emoji: '🧂' },
  { value: 'too_much_quantity', label: 'Too Much', emoji: '🍱' },
  { value: 'cold', label: 'Cold', emoji: '🥶' },
  { value: 'undercooked', label: 'Undercooked', emoji: '🌡️' },
  { value: 'bland', label: 'Bland', emoji: '😶' },
  { value: 'perfect', label: 'Perfect!', emoji: '✨' },
];

const Feedback: React.FC = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { meals } = useMeals(today);
  const [existingFeedback, setExistingFeedback] = useState<Record<string, any>>({});
  const [forms, setForms] = useState<Record<string, { rating: number; tags: FeedbackTag[]; comment: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);

  useEffect(() => {
    if (!user || meals.length === 0) return;
    supabase
      .from('feedback')
      .select('*')
      .eq('user_id', user.id)
      .in('meal_id', meals.map((m) => m.id))
      .then(({ data }) => {
        const map: Record<string, any> = {};
        data?.forEach((f) => { map[f.meal_id] = f; });
        setExistingFeedback(map);
        setSubmitted(data?.map((f: any) => f.meal_id) || []);
      });
  }, [user, meals]);

  const initForm = (mealId: string) => {
    if (!forms[mealId]) {
      setForms((prev) => ({ ...prev, [mealId]: { rating: 0, tags: [], comment: '' } }));
    }
  };

  const setRating = (mealId: string, rating: number) => {
    setForms((prev) => ({ ...prev, [mealId]: { ...prev[mealId], rating } }));
  };

  const toggleTag = (mealId: string, tag: FeedbackTag) => {
    setForms((prev) => {
      const current = prev[mealId]?.tags || [];
      const tags = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
      return { ...prev, [mealId]: { ...prev[mealId], tags } };
    });
  };

  const handleSubmit = async (meal: Meal) => {
    const form = forms[meal.id];
    if (!form || form.rating === 0) return toast.error('Please give a rating (1-5 stars)');
    if (!user) return;

    setSubmitting(meal.id);
    const { error } = await supabase.from('feedback').upsert(
      {
        user_id: user.id,
        meal_id: meal.id,
        rating: form.rating,
        tags: form.tags.length > 0 ? form.tags : null,
        comment: form.comment.trim() || null,
      },
      { onConflict: 'user_id,meal_id' }
    );
    setSubmitting(null);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Thank you for your feedback! 🌟');
      setSubmitted((prev) => [...prev, meal.id]);
    }
  };

  return (
    <div className="min-h-screen bg-light dark:bg-dark-bg pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary dark:text-white">Meal Feedback</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Help improve the mess with your feedback 🙏
          </p>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-500 dark:text-gray-400">No meals today to give feedback on</p>
          </div>
        ) : (
          <div className="space-y-6">
            {meals.map((meal) => {
              const mealType = meal.type;
              const hasSubmitted = submitted.includes(meal.id);
              const existing = existingFeedback[meal.id];
              const form = forms[meal.id] || { rating: 0, tags: [], comment: '' };

              return (
                <div
                  key={meal.id}
                  className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">
                        {mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : '🌙'}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white capitalize">{mealType}</h3>
                        <p className="text-xs text-gray-500">{format(new Date(today), 'd MMMM')}</p>
                      </div>
                      {hasSubmitted && (
                        <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                          ✓ Submitted
                        </span>
                      )}
                    </div>

                    {/* Menu */}
                    {meal.menu && meal.menu.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {meal.menu.map((item, i) => (
                          <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                            {item.dish}
                          </span>
                        ))}
                      </div>
                    )}

                    {hasSubmitted && existing ? (
                      /* Show submitted feedback */
                      <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={20}
                              className={i < existing.rating ? 'text-saffron fill-saffron' : 'text-gray-200'}
                            />
                          ))}
                        </div>
                        {existing.tags && existing.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {existing.tags.map((tag: string) => (
                              <span key={tag} className="text-xs bg-primary/10 text-primary dark:text-green-300 px-2 py-0.5 rounded-full">
                                {FEEDBACK_TAGS.find((t) => t.value === tag)?.emoji} {tag.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                        {existing.comment && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{existing.comment}"</p>
                        )}
                      </div>
                    ) : (
                      /* Feedback form */
                      <div onClick={() => initForm(meal.id)}>
                        {/* Star rating */}
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <Star size={14} className="inline mr-1" />
                          Rating *
                        </p>
                        <div className="flex gap-2 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRating(meal.id, star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                size={32}
                                className={
                                  star <= (form.rating || 0)
                                    ? 'text-saffron fill-saffron'
                                    : 'text-gray-300 dark:text-gray-600'
                                }
                              />
                            </button>
                          ))}
                        </div>

                        {/* Tags */}
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <Tag size={14} className="inline mr-1" />
                          Tags
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {FEEDBACK_TAGS.map((tag) => (
                            <button
                              key={tag.value}
                              onClick={() => toggleTag(meal.id, tag.value)}
                              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                                form.tags?.includes(tag.value)
                                  ? 'border-primary bg-primary/10 text-primary dark:border-saffron dark:bg-saffron/10 dark:text-saffron'
                                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary dark:hover:border-saffron'
                              }`}
                            >
                              {tag.emoji} {tag.label}
                            </button>
                          ))}
                        </div>

                        {/* Comment */}
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          <MessageSquare size={14} className="inline mr-1" />
                          Comment (optional)
                        </p>
                        <textarea
                          value={form.comment || ''}
                          onChange={(e) =>
                            setForms((prev) => ({
                              ...prev,
                              [meal.id]: { ...prev[meal.id], comment: e.target.value },
                            }))
                          }
                          placeholder="Share your thoughts about this meal..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-dark-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-saffron resize-none"
                        />

                        <button
                          onClick={() => handleSubmit(meal)}
                          disabled={submitting === meal.id || !form.rating}
                          className="mt-3 w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition"
                        >
                          {submitting === meal.id ? 'Submitting...' : '⭐ Submit Feedback'}
                        </button>
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

export default Feedback;
