export const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MM-DD-YYYY'] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

/**
 * Convierte una fecha de texto del CSV (según el formato elegido por el
 * usuario — nunca adivinado) a `YYYY-MM-DD`. A diferencia de
 * `shared/lib/date.ts`, esto no deriva "hoy": el CSV ya trae una fecha
 * calendario literal, así que solo se reordenan sus partes — no hay
 * conversión de zona horaria que hacer. Devuelve `null` si no es una
 * fecha real (ej. 31/02/2026) en vez de inventar la más cercana.
 */
export function parseDateWithFormat(raw: string, format: DateFormat): string | null {
  const trimmed = raw.trim();
  const separator = format.includes('/') ? '/' : '-';
  const parts = trimmed.split(separator);
  if (parts.length !== 3) return null;

  const order = format.split(separator) as Array<'YYYY' | 'MM' | 'DD'>;
  const byToken: Record<string, string> = {};
  order.forEach((token, index) => {
    byToken[token] = parts[index] ?? '';
  });

  const year = Number(byToken.YYYY);
  const month = Number(byToken.MM);
  const day = Number(byToken.DD);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}
