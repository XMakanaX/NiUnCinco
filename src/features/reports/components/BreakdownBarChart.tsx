import { Money } from '@/shared/ui/Money';
import type { CurrencyCode } from '@/shared/lib/money';
import type { BreakdownRow } from '@/features/reports/api/useReports';

interface BreakdownBarChartProps {
  rows: BreakdownRow[];
  currency: CurrencyCode;
}

/** Mismo patrón que `CategoryBarChart` (Fase 8), generalizado a
 * categoría/cuenta/tarjeta/comercio: barras horizontales directamente
 * etiquetadas, sin leyenda aparte. */
export function BreakdownBarChart({ rows, currency }: BreakdownBarChartProps) {
  const max = Math.max(...rows.map((r) => r.total), 0);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.id ?? 'none'} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-1.5 text-ink">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color ?? 'var(--border-strong)' }}
                aria-hidden
              />
              <span className="truncate">{row.label}</span>
            </span>
            <Money className="shrink-0" amount={row.total} currency={currency} size="sm" />
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-[var(--ease-out)]"
              style={{
                width: max > 0 ? `${(row.total / max) * 100}%` : '0%',
                backgroundColor: row.color ?? 'var(--border-strong)',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
