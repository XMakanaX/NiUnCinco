export const APP_TIME_ZONE = 'America/Costa_Rica';

/**
 * Fecha contable de "ahora" en America/Costa_Rica, como YYYY-MM-DD
 * (formato `date` de Postgres). Nunca usar `new Date().toISOString()`
 * para esto: usa UTC y una compra a las 23:30 en Costa Rica salta al
 * día/mes siguiente (plan §4.4 regla #4).
 */
export function todayInAppTimeZone(): string {
  return toDateOnly(new Date());
}

/** Convierte cualquier Date a YYYY-MM-DD en la zona horaria de la app. */
export function toDateOnly(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('No se pudo derivar la fecha contable');
  }

  return `${year}-${month}-${day}`;
}

/** Formatea una fecha `date` (YYYY-MM-DD) para mostrarla al usuario. */
export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year!, (month ?? 1) - 1, day ?? 1));
  return new Intl.DateTimeFormat('es-CR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
