import { describe, expect, it } from 'vitest';
import { classifyFailure, errorMessage, isNetworkError } from '@/shared/offline/classify';

describe('isNetworkError', () => {
  it('detecta TypeError como error de red (fetch fallido)', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('detecta un mensaje que menciona fetch/network', () => {
    expect(isNetworkError({ message: 'NetworkError when attempting to fetch resource' })).toBe(true);
  });

  it('no confunde un error de validación con uno de red', () => {
    expect(isNetworkError({ message: 'El importe debe ser mayor a 0' })).toBe(false);
  });
});

describe('classifyFailure', () => {
  it('clasifica unique_violation (23505) como duplicate', () => {
    expect(classifyFailure({ code: '23505', message: 'duplicate key' })).toBe('duplicate');
  });

  it('clasifica un TypeError como network', () => {
    expect(classifyFailure(new TypeError('Failed to fetch'))).toBe('network');
  });

  it('clasifica cualquier otro error como permanent', () => {
    expect(classifyFailure({ code: '23514', message: 'check constraint violated' })).toBe('permanent');
  });
});

describe('errorMessage', () => {
  it('extrae el mensaje de un error con forma de PostgrestError', () => {
    expect(errorMessage({ message: 'insufficient goal balance' })).toBe('insufficient goal balance');
  });

  it('devuelve un mensaje genérico si no hay `message`', () => {
    expect(errorMessage('algo raro')).toBe('Error desconocido');
  });
});
