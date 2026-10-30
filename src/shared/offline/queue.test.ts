import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  addOp,
  clearAllOps,
  clearUserOps,
  discardOp,
  listOps,
  markOpFailed,
  removeOp,
} from '@/shared/offline/queue';
import { OP_KIND } from '@/shared/offline/types';

beforeEach(async () => {
  await clearAllOps();
});

describe('addOp / listOps', () => {
  it('encola una operación y la devuelve al listar ese usuario', async () => {
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: { clientId: '1' } });
    const ops = await listOps('user-a');
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ userId: 'user-a', kind: OP_KIND.MOVEMENT, status: 'pending' });
  });

  it('nunca mezcla operaciones de usuarios distintos', async () => {
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: {} });
    await addOp({ userId: 'user-b', kind: OP_KIND.MOVEMENT, payload: {} });
    expect(await listOps('user-a')).toHaveLength(1);
    expect(await listOps('user-b')).toHaveLength(1);
  });

  it('ordena por fecha de creación ascendente', async () => {
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: { n: 1 } });
    await addOp({ userId: 'user-a', kind: OP_KIND.TRANSFER, payload: { n: 2 } });
    const ops = await listOps('user-a');
    expect(ops.map((op) => op.kind)).toEqual([OP_KIND.MOVEMENT, OP_KIND.TRANSFER]);
  });
});

describe('removeOp / markOpFailed / discardOp', () => {
  it('removeOp la quita de la lista', async () => {
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: {} });
    const [op] = await listOps('user-a');
    await removeOp(op!.id);
    expect(await listOps('user-a')).toHaveLength(0);
  });

  it('markOpFailed la marca `failed` con el mensaje, sin borrarla', async () => {
    await addOp({ userId: 'user-a', kind: OP_KIND.GOAL_CONTRIBUTION, payload: {} });
    const [op] = await listOps('user-a');
    await markOpFailed(op!.id, 'insufficient goal balance');
    const [updated] = await listOps('user-a');
    expect(updated).toMatchObject({ status: 'failed', lastError: 'insufficient goal balance' });
  });

  it('discardOp descarta una operación fallida', async () => {
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: {} });
    const [op] = await listOps('user-a');
    await markOpFailed(op!.id, 'error');
    await discardOp(op!.id);
    expect(await listOps('user-a')).toHaveLength(0);
  });
});

describe('clearUserOps / clearAllOps', () => {
  it('clearUserOps solo borra las del usuario indicado', async () => {
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: {} });
    await addOp({ userId: 'user-b', kind: OP_KIND.MOVEMENT, payload: {} });
    await clearUserOps('user-a');
    expect(await listOps('user-a')).toHaveLength(0);
    expect(await listOps('user-b')).toHaveLength(1);
  });

  it('clearAllOps deja la base vacía para todos los usuarios', async () => {
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: {} });
    await addOp({ userId: 'user-b', kind: OP_KIND.MOVEMENT, payload: {} });
    await clearAllOps();
    expect(await listOps('user-a')).toHaveLength(0);
    expect(await listOps('user-b')).toHaveLength(0);
  });
});
