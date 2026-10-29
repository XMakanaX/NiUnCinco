import { Money } from '@/shared/ui/Money';
import type { CurrencyCode } from '@/shared/lib/money';

interface IncomeExpenseBarsProps {
  income: number;
  expense: number;
  currency: CurrencyCode;
  /** % vs. el mismo rango del mes anterior. `null` = sin dato previo
   * suficiente (plan Fase 8: solo comparar "si existen datos
   * suficientes") — no se muestra nada en ese caso. */
  incomeChangePct?: number | null;
  expenseChangePct?: number | null;
}

function ChangeBadge({ pct, goodWhenUp }: { pct: number; goodWhenUp: boolean }) {
  const up = pct >= 0;
  const good = up === goodWhenUp;
  return (
    <span className={good ? 'text-income' : 'text-expense'}>
      {up ? '+' : ''}
      {pct.toFixed(0)}% vs. mes anterior
    </span>
  );
}

/** Dos barras directamente etiquetadas — ingreso/gasto usan sus colores
 * semánticos ya definidos en el sistema de diseño, no una paleta nueva. */
export function IncomeExpenseBars({
  income,
  expense,
  currency,
  incomeChangePct = null,
  expenseChangePct = null,
}: IncomeExpenseBarsProps) {
  const max = Math.max(income, expense, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Ingresos</span>
          <Money amount={income} currency={currency} tone="income" size="sm" />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-income transition-[width] duration-300 ease-[var(--ease-out)]"
            style={{ width: max > 0 ? `${(income / max) * 100}%` : '0%' }}
          />
        </div>
        {incomeChangePct !== null ? (
          <span className="text-right text-xs">
            <ChangeBadge pct={incomeChangePct} goodWhenUp />
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">Gastos</span>
          <Money amount={expense} currency={currency} tone="expense" size="sm" />
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-expense transition-[width] duration-300 ease-[var(--ease-out)]"
            style={{ width: max > 0 ? `${(expense / max) * 100}%` : '0%' }}
          />
        </div>
        {expenseChangePct !== null ? (
          <span className="text-right text-xs">
            <ChangeBadge pct={expenseChangePct} goodWhenUp={false} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
