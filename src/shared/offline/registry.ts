import type { OpKind } from '@/shared/offline/types';

export type Executor = (payload: unknown, userId: string) => Promise<void>;

const executors = new Map<OpKind, Executor>();

/** Registrado una vez desde `src/app/offline/executors.ts` (import de
 * efecto) — necesario porque `shared` no puede importar de `features`. */
export function registerExecutor(kind: OpKind, executor: Executor): void {
  executors.set(kind, executor);
}

export function getExecutor(kind: OpKind): Executor | undefined {
  return executors.get(kind);
}
