import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const subscribe = <T>(
  table: string,
  callback: (payload: { new: T; old?: T }) => void
) => {
  const channel = supabase
    .channel(`${table}_realtime`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();

  return () => supabase.removeChannel(channel);
};
