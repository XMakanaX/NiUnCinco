import { describe, expect, it } from 'vitest';
import { accountSchema, cardSchema } from './schema';

describe('accountSchema', () => {
  it('acepta una cuenta válida', () => {
    const result = accountSchema.safeParse({
      name: 'Ahorros BAC',
      type: 'bank',
      currency: 'CRC',
      color: '#0e3b36',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza nombre vacío', () => {
    const result = accountSchema.safeParse({
      name: '',
      type: 'cash',
      currency: 'CRC',
      color: null,
    });
    expect(result.success).toBe(false);
  });

  it('rechaza tipo de cuenta inválido', () => {
    const result = accountSchema.safeParse({
      name: 'Billetera',
      type: 'crypto',
      currency: 'CRC',
      color: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('cardSchema', () => {
  const base = {
    name: 'Visa BAC',
    bank: 'BAC',
    account_id: null,
    currency: 'CRC' as const,
    color: null,
  };

  it('acepta débito sin límite ni fechas', () => {
    const result = cardSchema.safeParse({
      ...base,
      card_type: 'debit',
      credit_limit: null,
      statement_day: null,
      due_day: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza débito con límite de crédito', () => {
    const result = cardSchema.safeParse({
      ...base,
      card_type: 'debit',
      credit_limit: 500000,
      statement_day: null,
      due_day: null,
    });
    expect(result.success).toBe(false);
  });

  it('rechaza crédito sin límite ni fechas', () => {
    const result = cardSchema.safeParse({
      ...base,
      card_type: 'credit',
      credit_limit: null,
      statement_day: null,
      due_day: null,
    });
    expect(result.success).toBe(false);
  });

  it('acepta crédito con límite, corte y vencimiento', () => {
    const result = cardSchema.safeParse({
      ...base,
      card_type: 'credit',
      credit_limit: 500000,
      statement_day: 15,
      due_day: 5,
    });
    expect(result.success).toBe(true);
  });
});
