import { describe, expect, it } from 'vitest';
import { validateRows } from './validateRows';
import type { ImportMapping } from '../schema';

const baseMapping: ImportMapping = {
  accountId: '11111111-1111-4111-8111-111111111111',
  hasHeaderRow: true,
  dateColumn: 0,
  dateFormat: 'DD/MM/YYYY',
  descriptionColumn: 1,
  amountColumn: 2,
  decimalSeparator: ',',
  currencyColumn: -1,
  defaultCurrency: 'CRC',
  signConvention: 'negative-expense',
  typeColumn: -1,
  expenseTypeValues: '',
  incomeTypeValues: '',
};

describe('validateRows', () => {
  it('clasifica negativo como gasto y positivo como ingreso', () => {
    const { valid, invalid } = validateRows(
      [
        ['30/10/2026', 'Soda', '-1.000,50'],
        ['29/10/2026', 'Salario', '500.000'],
      ],
      baseMapping,
      1,
    );
    expect(invalid).toEqual([]);
    expect(valid).toEqual([
      { rowNumber: 2, occurred_on: '2026-10-30', amount: 1000.5, type: 'expense', currency: 'CRC', merchant: 'Soda' },
      { rowNumber: 3, occurred_on: '2026-10-29', amount: 500000, type: 'income', currency: 'CRC', merchant: 'Salario' },
    ]);
  });

  it('rechaza fecha inválida sin descartar otras filas', () => {
    const { valid, invalid } = validateRows(
      [
        ['31/02/2026', 'Malo', '-100'],
        ['30/10/2026', 'Bueno', '-100'],
      ],
      baseMapping,
      1,
    );
    expect(valid).toHaveLength(1);
    expect(invalid).toHaveLength(1);
    expect(invalid[0]?.reason).toMatch(/Fecha inválida/);
  });

  it('rechaza importe cero', () => {
    const { invalid } = validateRows([['30/10/2026', 'x', '0']], baseMapping, 1);
    expect(invalid).toHaveLength(1);
  });

  it('usa columna de tipo cuando signConvention es type-column', () => {
    const mapping: ImportMapping = {
      ...baseMapping,
      signConvention: 'type-column',
      typeColumn: 3,
      expenseTypeValues: 'débito, gasto',
      incomeTypeValues: 'crédito, ingreso',
    };
    const { valid, invalid } = validateRows(
      [
        ['30/10/2026', 'Soda', '1000', 'Débito'],
        ['30/10/2026', 'Salario', '1000', 'Crédito'],
        ['30/10/2026', 'Raro', '1000', 'quién sabe'],
      ],
      mapping,
      1,
    );
    expect(valid).toHaveLength(2);
    expect(valid[0]?.type).toBe('expense');
    expect(valid[1]?.type).toBe('income');
    expect(invalid).toHaveLength(1);
    expect(invalid[0]?.reason).toMatch(/No se pudo determinar/);
  });

  it('all-expense fuerza gasto sin importar el signo', () => {
    const mapping: ImportMapping = { ...baseMapping, signConvention: 'all-expense' };
    const { valid } = validateRows([['30/10/2026', 'x', '1000']], mapping, 1);
    expect(valid[0]?.type).toBe('expense');
  });

  it('valida moneda de columna explícita', () => {
    const mapping: ImportMapping = { ...baseMapping, currencyColumn: 3 };
    const { valid, invalid } = validateRows(
      [
        ['30/10/2026', 'x', '-100', 'USD'],
        ['30/10/2026', 'y', '-100', 'EUR'],
      ],
      mapping,
      1,
    );
    expect(valid).toHaveLength(1);
    expect(valid[0]?.currency).toBe('USD');
    expect(invalid).toHaveLength(1);
    expect(invalid[0]?.reason).toMatch(/Moneda desconocida/);
  });

  it('numera filas considerando el encabezado', () => {
    const { valid } = validateRows([['30/10/2026', 'x', '-100']], baseMapping, 1);
    expect(valid[0]?.rowNumber).toBe(2);
  });
});
