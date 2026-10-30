import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';
import { queryClient } from '@/shared/lib/queryClient';
import { clearPersistedQueryCache } from '@/shared/lib/idbPersister';
import { clearAllOps } from '@/shared/offline/queue';

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

let previousUserId: string | null = null;

/**
 * Única fuente de verdad de la sesión: supabase-js ya persiste y refresca
 * el token (persistSession/autoRefreshToken en shared/lib/supabase.ts);
 * este store solo refleja esos cambios para la UI. Si el `user.id` cambia
 * (login con otra cuenta en la misma pestaña, o el primer `getSession`
 * resuelve antes que este listener) se borra el cache de consultas
 * persistido del usuario anterior — nunca debe mostrarse data financiera
 * de una cuenta mientras hay otra activa (regla global de aislamiento).
 */
supabase.auth.onAuthStateChange((_event, session) => {
  const nextUserId = session?.user?.id ?? null;
  if (previousUserId && previousUserId !== nextUserId) {
    void clearPersistedQueryCache();
    queryClient.clear();
  }
  previousUserId = nextUserId;
  useAuthStore.setState({ session, user: session?.user ?? null, initializing: false });
});

/**
 * Cierre de sesión (Fase 13): limpia el cache de consultas persistido y la
 * cola offline antes de cerrar sesión — "limpiar datos locales al cerrar
 * sesión y cambiar de usuario" (plan maestro, regla de la fase). Las
 * operaciones pendientes que todavía no confirmó el servidor se pierden
 * acá: la UI (`SettingsPage`) debe avisarlo antes de llamar a esta función
 * si hay alguna.
 */
export async function signOutAndWipe(): Promise<void> {
  await supabase.auth.signOut();
  queryClient.clear();
  await clearPersistedQueryCache();
  await clearAllOps();
}
