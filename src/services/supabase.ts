// Re-export from lib/supabase to have single client instance
export { supabase, getCurrentUser, getUserProfile, hasRole } from '../lib/supabase';
export default null;

// Realtime subscribe helper
import { supabase } from '../lib/supabase';

export const subscribe = <T>(
  table: string,
  callback: (payload: { new: T; old?: T }) => void
) => {
  const channel = supabase
    .channel(`${table}_realtime_${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();

  return () => supabase.removeChannel(channel);
};
