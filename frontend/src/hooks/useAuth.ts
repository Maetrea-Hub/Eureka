import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'siswa' | 'tutor' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  nama_lengkap: string;
  nomor_whatsapp: string | null;
  jenjang_sekolah: 'SD' | 'SMP' | 'SMA' | null;
  foto_url: string | null;
  onboarding_completed: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
  });

  useEffect(() => {
    // Ambil session awal
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setState(s => ({ ...s, session: data.session, user: data.session!.user }));
        fetchProfile(data.session.user.id);
      } else {
        setState(s => ({ ...s, isLoading: false }));
      }
    });

    // Subscribe perubahan auth (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(s => ({ ...s, session, user: session?.user ?? null }));
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setState(s => ({ ...s, profile: null, isLoading: false }));
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    setState(s => ({
      ...s,
      profile: error ? null : (data as UserProfile),
      isLoading: false,
    }));
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    ...state,
    signOut,
    isAuthenticated: !!state.session,
  };
}
