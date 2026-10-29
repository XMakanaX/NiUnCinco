import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { ColorSwatchPicker } from '@/shared/ui/ColorSwatchPicker';
import { toast } from '@/shared/lib/toast';
import { categorySchema, type CategoryInput } from '@/features/categories/schema';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  type Category,
} from '@/features/categories/api/useCategories';

const KIND_OPTIONS = [
  { label: 'Gasto', value: 'expense' as const },
  { label: 'Ingreso', value: 'income' as const },
];
const NO_PARENT = '__none__';

const DEFAULT_VALUES: CategoryInput = { name: '', kind: 'expense', parent_id: null, color: null };

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema), defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    if (open) {
      reset(
        category
          ? { name: category.name, kind: category.kind, parent_id: category.parent_id, color: category.color }
          : DEFAULT_VALUES,
      );
    }
  }, [open, category, reset]);

  const parentOptions = [
    { label: 'Sin categoría padre', value: NO_PARENT },
    ...categories
      .filter((c) => !c.archived_at && c.parent_id === null && c.id !== category?.id)
      .map((c) => ({ label: c.name, value: c.id })),
  ];

  const onSubmit = async (values: CategoryInput) => {
    try {
      if (category) {
        await updateCategory.mutateAsync({ id: category.id, input: values });
        toast.success('Categoría actualizada');
      } else {
        await createCategory.mutateAsync(values);
        toast.success('Categoría creada');
      }
      onOpenChange(false);
    } catch {
      toast.error('No se pudo guardar la categoría');
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title={category ? 'Editar categoría' : 'Nueva categoría'}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Nombre" error={errors.name?.message} {...register('name')} />
        <Select
          label="Tipo"
          options={KIND_OPTIONS}
          value={watch('kind')}
          onValueChange={(value) => setValue('kind', value, { shouldDirty: true })}
        />
        <Select
          label="Categoría padre"
          options={parentOptions}
          value={watch('parent_id') ?? NO_PARENT}
          onValueChange={(value) =>
            setValue('parent_id', value === NO_PARENT ? null : value, { shouldDirty: true })
          }
        />
        <ColorSwatchPicker
          label="Color"
          value={watch('color')}
          onValueChange={(value) => setValue('color', value, { shouldDirty: true })}
        />
        <Button type="submit" loading={isSubmitting}>
          {category ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </form>
    </Dialog>
  );
}
