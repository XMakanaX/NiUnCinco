import { describe, expect, it } from 'vitest';
import { budgetSchema, recurringExpenseSchema, goalSchema, goalContributionSchema } from './schema';

describe('budgetSchema', () => {
  it('acepta un presupuesto general válido', () => {
    const result = budgetSchema.safeParse({
      category_id: null,
      period_month: '2026-10-01',
      amount_limit: 100000,
      currency: 'CRC',
      alert_threshold_pct: 80,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza un mes que no es el primer día', () => {
    const result = budgetSchema.safeParse({
      category_id: null,
      period_month: '2026-10-15',
      amount_limit: 100000,
      currency: 'CRC',
      alert_threshold_pct: null,
    });
    expect(result.success).toBe(false);
  });

  it('rechaza límite negativo', () => {
    const result = budgetSchema.safeParse({
      category_id: null,
      period_month: '2026-10-01',
      amount_limit: -1,
      currency: 'CRC',
      alert_threshold_pct: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('recurringExpenseSchema', () => {
  const base = {
    name: 'Netflix',
    amount: 7000,
    currency: 'CRC' as const,
    category_id: null,
    frequency: 'monthly' as const,
    next_due_on: '2026-11-01',
    reminder_enabled: false,
  };

  const uuid = '11111111-1111-4111-8111-111111111111';

  it('acepta con cuenta de origen', () => {
    const result = recurringExpenseSchema.safeParse({ ...base, account_id: uuid, card_id: null });
    expect(result.success).toBe(true);
  });

  it('acepta con tarjeta de origen', () => {
    const result = recurringExpenseSchema.safeParse({ ...base, account_id: null, card_id: uuid });
    expect(result.success).toBe(true);
  });

  it('rechaza sin cuenta ni tarjeta de origen', () => {
    const result = recurringExpenseSchema.safeParse({ ...base, account_id: null, card_id: null });
    expect(result.success).toBe(false);
  });
});

describe('goalSchema', () => {
  it('acepta una meta sin fecha objetivo', () => {
    const result = goalSchema.safeParse({
      name: 'Fondo de emergencia',
      target_amount: 500000,
      currency: 'CRC',
      target_date: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza importe objetivo cero', () => {
    const result = goalSchema.safeParse({
      name: 'Vacaciones',
      target_amount: 0,
      currency: 'CRC',
      target_date: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('goalContributionSchema', () => {
  it('acepta un retiro válido', () => {
    const result = goalContributionSchema.safeParse({
      type: 'withdrawal',
      amount: 10000,
      occurred_on: '2026-10-29',
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza importe negativo', () => {
    const result = goalContributionSchema.safeParse({
      type: 'contribution',
      amount: -5,
      occurred_on: '2026-10-29',
      notes: null,
    });
    expect(result.success).toBe(false);
  });
});
