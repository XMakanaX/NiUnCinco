import { describe, expect, it } from 'vitest';
import { parseDateWithFormat } from './parseDate';

describe('parseDateWithFormat', () => {
  it('parsea YYYY-MM-DD', () => {
    expect(parseDateWithFormat('2026-10-30', 'YYYY-MM-DD')).toBe('2026-10-30');
  });

  it('parsea DD/MM/YYYY', () => {
    expect(parseDateWithFormat('30/10/2026', 'DD/MM/YYYY')).toBe('2026-10-30');
  });

  it('parsea MM/DD/YYYY', () => {
    expect(parseDateWithFormat('10/30/2026', 'MM/DD/YYYY')).toBe('2026-10-30');
  });

  it('parsea con guion', () => {
    expect(parseDateWithFormat('30-10-2026', 'DD-MM-YYYY')).toBe('2026-10-30');
  });

  it('rechaza fecha inexistente (31 de febrero)', () => {
    expect(parseDateWithFormat('31/02/2026', 'DD/MM/YYYY')).toBeNull();
  });

  it('rechaza mes fuera de rango', () => {
    expect(parseDateWithFormat('15/13/2026', 'DD/MM/YYYY')).toBeNull();
  });

  it('rechaza texto mal formado', () => {
    expect(parseDateWithFormat('no-es-fecha', 'YYYY-MM-DD')).toBeNull();
    expect(parseDateWithFormat('', 'YYYY-MM-DD')).toBeNull();
  });

  it('respeta año bisiesto', () => {
    expect(parseDateWithFormat('29/02/2028', 'DD/MM/YYYY')).toBe('2028-02-29');
    expect(parseDateWithFormat('29/02/2026', 'DD/MM/YYYY')).toBeNull();
  });
});
