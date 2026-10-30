import { useRef, useState } from 'react';
import { Archive, ArchiveRestore, BellRing, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Money } from '@/shared/ui/Money';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toast } from '@/shared/lib/toast';
import { offlineActionMessage } from '@/shared/lib/offlineActionMessage';
import { formatDisplayDate, todayInAppTimeZone } from '@/shared/lib/date';
import {
  useArchiveRecurringExpense,
  useDeleteRecurringExpense,
  useMarkRecurringExpensePaid,
  type RecurringExpense,
} from '@/features/budgets/api/useRecurringExpenses';

const FREQUENCY_LABEL: Record<RecurringExpense['frequency'], string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
};

export function RecurringExpenseListItem({
  recurringExpense,
  onEdit,
}: {
  recurringExpense: RecurringExpense;
  onEdit: () => void;
}) {
  const archive = useArchiveRecurringExpense();
  const deleteRecurringExpense = useDeleteRecurringExpense();
  const markPaid = useMarkRecurringExpensePaid();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const clientIdRef = useRef(crypto.randomUUID());
  const archived = Boolean(recurringExpense.archived_at);

  const overdue = !archived && recurringExpense.next_due_on < todayInAppTimeZone();

  const handleDelete = async () => {
    try {
      await deleteRecurringExpense.mutateAsync(recurringExpense.id);
      toast.success('Gasto recurrente eliminado');
      setConfirmDelete(false);
    } catch (error) {
      toast.error(offlineActionMessage(error, 'No se pudo eliminar el gasto recurrente'));
    }
  };

  const handleMarkPaid = async () => {
    try {
      const { queued } = await markPaid.mutateAsync({
        clientId: clientIdRef.current,
        recurringExpenseId: recurringExpense.id,
        occurredOn: todayInAppTimeZone(),
      });
      clientIdRef.current = crypto.randomUUID();
      toast[queued ? 'info' : 'success'](
        queued
          ? 'Sin conexión: el pago quedó pendiente de enviar'
          : 'Gasto registrado y próximo vencimiento actualizado',
      );
    } catch {
      toast.error('No se pudo registrar el pago');
    }
  };

  return (
    <Card className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-ink">{recurringExpense.name}</span>
          {archived ? <Badge tone="neutral">Archivado</Badge> : null}
          {overdue ? <Badge tone="expense">Vencido</Badge> : null}
          {recurringExpense.reminder_enabled ? (
            <BellRing className="size-3.5 shrink-0 text-ink-muted" aria-label="Recordatorio activado" />
          ) : null}
        </div>
        <span className="truncate text-xs text-ink-muted">
          {FREQUENCY_LABEL[recurringExpense.frequency]} · próximo {formatDisplayDate(recurringExpense.next_due_on)}
        </span>
      </div>
      <Money className="shrink-0" amount={recurringExpense.amount} currency={recurringExpense.currency} />
      <div className="flex shrink-0 gap-1">
        {!archived ? (
          <Button
            intent="ghost"
            size="icon"
            aria-label="Marcar como pagado"
            loading={markPaid.isPending}
            onClick={handleMarkPaid}
          >
            <CheckCircle2 className="size-4" aria-hidden />
          </Button>
        ) : null}
        <Button intent="ghost" size="icon" aria-label="Editar" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          intent="ghost"
          size="icon"
          aria-label={archived ? 'Restaurar' : 'Archivar'}
          onClick={() => archive.mutate({ id: recurringExpense.id, archived: !archived })}
        >
          {archived ? <ArchiveRestore className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
        </Button>
        <Button intent="ghost" size="icon" aria-label="Eliminar" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar gasto recurrente"
        description={`¿Eliminar "${recurringExpense.name}"? Los gastos ya registrados no se borran.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleteRecurringExpense.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
