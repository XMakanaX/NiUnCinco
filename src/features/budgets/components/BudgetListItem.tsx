import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Money } from '@/shared/ui/Money';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toast } from '@/shared/lib/toast';
import { offlineActionMessage } from '@/shared/lib/offlineActionMessage';
import { monthLabel } from '@/shared/lib/date';
import { useArchiveBudget, useDeleteBudget, type Budget } from '@/features/budgets/api/useBudgets';

interface BudgetListItemProps {
  budget: Budget;
  categoryName: string | null;
  onEdit: () => void;
}

export function BudgetListItem({ budget, categoryName, onEdit }: BudgetListItemProps) {
  const archiveBudget = useArchiveBudget();
  const deleteBudget = useDeleteBudget();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = Boolean(budget.archived_at);

  const [year, month] = budget.period_month.split('-').map(Number);
  const pct = budget.amount_limit > 0 ? (budget.amount_spent / budget.amount_limit) * 100 : 0;
  const overBudget = pct >= 100;
  const nearLimit = !overBudget && budget.alert_threshold_pct !== null && pct >= budget.alert_threshold_pct;
  const remaining = budget.amount_limit - budget.amount_spent;

  const handleDelete = async () => {
    try {
      await deleteBudget.mutateAsync(budget.id);
      toast.success('Presupuesto eliminado');
      setConfirmDelete(false);
    } catch (error) {
      toast.error(offlineActionMessage(error, 'No se pudo eliminar el presupuesto'));
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium text-ink">{categoryName ?? 'Presupuesto general'}</span>
          <span className="truncate text-xs text-ink-muted">
            {monthLabel(year!, month!)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {archived ? <Badge tone="neutral">Archivado</Badge> : null}
          {!archived && overBudget ? <Badge tone="expense">Excedido</Badge> : null}
          {!archived && nearLimit ? <Badge tone="expense">Cerca del límite</Badge> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2 w-full min-w-0 flex-1 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-[var(--ease-out)]"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: overBudget ? 'var(--expense)' : 'var(--brand)',
            }}
          />
        </div>
        <span className={`shrink-0 text-xs font-medium tabular-nums ${overBudget ? 'text-expense' : 'text-ink-muted'}`}>
          {Math.round(pct)}%
        </span>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-ink-muted">
          <Money amount={budget.amount_spent} currency={budget.currency} size="sm" /> de{' '}
          <Money amount={budget.amount_limit} currency={budget.currency} size="sm" />
        </span>
        <span className={remaining < 0 ? 'text-expense' : 'text-ink-muted'}>
          {remaining < 0 ? 'Excedido por ' : 'Restante '}
          <Money amount={Math.abs(remaining)} currency={budget.currency} size="sm" />
        </span>
      </div>

      <div className="flex shrink-0 justify-end gap-1">
        <Button intent="ghost" size="icon" aria-label="Editar" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          intent="ghost"
          size="icon"
          aria-label={archived ? 'Restaurar' : 'Archivar'}
          onClick={() => archiveBudget.mutate({ id: budget.id, archived: !archived })}
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
        title="Eliminar presupuesto"
        description={`¿Eliminar el presupuesto de "${categoryName ?? 'presupuesto general'}" para ${monthLabel(year!, month!)}?`}
        confirmLabel="Eliminar"
        destructive
        loading={deleteBudget.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
