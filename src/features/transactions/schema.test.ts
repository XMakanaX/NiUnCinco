import { describe, expect, it } from 'vitest';
import { cardPaymentSchema, movementSchema, transferSchema } from './schema';

const ACCOUNT_A = '11111111-1111-4111-8111-111111111111';
const ACCOUNT_B = '22222222-2222-4222-8222-222222222222';
const CARD_A = '33333333-3333-4333-8333-333333333333';

describe('movementSchema', () => {
  const base = {
    type: 'expense' as const,
    amount: 5000,
    currency: 'CRC' as const,
    occurred_on: '2026-10-29',
    category_id: null,
    merchant: null,
    notes: null,
    tags: [],
  };

  it('acepta un gasto con cuenta', () => {
    const result = movementSchema.safeParse({ ...base, account_id: ACCOUNT_A, card_id: null });
    expect(result.success).toBe(true);
  });

  it('acepta un gasto con tarjeta', () => {
    const result = movementSchema.safeParse({ ...base, account_id: null, card_id: CARD_A });
    expect(result.success).toBe(true);
  });

  it('rechaza un movimiento sin cuenta ni tarjeta', () => {
    const result = movementSchema.safeParse({ ...base, account_id: null, card_id: null });
    expect(result.success).toBe(false);
  });

  it('rechaza importe negativo o cero', () => {
    const result = movementSchema.safeParse({ ...base, amount: 0, account_id: ACCOUNT_A, card_id: null });
    expect(result.success).toBe(false);
  });
});

describe('transferSchema', () => {
  const base = { amount: 10000, currency: 'CRC' as const, occurred_on: '2026-10-29', notes: null };

  it('acepta una transferencia entre dos cuentas distintas', () => {
    const result = transferSchema.safeParse({ ...base, from_account_id: ACCOUNT_A, to_account_id: ACCOUNT_B });
    expect(result.success).toBe(true);
  });

  it('rechaza transferir a la misma cuenta', () => {
    const result = transferSchema.safeParse({ ...base, from_account_id: ACCOUNT_A, to_account_id: ACCOUNT_A });
    expect(result.success).toBe(false);
  });
});

describe('cardPaymentSchema', () => {
  it('acepta un pago válido', () => {
    const result = cardPaymentSchema.safeParse({
      card_id: CARD_A,
      from_account_id: ACCOUNT_A,
      amount: 25000,
      currency: 'CRC',
      occurred_on: '2026-10-29',
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza importe negativo', () => {
    const result = cardPaymentSchema.safeParse({
      card_id: CARD_A,
      from_account_id: ACCOUNT_A,
      amount: -100,
      currency: 'CRC',
      occurred_on: '2026-10-29',
      notes: null,
    });
    expect(result.success).toBe(false);
  });
});
