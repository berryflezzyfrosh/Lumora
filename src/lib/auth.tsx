import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toUserError } from '@/lib/errors';

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  plan: 'free' | 'pro';
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, plan')
      .eq('id', userId)
      .maybeSingle();

    if (error) return { profile: null, error: toUserError('auth.profile', error).message };
    return { profile: (data as Profile | null) ?? null, error: null };
  } catch (caught) {
    return { profile: null, error: toUserError('auth.profile', caught).message };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const profileRequestId = useRef(0);
  const profileUserId = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    profileUserId.current = userId;
    const requestId = ++profileRequestId.current;
    const result = await fetchProfile(userId);
    if (requestId !== profileRequestId.current) return;
    setProfile(result.profile);
    setProfileError(result.error);
  }, []);

  useEffect(() => {
    let active = true;
    let authEventVersion = 0;
    const initialAuthEventVersion = authEventVersion;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventVersion += 1;
      const eventVersion = authEventVersion;
      setSession(nextSession);
      setLoading(false);
      if (!nextSession?.user) {
        profileRequestId.current += 1;
        profileUserId.current = null;
        setProfile(null);
        setProfileError(null);
        return;
      }

      if (profileUserId.current !== nextSession.user.id) {
        profileRequestId.current += 1;
        profileUserId.current = nextSession.user.id;
        setProfile(null);
        setProfileError(null);
      }

      window.setTimeout(() => {
        if (active && authEventVersion === eventVersion) {
          void loadProfile(nextSession.user.id);
        }
      }, 0);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || authEventVersion !== initialAuthEventVersion) return;
      if (error) {
        setProfileError(toUserError('auth.session', error).message);
      } else {
        setSession(data.session);
        if (data.session?.user) {
          profileUserId.current = data.session.user.id;
          void loadProfile(data.session.user.id);
        }
      }
      setLoading(false);
    }).catch((caught: unknown) => {
      if (!active || authEventVersion !== initialAuthEventVersion) return;
      setProfileError(toUserError('auth.session', caught).message);
      setLoading(false);
    });

    return () => {
      active = false;
      profileRequestId.current += 1;
      profileUserId.current = null;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw toUserError('auth.signOut', error);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileError,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, profileError, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
