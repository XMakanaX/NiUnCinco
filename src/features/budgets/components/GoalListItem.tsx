import { useState } from 'react';
import { Archive, ArchiveRestore, ChevronDown, Pencil, PiggyBank, Trash2 } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Money } from '@/shared/ui/Money';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toast } from '@/shared/lib/toast';
import { offlineActionMessage } from '@/shared/lib/offlineActionMessage';
import { formatDisplayDate, todayInAppTimeZone } from '@/shared/lib/date';
import { useArchiveGoal, useDeleteGoal, useGoalContributions, type Goal } from '@/features/budgets/api/useGoals';

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

interface GoalListItemProps {
  goal: Goal;
  onEdit: () => void;
  onContribute: () => void;
}

export function GoalListItem({ goal, onEdit, onContribute }: GoalListItemProps) {
  const archiveGoal = useArchiveGoal();
  const deleteGoal = useDeleteGoal();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { data: contributions = [] } = useGoalContributions(historyOpen ? goal.id : null);
  const archived = Boolean(goal.archived_at);

  const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  // Ritmo de ahorro: solo si hay al menos un aporte y queda algo por
  // ahorrar — "cuando haya datos suficientes" (plan Fase 9), nunca se
  // inventa un ritmo sin aportes reales.
  const oldestContribution = contributions.filter((c) => c.type === 'contribution').at(-1);
  const today = todayInAppTimeZone();
  let pace: string | null = null;
  if (oldestContribution && remaining > 0 && goal.current_amount > 0) {
    const days = daysBetween(oldestContribution.occurred_on, today);
    if (days > 0) {
      const perDay = goal.current_amount / days;
      if (perDay > 0) {
        const daysLeft = Math.ceil(remaining / perDay);
        pace = `A este ritmo, faltan ~${daysLeft} día(s) para llegar a la meta`;
      }
    }
  }

  const handleDelete = async () => {
    try {
      await deleteGoal.mutateAsync(goal.id);
      toast.success('Meta eliminada');
      setConfirmDelete(false);
    } catch (error) {
      toast.error(offlineActionMessage(error, 'No se pudo eliminar la meta'));
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium text-ink">{goal.name}</span>
          {goal.target_date ? (
            <span className="truncate text-xs text-ink-muted">Fecha objetivo: {formatDisplayDate(goal.target_date)}</span>
          ) : null}
        </div>
        {archived ? <Badge tone="neutral">Archivada</Badge> : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2 w-full min-w-0 flex-1 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300 ease-[var(--ease-out)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium text-ink-muted tabular-nums">{Math.round(pct)}%</span>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-ink-muted">
          <Money amount={goal.current_amount} currency={goal.currency} size="sm" /> de{' '}
          <Money amount={goal.target_amount} currency={goal.currency} size="sm" />
        </span>
        <span className="text-ink-muted">
          Falta <Money amount={remaining} currency={goal.currency} size="sm" />
        </span>
      </div>
      {pace ? <p className="text-xs text-ink-muted">{pace}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-1">
        <Button intent="secondary" onClick={() => setHistoryOpen((v) => !v)}>
          <ChevronDown className={`size-4 transition-transform ${historyOpen ? 'rotate-180' : ''}`} aria-hidden />
          Historial
        </Button>
        <div className="flex shrink-0 gap-1">
          {!archived ? (
            <Button intent="ghost" size="icon" aria-label="Aportar o retirar" onClick={onContribute}>
              <PiggyBank className="size-4" aria-hidden />
            </Button>
          ) : null}
          <Button intent="ghost" size="icon" aria-label="Editar" onClick={onEdit}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            intent="ghost"
            size="icon"
            aria-label={archived ? 'Restaurar' : 'Archivar'}
            onClick={() => archiveGoal.mutate({ id: goal.id, archived: !archived })}
          >
            {archived ? <ArchiveRestore className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
          </Button>
          <Button intent="ghost" size="icon" aria-label="Eliminar" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {historyOpen ? (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-2">
          {contributions.length === 0 ? (
            <li className="text-sm text-ink-muted">Sin aportes ni retiros todavía.</li>
          ) : (
            contributions.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-ink-muted">
                  {formatDisplayDate(c.occurred_on)} · {c.type === 'contribution' ? 'Aporte' : 'Retiro'}
                  {c.notes ? ` · ${c.notes}` : ''}
                </span>
                <Money
                  className="shrink-0"
                  amount={c.type === 'withdrawal' ? -c.amount : c.amount}
                  currency={goal.currency}
                  size="sm"
                />
              </li>
            ))
          )}
        </ul>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar meta"
        description={`¿Eliminar "${goal.name}"? Se perderá también su historial de aportes y retiros.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleteGoal.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
