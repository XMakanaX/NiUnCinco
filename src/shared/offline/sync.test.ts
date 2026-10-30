import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { addOp, clearAllOps, listOps } from '@/shared/offline/queue';
import { registerExecutor } from '@/shared/offline/registry';
import { flushQueue } from '@/shared/offline/sync';
import { OP_KIND } from '@/shared/offline/types';

beforeEach(async () => {
  await clearAllOps();
});

describe('flushQueue', () => {
  it('éxito: borra la operación de la cola', async () => {
    registerExecutor(OP_KIND.MOVEMENT, async () => {});
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: {} });

    await flushQueue('user-a');

    expect(await listOps('user-a')).toHaveLength(0);
  });

  it('duplicate (reintento con el mismo client_id): se descarta en silencio, no se reintenta de nuevo', async () => {
    registerExecutor(OP_KIND.MOVEMENT, async () => {
      throw { code: '23505', message: 'duplicate key value violates unique constraint' };
    });
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: {} });

    await flushQueue('user-a');

    expect(await listOps('user-a')).toHaveLength(0);
  });

  it('error permanente: marca esa operación `failed` y sigue con la siguiente (no bloquea la cola)', async () => {
    registerExecutor(OP_KIND.GOAL_CONTRIBUTION, async () => {
      throw { message: 'insufficient goal balance' };
    });
    registerExecutor(OP_KIND.MOVEMENT, async () => {});

    await addOp({ userId: 'user-a', kind: OP_KIND.GOAL_CONTRIBUTION, payload: {} });
    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: {} });

    await flushQueue('user-a');

    const ops = await listOps('user-a');
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ kind: OP_KIND.GOAL_CONTRIBUTION, status: 'failed' });
  });

  it('error de red: detiene el recorrido ahí — nada se pierde, lo siguiente sigue pendiente', async () => {
    registerExecutor(OP_KIND.MOVEMENT, async () => {
      throw new TypeError('Failed to fetch');
    });
    registerExecutor(OP_KIND.TRANSFER, async () => {});

    await addOp({ userId: 'user-a', kind: OP_KIND.MOVEMENT, payload: {} });
    await addOp({ userId: 'user-a', kind: OP_KIND.TRANSFER, payload: {} });

    await flushQueue('user-a');

    const ops = await listOps('user-a');
    expect(ops).toHaveLength(2);
    expect(ops.every((op) => op.status === 'pending')).toBe(true);
  });

  it('includeFailed: reintentar solo retoma las `failed` cuando se pide explícitamente', async () => {
    let attempt = 0;
    registerExecutor(OP_KIND.CARD_PAYMENT, async () => {
      attempt += 1;
      if (attempt === 1) throw { message: 'error real' };
    });
    await addOp({ userId: 'user-a', kind: OP_KIND.CARD_PAYMENT, payload: {} });

    await flushQueue('user-a');
    expect((await listOps('user-a'))[0]).toMatchObject({ status: 'failed' });

    await flushQueue('user-a', { includeFailed: true });
    expect(await listOps('user-a')).toHaveLength(0);
  });
});
