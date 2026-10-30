import { getOfflineDb, PENDING_OPS_STORE, PENDING_OPS_USER_INDEX } from '@/shared/offline/db';
import type { OpKind, PendingOp } from '@/shared/offline/types';

export const QUEUE_CHANGED_EVENT = 'niuncinco:offline-queue-changed';

function notifyChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
}

let opSeq = 0;

export async function addOp(op: { userId: string; kind: OpKind; payload: unknown }): Promise<void> {
  const db = await getOfflineDb();
  const entry: PendingOp = {
    id: crypto.randomUUID(),
    userId: op.userId,
    kind: op.kind,
    payload: op.payload,
    createdAt: new Date().toISOString(),
    seq: opSeq++,
    status: 'pending',
  };
  await db.add(PENDING_OPS_STORE, entry);
  notifyChanged();
}

export async function listOps(userId: string): Promise<PendingOp[]> {
  const db = await getOfflineDb();
  const ops = await db.getAllFromIndex(PENDING_OPS_STORE, PENDING_OPS_USER_INDEX, userId);
  return ops.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.seq - b.seq);
}

export async function removeOp(id: string): Promise<void> {
  const db = await getOfflineDb();
  await db.delete(PENDING_OPS_STORE, id);
  notifyChanged();
}

export async function markOpFailed(id: string, message: string): Promise<void> {
  const db = await getOfflineDb();
  const op = await db.get(PENDING_OPS_STORE, id);
  if (!op) return;
  await db.put(PENDING_OPS_STORE, { ...op, status: 'failed', lastError: message } satisfies PendingOp);
  notifyChanged();
}

export async function discardOp(id: string): Promise<void> {
  await removeOp(id);
}

export async function clearUserOps(userId: string): Promise<void> {
  const db = await getOfflineDb();
  const tx = db.transaction(PENDING_OPS_STORE, 'readwrite');
  const index = tx.store.index(PENDING_OPS_USER_INDEX);
  for await (const cursor of index.iterate(userId)) {
    await cursor.delete();
  }
  await tx.done;
  notifyChanged();
}

export async function clearAllOps(): Promise<void> {
  const db = await getOfflineDb();
  await db.clear(PENDING_OPS_STORE);
  notifyChanged();
}
