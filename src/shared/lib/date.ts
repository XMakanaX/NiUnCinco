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

/**
 * Rango [primer día, último día] del mes calendario N meses atrás (0 =
 * mes actual), en la zona horaria de la app. Para el selector de periodo
 * y la comparación del dashboard (Fase 8) — nunca se arma con
 * `toISOString()` ni con `toDateOnly(new Date(Date.UTC(...)))`: ambos
 * reinterpretan una fecha ya calculada a través de otra zona horaria y
 * pueden saltar al día/mes anterior cerca de medianoche.
 */
export function monthRange(monthsAgo = 0): { from: string; to: string; year: number; month: number } {
  const todayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = Number(todayParts.find((p) => p.type === 'year')?.value);
  const month = Number(todayParts.find((p) => p.type === 'month')?.value);

  let targetYear = year;
  let targetMonth = month - monthsAgo;
  while (targetMonth < 1) {
    targetMonth += 12;
    targetYear -= 1;
  }
  while (targetMonth > 12) {
    targetMonth -= 12;
    targetYear += 1;
  }

  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    from: `${targetYear}-${pad(targetMonth)}-01`,
    to: `${targetYear}-${pad(targetMonth)}-${pad(lastDay)}`,
    year: targetYear,
    month: targetMonth,
  };
}

/** Nombre del mes calendario (es-CR), para el selector de periodo. */
export function monthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('es-CR', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(date);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

function addMonths(year: number, month: number, delta: number): [number, number] {
  const total = month - 1 + delta;
  const y = year + Math.floor(total / 12);
  const m = ((total % 12) + 12) % 12 + 1;
  return [y, m];
}

function partsToDateOnly(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

function addOneDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return partsToDateOnly(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

/**
 * Ciclo de facturación de una tarjeta de crédito, derivado de su día de
 * corte (`statementDay`) y vencimiento (`dueDay`) — Fase 10. Asume que el
 * corte es mensual y que el vencimiento cae en el mismo mes del corte si
 * `dueDay > statementDay`, o en el mes siguiente si no (el caso más común
 * en tarjetas costarricenses). Es un cálculo de control personal: el banco
 * puede ajustar el ciclo real por feriados o fin de semana — se avisa al
 * usuario en la UI, nunca se presenta como el dato oficial del banco.
 */
export function creditCardCycle(
  statementDay: number,
  dueDay: number,
  todayIso: string = todayInAppTimeZone(),
): { periodStart: string; periodEnd: string; dueDate: string } {
  const [year, month] = todayIso.split('-').map(Number) as [number, number, number];
  const closeThisMonth = partsToDateOnly(year, month, clampDay(year, month, statementDay));

  let periodEndYear = year;
  let periodEndMonth = month;
  let periodEndDay = clampDay(year, month, statementDay);
  let periodStartYear: number;
  let periodStartMonth: number;
  let periodStartDay: number;

  if (todayIso <= closeThisMonth) {
    [periodStartYear, periodStartMonth] = addMonths(year, month, -1);
    periodStartDay = clampDay(periodStartYear, periodStartMonth, statementDay);
  } else {
    [periodEndYear, periodEndMonth] = addMonths(year, month, 1);
    periodEndDay = clampDay(periodEndYear, periodEndMonth, statementDay);
    periodStartYear = year;
    periodStartMonth = month;
    periodStartDay = clampDay(year, month, statementDay);
  }

  const periodEnd = partsToDateOnly(periodEndYear, periodEndMonth, periodEndDay);
  const periodStart = addOneDay(partsToDateOnly(periodStartYear, periodStartMonth, periodStartDay));

  const [dueYear, dueMonth] =
    dueDay > statementDay ? [periodEndYear, periodEndMonth] : addMonths(periodEndYear, periodEndMonth, 1);
  const dueDate = partsToDateOnly(dueYear, dueMonth, clampDay(dueYear, dueMonth, dueDay));

  return { periodStart, periodEnd, dueDate };
}

/** Días calendario entre hoy y una fecha futura (negativo si ya pasó). */
export function daysUntil(isoDate: string, todayIso: string = todayInAppTimeZone()): number {
  const [y1, m1, d1] = todayIso.split('-').map(Number) as [number, number, number];
  const [y2, m2, d2] = isoDate.split('-').map(Number) as [number, number, number];
  const today = Date.UTC(y1, m1 - 1, d1);
  const target = Date.UTC(y2, m2 - 1, d2);
  return Math.round((target - today) / 86_400_000);
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
