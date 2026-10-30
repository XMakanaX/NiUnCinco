import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Money } from '@/shared/ui/Money';
import { LoadingState } from '@/shared/ui/LoadingState';
import { Select, type SelectOption } from '@/shared/ui/Select';
import { Tabs, TabPanel, type TabItem } from '@/shared/ui/Tabs';
import { monthLabel, monthRange } from '@/shared/lib/date';
import type { CurrencyCode } from '@/shared/lib/money';
import { useAccounts } from '@/features/accounts/api/useAccounts';
import { useCards } from '@/features/accounts/api/useCards';
import { useCategories } from '@/features/categories/api/useCategories';
import { useProfile } from '@/features/settings/api/useProfile';
import { useBudgets } from '@/features/budgets/api/useBudgets';
import { useRecurringExpenses } from '@/features/budgets/api/useRecurringExpenses';
import {
  useBreakdown,
  useCardPaymentsInRange,
  useMonthlySeries,
  type BreakdownDimension,
  type BreakdownKind,
} from '@/features/reports/api/useReports';
import { BreakdownBarChart } from '@/features/reports/components/BreakdownBarChart';
import { MonthlyEvolutionChart } from '@/features/reports/components/MonthlyEvolutionChart';
import { RecurringReport } from '@/features/reports/components/RecurringReport';
import { CardDebtReport } from '@/features/reports/components/CardDebtReport';
import { BudgetComplianceReport } from '@/features/reports/components/BudgetComplianceReport';
import { GlobalSearch } from '@/features/reports/components/GlobalSearch';
import { ExportPanel } from '@/features/reports/components/ExportPanel';

const CURRENCIES: CurrencyCode[] = ['CRC', 'USD'];
const EVOLUTION_MONTHS = 6;

const TABS: TabItem[] = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'desglose', label: 'Desglose' },
  { value: 'recurrentes', label: 'Recurrentes' },
  { value: 'tarjetas', label: 'Tarjetas' },
  { value: 'presupuestos', label: 'Presupuestos' },
  { value: 'busqueda', label: 'Búsqueda' },
  { value: 'exportar', label: 'Exportar' },
];

const DIMENSION_OPTIONS: SelectOption<BreakdownDimension>[] = [
  { label: 'Categoría', value: 'category' },
  { label: 'Cuenta', value: 'account' },
  { label: 'Tarjeta', value: 'card' },
  { label: 'Comercio', value: 'merchant' },
];
const KIND_OPTIONS: SelectOption<BreakdownKind>[] = [
  { label: 'Gastos', value: 'expense' },
  { label: 'Ingresos', value: 'income' },
];

/** % contra el mismo mes anterior — `null` sin dato previo suficiente,
 * mismo criterio que el dashboard (Fase 8): nunca se compara contra cero. */
function pctChange(curr: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}

function PeriodTotalRow({
  label,
  amount,
  currency,
  changePct,
  tone,
}: {
  label: string;
  amount: number;
  currency: CurrencyCode;
  changePct: number | null;
  tone: 'income' | 'expense';
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-ink-muted">{label}</span>
      <div className="flex items-center gap-2">
        {changePct !== null ? (
          <span className={changePct >= 0 === (tone === 'income') ? 'text-income text-xs' : 'text-expense text-xs'}>
            {changePct >= 0 ? '+' : ''}
            {changePct.toFixed(0)}% vs. mes anterior
          </span>
        ) : null}
        <Money amount={amount} currency={currency} tone={tone} size="sm" />
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: cards, isLoading: loadingCards } = useCards();
  const { data: categories } = useCategories();
  const { data: profile } = useProfile();
  const { data: budgets } = useBudgets();
  const { data: recurringExpenses } = useRecurringExpenses();

  const [currency, setCurrency] = useState<CurrencyCode>('CRC');
  const [monthsAgo, setMonthsAgo] = useState(0);
  const [tab, setTab] = useState('resumen');
  const [dimension, setDimension] = useState<BreakdownDimension>('category');
  const [kind, setKind] = useState<BreakdownKind>('expense');

  const currencyInitRef = useRef(false);
  useEffect(() => {
    if (currencyInitRef.current || !profile) return;
    currencyInitRef.current = true;
    setCurrency(profile.base_currency);
  }, [profile]);

  const period = monthRange(monthsAgo);
  const evolutionStart = monthRange(monthsAgo + EVOLUTION_MONTHS - 1);
  const periodMonthDate = `${period.year}-${String(period.month).padStart(2, '0')}-01`;

  const { data: monthlySeries, isPending: loadingSeries } = useMonthlySeries(
    currency,
    evolutionStart.from,
    period.to,
  );
  const { data: breakdown, isPending: loadingBreakdown } = useBreakdown(
    dimension,
    currency,
    period.from,
    period.to,
    kind,
  );
  const { data: paymentsInRange } = useCardPaymentsInRange(currency, period.from, period.to);

  const loading = loadingAccounts || loadingCards;

  if (loading) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold text-ink">Informes</h1>
        <LoadingState rows={4} />
      </div>
    );
  }

  const paymentsByCardId = new Map<string, number>();
  for (const row of paymentsInRange ?? []) {
    paymentsByCardId.set(row.cardId, (paymentsByCardId.get(row.cardId) ?? 0) + row.amount);
  }

  const budgetsThisMonth = (budgets ?? []).filter(
    (b) => !b.archived_at && b.period_month === periodMonthDate && b.currency === currency,
  );

  const monthlyIncomeTotal = (monthlySeries ?? []).reduce((sum, r) => sum + r.income, 0);
  const monthlyExpenseTotal = (monthlySeries ?? []).reduce((sum, r) => sum + r.expense, 0);
  const currentMonth = monthlySeries?.find((r) => r.month === periodMonthDate);
  const previousPeriod = monthRange(monthsAgo + 1);
  const previousMonth = monthlySeries?.find(
    (r) => r.month === `${previousPeriod.year}-${String(previousPeriod.month).padStart(2, '0')}-01`,
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Informes</h1>
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

      {tab !== 'busqueda' && tab !== 'exportar' ? (
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
      ) : null}

      <Tabs items={TABS} value={tab} onValueChange={setTab}>
        <TabPanel value="resumen">
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-ink">Ingreso/gasto del mes</h2>
              {loadingSeries ? (
                <LoadingState rows={2} />
              ) : (
                <div className="flex flex-col gap-2">
                  <PeriodTotalRow
                    label="Ingreso"
                    amount={currentMonth?.income ?? 0}
                    currency={currency}
                    changePct={pctChange(currentMonth?.income ?? 0, previousMonth?.income ?? 0)}
                    tone="income"
                  />
                  <PeriodTotalRow
                    label="Gasto"
                    amount={currentMonth?.expense ?? 0}
                    currency={currency}
                    changePct={pctChange(currentMonth?.expense ?? 0, previousMonth?.expense ?? 0)}
                    tone="expense"
                  />
                </div>
              )}
            </Card>

            <Card className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-ink">Evolución — últimos {EVOLUTION_MONTHS} meses</h2>
              {loadingSeries ? (
                <LoadingState rows={3} />
              ) : !monthlySeries || monthlySeries.length === 0 ? (
                <p className="text-sm text-ink-muted">Sin movimientos en este rango.</p>
              ) : (
                <MonthlyEvolutionChart rows={monthlySeries} currency={currency} />
              )}
              <div className="flex items-center justify-between gap-2 border-t border-border pt-2 text-xs text-ink-muted">
                <span>
                  Total del rango: ingreso <Money amount={monthlyIncomeTotal} currency={currency} size="sm" />, gasto{' '}
                  <Money amount={monthlyExpenseTotal} currency={currency} size="sm" />.
                </span>
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="desglose">
          <Card className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Agrupar por" options={DIMENSION_OPTIONS} value={dimension} onValueChange={setDimension} />
              <Select label="Tipo" options={KIND_OPTIONS} value={kind} onValueChange={setKind} />
            </div>
            {loadingBreakdown ? (
              <LoadingState rows={3} />
            ) : !breakdown || breakdown.length === 0 ? (
              <p className="text-sm text-ink-muted">Sin movimientos en este periodo.</p>
            ) : (
              <BreakdownBarChart rows={breakdown} currency={currency} />
            )}
          </Card>
        </TabPanel>

        <TabPanel value="recurrentes">
          <Card>
            <RecurringReport recurringExpenses={recurringExpenses ?? []} />
          </Card>
        </TabPanel>

        <TabPanel value="tarjetas">
          <Card>
            <CardDebtReport cards={cards ?? []} currency={currency} paymentsByCardId={paymentsByCardId} />
          </Card>
        </TabPanel>

        <TabPanel value="presupuestos">
          <Card>
            <BudgetComplianceReport budgets={budgetsThisMonth} categories={categories ?? []} />
          </Card>
        </TabPanel>

        <TabPanel value="busqueda">
          <Card>
            <GlobalSearch accounts={accounts ?? []} cards={cards ?? []} categories={categories ?? []} />
          </Card>
        </TabPanel>

        <TabPanel value="exportar">
          <Card>
            <ExportPanel accounts={accounts ?? []} cards={cards ?? []} categories={categories ?? []} />
          </Card>
        </TabPanel>
      </Tabs>
    </div>
  );
}
