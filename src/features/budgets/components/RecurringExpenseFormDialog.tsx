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
import {
  recurringExpenseSchema,
  type RecurringExpenseInput,
} from '@/features/budgets/schema';
import {
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  type RecurringExpense,
} from '@/features/budgets/api/useRecurringExpenses';
import { useCategories } from '@/features/categories/api/useCategories';
import { useAccounts } from '@/features/accounts/api/useAccounts';
import { useCards } from '@/features/accounts/api/useCards';

const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];
const FREQUENCY_OPTIONS = [
  { label: 'Semanal', value: 'weekly' as const },
  { label: 'Mensual', value: 'monthly' as const },
  { label: 'Anual', value: 'yearly' as const },
];
const NO_CATEGORY = '__none__';
const NO_ACCOUNT = '__none__';
const NO_CARD = '__none__';

const DEFAULT_VALUES: RecurringExpenseInput = {
  name: '',
  amount: 0,
  currency: 'CRC',
  category_id: null,
  account_id: null,
  card_id: null,
  frequency: 'monthly',
  next_due_on: todayInAppTimeZone(),
  reminder_enabled: false,
};

interface RecurringExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringExpense: RecurringExpense | null;
}

export function RecurringExpenseFormDialog({
  open,
  onOpenChange,
  recurringExpense,
}: RecurringExpenseFormDialogProps) {
  const createRecurringExpense = useCreateRecurringExpense();
  const updateRecurringExpense = useUpdateRecurringExpense();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: cards = [] } = useCards();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecurringExpenseInput>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        recurringExpense
          ? {
              name: recurringExpense.name,
              amount: recurringExpense.amount,
              currency: recurringExpense.currency,
              category_id: recurringExpense.category_id,
              account_id: recurringExpense.account_id,
              card_id: recurringExpense.card_id,
              frequency: recurringExpense.frequency,
              next_due_on: recurringExpense.next_due_on,
              reminder_enabled: recurringExpense.reminder_enabled,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, recurringExpense, reset]);

  const categoryOptions = [
    { label: 'Sin categoría', value: NO_CATEGORY },
    ...categories
      .filter((category) => category.kind === 'expense' && !category.archived_at)
      .map((category) => ({ label: category.name, value: category.id })),
  ];
  const accountOptions = [
    { label: 'Sin cuenta', value: NO_ACCOUNT },
    ...accounts.filter((a) => !a.archived_at).map((a) => ({ label: a.name, value: a.id })),
  ];
  const cardOptions = [
    { label: 'Sin tarjeta', value: NO_CARD },
    ...cards.filter((c) => !c.archived_at).map((c) => ({ label: c.name, value: c.id })),
  ];

  const onSubmit = async (values: RecurringExpenseInput) => {
    try {
      if (recurringExpense) {
        await updateRecurringExpense.mutateAsync({ id: recurringExpense.id, input: values });
        toast.success('Gasto recurrente actualizado');
      } else {
        await createRecurringExpense.mutateAsync(values);
        toast.success('Gasto recurrente creado');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(offlineActionMessage(error, 'No se pudo guardar el gasto recurrente'));
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title={recurringExpense ? 'Editar gasto recurrente' : 'Nuevo gasto recurrente'}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Nombre" hint="Servicio, alquiler o suscripción" error={errors.name?.message} {...register('name')} />
        <Input
          label="Importe"
          type="number"
          step="0.01"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />
        <Select
          label="Moneda"
          options={CURRENCY_OPTIONS}
          value={watch('currency')}
          onValueChange={(value) => setValue('currency', value, { shouldDirty: true })}
        />
        <Select
          label="Periodicidad"
          options={FREQUENCY_OPTIONS}
          value={watch('frequency')}
          onValueChange={(value) => setValue('frequency', value, { shouldDirty: true })}
        />
        <Input
          label="Próximo vencimiento"
          type="date"
          error={errors.next_due_on?.message}
          {...register('next_due_on')}
        />
        <Select
          label="Categoría"
          options={categoryOptions}
          value={watch('category_id') ?? NO_CATEGORY}
          onValueChange={(value) =>
            setValue('category_id', value === NO_CATEGORY ? null : value, { shouldDirty: true })
          }
        />
        <Select
          label="Cuenta de origen"
          options={accountOptions}
          value={watch('account_id') ?? NO_ACCOUNT}
          onValueChange={(value) =>
            setValue('account_id', value === NO_ACCOUNT ? null : value, { shouldDirty: true })
          }
        />
        <Select
          label="Tarjeta de origen"
          options={cardOptions}
          value={watch('card_id') ?? NO_CARD}
          onValueChange={(value) => setValue('card_id', value === NO_CARD ? null : value, { shouldDirty: true })}
        />
        {errors.account_id ? <p className="text-xs text-expense">{errors.account_id.message}</p> : null}
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="size-4"
            checked={watch('reminder_enabled')}
            onChange={(e) => setValue('reminder_enabled', e.target.checked, { shouldDirty: true })}
          />
          Avisarme antes del vencimiento
        </label>
        <Button type="submit" loading={isSubmitting}>
          {recurringExpense ? 'Guardar cambios' : 'Crear gasto recurrente'}
        </Button>
      </form>
    </Dialog>
  );
}
