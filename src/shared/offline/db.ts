import { openDB, type IDBPDatabase } from 'idb';
import type { PendingOp } from '@/shared/offline/types';

const DB_NAME = 'niuncinco-offline';
const STORE = 'pending_ops';
const USER_INDEX = 'by_userId';

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getOfflineDb() {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: 'id' });
      store.createIndex(USER_INDEX, 'userId');
    },
  });
  return dbPromise;
}

export { STORE as PENDING_OPS_STORE, USER_INDEX as PENDING_OPS_USER_INDEX };
export type { PendingOp };
