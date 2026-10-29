import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { ColorSwatchPicker } from '@/shared/ui/ColorSwatchPicker';
import { toast } from '@/shared/lib/toast';
import { cardSchema, type CardInput } from '@/features/accounts/schema';
import { useCreateCard, useUpdateCard, type Card } from '@/features/accounts/api/useCards';
import { useAccounts } from '@/features/accounts/api/useAccounts';

const CARD_TYPE_OPTIONS = [
  { label: 'Débito', value: 'debit' as const },
  { label: 'Crédito', value: 'credit' as const },
];
const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];
const NO_ACCOUNT = '__none__';

const DEFAULT_VALUES: CardInput = {
  name: '',
  card_type: 'debit',
  bank: null,
  account_id: null,
  currency: 'CRC',
  color: null,
  credit_limit: null,
  statement_day: null,
  due_day: null,
};

interface CardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card | null;
}

export function CardFormDialog({ open, onOpenChange, card }: CardFormDialogProps) {
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const { data: accounts = [] } = useAccounts();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CardInput>({ resolver: zodResolver(cardSchema), defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    if (open) {
      reset(
        card
          ? {
              name: card.name,
              card_type: card.card_type,
              bank: card.bank,
              account_id: card.account_id,
              currency: card.currency,
              color: card.color,
              credit_limit: card.credit_limit,
              statement_day: card.statement_day,
              due_day: card.due_day,
            }
          : DEFAULT_VALUES,
      );
    }
  }, [open, card, reset]);

  const cardType = watch('card_type');
  const accountOptions = [
    { label: 'Sin cuenta enlazada', value: NO_ACCOUNT },
    ...accounts
      .filter((account) => !account.archived_at)
      .map((account) => ({ label: account.name, value: account.id })),
  ];

  const onSubmit = async (values: CardInput) => {
    try {
      if (card) {
        await updateCard.mutateAsync({ id: card.id, input: values });
        toast.success('Tarjeta actualizada');
      } else {
        await createCard.mutateAsync(values);
        toast.success('Tarjeta creada');
      }
      onOpenChange(false);
    } catch {
      toast.error('No se pudo guardar la tarjeta');
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title={card ? 'Editar tarjeta' : 'Nueva tarjeta'}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Nombre" error={errors.name?.message} {...register('name')} />
        <Input
          label="Banco"
          error={errors.bank?.message}
          value={watch('bank') ?? ''}
          onChange={(e) => setValue('bank', e.target.value === '' ? null : e.target.value, { shouldDirty: true })}
        />
        <Select
          label="Tipo"
          options={CARD_TYPE_OPTIONS}
          value={cardType}
          onValueChange={(value) => setValue('card_type', value, { shouldDirty: true })}
        />
        <Select
          label="Moneda"
          options={CURRENCY_OPTIONS}
          value={watch('currency')}
          onValueChange={(value) => setValue('currency', value, { shouldDirty: true })}
        />
        <Select
          label="Cuenta enlazada"
          options={accountOptions}
          value={watch('account_id') ?? NO_ACCOUNT}
          onValueChange={(value) =>
            setValue('account_id', value === NO_ACCOUNT ? null : value, { shouldDirty: true })
          }
        />
        {cardType === 'credit' ? (
          <>
            <Input
              label="Límite de crédito"
              type="number"
              step="0.01"
              error={errors.credit_limit?.message}
              value={watch('credit_limit') ?? ''}
              onChange={(e) =>
                setValue('credit_limit', e.target.value === '' ? null : Number(e.target.value), {
                  shouldDirty: true,
                })
              }
            />
            <Input
              label="Día de corte"
              hint="Día del mes (1-31)"
              type="number"
              min={1}
              max={31}
              error={errors.statement_day?.message}
              value={watch('statement_day') ?? ''}
              onChange={(e) =>
                setValue('statement_day', e.target.value === '' ? null : Number(e.target.value), {
                  shouldDirty: true,
                })
              }
            />
            <Input
              label="Día de vencimiento"
              hint="Día del mes (1-31)"
              type="number"
              min={1}
              max={31}
              error={errors.due_day?.message}
              value={watch('due_day') ?? ''}
              onChange={(e) =>
                setValue('due_day', e.target.value === '' ? null : Number(e.target.value), {
                  shouldDirty: true,
                })
              }
            />
          </>
        ) : null}
        <ColorSwatchPicker
          label="Color"
          value={watch('color')}
          onValueChange={(value) => setValue('color', value, { shouldDirty: true })}
        />
        <Button type="submit" loading={isSubmitting}>
          {card ? 'Guardar cambios' : 'Crear tarjeta'}
        </Button>
      </form>
    </Dialog>
  );
}
