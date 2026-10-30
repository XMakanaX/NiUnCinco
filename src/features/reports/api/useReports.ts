import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import type { CurrencyCode } from '@/shared/lib/money';

export interface MonthlySeriesRow {
  month: string;
  income: number;
  expense: number;
}

/** Evolución mensual (RPC `reports_monthly_series`, Fase 12) — agregada
 * en la base por el mismo motivo que los agregados del dashboard (Fase 8):
 * no traer el historial completo al cliente solo para sumarlo ahí. */
export function useMonthlySeries(currency: CurrencyCode, from: string, to: string) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['reports', 'monthly-series', userId, currency, from, to],
    enabled: Boolean(userId),
    queryFn: async (): Promise<MonthlySeriesRow[]> => {
      const { data, error } = await supabase.rpc('reports_monthly_series', {
        p_currency: currency,
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return data;
    },
  });
}

export type BreakdownKind = 'income' | 'expense';
export type BreakdownDimension = 'category' | 'account' | 'card' | 'merchant';

export interface BreakdownRow {
  id: string | null;
  label: string;
  color: string | null;
  total: number;
}

/**
 * Gasto o ingreso por categoría, cuenta, tarjeta o comercio (plan Fase
 * 12). Categoría reusa la RPC de la Fase 8 (`dashboard_category_breakdown`);
 * cuenta/tarjeta/comercio son RPCs nuevas de esta fase, mismo patrón
 * (`security invoker`, agregado en la base). Se normaliza a una forma
 * común (`id`/`label`/`color`/`total`) para que un solo componente de
 * gráfico sirva para las cuatro dimensiones. Cada rama llama la RPC con
 * su nombre literal (no una variable) para que TypeScript infiera el
 * tipo de retorno correcto de cada una.
 */
export function useBreakdown(
  dimension: BreakdownDimension,
  currency: CurrencyCode,
  from: string,
  to: string,
  kind: BreakdownKind,
) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['reports', 'breakdown', dimension, userId, currency, from, to, kind],
    enabled: Boolean(userId),
    queryFn: async (): Promise<BreakdownRow[]> => {
      const params = { p_currency: currency, p_from: from, p_to: to, p_kind: kind };

      if (dimension === 'category') {
        const { data, error } = await supabase.rpc('dashboard_category_breakdown', params);
        if (error) throw error;
        return data.map((row) => ({ id: row.category_id, label: row.category_name, color: row.color, total: row.total }));
      }
      if (dimension === 'account') {
        const { data, error } = await supabase.rpc('reports_breakdown_by_account', params);
        if (error) throw error;
        return data.map((row) => ({ id: row.account_id, label: row.account_name, color: row.color, total: row.total }));
      }
      if (dimension === 'card') {
        const { data, error } = await supabase.rpc('reports_breakdown_by_card', params);
        if (error) throw error;
        return data.map((row) => ({ id: row.card_id, label: row.card_name, color: row.color, total: row.total }));
      }
      const { data, error } = await supabase.rpc('reports_breakdown_by_merchant', params);
      if (error) throw error;
      return data.map((row) => ({ id: row.merchant, label: row.merchant, color: null, total: row.total }));
    },
  });
}

export interface CardPaymentAggregate {
  cardId: string;
  cardName: string;
  color: string | null;
  totalPaid: number;
}

/**
 * Pagos de tarjeta hechos dentro de un periodo, agrupados por tarjeta —
 * para el informe "Pagos y deuda de tarjetas". `card_payments` ya se
 * trae completo en el detalle de cada tarjeta (Fase 10, `useCardPayments`);
 * acá se filtra por rango y se agrega en el cliente porque es la misma
 * tabla pequeña por usuario, no el historial de `transactions`.
 */
export function useCardPaymentsInRange(currency: CurrencyCode, from: string, to: string) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: ['reports', 'card-payments-range', userId, currency, from, to],
    enabled: Boolean(userId),
    queryFn: async (): Promise<{ cardId: string; amount: number }[]> => {
      const { data, error } = await supabase
        .from('card_payments')
        .select('card_id, amount, currency, occurred_on, status')
        .eq('currency', currency)
        .eq('status', 'confirmed')
        .gte('occurred_on', from)
        .lte('occurred_on', to);
      if (error) throw error;
      return data.map((row) => ({ cardId: row.card_id, amount: row.amount }));
    },
  });
}
