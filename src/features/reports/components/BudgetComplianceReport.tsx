import clsx from 'clsx';
import { Money } from '@/shared/ui/Money';
import type { Budget } from '@/features/budgets/api/useBudgets';
import type { Category } from '@/features/categories/api/useCategories';

interface BudgetComplianceReportProps {
  budgets: Budget[];
  categories: Category[];
}

/** Cumplimiento de presupuestos del mes elegido — reusa `amount_spent`
 * ya calculado por la vista `budget_progress` (Fase 9), mismo criterio
 * que el widget del dashboard: nunca se recalcula el gasto en el
 * cliente. */
export function BudgetComplianceReport({ budgets, categories }: BudgetComplianceReportProps) {
  if (budgets.length === 0) {
    return <p className="text-sm text-ink-muted">No hay presupuestos configurados para este mes.</p>;
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <ul className="flex flex-col gap-3">
      {budgets.map((budget) => {
        const category = budget.category_id ? categoryById.get(budget.category_id) : null;
        const pct = budget.amount_limit > 0 ? Math.min(100, (budget.amount_spent / budget.amount_limit) * 100) : 0;
        const over = budget.amount_spent > budget.amount_limit;
        return (
          <li key={budget.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate text-ink">{category?.name ?? 'Presupuesto general'}</span>
              <span className="shrink-0 whitespace-nowrap text-ink-muted">
                <Money amount={budget.amount_spent} currency={budget.currency} size="sm" /> de{' '}
                <Money amount={budget.amount_limit} currency={budget.currency} size="sm" />
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className={clsx('h-full rounded-full transition-[width] duration-300 ease-[var(--ease-out)]', over ? 'bg-expense' : 'bg-brand')}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
