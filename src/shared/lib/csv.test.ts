import { describe, expect, it } from 'vitest';
import { detectDelimiter, parseCsv } from './csv';

describe('parseCsv', () => {
  it('separa filas y columnas simples', () => {
    const result = parseCsv('a,b,c\n1,2,3', ',');
    expect(result).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('respeta campos entre comillas con el delimitador adentro', () => {
    const result = parseCsv('"Supermercado, S.A.",1000\n"Soda",500', ',');
    expect(result).toEqual([
      ['Supermercado, S.A.', '1000'],
      ['Soda', '500'],
    ]);
  });

  it('respeta comillas escapadas dobles', () => {
    const result = parseCsv('"Dijo ""hola""",1', ',');
    expect(result).toEqual([['Dijo "hola"', '1']]);
  });

  it('respeta saltos de línea embebidos en un campo', () => {
    const result = parseCsv('"línea 1\nlínea 2",1', ',');
    expect(result).toEqual([['línea 1\nlínea 2', '1']]);
  });

  it('ignora CRLF', () => {
    const result = parseCsv('a,b\r\n1,2\r\n', ',');
    expect(result).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('devuelve lista vacía para archivo vacío', () => {
    expect(parseCsv('', ',')).toEqual([]);
    expect(parseCsv('   \n  ', ',')).toEqual([]);
  });

  it('soporta punto y coma y tab', () => {
    expect(parseCsv('a;b\n1;2', ';')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(parseCsv('a\tb\n1\t2', '\t')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('detectDelimiter', () => {
  it('detecta coma', () => {
    expect(detectDelimiter('fecha,monto,descripcion\n2026-01-01,100,Café')).toBe(',');
  });

  it('detecta punto y coma', () => {
    expect(detectDelimiter('fecha;monto;descripcion\n2026-01-01;100;Café')).toBe(';');
  });

  it('por defecto usa coma si no hay señal clara', () => {
    expect(detectDelimiter('solo una columna\notra fila')).toBe(',');
  });
});
