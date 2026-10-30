import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/lib/toast';
import { todayInAppTimeZone } from '@/shared/lib/date';
import { movementSchema, type MovementInput } from '@/features/transactions/schema';
import { useCreateMovement } from '@/features/transactions/api/useTransactions';
import { useAccounts } from '@/features/accounts/api/useAccounts';
import { useCards } from '@/features/accounts/api/useCards';
import { useCategories } from '@/features/categories/api/useCategories';

const TYPE_OPTIONS = [
  { label: 'Gasto', value: 'expense' as const },
  { label: 'Ingreso', value: 'income' as const },
];
const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];
const NO_ACCOUNT = '__none__';
const NO_CARD = '__none__';
const NO_CATEGORY = '__none__';

function defaultValues(): MovementInput {
  return {
    type: 'expense',
    amount: 0,
    currency: 'CRC',
    occurred_on: todayInAppTimeZone(),
    account_id: null,
    card_id: null,
    category_id: null,
    merchant: null,
    notes: null,
    tags: [],
  };
}

interface MovementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MovementFormDialog({ open, onOpenChange }: MovementFormDialogProps) {
  const createMovement = useCreateMovement();
  const { data: accounts = [] } = useAccounts();
  const { data: cards = [] } = useCards();
  const { data: categories = [] } = useCategories();
  const clientIdRef = useRef(crypto.randomUUID());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MovementInput>({ resolver: zodResolver(movementSchema), defaultValues: defaultValues() });

  useEffect(() => {
    if (open) {
      clientIdRef.current = crypto.randomUUID();
      reset(defaultValues());
    }
  }, [open, reset]);

  const type = watch('type');
  const accountOptions = [
    { label: 'Sin cuenta', value: NO_ACCOUNT },
    ...accounts.filter((a) => !a.archived_at).map((a) => ({ label: a.name, value: a.id })),
  ];
  const cardOptions = [
    { label: 'Sin tarjeta', value: NO_CARD },
    ...cards.filter((c) => !c.archived_at).map((c) => ({ label: c.name, value: c.id })),
  ];
  const categoryOptions = [
    { label: 'Sin categoría', value: NO_CATEGORY },
    ...categories.filter((c) => !c.archived_at && c.kind === type).map((c) => ({ label: c.name, value: c.id })),
  ];

  const onSubmit = async (values: MovementInput) => {
    try {
      const { queued } = await createMovement.mutateAsync({ clientId: clientIdRef.current, input: values });
      if (queued) {
        toast.info('Sin conexión: el movimiento quedó pendiente de enviar');
      } else {
        toast.success(type === 'income' ? 'Ingreso registrado' : 'Gasto registrado');
      }
      onOpenChange(false);
    } catch {
      toast.error('No se pudo registrar el movimiento. Volvé a intentar.');
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title="Nuevo movimiento"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Select
          label="Tipo"
          options={TYPE_OPTIONS}
          value={type}
          onValueChange={(value) => {
            setValue('type', value, { shouldDirty: true });
            setValue('category_id', null, { shouldDirty: true });
          }}
        />
        <Input
          label="Importe"
          type="number"
          step="0.01"
          error={errors.amount?.message}
          value={watch('amount') || ''}
          onChange={(e) => setValue('amount', e.target.value === '' ? 0 : Number(e.target.value), { shouldDirty: true })}
        />
        <Select
          label="Moneda"
          options={CURRENCY_OPTIONS}
          value={watch('currency')}
          onValueChange={(value) => setValue('currency', value, { shouldDirty: true })}
        />
        <Input label="Fecha" type="date" error={errors.occurred_on?.message} {...register('occurred_on')} />
        <Select
          label="Cuenta"
          options={accountOptions}
          value={watch('account_id') ?? NO_ACCOUNT}
          onValueChange={(value) => setValue('account_id', value === NO_ACCOUNT ? null : value, { shouldDirty: true })}
        />
        <Select
          label="Tarjeta"
          options={cardOptions}
          value={watch('card_id') ?? NO_CARD}
          onValueChange={(value) => setValue('card_id', value === NO_CARD ? null : value, { shouldDirty: true })}
        />
        {errors.account_id ? <p className="text-xs text-expense">{errors.account_id.message}</p> : null}
        <Select
          label="Categoría"
          options={categoryOptions}
          value={watch('category_id') ?? NO_CATEGORY}
          onValueChange={(value) => setValue('category_id', value === NO_CATEGORY ? null : value, { shouldDirty: true })}
        />
        <Input
          label="Comercio o descripción"
          error={errors.merchant?.message}
          value={watch('merchant') ?? ''}
          onChange={(e) => setValue('merchant', e.target.value === '' ? null : e.target.value, { shouldDirty: true })}
        />
        <Input
          label="Notas"
          error={errors.notes?.message}
          value={watch('notes') ?? ''}
          onChange={(e) => setValue('notes', e.target.value === '' ? null : e.target.value, { shouldDirty: true })}
        />
        <Button type="submit" loading={isSubmitting}>
          {type === 'income' ? 'Registrar ingreso' : 'Registrar gasto'}
        </Button>
      </form>
    </Dialog>
  );
}
