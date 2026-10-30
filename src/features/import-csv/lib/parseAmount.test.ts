import { describe, expect, it } from 'vitest';
import { parseAmount } from './parseAmount';

describe('parseAmount', () => {
  it('parsea formato con coma decimal (CR/LatAm)', () => {
    expect(parseAmount('1.000,50', ',')).toBe(1000.5);
    expect(parseAmount('1000,50', ',')).toBe(1000.5);
    expect(parseAmount('500', ',')).toBe(500);
  });

  it('parsea formato con punto decimal (US)', () => {
    expect(parseAmount('1,000.50', '.')).toBe(1000.5);
    expect(parseAmount('1000.50', '.')).toBe(1000.5);
  });

  it('respeta el signo negativo', () => {
    expect(parseAmount('-1.000,50', ',')).toBe(-1000.5);
    expect(parseAmount('-500', ',')).toBe(-500);
  });

  it('interpreta paréntesis como negativo (formato contable)', () => {
    expect(parseAmount('(1.000,50)', ',')).toBe(-1000.5);
  });

  it('ignora símbolos de moneda y espacios', () => {
    expect(parseAmount('₡ 1.000,50', ',')).toBe(1000.5);
    expect(parseAmount('$1,000.50', '.')).toBe(1000.5);
  });

  it('devuelve null para texto no numérico', () => {
    expect(parseAmount('n/a', ',')).toBeNull();
    expect(parseAmount('', ',')).toBeNull();
    expect(parseAmount('   ', ',')).toBeNull();
  });
});
