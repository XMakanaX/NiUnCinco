import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import { Money } from '@/shared/ui/Money';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toast } from '@/shared/lib/toast';
import { useArchiveCard, useDeleteCard, type Card } from '@/features/accounts/api/useCards';
import { isForeignKeyViolation } from '@/shared/lib/postgresErrors';

export function CardListItem({
  card,
  onEdit,
  onViewDetail,
}: {
  card: Card;
  onEdit: () => void;
  onViewDetail?: () => void;
}) {
  const archiveCard = useArchiveCard();
  const deleteCard = useDeleteCard();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = Boolean(card.archived_at);
  const canViewDetail = card.card_type === 'credit' && Boolean(onViewDetail);

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

  // Degradado en el tono de la tarjeta, oscurecido hacia una esquina para
  // que el blanco del texto siempre tenga contraste suficiente sin
  // depender de cuál de los 8 swatches (o ninguno) haya elegido el
  // usuario. Sin color: cae al verde de marca, que ya es oscuro.
  const baseColor = card.color ?? 'var(--brand)';
  const faceStyle = {
    background: `linear-gradient(135deg, ${baseColor} 0%, color-mix(in srgb, ${baseColor} 55%, black) 100%)`,
  };

  const FaceWrapper = canViewDetail ? 'button' : 'div';

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-elevation-sm)]">
      <FaceWrapper
        {...(canViewDetail
          ? { type: 'button' as const, onClick: onViewDetail, 'aria-label': `Ver detalle de ${card.name}` }
          : {})}
        className="relative block w-full overflow-hidden p-4 text-left transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.99]"
        style={faceStyle}
      >
        {/* Brillo decorativo: esquina superior derecha, evoca el reflejo
            de una tarjeta plástica real. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-white/15 blur-2xl"
        />

        <div className="relative flex items-start justify-between gap-2">
          <span className="min-w-0 truncate text-[11px] font-medium tracking-wider text-white/70 uppercase">
            {card.bank ?? 'Sin banco'}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {archived ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90">
                Archivada
              </span>
            ) : null}
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90">
              {card.card_type === 'credit' ? 'Crédito' : 'Débito'}
            </span>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-3">
          {/* Chip EMV decorativo. */}
          <span
            aria-hidden
            className="h-6 w-8 shrink-0 rounded-[4px]"
            style={{ background: 'linear-gradient(135deg, #f6e7a8 0%, #c9a227 100%)' }}
          />
          <span className="min-w-0 truncate text-base font-medium tracking-wide text-white">{card.name}</span>
        </div>

        {card.card_type === 'credit' ? (
          <div className="relative mt-5 flex items-end justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[10px] tracking-wide text-white/60 uppercase">Deuda</span>
              <Money amount={card.balanceDue ?? 0} currency={card.currency} size="sm" className="!text-white" />
            </div>
            {card.availableCredit !== null ? (
              <div className="flex min-w-0 flex-col items-end gap-0.5">
                <span className="text-[10px] tracking-wide text-white/60 uppercase">Disponible</span>
                <Money amount={card.availableCredit} currency={card.currency} size="sm" className="!text-white" />
              </div>
            ) : null}
          </div>
        ) : null}
      </FaceWrapper>

      <div className="flex items-center justify-end gap-1 border-t border-border bg-surface-sunken px-2 py-1.5">
        <Button intent="ghost" size="icon" aria-label="Editar" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          intent="ghost"
          size="icon"
          aria-label={archived ? 'Restaurar' : 'Archivar'}
          onClick={() => archiveCard.mutate({ id: card.id, archived: !archived })}
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
        title="Eliminar tarjeta"
        description={`¿Eliminar "${card.name}"? Si tiene movimientos asociados, se archivará en su lugar.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleteCard.isPending || archiveCard.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
