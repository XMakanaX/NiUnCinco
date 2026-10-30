import { queryClient } from '@/shared/lib/queryClient';
import { classifyFailure, errorMessage } from '@/shared/offline/classify';
import { getExecutor } from '@/shared/offline/registry';
import { listOps, markOpFailed, removeOp } from '@/shared/offline/queue';
import { setSyncing } from '@/shared/offline/store';
import { OP_KIND, type OpKind } from '@/shared/offline/types';

/** Claves de React Query a invalidar por tipo de operación — mismas que
 * invalidaban los hooks originales en línea (Fases 6/9). Son solo strings,
 * no importan nada de `features`, así que no violan la regla de
 * dependencia (`shared` nunca importa de `features`). */
const INVALIDATE_KEYS: Record<OpKind, string[][]> = {
  [OP_KIND.MOVEMENT]: [['transactions'], ['accounts'], ['cards'], ['dashboard']],
  [OP_KIND.TRANSFER]: [['transactions'], ['accounts'], ['dashboard']],
  [OP_KIND.CARD_PAYMENT]: [['transactions'], ['accounts'], ['cards'], ['card_payments'], ['dashboard']],
  [OP_KIND.GOAL_CONTRIBUTION]: [['goals'], ['goal_contributions']],
  [OP_KIND.RECURRING_PAID]: [
    ['recurring_expenses'],
    ['transactions'],
    ['accounts'],
    ['cards'],
    ['dashboard'],
    ['budgets'],
  ],
};

function invalidateForKind(kind: OpKind) {
  for (const key of INVALIDATE_KEYS[kind] ?? []) {
    void queryClient.invalidateQueries({ queryKey: key });
  }
}

let flushing = false;

/**
 * Recorre la cola del usuario y reintenta cada operación en orden. Un error
 * de red detiene el recorrido ahí (todo lo siguiente sigue pendiente, sin
 * perder nada); un error permanente marca esa operación como `failed` y
 * **sigue con la próxima** — corrige el `break` incondicional de la cola
 * original de quick-expense, que bloqueaba el resto ante cualquier error.
 */
export async function flushQueue(userId: string, opts: { includeFailed?: boolean } = {}): Promise<void> {
  if (flushing) return;
  flushing = true;
  setSyncing(true);
  try {
    const ops = (await listOps(userId)).filter(
      (op) => op.status === 'pending' || (opts.includeFailed && op.status === 'failed'),
    );
    for (const op of ops) {
      const executor = getExecutor(op.kind);
      if (!executor) continue;
      try {
        await executor(op.payload, op.userId);
        await removeOp(op.id);
        invalidateForKind(op.kind);
      } catch (error) {
        const failure = classifyFailure(error);
        if (failure === 'duplicate') {
          await removeOp(op.id);
          invalidateForKind(op.kind);
        } else if (failure === 'network') {
          break;
        } else {
          await markOpFailed(op.id, errorMessage(error));
        }
      }
    }
  } finally {
    setSyncing(false);
    flushing = false;
  }
}
