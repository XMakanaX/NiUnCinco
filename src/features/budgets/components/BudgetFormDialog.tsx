import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/lib/toast';
import { offlineActionMessage } from '@/shared/lib/offlineActionMessage';
import { todayInAppTimeZone } from '@/shared/lib/date';
import { budgetSchema, type BudgetInput } from '@/features/budgets/schema';
import { useCreateBudget, useUpdateBudget, type Budget } from '@/features/budgets/api/useBudgets';
import { useCategories } from '@/features/categories/api/useCategories';

const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];
const GENERAL_BUDGET = '__general__';

function currentPeriodMonth(): string {
  return `${todayInAppTimeZone().slice(0, 7)}-01`;
}

const DEFAULT_VALUES: BudgetInput = {
  category_id: null,
  period_month: currentPeriodMonth(),
  amount_limit: 0,
  currency: 'CRC',
  alert_threshold_pct: 80,
};

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
}

export function BudgetFormDialog({ open, onOpenChange, budget }: BudgetFormDialogProps) {
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const { data: categories = [] } = useCategories();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BudgetInput>({ resolver: zodResolver(budgetSchema), defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    if (open) {
      reset(
        budget
          ? {
              category_id: budget.category_id,
              period_month: budget.period_month,
              amount_limit: budget.amount_limit,
              currency: budget.currency,
              alert_threshold_pct: budget.alert_threshold_pct,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, budget, reset]);

  const categoryOptions = [
    { label: 'Presupuesto general (todas las categorías)', value: GENERAL_BUDGET },
    ...categories
      .filter((category) => category.kind === 'expense' && !category.archived_at)
      .map((category) => ({ label: category.name, value: category.id })),
  ];

  const onSubmit = async (values: BudgetInput) => {
    try {
      if (budget) {
        await updateBudget.mutateAsync({ id: budget.id, input: values });
        toast.success('Presupuesto actualizado');
      } else {
        await createBudget.mutateAsync(values);
        toast.success('Presupuesto creado');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        offlineActionMessage(error, 'No se pudo guardar el presupuesto. Puede que ya exista uno para ese mes y categoría.'),
      );
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title={budget ? 'Editar presupuesto' : 'Nuevo presupuesto'}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Select
          label="Categoría"
          options={categoryOptions}
          value={watch('category_id') ?? GENERAL_BUDGET}
          onValueChange={(value) =>
            setValue('category_id', value === GENERAL_BUDGET ? null : value, { shouldDirty: true })
          }
        />
        <Input
          label="Mes"
          type="month"
          value={watch('period_month').slice(0, 7)}
          onChange={(e) => setValue('period_month', `${e.target.value}-01`, { shouldDirty: true })}
          error={errors.period_month?.message}
        />
        <Input
          label="Límite"
          type="number"
          step="0.01"
          error={errors.amount_limit?.message}
          {...register('amount_limit', { valueAsNumber: true })}
        />
        <Select
          label="Moneda"
          options={CURRENCY_OPTIONS}
          value={watch('currency')}
          onValueChange={(value) => setValue('currency', value, { shouldDirty: true })}
        />
        <Input
          label="Avisar al usar (%)"
          hint="Opcional. Dejá vacío para no recibir aviso."
          type="number"
          min={1}
          max={100}
          error={errors.alert_threshold_pct?.message}
          value={watch('alert_threshold_pct') ?? ''}
          onChange={(e) =>
            setValue('alert_threshold_pct', e.target.value === '' ? null : Number(e.target.value), {
              shouldDirty: true,
            })
          }
        />
        <Button type="submit" loading={isSubmitting}>
          {budget ? 'Guardar cambios' : 'Crear presupuesto'}
        </Button>
      </form>
    </Dialog>
  );
}
