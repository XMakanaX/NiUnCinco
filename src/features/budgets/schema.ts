import { z } from 'zod';
import { MAX_MONEY_AMOUNT } from '@/shared/lib/money';

const currency = z.enum(['CRC', 'USD'], { error: 'Elegí una moneda' });

export const budgetSchema = z.object({
  category_id: z.string().uuid().nullable(),
  // Siempre el primer día del mes — la base lo exige con un check
  // (`budgets_period_month_first_day`).
  period_month: z.string().regex(/^\d{4}-\d{2}-01$/, 'Elegí un mes'),
  amount_limit: z.number().positive('Debe ser mayor a 0').max(MAX_MONEY_AMOUNT, 'Importe demasiado grande'),
  currency,
  alert_threshold_pct: z.number().int().min(1).max(100).nullable(),
});
export type BudgetInput = z.infer<typeof budgetSchema>;

export const recurringExpenseSchema = z
  .object({
    name: z.string().trim().min(1, 'Ingresá un nombre').max(80, 'Máximo 80 caracteres'),
    amount: z.number().positive('Debe ser mayor a 0').max(MAX_MONEY_AMOUNT, 'Importe demasiado grande'),
    currency,
    category_id: z.string().uuid().nullable(),
    account_id: z.string().uuid().nullable(),
    card_id: z.string().uuid().nullable(),
    frequency: z.enum(['weekly', 'monthly', 'yearly'], { error: 'Elegí una periodicidad' }),
    next_due_on: z.string().min(1, 'Elegí la próxima fecha'),
    reminder_enabled: z.boolean(),
  })
  .refine((data) => data.account_id !== null || data.card_id !== null, {
    message: 'Elegí una cuenta o tarjeta de origen',
    path: ['account_id'],
  });
export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>;

export const goalSchema = z.object({
  name: z.string().trim().min(1, 'Ingresá un nombre').max(80, 'Máximo 80 caracteres'),
  target_amount: z.number().positive('Debe ser mayor a 0').max(MAX_MONEY_AMOUNT, 'Importe demasiado grande'),
  currency,
  target_date: z.string().nullable(),
});
export type GoalInput = z.infer<typeof goalSchema>;

export const goalContributionSchema = z.object({
  type: z.enum(['contribution', 'withdrawal'], { error: 'Elegí aporte o retiro' }),
  amount: z.number().positive('Debe ser mayor a 0').max(MAX_MONEY_AMOUNT, 'Importe demasiado grande'),
  occurred_on: z.string().min(1, 'Elegí una fecha'),
  notes: z.string().trim().max(200, 'Máximo 200 caracteres').nullable(),
});
export type GoalContributionInput = z.infer<typeof goalContributionSchema>;
