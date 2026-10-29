import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { creditCardCycle, daysUntil, monthLabel, monthRange, toDateOnly } from './date';

describe('toDateOnly', () => {
  it('no salta de día cerca de medianoche UTC (borde America/Costa_Rica, UTC-6)', () => {
    // 2025-01-01 04:30 UTC = 2024-12-31 22:30 en Costa Rica: debe quedar en 2024-12-31.
    const date = new Date('2025-01-01T04:30:00Z');
    expect(toDateOnly(date)).toBe('2024-12-31');
  });

  it('no salta de mes en fin de mes', () => {
    // 2025-02-01 05:00 UTC = 2025-01-31 23:00 en Costa Rica.
    const date = new Date('2025-02-01T05:00:00Z');
    expect(toDateOnly(date)).toBe('2025-01-31');
  });
});

describe('monthRange', () => {
  beforeEach(() => {
    // 2026-03-01 04:30 UTC = 2026-02-28 22:30 en Costa Rica: "hoy" cae en febrero.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T04:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mes actual (0) cubre todo febrero, un año bisiesto', () => {
    expect(monthRange(0)).toEqual({ from: '2026-02-01', to: '2026-02-28', year: 2026, month: 2 });
  });

  it('retrocede de año al pedir meses del año anterior', () => {
    expect(monthRange(2)).toEqual({ from: '2025-12-01', to: '2025-12-31', year: 2025, month: 12 });
  });
});

describe('monthLabel', () => {
  it('formatea mes y año en español', () => {
    expect(monthLabel(2026, 2)).toBe('febrero de 2026');
  });
});

describe('creditCardCycle', () => {
  it('antes del corte: periodo abierto termina este mes, vencimiento el mes siguiente (dueDay <= statementDay)', () => {
    // Corte día 20, vencimiento día 5 (del mes siguiente al corte).
    expect(creditCardCycle(20, 5, '2026-10-10')).toEqual({
      periodStart: '2026-09-21',
      periodEnd: '2026-10-20',
      dueDate: '2026-11-05',
    });
  });

  it('después del corte: el periodo abierto cierra el mes siguiente', () => {
    expect(creditCardCycle(20, 5, '2026-10-25')).toEqual({
      periodStart: '2026-10-21',
      periodEnd: '2026-11-20',
      dueDate: '2026-12-05',
    });
  });

  it('vencimiento el mismo mes del corte cuando dueDay > statementDay', () => {
    expect(creditCardCycle(5, 20, '2026-10-03')).toEqual({
      periodStart: '2026-09-06',
      periodEnd: '2026-10-05',
      dueDate: '2026-10-20',
    });
  });

  it('corte día 31 se acota al último día de meses más cortos (febrero)', () => {
    // "Hoy" cae antes del corte de febrero (28): el periodo termina el 28/02.
    expect(creditCardCycle(31, 10, '2026-02-15').periodEnd).toBe('2026-02-28');
  });
});

describe('daysUntil', () => {
  it('cuenta días calendario hacia adelante', () => {
    expect(daysUntil('2026-11-05', '2026-10-30')).toBe(6);
  });

  it('devuelve negativo si la fecha ya pasó', () => {
    expect(daysUntil('2026-10-01', '2026-10-30')).toBe(-29);
  });

  it('devuelve 0 el mismo día', () => {
    expect(daysUntil('2026-10-30', '2026-10-30')).toBe(0);
  });
});
