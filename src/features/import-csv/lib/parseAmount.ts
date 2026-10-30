export type DecimalSeparator = ',' | '.';

/**
 * Parsea un importe de texto con separador decimal explícito (nunca
 * asumido — plan Fase 11: "no supongás el mismo formato"). El separador
 * de miles se infiere como el símbolo contrario y se descarta. Soporta
 * paréntesis como negativo (`(1.000,00)`, formato contable común en
 * exportes bancarios) y símbolos de moneda/espacios alrededor del número.
 * Devuelve `null` si el texto no es un número válido — nunca inventa 0.
 */
export function parseAmount(raw: string, decimalSeparator: DecimalSeparator): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  const isParenNegative = /^\(.*\)$/.test(trimmed);
  const stripped = trimmed
    .replace(/^\(|\)$/g, '')
    .replace(/[^\d,.\-+]/g, '')
    .trim();
  if (stripped === '') return null;

  const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
  const withoutThousands = stripped.split(thousandsSeparator).join('');
  const normalized =
    decimalSeparator === ','
      ? withoutThousands.replace(',', '.')
      : withoutThousands;

  if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) return null;

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;

  return isParenNegative ? -Math.abs(value) : value;
}
