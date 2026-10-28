import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  /** true hasta que se resuelve la sesión inicial (evita un flash a /login). */
  initializing: boolean;
}

export const useAuthStore = create<AuthState>(() => ({
  session: null,
  user: null,
  initializing: true,
}));

supabase.auth.getSession().then(({ data }) => {
  useAuthStore.setState({ session: data.session, user: data.session?.user ?? null, initializing: false });
});

/**
 * Única fuente de verdad de la sesión: supabase-js ya persiste y refresca
 * el token (persistSession/autoRefreshToken en shared/lib/supabase.ts);
 * este store solo refleja esos cambios para la UI.
 */
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({ session, user: session?.user ?? null, initializing: false });
});
