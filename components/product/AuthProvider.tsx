'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser';

type AuthUser = { id: string; email: string };

type AuthStore = {
  ready: boolean; // session has been resolved at least once
  user: AuthUser | null;
  // Email the 6-digit code. Returns an error message, or null on success.
  sendCode: (email: string) => Promise<string | null>;
  // Verify the code and establish the session. Returns an error message, or null.
  verifyCode: (email: string, code: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthStore | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser(u ? { id: u.id, email: u.email ?? '' } : null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? '' } : null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendCode = useCallback(async (email: string) => {
    const supabase = getBrowserSupabaseClient();
    // shouldCreateUser: true unifies sign-up and sign-in — first-timers get an
    // account, returning users just sign in.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    return error?.message ?? null;
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const supabase = getBrowserSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await getBrowserSupabaseClient().auth.signOut();
  }, []);

  return (
    <Ctx.Provider value={{ ready, user, sendCode, verifyCode, signOut }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
