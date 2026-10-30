/**
 * Cola de sincronización genérica (Fase 13). `shared` nunca importa de
 * `features` (regla de dependencia del proyecto), así que `payload` queda
 * tipado como `unknown` aquí: quien conoce la forma real es el executor
 * registrado desde la capa `app` (ver `src/app/offline/executors.ts`).
 *
 * Solo se encolan operaciones que tienen clave de idempotencia en la base
 * (`client_id` + `unique(user_id, client_id)`): un reintento repetido nunca
 * duplica la fila. El resto de las mutaciones (CRUD de cuentas, tarjetas,
 * categorías, presupuestos, metas, recurrentes, anulaciones, perfil) no
 * tiene esa garantía y por eso no se encola — fallan offline con un
 * mensaje explícito en vez de arriesgar un duplicado.
 */
export const OP_KIND = {
  MOVEMENT: 'movement',
  TRANSFER: 'transfer',
  CARD_PAYMENT: 'card_payment',
  GOAL_CONTRIBUTION: 'goal_contribution',
  RECURRING_PAID: 'recurring_paid',
} as const;

export type OpKind = (typeof OP_KIND)[keyof typeof OP_KIND];

export interface PendingOp {
  id: string;
  userId: string;
  kind: OpKind;
  payload: unknown;
  createdAt: string;
  /** Contador monotónico — desempata `createdAt` cuando dos operaciones se encolan en el mismo milisegundo. */
  seq: number;
  status: 'pending' | 'failed';
  lastError?: string;
}
