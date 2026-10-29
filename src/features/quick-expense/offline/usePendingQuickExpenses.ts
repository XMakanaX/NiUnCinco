import { useCallback, useEffect, useState } from 'react';
import { useCreateMovement } from '@/features/transactions/api/useTransactions';
import {
  addPendingQuickExpense,
  listPendingQuickExpenses,
  removePendingQuickExpense,
  type PendingQuickExpense,
} from '@/features/quick-expense/offline/queue';

/**
 * Cola de gastos rápidos capturados sin conexión, guardada en IndexedDB.
 * Nunca se marcan como confirmados en la UI hasta que el insert al
 * servidor responde (regla global 12 del plan maestro); `client_id` los
 * hace idempotentes ante reintentos (regla global 15 / Fase 6).
 */
export function usePendingQuickExpenses() {
  const [pending, setPending] = useState<PendingQuickExpense[]>([]);
  const createMovement = useCreateMovement();

  const refresh = useCallback(async () => {
    setPending(await listPendingQuickExpenses());
  }, []);

  const flush = useCallback(async () => {
    if (!navigator.onLine) return;
    const queued = await listPendingQuickExpenses();
    for (const entry of queued) {
      try {
        await createMovement.mutateAsync({ clientId: entry.clientId, input: entry.input });
        await removePendingQuickExpense(entry.clientId);
      } catch {
        break;
      }
    }
    await refresh();
  }, [createMovement, refresh]);

  useEffect(() => {
    void refresh();
    void flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [flush, refresh]);

  const enqueue = useCallback(
    async (entry: PendingQuickExpense) => {
      await addPendingQuickExpense(entry);
      await refresh();
    },
    [refresh],
  );

  return { pending, enqueue };
}
