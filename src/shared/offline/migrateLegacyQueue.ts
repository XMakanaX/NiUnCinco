import { deleteDB, openDB } from 'idb';
import { addOp } from '@/shared/offline/queue';
import { OP_KIND } from '@/shared/offline/types';

const LEGACY_DB_NAME = 'quick-expense-queue';
const LEGACY_STORE = 'pending';

interface LegacyEntry {
  clientId: string;
  input: unknown;
  createdAt: string;
}

/**
 * La Fase 7 guardaba los gastos rápidos sin conexión en su propia base
 * IndexedDB (`quick-expense-queue`), separada de la cola genérica de esta
 * fase. Se migran una sola vez para no perder gastos pendientes de un
 * dispositivo real, y se borra la base vieja. `indexedDB.databases()` no
 * existe en todos los navegadores (p. ej. Safari viejo) — si falta, se
 * omite la migración en vez de fallar: un gasto que ya estaba pendiente
 * ahí simplemente no aparece hasta que el usuario reintente desde ese
 * mismo dispositivo con un navegador que sí lo soporte.
 */
export async function migrateLegacyQuickExpenseQueue(userId: string): Promise<void> {
  if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') return;
  const databases = await indexedDB.databases();
  if (!databases.some((d) => d.name === LEGACY_DB_NAME)) return;

  const legacyDb = await openDB(LEGACY_DB_NAME, 1);
  if (!legacyDb.objectStoreNames.contains(LEGACY_STORE)) {
    legacyDb.close();
    await deleteDB(LEGACY_DB_NAME);
    return;
  }
  const entries = (await legacyDb.getAll(LEGACY_STORE)) as LegacyEntry[];
  for (const entry of entries) {
    await addOp({
      userId,
      kind: OP_KIND.MOVEMENT,
      payload: { clientId: entry.clientId, input: entry.input },
    });
  }
  legacyDb.close();
  await deleteDB(LEGACY_DB_NAME);
}
