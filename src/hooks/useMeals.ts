import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Meal, Confirmation } from '../types';

export const useMeals = (date?: string) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMeals();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('meals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meals',
        },
        () => {
          fetchMeals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [date]);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('meals')
        .select('*')
        .order('date', { ascending: true })
        .order('type', { ascending: true });

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setMeals(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { meals, loading, error, refetch: fetchMeals };
};

export const useConfirmations = (userId: string, mealIds?: string[]) => {
  const [confirmations, setConfirmations] = useState<Record<string, Confirmation>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchConfirmations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('confirmations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'confirmations',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchConfirmations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, mealIds]);

  const fetchConfirmations = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('confirmations')
        .select('*')
        .eq('user_id', userId);

      if (mealIds && mealIds.length > 0) {
        query = query.in('meal_id', mealIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      const confirmationMap: Record<string, Confirmation> = {};
      data?.forEach((conf) => {
        confirmationMap[conf.meal_id] = conf;
      });

      setConfirmations(confirmationMap);
    } catch (err) {
      console.error('Error fetching confirmations:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateConfirmation = async (
    mealId: string,
    status: 'confirmed' | 'skipped'
  ) => {
    try {
      const { data, error } = await supabase
        .from('confirmations')
        .upsert(
          {
            user_id: userId,
            meal_id: mealId,
            status,
          },
          {
            onConflict: 'user_id,meal_id',
          }
        )
        .select()
        .single();

      if (error) throw error;

      setConfirmations((prev) => ({
        ...prev,
        [mealId]: data,
      }));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return { confirmations, loading, updateConfirmation, refetch: fetchConfirmations };
};
