import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import type { Database } from '@/types/database';
import type { CurrencyCode } from '@/shared/lib/money';
import type { CardInput } from '@/features/accounts/schema';

type CardRow = Database['public']['Tables']['cards']['Row'];
export type Card = Omit<CardRow, 'currency' | 'card_type'> & {
  currency: CurrencyCode;
  card_type: 'debit' | 'credit';
  balanceDue: number | null;
  availableCredit: number | null;
};

const QUERY_KEY = ['cards'];

export function useCards() {
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...QUERY_KEY, userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Card[]> => {
      const [cardsRes, balancesRes] = await Promise.all([
        supabase.from('cards').select('*').order('created_at'),
        supabase.from('card_balances').select('card_id, balance_due, available_credit'),
      ]);
      if (cardsRes.error) throw cardsRes.error;
      if (balancesRes.error) throw balancesRes.error;

      const balanceByCard = new Map(balancesRes.data.map((row) => [row.card_id, row]));
      return cardsRes.data.map((card) => {
        const balance = balanceByCard.get(card.id);
        return {
          ...card,
          balanceDue: balance?.balance_due ?? null,
          availableCredit: balance?.available_credit ?? null,
        };
      }) as Card[];
    },
  });
}

export function useCreateCard() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CardInput) => {
      const { error } = await supabase.from('cards').insert({ ...input, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CardInput }) => {
      const { error } = await supabase.from('cards').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/** Umbral de recordatorio visual de vencimiento (Fase 10) — no es un
 * campo del formulario de tarjeta (`cardSchema`), se edita desde el
 * detalle de la tarjeta. */
export function useUpdateCardReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reminderDaysBefore }: { id: string; reminderDaysBefore: number | null }) => {
      const { error } = await supabase
        .from('cards')
        .update({ reminder_days_before: reminderDaysBefore })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useArchiveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('cards')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
