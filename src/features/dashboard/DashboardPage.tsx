import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Money } from '@/shared/ui/Money';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageMessage } from '@/shared/ui/PageMessage';
import { formatDisplayDate, monthLabel, monthRange } from '@/shared/lib/date';
import type { CurrencyCode } from '@/shared/lib/money';
import { useAccounts } from '@/features/accounts/api/useAccounts';
import { useCards } from '@/features/accounts/api/useCards';
import { useCategories } from '@/features/categories/api/useCategories';
import { useProfile } from '@/features/settings/api/useProfile';
import { useTransactions } from '@/features/transactions/api/useTransactions';
import { TransactionListItem } from '@/features/transactions/components/TransactionListItem';
import {
  useBudgetsForMonth,
  useCategoryBreakdown,
  usePeriodTotals,
  useUpcomingRecurring,
} from '@/features/dashboard/api/useDashboard';
import { IncomeExpenseBars } from '@/features/dashboard/components/IncomeExpenseBars';
import { CategoryBarChart } from '@/features/dashboard/components/CategoryBarChart';

const CURRENCIES: CurrencyCode[] = ['CRC', 'USD'];

function pctChange(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}

export function DashboardPage() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: cards, isLoading: loadingCards } = useCards();
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();

  const [currency, setCurrency] = useState<CurrencyCode>('CRC');
  const [monthsAgo, setMonthsAgo] = useState(0);

  // El perfil carga async — una vez llega, adopta su moneda principal
  // como punto de partida sin pisar un cambio manual posterior.
  const currencyInitRef = useRef(false);
  useEffect(() => {
    if (currencyInitRef.current || !profile) return;
    currencyInitRef.current = true;
    setCurrency(profile.base_currency);
  }, [profile]);

  const period = monthRange(monthsAgo);
  const prevPeriod = monthRange(monthsAgo + 1);
  const periodMonthDate = `${period.year}-${String(period.month).padStart(2, '0')}-01`;

  const { data: totals, isPending: loadingTotals } = usePeriodTotals(currency, period.from, period.to);
  const { data: prevTotals } = usePeriodTotals(currency, prevPeriod.from, prevPeriod.to);
  const { data: breakdown, isPending: loadingBreakdown } = useCategoryBreakdown(
    currency,
    period.from,
    period.to,
    'expense',
  );
  const { data: recent, isPending: loadingRecent } = useTransactions({ limit: 5 });
  const { data: upcoming, isPending: loadingUpcoming } = useUpcomingRecurring();
  const { data: budgets, isPending: loadingBudgets } = useBudgetsForMonth(periodMonthDate);

  const loading = loadingAccounts || loadingCards;

  const accountsInCurrency = (accounts ?? []).filter((a) => !a.archived_at && a.currency === currency);
  const cardsInCurrency = (cards ?? []).filter((c) => !c.archived_at && c.currency === currency);
  const creditCards = cardsInCurrency.filter((c) => c.card_type === 'credit');

  const totalAvailable = accountsInCurrency.reduce((sum, a) => sum + a.balance, 0);
  const totalDebt = creditCards.reduce((sum, c) => sum + (c.balanceDue ?? 0), 0);
  const netWorth = totalAvailable - totalDebt;

  const income = totals?.income ?? 0;
  const expense = totals?.expense ?? 0;
  const balance = income - expense;
  const incomeChangePct = pctChange(income, prevTotals?.income ?? 0);
  const expenseChangePct = pctChange(expense, prevTotals?.expense ?? 0);

  const accountNameById = new Map((accounts ?? []).map((a) => [a.id, a.name]));
  const cardNameById = new Map((cards ?? []).map((c) => [c.id, c.name]));
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));
  const expenseByCategoryId = new Map((breakdown ?? []).map((row) => [row.category_id, row.total]));

  const hasAnySource = accountsInCurrency.length > 0 || cardsInCurrency.length > 0;

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold text-ink">Inicio</h1>
        <LoadingState rows={4} />
      </div>
    );
  }

  if ((accounts ?? []).length === 0 && (cards ?? []).length === 0) {
    return (
      <div className="p-4">
        <h1 className="mb-4 text-xl font-semibold text-ink">Inicio</h1>
        <EmptyState
          icon={LayoutDashboard}
          title="Todavía no hay movimientos"
          description="Registrá tu primera cuenta y tu primer movimiento para ver aquí tu resumen financiero."
          action={
            <Link
              to="/accounts"
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-sm)] bg-brand px-4 text-sm font-medium text-brand-contrast transition-colors duration-150 hover:bg-brand-strong"
            >
              Ir a Cuentas y tarjetas
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Inicio</h1>
        <div className="flex items-center gap-2">
          {CURRENCIES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              className={clsx(
                'rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                currency === code ? 'bg-brand text-brand-contrast' : 'bg-surface-sunken text-ink-muted',
              )}
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {!hasAnySource ? (
        <PageMessage tone="info">
          No hay cuentas ni tarjetas en {currency === 'CRC' ? 'colones' : 'dólares'} todavía — los totales de este
          resumen están en cero.
        </PageMessage>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">Disponible en cuentas</span>
          <Money amount={totalAvailable} currency={currency} size="lg" />
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">Deuda de tarjetas</span>
          <Money amount={totalDebt} currency={currency} size="lg" />
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">Patrimonio neto</span>
          <Money amount={netWorth} currency={currency} size="lg" />
        </Card>
      </div>

      {creditCards.length > 0 ? (
        <Card className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-ink">Crédito disponible</h2>
          <ul className="flex flex-col gap-2">
            {creditCards.map((card) => (
              <li key={card.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 text-ink">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: card.color ?? 'var(--border-strong)' }}
                    aria-hidden
                  />
                  <span className="truncate">{card.name}</span>
                </span>
                <Money className="shrink-0" amount={card.availableCredit ?? 0} currency={currency} size="sm" />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button intent="ghost" size="sm" aria-label="Mes anterior" onClick={() => setMonthsAgo((m) => m + 1)}>
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <span className="text-sm font-medium capitalize text-ink">{monthLabel(period.year, period.month)}</span>
          <Button
            intent="ghost"
            size="sm"
            aria-label="Mes siguiente"
            disabled={monthsAgo === 0}
            onClick={() => setMonthsAgo((m) => Math.max(0, m - 1))}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>

        {loadingTotals ? (
          <LoadingState rows={2} />
        ) : (
          <>
            <IncomeExpenseBars
              income={income}
              expense={expense}
              currency={currency}
              incomeChangePct={incomeChangePct}
              expenseChangePct={expenseChangePct}
            />
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-ink-muted">Balance del mes</span>
              <Money amount={balance} currency={currency} size="md" />
            </div>
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-ink">Gastos por categoría</h2>
        {loadingBreakdown ? (
          <LoadingState rows={3} />
        ) : !breakdown || breakdown.length === 0 ? (
          <p className="text-sm text-ink-muted">Sin gastos registrados en este periodo.</p>
        ) : (
          <CategoryBarChart rows={breakdown} currency={currency} />
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-ink">Presupuestos del mes</h2>
        {loadingBudgets ? (
          <LoadingState rows={2} />
        ) : !budgets || budgets.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-muted">Todavía no hay presupuestos configurados para este mes.</p>
            <Link to="/budgets" className="text-sm font-medium text-brand hover:underline">
              Ir a Presupuestos
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {budgets.map((budget) => {
              const category = budget.category_id ? categoryById.get(budget.category_id) : null;
              const spent = budget.category_id
                ? (expenseByCategoryId.get(budget.category_id) ?? 0)
                : expense;
              const pct = budget.amount_limit > 0 ? Math.min(100, (spent / budget.amount_limit) * 100) : 0;
              const over = spent > budget.amount_limit;
              return (
                <li key={budget.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-ink">{category?.name ?? 'Presupuesto general'}</span>
                    <span className="shrink-0 whitespace-nowrap text-ink-muted">
                      <Money amount={spent} currency={budget.currency} size="sm" /> de{' '}
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
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-ink">Próximos pagos</h2>
        {loadingUpcoming ? (
          <LoadingState rows={2} />
        ) : !upcoming || upcoming.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-muted">No hay gastos recurrentes configurados.</p>
            <Link to="/budgets" className="text-sm font-medium text-brand hover:underline">
              Ir a Presupuestos
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-ink">{item.name}</span>
                  <span className="truncate text-xs text-ink-muted">{formatDisplayDate(item.next_due_on)}</span>
                </div>
                <Money className="shrink-0" amount={item.amount} currency={item.currency} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">Últimos movimientos</h2>
          <Link to="/transactions" className="text-sm font-medium text-brand hover:underline">
            Ver todos
          </Link>
        </div>
        {loadingRecent ? (
          <LoadingState rows={3} />
        ) : !recent || recent.length === 0 ? (
          <p className="text-sm text-ink-muted">Sin movimientos todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((transaction) => (
              <TransactionListItem
                key={transaction.id}
                transaction={transaction}
                accountName={transaction.account_id ? (accountNameById.get(transaction.account_id) ?? null) : null}
                cardName={transaction.card_id ? (cardNameById.get(transaction.card_id) ?? null) : null}
                categoryName={
                  transaction.category_id ? (categoryNameById.get(transaction.category_id) ?? null) : null
                }
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
