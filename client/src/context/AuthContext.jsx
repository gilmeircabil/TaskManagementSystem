import React, { createContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { getProfile, updateProfile as updateProfileRequest } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      const p = await getProfile(currentUser.id);
      setProfile(p);
    } catch (err) {
      // Profile row may not exist yet (trigger race on first sign up) — non-fatal.
      console.warn('[AuthContext] could not load profile:', err.message);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      loadProfile(sessionUser).finally(() => setLoading(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      loadProfile(sessionUser);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [user, loadProfile]);

  const updateProfile = useCallback(
    async (updates) => {
      if (!user) throw new Error('Not authenticated');
      const updated = await updateProfileRequest(user.id, updates);
      setProfile(updated);
      return updated;
    },
    [user]
  );

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
