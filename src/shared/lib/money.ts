export type CurrencyCode = 'CRC' | 'USD';

const LOCALE = 'es-CR';

/**
 * Formatea un monto en CRC o USD con Intl.NumberFormat. Nunca concatenar
 * símbolos a mano (regla de negocio #8 del plan): el formato de moneda
 * depende del locale y Intl ya lo resuelve correctamente.
 */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
  }).format(amount);
}

/**
 * Convierte un monto entre monedas usando una tasa ya conocida (congelada
 * por transacción, nunca recalculada — ver plan §4.4 regla #5).
 */
export function convert(amount: number, fxRate: number): number {
  return roundToCents(amount * fxRate);
}

/** Redondeo a 2 decimales sin arrastrar error de punto flotante visible. */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}
