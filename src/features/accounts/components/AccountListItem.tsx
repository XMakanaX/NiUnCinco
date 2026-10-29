import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
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

export function AccountListItem({ account, onEdit }: { account: Account; onEdit: () => void }) {
  const archiveAccount = useArchiveAccount();
  const deleteAccount = useDeleteAccount();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = Boolean(account.archived_at);

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
    <Card className="flex items-center gap-3">
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: account.color ?? 'var(--border)' }}
        aria-hidden
      />
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">{account.name}</span>
          {archived ? <Badge tone="neutral">Archivada</Badge> : null}
        </div>
        <span className="text-xs text-ink-muted">{TYPE_LABEL[account.type]}</span>
      </div>
      <Money amount={account.balance} currency={account.currency} />
      <div className="flex gap-1">
        <Button intent="ghost" size="sm" aria-label="Editar" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          intent="ghost"
          size="sm"
          aria-label={archived ? 'Restaurar' : 'Archivar'}
          onClick={() => archiveAccount.mutate({ id: account.id, archived: !archived })}
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
