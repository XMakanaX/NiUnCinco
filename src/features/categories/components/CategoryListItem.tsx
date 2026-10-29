import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toast } from '@/shared/lib/toast';
import { useArchiveCategory, useDeleteCategory, type Category } from '@/features/categories/api/useCategories';

export function CategoryListItem({
  category,
  parentName,
  onEdit,
}: {
  category: Category;
  parentName: string | null;
  onEdit: () => void;
}) {
  const archiveCategory = useArchiveCategory();
  const deleteCategory = useDeleteCategory();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const archived = Boolean(category.archived_at);

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success('Categoría eliminada');
      setConfirmDelete(false);
    } catch (error) {
      if (error instanceof Error && error.message === 'CATEGORY_IN_USE') {
        await archiveCategory.mutateAsync({ id: category.id, archived: true });
        toast.info('Esta categoría tiene movimientos, presupuestos o subcategorías: se archivó en vez de eliminarse');
        setConfirmDelete(false);
      } else {
        toast.error('No se pudo eliminar la categoría');
      }
    }
  };

  return (
    <Card className="flex items-center gap-3">
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: category.color ?? 'var(--border)' }}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-ink">{category.name}</span>
          <Badge className="shrink-0" tone={category.kind === 'income' ? 'income' : 'expense'}>
            {category.kind === 'income' ? 'Ingreso' : 'Gasto'}
          </Badge>
          {archived ? <Badge className="shrink-0" tone="neutral">Archivada</Badge> : null}
        </div>
        {parentName ? <span className="truncate text-xs text-ink-muted">Subcategoría de {parentName}</span> : null}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button intent="ghost" size="icon" aria-label="Editar" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button
          intent="ghost"
          size="icon"
          aria-label={archived ? 'Restaurar' : 'Archivar'}
          onClick={() => archiveCategory.mutate({ id: category.id, archived: !archived })}
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
        title="Eliminar categoría"
        description={`¿Eliminar "${category.name}"? Si tiene movimientos, presupuestos o subcategorías, se archivará en su lugar.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleteCategory.isPending || archiveCategory.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
