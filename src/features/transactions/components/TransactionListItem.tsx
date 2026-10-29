import { useState } from 'react';
import { Ban, ArrowLeftRight, CreditCard as CardIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Money } from '@/shared/ui/Money';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toast } from '@/shared/lib/toast';
import { formatDisplayDate } from '@/shared/lib/date';
import { useVoidTransaction, type Transaction } from '@/features/transactions/api/useTransactions';

const TYPE_ICON = {
  income: TrendingUp,
  expense: TrendingDown,
  transfer: ArrowLeftRight,
  card_payment: CardIcon,
} as const;

const TYPE_LABEL: Record<Transaction['type'], string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
  card_payment: 'Pago de tarjeta',
};

interface TransactionListItemProps {
  transaction: Transaction;
  accountName: string | null;
  cardName: string | null;
  categoryName: string | null;
}

export function TransactionListItem({
  transaction,
  accountName,
  cardName,
  categoryName,
}: TransactionListItemProps) {
  const voidTransaction = useVoidTransaction();
  const [confirmVoid, setConfirmVoid] = useState(false);
  const Icon = TYPE_ICON[transaction.type];
  const voided = transaction.status === 'voided';
  const tone: 'income' | 'expense' | 'neutral' =
    transaction.type === 'income' ? 'income' : transaction.type === 'expense' ? 'expense' : 'neutral';

  const handleVoid = async () => {
    try {
      await voidTransaction.mutateAsync(transaction);
      toast.success('Movimiento anulado');
      setConfirmVoid(false);
    } catch {
      toast.error('No se pudo anular el movimiento');
    }
  };

  return (
    <Card className={`flex items-center gap-3 ${voided ? 'opacity-60' : ''}`}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-ink">
            {transaction.merchant || categoryName || TYPE_LABEL[transaction.type]}
          </span>
          {voided ? <Badge className="shrink-0" tone="neutral">Anulado</Badge> : null}
        </div>
        <span className="truncate text-xs text-ink-muted">
          {formatDisplayDate(transaction.occurred_on)}
          {accountName ? ` · ${accountName}` : ''}
          {cardName ? ` · ${cardName}` : ''}
          {categoryName && transaction.merchant ? ` · ${categoryName}` : ''}
        </span>
      </div>
      <Money
        className="shrink-0"
        amount={transaction.amount}
        currency={transaction.currency}
        tone={voided ? 'neutral' : tone}
      />
      {!voided ? (
        <Button intent="ghost" size="icon" className="shrink-0" aria-label="Anular" onClick={() => setConfirmVoid(true)}>
          <Ban className="size-4" aria-hidden />
        </Button>
      ) : null}
      <ConfirmDialog
        open={confirmVoid}
        onOpenChange={setConfirmVoid}
        title="Anular movimiento"
        description="El movimiento queda marcado como anulado y deja de afectar saldos, pero no se borra del historial."
        confirmLabel="Anular"
        destructive
        loading={voidTransaction.isPending}
        onConfirm={handleVoid}
      />
    </Card>
  );
}
