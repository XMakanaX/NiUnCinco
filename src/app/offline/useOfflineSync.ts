import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/shared/lib/auth';
import { migrateLegacyQuickExpenseQueue } from '@/shared/offline/migrateLegacyQueue';
import { flushQueue } from '@/shared/offline/sync';
import '@/app/offline/executors';

/** Montado una vez en `AppProviders`: migra la cola vieja de quick-expense,
 * reintenta la cola al cargar y al volver la conexión. */
export function useOfflineSync(): void {
  const userId = useAuthStore((state) => state.user?.id);
  const migratedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const run = async () => {
      if (migratedRef.current !== userId) {
        migratedRef.current = userId;
        await migrateLegacyQuickExpenseQueue(userId);
      }
      if (!cancelled) await flushQueue(userId);
    };
    void run();

    const handleOnline = () => void flushQueue(userId);
    window.addEventListener('online', handleOnline);
    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
    };
  }, [userId]);
}
