import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import { isUniqueViolation } from '@/shared/lib/postgresErrors';
import { isNetworkError } from '@/shared/offline/classify';
import { addOp } from '@/shared/offline/queue';
import { OP_KIND } from '@/shared/offline/types';
import type { Database } from '@/types/database';
import type { CurrencyCode } from '@/shared/lib/money';
import type { RecurringExpenseInput } from '@/features/budgets/schema';

type RecurringExpenseRow = Database['public']['Tables']['recurring_expenses']['Row'];
export type RecurringExpense = Omit<RecurringExpenseRow, 'currency' | 'frequency'> & {
  currency: CurrencyCode;
  frequency: 'weekly' | 'monthly' | 'yearly';
};

const QUERY_KEY = ['recurring_expenses'];

export function useRecurringExpenses() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...QUERY_KEY, userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<RecurringExpense[]> => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .order('next_due_on');
      if (error) throw error;
      return data as RecurringExpense[];
    },
  });
}

export function useCreateRecurringExpense() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecurringExpenseInput) => {
      const { error } = await supabase.from('recurring_expenses').insert({ ...input, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RecurringExpenseInput }) => {
      const { error } = await supabase.from('recurring_expenses').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useArchiveRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/** RPC atómica (Fase 9): inserta el gasto del periodo y avanza
 * `next_due_on` en la misma transacción. Reintento con el mismo
 * `client_id` viola el `unique(user_id, client_id)` de `transactions` y
 * aborta toda la función — se trata como éxito silencioso, igual que
 * `create_transfer`/`create_card_payment` (Fase 6), sin volver a
 * avanzar la fecha ni duplicar el gasto. */
export function useMarkRecurringExpensePaid() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      recurringExpenseId,
      occurredOn,
    }: {
      clientId: string;
      recurringExpenseId: string;
      occurredOn: string;
    }): Promise<{ queued: boolean }> => {
      const { error } = await supabase.rpc('mark_recurring_expense_paid', {
        p_recurring_expense_id: recurringExpenseId,
        p_occurred_on: occurredOn,
        p_client_id: clientId,
      });
      if (error) {
        if (isUniqueViolation(error)) return { queued: false };
        if (isNetworkError(error)) {
          await addOp({
            userId: userId!,
            kind: OP_KIND.RECURRING_PAID,
            payload: { clientId, recurringExpenseId, occurredOn },
          });
          return { queued: true };
        }
        throw error;
      }
      return { queued: false };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['cards'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
