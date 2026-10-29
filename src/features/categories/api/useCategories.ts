import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import type { Database } from '@/types/database';
import type { CategoryInput } from '@/features/categories/schema';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type Category = Omit<CategoryRow, 'kind'> & { kind: 'expense' | 'income' };

const QUERY_KEY = ['categories'];

export function useCategories() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...QUERY_KEY, userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCreateCategory() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { error } = await supabase.from('categories').insert({ ...input, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CategoryInput }) => {
      const { error } = await supabase.from('categories').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useArchiveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('categories')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * A diferencia de accounts/cards, las FK de categoría usan `set null` /
 * `cascade` (no `restrict`) — la base sí permite borrarla. La regla de
 * negocio (plan Fase 5, regla 10) exige no perder la categorización de
 * movimientos existentes, así que el chequeo corre en la app antes de
 * borrar: si hay movimientos o presupuestos ligados, se bloquea y se
 * sugiere archivar.
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const [txRes, budgetRes, childRes] = await Promise.all([
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('category_id', id),
        supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('category_id', id),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('parent_id', id),
      ]);
      if (txRes.error) throw txRes.error;
      if (budgetRes.error) throw budgetRes.error;
      if (childRes.error) throw childRes.error;

      const inUse = (txRes.count ?? 0) > 0 || (budgetRes.count ?? 0) > 0 || (childRes.count ?? 0) > 0;
      if (inUse) {
        throw new Error('CATEGORY_IN_USE');
      }

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
