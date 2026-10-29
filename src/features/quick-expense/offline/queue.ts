import { openDB, type IDBPDatabase } from 'idb';
import type { MovementInput } from '@/features/transactions/schema';

export interface PendingQuickExpense {
  clientId: string;
  input: MovementInput;
  createdAt: string;
}

const DB_NAME = 'quick-expense-queue';
const STORE = 'pending';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'clientId' });
    },
  });
  return dbPromise;
}

export async function addPendingQuickExpense(entry: PendingQuickExpense): Promise<void> {
  const db = await getDb();
  await db.put(STORE, entry);
}

export async function removePendingQuickExpense(clientId: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, clientId);
}

export async function listPendingQuickExpenses(): Promise<PendingQuickExpense[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

/**
 * Error de red (sin conexión o fetch fallido) vs. error real del servidor
 * (validación, RLS, etc.) — solo el primero va a la cola offline (regla
 * global 12 del plan maestro: nunca mostrar como sincronizado algo que no
 * confirmó el servidor, pero tampoco encolar errores reales como si fueran
 * de conexión).
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '');
    return /fetch|network/i.test(message);
  }
  return false;
}
