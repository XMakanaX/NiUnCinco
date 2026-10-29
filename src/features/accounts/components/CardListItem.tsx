import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import { Card as UiCard } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Money } from '@/shared/ui/Money';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toast } from '@/shared/lib/toast';
import { useArchiveCard, useDeleteCard, type Card } from '@/features/accounts/api/useCards';
import { isForeignKeyViolation } from '@/shared/lib/postgresErrors';

export function CardListItem({ card, onEdit }: { card: Card; onEdit: () => void }) {
  const archiveCard = useArchiveCard();
  const deleteCard = useDeleteCard();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = Boolean(card.archived_at);

  const handleDelete = async () => {
    try {
      await deleteCard.mutateAsync(card.id);
      toast.success('Tarjeta eliminada');
      setConfirmDelete(false);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        await archiveCard.mutateAsync({ id: card.id, archived: true });
        toast.info('Esta tarjeta tiene movimientos asociados: se archivó en vez de eliminarse');
        setConfirmDelete(false);
      } else {
        toast.error('No se pudo eliminar la tarjeta');
      }
    }
  };

  return (
    <UiCard className="flex items-center gap-3">
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: card.color ?? 'var(--border)' }}
        aria-hidden
      />
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">{card.name}</span>
          <Badge tone="brand">{card.card_type === 'credit' ? 'Crédito' : 'Débito'}</Badge>
          {archived ? <Badge tone="neutral">Archivada</Badge> : null}
        </div>
        <span className="text-xs text-ink-muted">{card.bank ?? 'Sin banco'}</span>
      </div>
      {card.card_type === 'credit' ? (
        <div className="flex flex-col items-end gap-0.5">
          <Money amount={card.balanceDue ?? 0} currency={card.currency} tone="expense" size="sm" />
          {card.availableCredit !== null ? (
            <span className="text-xs text-ink-muted">
              Disponible: <Money amount={card.availableCredit} currency={card.currency} size="sm" />
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex gap-1">
        <Button intent="ghost" size="sm" aria-label="Editar" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          intent="ghost"
          size="sm"
          aria-label={archived ? 'Restaurar' : 'Archivar'}
          onClick={() => archiveCard.mutate({ id: card.id, archived: !archived })}
        >
          {archived ? <ArchiveRestore className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
        </Button>
        <Button intent="ghost" size="sm" aria-label="Eliminar" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar tarjeta"
        description={`¿Eliminar "${card.name}"? Si tiene movimientos asociados, se archivará en su lugar.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleteCard.isPending || archiveCard.isPending}
        onConfirm={handleDelete}
      />
    </UiCard>
  );
}
