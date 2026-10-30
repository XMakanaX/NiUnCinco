import { openDB, type IDBPDatabase } from 'idb';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const DB_NAME = 'niuncinco-query-cache';
const STORE = 'cache';
const KEY = 'client';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE);
    },
  });
  return dbPromise;
}

/**
 * Persister de TanStack Query sobre IndexedDB vía `idb` (ya instalada,
 * sin dependencia de storage nueva). Lectura offline en frío (plan Fase
 * 13): el cache sobrevive a cerrar la pestaña, pero nunca es la fuente de
 * verdad — se borra completo al cerrar sesión o cambiar de usuario (ver
 * `src/shared/lib/auth.ts`).
 */
export function createIdbPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      const db = await getDb();
      await db.put(STORE, client, KEY);
    },
    restoreClient: async () => {
      const db = await getDb();
      return db.get(STORE, KEY);
    },
    removeClient: async () => {
      const db = await getDb();
      await db.delete(STORE, KEY);
    },
  };
}

export async function clearPersistedQueryCache(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
}
