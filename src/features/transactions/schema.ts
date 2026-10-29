import { z } from 'zod';

const currency = z.enum(['CRC', 'USD'], { error: 'Elegí una moneda' });
const amount = z.number({ error: 'Ingresá un importe' }).positive('El importe debe ser mayor a 0');
const occurredOn = z.string().min(1, 'Elegí una fecha');
const notes = z.string().trim().max(280, 'Máximo 280 caracteres').nullable();
const tags = z.array(z.string().trim().min(1).max(30)).max(10, 'Máximo 10 etiquetas');

/** Ingreso o gasto: una sola fila en `transactions`, ya atómica. */
export const movementSchema = z
  .object({
    type: z.enum(['income', 'expense'], { error: 'Elegí ingreso o gasto' }),
    amount,
    currency,
    occurred_on: occurredOn,
    account_id: z.string().uuid().nullable(),
    card_id: z.string().uuid().nullable(),
    category_id: z.string().uuid().nullable(),
    merchant: z.string().trim().max(80, 'Máximo 80 caracteres').nullable(),
    notes,
    tags,
  })
  .refine((data) => data.account_id !== null || data.card_id !== null, {
    message: 'Elegí una cuenta o una tarjeta',
    path: ['account_id'],
  });
export type MovementInput = z.infer<typeof movementSchema>;

/** Transferencia entre cuentas propias: no es ingreso ni gasto. */
export const transferSchema = z
  .object({
    from_account_id: z.string().uuid({ error: 'Elegí la cuenta de origen' }),
    to_account_id: z.string().uuid({ error: 'Elegí la cuenta de destino' }),
    amount,
    currency,
    occurred_on: occurredOn,
    notes,
  })
  .refine((data) => data.from_account_id !== data.to_account_id, {
    message: 'Elegí dos cuentas distintas',
    path: ['to_account_id'],
  });
export type TransferInput = z.infer<typeof transferSchema>;

/** Pago de tarjeta de crédito: reduce deuda y saldo de la cuenta de origen. */
export const cardPaymentSchema = z.object({
  card_id: z.string().uuid({ error: 'Elegí la tarjeta' }),
  from_account_id: z.string().uuid({ error: 'Elegí la cuenta de origen' }),
  amount,
  currency,
  occurred_on: occurredOn,
  notes,
});
export type CardPaymentInput = z.infer<typeof cardPaymentSchema>;
