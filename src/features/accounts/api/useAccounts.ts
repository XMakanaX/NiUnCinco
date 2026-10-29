import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import type { Database } from '@/types/database';
import type { CurrencyCode } from '@/shared/lib/money';
import type { AccountInput } from '@/features/accounts/schema';

type AccountRow = Database['public']['Tables']['accounts']['Row'];
export type Account = Omit<AccountRow, 'currency' | 'type'> & {
  currency: CurrencyCode;
  type: 'cash' | 'bank' | 'other';
  balance: number;
};

const QUERY_KEY = ['accounts'];

/** Error de Postgres por FK restrict: el registro tiene movimientos asociados. */
export function isForeignKeyViolation(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === '23503');
}

export function useAccounts() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...QUERY_KEY, userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Account[]> => {
      const [accountsRes, balancesRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at'),
        supabase.from('account_balances').select('account_id, balance'),
      ]);
      if (accountsRes.error) throw accountsRes.error;
      if (balancesRes.error) throw balancesRes.error;

      const balanceByAccount = new Map(
        balancesRes.data.map((row) => [row.account_id, row.balance ?? 0]),
      );
      return accountsRes.data.map((account) => ({
        ...account,
        balance: balanceByAccount.get(account.id) ?? 0,
      })) as Account[];
    },
  });
}

export function useCreateAccount() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AccountInput) => {
      const { error } = await supabase
        .from('accounts')
        .insert({ ...input, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AccountInput }) => {
      const { error } = await supabase.from('accounts').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('accounts')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
