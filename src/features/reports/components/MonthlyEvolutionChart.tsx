import { Money } from '@/shared/ui/Money';
import { monthLabel } from '@/shared/lib/date';
import type { CurrencyCode } from '@/shared/lib/money';
import type { MonthlySeriesRow } from '@/features/reports/api/useReports';

interface MonthlyEvolutionChartProps {
  rows: MonthlySeriesRow[];
  currency: CurrencyCode;
}

/** Un mes por fila, barra de ingreso y de gasto superpuestas a escala —
 * mismos colores semánticos que `IncomeExpenseBars` (Fase 8). */
export function MonthlyEvolutionChart({ rows, currency }: MonthlyEvolutionChartProps) {
  const max = Math.max(...rows.flatMap((r) => [r.income, r.expense]), 0);

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((row) => {
        const [year, month] = row.month.split('-').map(Number) as [number, number];
        return (
          <li key={row.month} className="flex flex-col gap-1.5">
            <span className="text-sm font-medium capitalize text-ink">{monthLabel(year, month)}</span>
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs text-ink-muted">Ingreso</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-income transition-[width] duration-300 ease-[var(--ease-out)]"
                  style={{ width: max > 0 ? `${(row.income / max) * 100}%` : '0%' }}
                />
              </div>
              <Money className="w-24 shrink-0 text-right" amount={row.income} currency={currency} size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs text-ink-muted">Gasto</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-expense transition-[width] duration-300 ease-[var(--ease-out)]"
                  style={{ width: max > 0 ? `${(row.expense / max) * 100}%` : '0%' }}
                />
              </div>
              <Money className="w-24 shrink-0 text-right" amount={row.expense} currency={currency} size="sm" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
