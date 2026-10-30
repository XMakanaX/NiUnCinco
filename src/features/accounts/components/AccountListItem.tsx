import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Trash2, Wallet, Landmark, PiggyBank } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Money } from '@/shared/ui/Money';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toast } from '@/shared/lib/toast';
import { isForeignKeyViolation } from '@/shared/lib/postgresErrors';
import { useArchiveAccount, useDeleteAccount, type Account } from '@/features/accounts/api/useAccounts';

const TYPE_LABEL: Record<Account['type'], string> = {
  cash: 'Efectivo',
  bank: 'Cuenta bancaria',
  other: 'Otra',
};

const TYPE_ICON: Record<Account['type'], typeof Wallet> = {
  cash: Wallet,
  bank: Landmark,
  other: PiggyBank,
};

export function AccountListItem({ account, onEdit }: { account: Account; onEdit: () => void }) {
  const archiveAccount = useArchiveAccount();
  const deleteAccount = useDeleteAccount();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = Boolean(account.archived_at);
  const TypeIcon = TYPE_ICON[account.type];
  const tintColor = account.color ?? 'var(--brand)';

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync(account.id);
      toast.success('Cuenta eliminada');
      setConfirmDelete(false);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        await archiveAccount.mutateAsync({ id: account.id, archived: true });
        toast.info('Esta cuenta tiene movimientos asociados: se archivó en vez de eliminarse');
        setConfirmDelete(false);
      } else {
        toast.error('No se pudo eliminar la cuenta');
      }
    }
  };

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ backgroundColor: `color-mix(in srgb, ${tintColor} 16%, transparent)` }}
          aria-hidden
        >
          <TypeIcon className="size-5" style={{ color: tintColor }} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 truncate font-medium text-ink">{account.name}</span>
            {archived ? <Badge className="shrink-0" tone="neutral">Archivada</Badge> : null}
          </div>
          <span className="truncate text-xs text-ink-muted">{TYPE_LABEL[account.type]}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:ml-auto sm:justify-end">
        <Money className="shrink-0" amount={account.balance} currency={account.currency} />
        <div className="flex shrink-0 gap-1">
          <Button intent="ghost" size="icon" aria-label="Editar" onClick={onEdit}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            intent="ghost"
            size="icon"
            aria-label={archived ? 'Restaurar' : 'Archivar'}
            onClick={() => archiveAccount.mutate({ id: account.id, archived: !archived })}
          >
            {archived ? <ArchiveRestore className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
          </Button>
          <Button intent="ghost" size="icon" aria-label="Eliminar" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Eliminar cuenta"
        description={`¿Eliminar "${account.name}"? Si tiene movimientos asociados, se archivará en su lugar.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleteAccount.isPending || archiveAccount.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
