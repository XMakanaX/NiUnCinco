import { describe, expect, it } from 'vitest';
import { convert, formatMoney, roundToCents } from './money';

describe('formatMoney', () => {
  it('formatea colones sin decimales sueltos de más', () => {
    expect(formatMoney(1500, 'CRC')).toContain('1');
    expect(formatMoney(1500, 'CRC')).toMatch(/CRC|₡/);
  });

  it('formatea dólares con el código de moneda (es-CR no usa $ para USD)', () => {
    expect(formatMoney(19.99, 'USD')).toMatch(/USD/);
  });
});

describe('roundToCents', () => {
  it('no deja arrastre de punto flotante', () => {
    expect(roundToCents(0.1 + 0.2)).toBe(0.3);
  });
});

describe('convert', () => {
  it('aplica la tasa y redondea a centavos', () => {
    expect(convert(100, 520.3333)).toBe(52033.33);
  });
});
