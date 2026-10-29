import { useState } from 'react';
import { Dialog } from '@/shared/ui/Dialog';
import { Badge } from '@/shared/ui/Badge';
import { Money } from '@/shared/ui/Money';
import { Button } from '@/shared/ui/Button';
import { Select } from '@/shared/ui/Select';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { LoadingState } from '@/shared/ui/LoadingState';
import { toast } from '@/shared/lib/toast';
import { creditCardCycle, daysUntil, formatDisplayDate } from '@/shared/lib/date';
import type { Card } from '@/features/accounts/api/useCards';
import { useUpdateCardReminder } from '@/features/accounts/api/useCards';
import { useTransactions } from '@/features/transactions/api/useTransactions';
import {
  useCardPayments,
  useVoidCardPayment,
  type CardPaymentHistoryEntry,
} from '@/features/transactions/api/useTransactions';
import { CardPaymentFormDialog } from '@/features/transactions/components/CardPaymentFormDialog';

const REMINDER_OPTIONS = [
  { label: 'Sin recordatorio', value: 'none' },
  { label: '1 día antes', value: '1' },
  { label: '3 días antes', value: '3' },
  { label: '5 días antes', value: '5' },
  { label: '7 días antes', value: '7' },
];

function PaymentRow({ payment }: { payment: CardPaymentHistoryEntry }) {
  const voidPayment = useVoidCardPayment();
  const [confirmVoid, setConfirmVoid] = useState(false);
  const voided = payment.status === 'voided';

  const handleVoid = async () => {
    try {
      await voidPayment.mutateAsync(payment.id);
      toast.success('Pago anulado');
      setConfirmVoid(false);
    } catch {
      toast.error('No se pudo anular el pago');
    }
  };

  return (
    <div className={`flex items-center gap-2 rounded-[var(--radius-md)] border border-border p-3 ${voided ? 'opacity-60' : ''}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm text-ink">{formatDisplayDate(payment.occurred_on)}</span>
        {payment.notes ? <span className="truncate text-xs text-ink-muted">{payment.notes}</span> : null}
      </div>
      {voided ? <Badge tone="neutral">Anulado</Badge> : null}
      <Money amount={payment.amount} currency={payment.currency} size="sm" />
      {!voided ? (
        <Button intent="ghost" size="sm" onClick={() => setConfirmVoid(true)}>
          Anular
        </Button>
      ) : null}
      <ConfirmDialog
        open={confirmVoid}
        onOpenChange={setConfirmVoid}
        title="Anular pago"
        description="La deuda y el saldo de la cuenta de origen vuelven a su estado anterior. El pago no se borra, queda marcado como anulado."
        confirmLabel="Anular"
        destructive
        loading={voidPayment.isPending}
        onConfirm={handleVoid}
      />
    </div>
  );
}

export function CardDetailDialog({
  card,
  open,
  onOpenChange,
}: {
  card: Card | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const updateReminder = useUpdateCardReminder();

  const hasCycle = Boolean(card?.statement_day && card?.due_day);
  const cycle = hasCycle ? creditCardCycle(card!.statement_day!, card!.due_day!) : null;
  const daysToDue = cycle ? daysUntil(cycle.dueDate) : null;

  const { data: purchases = [], isPending: purchasesPending } = useTransactions(
    cycle
      ? { cardId: card?.id, type: 'expense', from: cycle.periodStart, to: cycle.periodEnd }
      // Sin corte configurado no hay periodo que resumir: rango vacío en
      // vez de traer todo el historial de la tarjeta sin usarlo.
      : { cardId: card?.id, type: 'expense', from: '0001-01-01', to: '0001-01-01' },
  );
  const { data: payments = [], isPending: paymentsPending } = useCardPayments(card?.id ?? null);

  const periodTotal = purchases.reduce((sum, t) => sum + t.amount, 0);
  const reminderValue = card?.reminder_days_before != null ? String(card.reminder_days_before) : 'none';
  const showReminderBadge =
    card?.reminder_days_before != null && daysToDue !== null && daysToDue <= card.reminder_days_before;

  const handleReminderChange = async (value: string) => {
    if (!card) return;
    await updateReminder.mutateAsync({
      id: card.id,
      reminderDaysBefore: value === 'none' ? null : Number(value),
    });
  };

  if (!card) return null;

  return (
    <>
      <Dialog
        trigger={<button type="button" hidden />}
        open={open}
        onOpenChange={onOpenChange}
        title={card.name}
        description="El saldo es un control personal: puede necesitar conciliación con el estado de cuenta real del banco."
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-sunken p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-ink-muted">Deuda actual</span>
              <Money amount={card.balanceDue ?? 0} currency={card.currency} tone="expense" />
            </div>
            {card.availableCredit !== null ? (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs text-ink-muted">Crédito disponible</span>
                <Money amount={card.availableCredit} currency={card.currency} />
              </div>
            ) : null}
          </div>

          {cycle ? (
            <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Periodo actual</span>
                <span className="text-xs text-ink-muted">
                  {formatDisplayDate(cycle.periodStart)} – {formatDisplayDate(cycle.periodEnd)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Compras del periodo</span>
                <Money amount={periodTotal} currency={card.currency} tone="expense" size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Próximo vencimiento</span>
                <span className="flex items-center gap-2 text-sm text-ink">
                  {formatDisplayDate(cycle.dueDate)}
                  {showReminderBadge ? (
                    <Badge tone="expense">
                      {daysToDue! <= 0 ? 'Vence hoy o ya venció' : `Vence en ${daysToDue} día(s)`}
                    </Badge>
                  ) : null}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-muted">
              Esta tarjeta no tiene fecha de corte o vencimiento configurada.
            </p>
          )}

          <Select
            label="Recordatorio de vencimiento"
            options={REMINDER_OPTIONS}
            value={reminderValue}
            onValueChange={handleReminderChange}
          />
          <p className="text-xs text-ink-muted">
            Solo resalta el vencimiento en esta pantalla — la app no envía notificaciones ni correos.
          </p>

          <Button onClick={() => setPaymentDialogOpen(true)}>Registrar pago</Button>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink">Historial de pagos</span>
            {purchasesPending || paymentsPending ? (
              <LoadingState />
            ) : payments.length === 0 ? (
              <p className="text-xs text-ink-muted">Todavía no hay pagos registrados para esta tarjeta.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {payments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>
      <CardPaymentFormDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen} defaultCardId={card.id} />
    </>
  );
}
