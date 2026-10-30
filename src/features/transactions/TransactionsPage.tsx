import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeftRight, CreditCard, FileUp, Plus, TrendingDown } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageMessage } from '@/shared/ui/PageMessage';
import { Button } from '@/shared/ui/Button';
import { useTransactions, type TransactionFilters as Filters, type TransactionType } from '@/features/transactions/api/useTransactions';
import { useAccounts } from '@/features/accounts/api/useAccounts';
import { useCards } from '@/features/accounts/api/useCards';
import { useCategories } from '@/features/categories/api/useCategories';
import { MovementFormDialog } from '@/features/transactions/components/MovementFormDialog';
import { TransferFormDialog } from '@/features/transactions/components/TransferFormDialog';
import { CardPaymentFormDialog } from '@/features/transactions/components/CardPaymentFormDialog';
import { TransactionListItem } from '@/features/transactions/components/TransactionListItem';
import {
  TransactionFilters as TransactionFiltersPanel,
  type TransactionFiltersValue,
} from '@/features/transactions/components/TransactionFilters';

const ALL = '__all__';

const DEFAULT_FILTERS: TransactionFiltersValue = {
  search: '',
  from: '',
  to: '',
  accountId: ALL,
  cardId: ALL,
  categoryId: ALL,
  type: ALL,
};

export function TransactionsPage() {
  const navigate = useNavigate();
  const [movementOpen, setMovementOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [cardPaymentOpen, setCardPaymentOpen] = useState(false);

  const [filterValue, setFilterValue] = useState<TransactionFiltersValue>(DEFAULT_FILTERS);
  const updateFilters = (next: Partial<TransactionFiltersValue>) =>
    setFilterValue((prev) => ({ ...prev, ...next }));

  const { data: accounts = [] } = useAccounts();
  const { data: cards = [] } = useCards();
  const { data: categories = [] } = useCategories();

  const filters: Filters = useMemo(
    () => ({
      from: filterValue.from || undefined,
      to: filterValue.to || undefined,
      accountId: filterValue.accountId === ALL ? undefined : filterValue.accountId,
      cardId: filterValue.cardId === ALL ? undefined : filterValue.cardId,
      categoryId: filterValue.categoryId === ALL ? undefined : filterValue.categoryId,
      type: filterValue.type === ALL ? undefined : (filterValue.type as TransactionType),
      search: filterValue.search.trim() || undefined,
    }),
    [filterValue],
  );

  const { data: transactions, isPending, isError } = useTransactions(filters);

  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));
  const cardNameById = new Map(cards.map((c) => [c.id, c.name]));
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const hasAnySource = accounts.length > 0 || cards.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-ink">Movimientos</h1>
        {hasAnySource ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setMovementOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Ingreso/Gasto
            </Button>
            <Button size="sm" intent="secondary" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRight className="size-4" aria-hidden />
              Transferencia
            </Button>
            <Button size="sm" intent="secondary" onClick={() => setCardPaymentOpen(true)}>
              <CreditCard className="size-4" aria-hidden />
              Pago de tarjeta
            </Button>
            <Button size="sm" intent="secondary" onClick={() => navigate('/transactions/import')}>
              <FileUp className="size-4" aria-hidden />
              Importar CSV
            </Button>
          </div>
        ) : null}
      </div>

      {!hasAnySource ? (
        <EmptyState
          icon={TrendingDown}
          title="Sin movimientos registrados"
          description="Creá una cuenta o tarjeta primero (pestaña Cuentas) y después registrá ingresos, gastos o transferencias desde aquí."
        />
      ) : (
        <>
          <TransactionFiltersPanel
            value={filterValue}
            onChange={updateFilters}
            accounts={accounts}
            cards={cards}
            categories={categories}
          />

          {isPending ? (
            <LoadingState />
          ) : isError ? (
            <PageMessage tone="error">No se pudieron cargar los movimientos.</PageMessage>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={TrendingDown}
              title="Sin movimientos para este filtro"
              description="Probá ajustar las fechas o limpiar los filtros, o registrá tu primer movimiento."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.map((transaction) => (
                <TransactionListItem
                  key={transaction.id}
                  transaction={transaction}
                  accountName={transaction.account_id ? accountNameById.get(transaction.account_id) ?? null : null}
                  cardName={transaction.card_id ? cardNameById.get(transaction.card_id) ?? null : null}
                  categoryName={transaction.category_id ? categoryNameById.get(transaction.category_id) ?? null : null}
                />
              ))}
            </div>
          )}
        </>
      )}

      <MovementFormDialog open={movementOpen} onOpenChange={setMovementOpen} />
      <TransferFormDialog open={transferOpen} onOpenChange={setTransferOpen} />
      <CardPaymentFormDialog open={cardPaymentOpen} onOpenChange={setCardPaymentOpen} />
    </div>
  );
}
