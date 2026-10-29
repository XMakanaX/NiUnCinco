import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import type { CurrencyCode } from '@/shared/lib/money';

export interface PeriodTotals {
  income: number;
  expense: number;
}

/**
 * Ingreso/gasto total de un rango en una sola moneda — agregado en la
 * base (RPC `dashboard_period_totals`, Fase 8) para no traer todo el
 * historial de movimientos solo para sumarlo en el cliente.
 */
export function usePeriodTotals(currency: CurrencyCode, from: string, to: string) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['dashboard', 'period-totals', userId, currency, from, to],
    enabled: Boolean(userId),
    queryFn: async (): Promise<PeriodTotals> => {
      const { data, error } = await supabase.rpc('dashboard_period_totals', {
        p_currency: currency,
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return data[0] ?? { income: 0, expense: 0 };
    },
  });
}

export interface CategoryBreakdownRow {
  category_id: string | null;
  category_name: string;
  color: string | null;
  total: number;
}

/** Gasto (o ingreso) por categoría de un rango, agregado en la base. */
export function useCategoryBreakdown(
  currency: CurrencyCode,
  from: string,
  to: string,
  kind: 'expense' | 'income',
) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['dashboard', 'category-breakdown', userId, currency, from, to, kind],
    enabled: Boolean(userId),
    queryFn: async (): Promise<CategoryBreakdownRow[]> => {
      const { data, error } = await supabase.rpc('dashboard_category_breakdown', {
        p_currency: currency,
        p_from: from,
        p_to: to,
        p_kind: kind,
      });
      if (error) throw error;
      return data;
    },
  });
}

export interface UpcomingRecurring {
  id: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  next_due_on: string;
}

/**
 * Próximos vencimientos para el widget "Próximos pagos". La tabla
 * `recurring_expenses` existe desde la Fase 4; el CRUD para cargarla es
 * Fase 9 — hoy casi siempre está vacía, y el widget muestra ese estado
 * vacío real en vez de inventar pagos.
 */
export function useUpcomingRecurring() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['dashboard', 'upcoming-recurring', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<UpcomingRecurring[]> => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('id, name, amount, currency, next_due_on')
        .is('archived_at', null)
        .order('next_due_on', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data as UpcomingRecurring[];
    },
  });
}

export interface BudgetRow {
  id: string;
  category_id: string | null;
  amount_limit: number;
  currency: CurrencyCode;
}

/**
 * Presupuestos del mes para el widget "Presupuestos y progreso". Mismo
 * caso que `recurring_expenses`: la tabla existe, el CRUD es Fase 9.
 */
export function useBudgetsForMonth(periodMonth: string) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['dashboard', 'budgets', userId, periodMonth],
    enabled: Boolean(userId),
    queryFn: async (): Promise<BudgetRow[]> => {
      const { data, error } = await supabase
        .from('budgets')
        .select('id, category_id, amount_limit, currency')
        .eq('period_month', periodMonth)
        .is('archived_at', null);
      if (error) throw error;
      return data as BudgetRow[];
    },
  });
}
