import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import { isUniqueViolation } from '@/shared/lib/postgresErrors';
import type { Database } from '@/types/database';
import type { CurrencyCode } from '@/shared/lib/money';
import type { MovementInput, TransferInput, CardPaymentInput } from '@/features/transactions/schema';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type TransactionType = 'income' | 'expense' | 'transfer' | 'card_payment';
export type Transaction = Omit<TransactionRow, 'currency' | 'type' | 'status'> & {
  currency: CurrencyCode;
  type: TransactionType;
  status: 'pending' | 'confirmed' | 'voided';
};

export interface TransactionFilters {
  from?: string | undefined;
  to?: string | undefined;
  accountId?: string | undefined;
  cardId?: string | undefined;
  categoryId?: string | undefined;
  type?: TransactionType | undefined;
  search?: string | undefined;
  /** Para widgets como "últimos movimientos" del dashboard: evita traer
   * todo el historial cuando solo se necesitan los N más recientes. */
  limit?: number | undefined;
}

const QUERY_KEY = ['transactions'];

export function useTransactions(filters: TransactionFilters = {}) {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...QUERY_KEY, userId, filters],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters.from) query = query.gte('occurred_on', filters.from);
      if (filters.to) query = query.lte('occurred_on', filters.to);
      if (filters.accountId) query = query.eq('account_id', filters.accountId);
      if (filters.cardId) query = query.eq('card_id', filters.cardId);
      if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.search) query = query.or(`merchant.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
  });
}

/** Ingreso o gasto: un solo insert, ya atómico. `client_id` lo genera el
 * formulario al abrirse y lo reutiliza en reintentos (protección contra
 * doble clic / reintentos de red — un `client_id` repetido es idempotente). */
export function useCreateMovement() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, input }: { clientId: string; input: MovementInput }) => {
      const { error } = await supabase.from('transactions').insert({
        ...input,
        user_id: userId!,
        client_id: clientId,
        status: 'confirmed',
      });
      if (error && !isUniqueViolation(error)) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['cards'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientIdOut,
      clientIdIn,
      input,
    }: {
      clientIdOut: string;
      clientIdIn: string;
      input: TransferInput;
    }) => {
      const { error } = await supabase.rpc('create_transfer', {
        p_from_account_id: input.from_account_id,
        p_to_account_id: input.to_account_id,
        p_amount: input.amount,
        p_currency: input.currency,
        p_occurred_on: input.occurred_on,
        // El codegen de Supabase modela `p_notes` como `string` no nulable,
        // pero el parámetro Postgres es `text` y sí acepta null.
        p_notes: input.notes as string,
        p_client_id_out: clientIdOut,
        p_client_id_in: clientIdIn,
      });
      if (error && !isUniqueViolation(error)) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateCardPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, input }: { clientId: string; input: CardPaymentInput }) => {
      const { error } = await supabase.rpc('create_card_payment', {
        p_card_id: input.card_id,
        p_from_account_id: input.from_account_id,
        p_amount: input.amount,
        p_currency: input.currency,
        p_occurred_on: input.occurred_on,
        p_notes: input.notes as string,
        p_client_id: clientId,
      });
      if (error && !isUniqueViolation(error)) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['cards'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** Anular: nunca borra. Ingreso/gasto es un update directo; transferencia
 * y pago de tarjeta usan RPC porque anulan dos filas a la vez (regla
 * global 14 — misma razón atómica que crearlos). */
export function useVoidTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Transaction) => {
      if (transaction.type === 'transfer') {
        const { error } = await supabase.rpc('void_transfer', { p_transfer_id: transaction.transfer_id! });
        if (error) throw error;
      } else if (transaction.type === 'card_payment') {
        const { error } = await supabase.rpc('void_card_payment', {
          p_card_payment_id: transaction.card_payment_id!,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transactions')
          .update({ status: 'voided' })
          .eq('id', transaction.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['cards'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
