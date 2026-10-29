import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/lib/toast';
import { goalSchema, type GoalInput } from '@/features/budgets/schema';
import { useCreateGoal, useUpdateGoal, type Goal } from '@/features/budgets/api/useGoals';

const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];

const DEFAULT_VALUES: GoalInput = { name: '', target_amount: 0, currency: 'CRC', target_date: null };

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

export function GoalFormDialog({ open, onOpenChange, goal }: GoalFormDialogProps) {
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GoalInput>({ resolver: zodResolver(goalSchema), defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    if (open) {
      reset(
        goal
          ? {
              name: goal.name,
              target_amount: goal.target_amount,
              currency: goal.currency,
              target_date: goal.target_date,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, goal, reset]);

  const onSubmit = async (values: GoalInput) => {
    try {
      if (goal) {
        await updateGoal.mutateAsync({ id: goal.id, input: values });
        toast.success('Meta actualizada');
      } else {
        await createGoal.mutateAsync(values);
        toast.success('Meta creada');
      }
      onOpenChange(false);
    } catch {
      toast.error('No se pudo guardar la meta');
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title={goal ? 'Editar meta' : 'Nueva meta'}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Nombre" error={errors.name?.message} {...register('name')} />
        <Input
          label="Importe objetivo"
          type="number"
          step="0.01"
          error={errors.target_amount?.message}
          {...register('target_amount', { valueAsNumber: true })}
        />
        <Select
          label="Moneda"
          options={CURRENCY_OPTIONS}
          value={watch('currency')}
          onValueChange={(value) => setValue('currency', value, { shouldDirty: true })}
        />
        <Input
          label="Fecha objetivo"
          hint="Opcional"
          type="date"
          value={watch('target_date') ?? ''}
          onChange={(e) => setValue('target_date', e.target.value === '' ? null : e.target.value, { shouldDirty: true })}
        />
        <Button type="submit" loading={isSubmitting}>
          {goal ? 'Guardar cambios' : 'Crear meta'}
        </Button>
      </form>
    </Dialog>
  );
}
