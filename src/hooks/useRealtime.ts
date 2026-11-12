import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

/**
 * useRealtime – subscribes to Postgres changes on a table and calls `onUpdate`
 * whenever any INSERT, UPDATE, or DELETE fires. Cleans up on unmount.
 *
 * @param table   The public table name to watch (e.g. 'food_logs')
 * @param onUpdate  Callback invoked on every change — typically re-fetches data
 */
export function useRealtime(table: string, onUpdate: () => void) {
  // Keep a stable ref so changing `onUpdate` doesn't re-subscribe needlessly
  const cbRef = useRef(onUpdate);
  useEffect(() => {
    cbRef.current = onUpdate;
  });

  useEffect(() => {
    const channel = supabase
      .channel(`${table}_realtime_hook`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => cbRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);
}
