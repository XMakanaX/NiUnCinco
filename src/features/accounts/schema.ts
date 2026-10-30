import { z } from 'zod';
import { MAX_MONEY_AMOUNT } from '@/shared/lib/money';

const name = z.string().trim().min(1, 'Ingresá un nombre').max(60, 'Máximo 60 caracteres');
const currency = z.enum(['CRC', 'USD'], { error: 'Elegí una moneda' });
const color = z.string().nullable();

export const accountSchema = z.object({
  name,
  type: z.enum(['cash', 'bank', 'other'], { error: 'Elegí un tipo de cuenta' }),
  currency,
  color,
});
export type AccountInput = z.infer<typeof accountSchema>;

export const cardSchema = z
  .object({
    name,
    card_type: z.enum(['debit', 'credit'], { error: 'Elegí débito o crédito' }),
    bank: z.string().trim().max(60, 'Máximo 60 caracteres').nullable(),
    account_id: z.string().uuid().nullable(),
    currency,
    color,
    // Importes/plazos solo aplican a crédito — se validan con .refine abajo
    // para no bloquear al elegir débito (regla global: no inventar
    // restricciones que la base no exige para ese caso).
    credit_limit: z
      .number()
      .positive('Debe ser mayor a 0')
      .max(MAX_MONEY_AMOUNT, 'Importe demasiado grande')
      .nullable(),
    statement_day: z.number().int().min(1).max(31).nullable(),
    due_day: z.number().int().min(1).max(31).nullable(),
  })
  .refine((data) => data.card_type === 'credit' || data.credit_limit === null, {
    message: 'Solo las tarjetas de crédito tienen límite',
    path: ['credit_limit'],
  })
  .refine((data) => data.card_type !== 'credit' || data.credit_limit !== null, {
    message: 'Ingresá el límite de crédito',
    path: ['credit_limit'],
  })
  .refine((data) => data.card_type !== 'credit' || data.statement_day !== null, {
    message: 'Ingresá la fecha de corte',
    path: ['statement_day'],
  })
  .refine((data) => data.card_type !== 'credit' || data.due_day !== null, {
    message: 'Ingresá la fecha de vencimiento',
    path: ['due_day'],
  });
export type CardInput = z.infer<typeof cardSchema>;
