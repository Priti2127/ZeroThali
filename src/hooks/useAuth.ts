import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('User profile not found, creating default:', error);
        // If user doesn't exist in public.users, create a default profile
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user) {
          const defaultUser = {
            id: userId,
            email: authUser.user.email || '',
            full_name: authUser.user.user_metadata?.full_name || 'User',
            role: 'student', // Default role
            is_registered: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUser(defaultUser as User);
        }
        return;
      }
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback: create temporary user object so dashboard can load
      const tempUser: User = {
        id: userId,
        email: '',
        full_name: 'User',
        role: 'student',
        is_registered: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(tempUser);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        console.error('SignIn error:', error);
      }
      
      return { data, error };
    } catch (err: any) {
      console.error('SignIn exception:', err);
      return { data: null, error: err };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: string,
    additionalData?: any
  ) => {
    try {
      // Trim and lowercase email
      const cleanEmail = email.trim().toLowerCase();
      
      // First, create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { data: null, error: authError };
      }

      // Then create user profile
      if (authData.user) {
        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: cleanEmail,
          full_name: fullName,
          role,
          ...additionalData,
        });

        if (profileError) {
          console.error('Profile error:', profileError);
          return { data: null, error: profileError };
        }
      }

      return { data: authData, error: null };
    } catch (err: any) {
      console.error('Signup error:', err);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  const signInWithOTP = async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { data, error };
  };

  const verifyOTP = async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOTP,
    verifyOTP,
  };
};
