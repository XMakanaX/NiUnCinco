import { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { LoadingState } from '@/shared/ui/LoadingState';
import { useTransactions } from '@/features/transactions/api/useTransactions';
import { TransactionListItem } from '@/features/transactions/components/TransactionListItem';
import type { Account } from '@/features/accounts/api/useAccounts';
import type { Card } from '@/features/accounts/api/useCards';
import type { Category } from '@/features/categories/api/useCategories';

interface GlobalSearchProps {
  accounts: Account[];
  cards: Card[];
  categories: Category[];
}

const RESULT_LIMIT = 50;

/**
 * Búsqueda global de movimientos (plan Fase 12) — sin filtro de fecha,
 * busca en comercio/notas en todo el historial del usuario. Reusa el
 * mismo `ilike` de `useTransactions` (Fase 6); `limit` evita traer todo
 * el historial cuando la búsqueda es genérica.
 */
export function GlobalSearch({ accounts, cards, categories }: GlobalSearchProps) {
  const [search, setSearch] = useState('');
  const { data: results, isPending } = useTransactions(
    search.trim() ? { search: search.trim(), limit: RESULT_LIMIT } : { limit: RESULT_LIMIT },
  );

  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));
  const cardNameById = new Map(cards.map((c) => [c.id, c.name]));
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Buscar en todos los movimientos"
        placeholder="Comercio o notas"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isPending ? (
        <LoadingState rows={3} />
      ) : !results || results.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin resultados.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {results.length === RESULT_LIMIT ? (
            <p className="text-xs text-ink-muted">Mostrando los {RESULT_LIMIT} más recientes.</p>
          ) : null}
          {results.map((transaction) => (
            <TransactionListItem
              key={transaction.id}
              transaction={transaction}
              accountName={transaction.account_id ? (accountNameById.get(transaction.account_id) ?? null) : null}
              cardName={transaction.card_id ? (cardNameById.get(transaction.card_id) ?? null) : null}
              categoryName={
                transaction.category_id ? (categoryNameById.get(transaction.category_id) ?? null) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
