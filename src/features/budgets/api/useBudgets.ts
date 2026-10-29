import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import type { Database } from '@/types/database';
import type { CurrencyCode } from '@/shared/lib/money';
import type { BudgetInput } from '@/features/budgets/schema';

type BudgetProgressRow = Database['public']['Views']['budget_progress']['Row'];
// El codegen de Supabase marca todas las columnas de una vista como
// nullable (no puede ver los `not null` de las tablas base) — en
// `budget_progress` solo `category_id`/`alert_threshold_pct`/`archived_at`
// son opcionales de verdad, el resto hereda columnas `not null` de `budgets`.
export type Budget = Omit<
  BudgetProgressRow,
  'currency' | 'amount_spent' | 'period_month' | 'amount_limit' | 'id' | 'user_id'
> & {
  id: string;
  user_id: string;
  currency: CurrencyCode;
  amount_spent: number;
  period_month: string;
  amount_limit: number;
};

const QUERY_KEY = ['budgets'];

/** `budget_progress` (Fase 9) ya trae `amount_spent` calculado en la base
 * — nunca se trae el historial de movimientos al cliente para sumarlo
 * ahí (mismo criterio que los agregados del dashboard, Fase 8). */
export function useBudgets() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...QUERY_KEY, userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from('budget_progress')
        .select('*')
        .order('period_month', { ascending: false });
      if (error) throw error;
      return data as Budget[];
    },
  });
}

export function useCreateBudget() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BudgetInput) => {
      const { error } = await supabase.from('budgets').insert({ ...input, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BudgetInput }) => {
      const { error } = await supabase.from('budgets').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useArchiveBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('budgets')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
