import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import { isUniqueViolation } from '@/shared/lib/postgresErrors';
import { isNetworkError } from '@/shared/offline/classify';
import { addOp } from '@/shared/offline/queue';
import { OP_KIND } from '@/shared/offline/types';
import type { Database } from '@/types/database';
import type { CurrencyCode } from '@/shared/lib/money';
import type { GoalInput, GoalContributionInput } from '@/features/budgets/schema';

type GoalRow = Database['public']['Tables']['goals']['Row'];
export type Goal = Omit<GoalRow, 'currency'> & { currency: CurrencyCode };

type GoalContributionRow = Database['public']['Tables']['goal_contributions']['Row'];
export type GoalContribution = Omit<GoalContributionRow, 'type'> & {
  type: 'contribution' | 'withdrawal';
};

const QUERY_KEY = ['goals'];
const CONTRIBUTIONS_QUERY_KEY = ['goal_contributions'];

export function useGoals() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...QUERY_KEY, userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase.from('goals').select('*').order('created_at');
      if (error) throw error;
      return data as Goal[];
    },
  });
}

export function useGoalContributions(goalId: string | null) {
  return useQuery({
    queryKey: [...CONTRIBUTIONS_QUERY_KEY, goalId],
    enabled: Boolean(goalId),
    queryFn: async (): Promise<GoalContribution[]> => {
      const { data, error } = await supabase
        .from('goal_contributions')
        .select('*')
        .eq('goal_id', goalId!)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GoalContribution[];
    },
  });
}

export function useCreateGoal() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GoalInput) => {
      const { error } = await supabase.from('goals').insert({ ...input, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: GoalInput }) => {
      const { error } = await supabase.from('goals').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useArchiveGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('goals')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/** RPC atómica (Fase 9): inserta el aporte/retiro y actualiza
 * `goals.current_amount` en la misma transacción — un retiro nunca deja
 * el saldo de la meta en negativo (lo valida la función). Reintento con
 * el mismo `client_id` viola `unique(user_id, client_id)` de
 * `goal_contributions` y aborta toda la función; se trata como éxito
 * silencioso, igual que las demás RPC de movimientos (Fase 6). Los
 * aportes/retiros de metas no tocan `transactions`: nunca se cuentan
 * como ingreso o gasto (regla del plan Fase 9). */
export function useCreateGoalContribution() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      goalId,
      input,
    }: {
      clientId: string;
      goalId: string;
      input: GoalContributionInput;
    }): Promise<{ queued: boolean }> => {
      const { error } = await supabase.rpc('create_goal_contribution', {
        p_goal_id: goalId,
        p_type: input.type,
        p_amount: input.amount,
        p_occurred_on: input.occurred_on,
        p_notes: input.notes as string,
        p_client_id: clientId,
      });
      if (error) {
        if (isUniqueViolation(error)) return { queued: false };
        if (isNetworkError(error)) {
          await addOp({
            userId: userId!,
            kind: OP_KIND.GOAL_CONTRIBUTION,
            payload: { clientId, goalId, input },
          });
          return { queued: true };
        }
        throw error;
      }
      return { queued: false };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: [...CONTRIBUTIONS_QUERY_KEY, variables.goalId] });
    },
  });
}
