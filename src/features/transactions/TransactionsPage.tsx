import { useMemo, useState } from 'react';
import { ArrowLeftRight, CreditCard, Plus, TrendingDown } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { PageMessage } from '@/shared/ui/PageMessage';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { useTransactions, type TransactionFilters, type TransactionType } from '@/features/transactions/api/useTransactions';
import { useAccounts } from '@/features/accounts/api/useAccounts';
import { useCards } from '@/features/accounts/api/useCards';
import { useCategories } from '@/features/categories/api/useCategories';
import { MovementFormDialog } from '@/features/transactions/components/MovementFormDialog';
import { TransferFormDialog } from '@/features/transactions/components/TransferFormDialog';
import { CardPaymentFormDialog } from '@/features/transactions/components/CardPaymentFormDialog';
import { TransactionListItem } from '@/features/transactions/components/TransactionListItem';

const ALL = '__all__';
const TYPE_OPTIONS = [
  { label: 'Todos los tipos', value: ALL },
  { label: 'Ingresos', value: 'income' as const },
  { label: 'Gastos', value: 'expense' as const },
  { label: 'Transferencias', value: 'transfer' as const },
  { label: 'Pagos de tarjeta', value: 'card_payment' as const },
];

export function TransactionsPage() {
  const [movementOpen, setMovementOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [cardPaymentOpen, setCardPaymentOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [accountId, setAccountId] = useState(ALL);
  const [cardId, setCardId] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [type, setType] = useState(ALL);

  const { data: accounts = [] } = useAccounts();
  const { data: cards = [] } = useCards();
  const { data: categories = [] } = useCategories();

  const filters: TransactionFilters = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      accountId: accountId === ALL ? undefined : accountId,
      cardId: cardId === ALL ? undefined : cardId,
      categoryId: categoryId === ALL ? undefined : categoryId,
      type: type === ALL ? undefined : (type as TransactionType),
      search: search.trim() || undefined,
    }),
    [from, to, accountId, cardId, categoryId, type, search],
  );

  const { data: transactions, isPending, isError } = useTransactions(filters);

  const accountOptions = [ALL, ...accounts.map((a) => a.id)];
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
          <div className="flex flex-wrap gap-3">
            <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Input
              label="Buscar"
              placeholder="Comercio o notas"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              label="Tipo"
              options={TYPE_OPTIONS}
              value={type}
              onValueChange={(value) => setType(value)}
            />
            <Select
              label="Cuenta"
              options={[
                { label: 'Todas las cuentas', value: ALL },
                ...accounts.map((a) => ({ label: a.name, value: a.id })),
              ]}
              value={accountOptions.includes(accountId) ? accountId : ALL}
              onValueChange={setAccountId}
            />
            <Select
              label="Tarjeta"
              options={[{ label: 'Todas las tarjetas', value: ALL }, ...cards.map((c) => ({ label: c.name, value: c.id }))]}
              value={cardId}
              onValueChange={setCardId}
            />
            <Select
              label="Categoría"
              options={[
                { label: 'Todas las categorías', value: ALL },
                ...categories.map((c) => ({ label: c.name, value: c.id })),
              ]}
              value={categoryId}
              onValueChange={setCategoryId}
            />
          </div>

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
