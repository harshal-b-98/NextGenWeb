'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getClient } from '@/lib/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const supabase = getClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          user: null,
          session: null,
          loading: false,
          error: error as Error,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error }));
        return { data: null, error };
      }
      return { data, error: null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string, metadata?: { full_name?: string }) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error }));
        return { data: null, error };
      }
      return { data, error: null };
    },
    [supabase]
  );

  const signInWithMagicLink = useCallback(
    async (email: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });
      setState((prev) => ({ ...prev, loading: false }));
      if (error) {
        setState((prev) => ({ ...prev, error }));
        return { data: null, error };
      }
      return { data, error: null };
    },
    [supabase]
  );

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github') => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/callback`,
        },
      });
      return { data, error };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const { error } = await supabase.auth.signOut();
    if (error) {
      setState((prev) => ({ ...prev, loading: false, error }));
      return { error };
    }
    return { error: null };
  }, [supabase]);

  const resetPassword = useCallback(
    async (email: string) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { data, error };
    },
    [supabase]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { data, error };
    },
    [supabase]
  );

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    signIn,
    signUp,
    signInWithMagicLink,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
  };
}
