import { Money } from '@/shared/ui/Money';
import { formatDisplayDate } from '@/shared/lib/date';
import type { RecurringExpense } from '@/features/budgets/api/useRecurringExpenses';

const FREQUENCY_LABEL = { weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual' } as const;

interface RecurringReportProps {
  recurringExpenses: RecurringExpense[];
}

/**
 * Informe de suscripciones/gastos recurrentes (plan Fase 12). El total
 * se agrupa por moneda y periodicidad en vez de normalizar todo a "por
 * mes": convertir semanal/anual a un equivalente mensual inventaría una
 * cifra que el plan maestro prohíbe (regla global — no inventar datos).
 */
export function RecurringReport({ recurringExpenses }: RecurringReportProps) {
  const active = recurringExpenses.filter((r) => !r.archived_at);

  if (active.length === 0) {
    return <p className="text-sm text-ink-muted">No hay gastos recurrentes activos.</p>;
  }

  const totals = new Map<string, number>();
  for (const item of active) {
    const key = `${item.frequency}_${item.currency}`;
    totals.set(key, (totals.get(key) ?? 0) + item.amount);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {[...totals.entries()].map(([key, total]) => {
          const [frequency, currency] = key.split('_') as [keyof typeof FREQUENCY_LABEL, 'CRC' | 'USD'];
          return (
            <div key={key} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink-muted">Total {FREQUENCY_LABEL[frequency].toLowerCase()} ({currency})</span>
              <Money amount={total} currency={currency} size="sm" />
            </div>
          );
        })}
      </div>
      <ul className="flex flex-col gap-3 border-t border-border pt-3">
        {active.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-ink">{item.name}</span>
              <span className="truncate text-xs text-ink-muted">
                {FREQUENCY_LABEL[item.frequency]} · próximo {formatDisplayDate(item.next_due_on)}
              </span>
            </div>
            <Money className="shrink-0" amount={item.amount} currency={item.currency} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
