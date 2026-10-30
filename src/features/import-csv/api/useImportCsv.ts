import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import { computeFingerprint } from '../lib/fingerprint';
import type { ValidRow } from '../lib/validateRows';

export interface SoftDuplicateMatch {
  rowNumber: number;
  existingMerchant: string | null;
}

/** Dedupe "suave": mismo monto/fecha/tipo/moneda en la misma cuenta ya
 * existe, aunque el texto de comercio difiera (la huella exacta de la
 * Fase 11 no lo detectaría porque incluye el comercio). Plan: "dejá casos
 * ambiguos para revisión" — nunca se excluye solo, se marca para que el
 * usuario decida antes de confirmar. */
export function useFindSoftDuplicates() {
  return useMutation({
    mutationFn: async ({
      accountId,
      rows,
    }: {
      accountId: string;
      rows: ValidRow[];
    }): Promise<SoftDuplicateMatch[]> => {
      if (rows.length === 0) return [];
      const dates = rows.map((r) => r.occurred_on);
      const minDate = dates.reduce((a, b) => (a < b ? a : b));
      const maxDate = dates.reduce((a, b) => (a > b ? a : b));

      const { data, error } = await supabase
        .from('transactions')
        .select('occurred_on, amount, currency, type, merchant')
        .eq('account_id', accountId)
        .eq('status', 'confirmed')
        .in('type', ['income', 'expense'])
        .gte('occurred_on', minDate)
        .lte('occurred_on', maxDate);
      if (error) throw error;

      const existingKeys = new Set(
        data.map((row) => `${row.occurred_on}|${row.amount}|${row.currency}|${row.type}`),
      );

      return rows
        .filter((row) => existingKeys.has(`${row.occurred_on}|${row.amount}|${row.currency}|${row.type}`))
        .map((row) => ({ rowNumber: row.rowNumber, existingMerchant: row.merchant }));
    },
  });
}

export interface ImportResult {
  sent: number;
  imported: number;
  skippedAsDuplicate: number;
}

const CHUNK_SIZE = 300;

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

/**
 * Inserta las filas aceptadas usando `upsert` con `ignoreDuplicates` sobre
 * el `unique(user_id, client_id)` ya existente (Fase 4): un `client_id`
 * repetido —mismo archivo importado dos veces— no rompe el lote, Postgres
 * lo descarta en silencio y la fila no vuelve en la respuesta, así que
 * `enviadas - devueltas` es exactamente el conteo de "omitidos por
 * duplicado exacto" sin consultas extra. Cada lote es una sola sentencia
 * `insert`, ya atómica en Postgres — un fallo real en un lote no deja
 * filas sueltas de ese lote, y los lotes previos ya confirmados quedan
 * reportados como importados (regla global: "evitar que fallos parciales
 * dejen datos inconsistentes").
 */
export function useImportCsv() {
  const userId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountId,
      rows,
    }: {
      accountId: string;
      rows: ValidRow[];
    }): Promise<ImportResult> => {
      if (!userId) throw new Error('Sesión requerida');

      const payload = await Promise.all(
        rows.map(async (row) => ({
          user_id: userId,
          account_id: accountId,
          card_id: null,
          category_id: null,
          type: row.type,
          amount: row.amount,
          currency: row.currency,
          occurred_on: row.occurred_on,
          merchant: row.merchant,
          notes: null,
          tags: [],
          status: 'confirmed',
          client_id: await computeFingerprint([
            userId,
            accountId,
            row.occurred_on,
            String(row.amount),
            row.currency,
            row.type,
            row.merchant ?? '',
          ]),
        })),
      );

      let imported = 0;
      for (const batch of chunk(payload, CHUNK_SIZE)) {
        const { data, error } = await supabase
          .from('transactions')
          .upsert(batch, { onConflict: 'user_id,client_id', ignoreDuplicates: true })
          .select('id');
        if (error) throw error;
        imported += data?.length ?? 0;
      }

      return { sent: payload.length, imported, skippedAsDuplicate: payload.length - imported };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
