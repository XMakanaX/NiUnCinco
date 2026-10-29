import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/lib/toast';
import { todayInAppTimeZone } from '@/shared/lib/date';
import { formatMoney } from '@/shared/lib/money';
import { cardPaymentSchema, type CardPaymentInput } from '@/features/transactions/schema';
import { useCreateCardPayment } from '@/features/transactions/api/useTransactions';
import { useAccounts } from '@/features/accounts/api/useAccounts';
import { useCards } from '@/features/accounts/api/useCards';

const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];

function defaultValues(defaultCardId: string | null): CardPaymentInput {
  return {
    card_id: defaultCardId ?? '',
    from_account_id: '',
    amount: 0,
    currency: 'CRC',
    occurred_on: todayInAppTimeZone(),
    notes: null,
  };
}

interface CardPaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selecciona la tarjeta cuando se abre desde el detalle de tarjeta (Fase 10). */
  defaultCardId?: string | null;
}

export function CardPaymentFormDialog({ open, onOpenChange, defaultCardId = null }: CardPaymentFormDialogProps) {
  const createCardPayment = useCreateCardPayment();
  const { data: accounts = [] } = useAccounts();
  const { data: cards = [] } = useCards();
  const clientIdRef = useRef(crypto.randomUUID());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CardPaymentInput>({
    resolver: zodResolver(cardPaymentSchema),
    defaultValues: defaultValues(defaultCardId),
  });

  useEffect(() => {
    if (open) {
      clientIdRef.current = crypto.randomUUID();
      reset(defaultValues(defaultCardId));
    }
  }, [open, defaultCardId, reset]);

  const creditCards = cards.filter((c) => !c.archived_at && c.card_type === 'credit');
  const cardOptions = creditCards.map((c) => ({ label: c.name, value: c.id }));
  const accountOptions = accounts.filter((a) => !a.archived_at).map((a) => ({ label: a.name, value: a.id }));
  const selectedCard = creditCards.find((c) => c.id === watch('card_id')) ?? null;

  const onSubmit = async (values: CardPaymentInput) => {
    // Validación de saldo (Fase 10): no dejar registrar un pago mayor a la
    // deuda actual de la tarjeta — el saldo es de control personal, pero
    // igual debe ser internamente consistente.
    if (selectedCard?.balanceDue !== null && selectedCard?.balanceDue !== undefined) {
      if (values.amount > selectedCard.balanceDue + 0.01) {
        setError('amount', {
          message: `El pago no puede ser mayor a la deuda actual (${formatMoney(selectedCard.balanceDue, selectedCard.currency)})`,
        });
        return;
      }
    }
    try {
      await createCardPayment.mutateAsync({ clientId: clientIdRef.current, input: values });
      toast.success('Pago de tarjeta registrado');
      onOpenChange(false);
    } catch {
      toast.error('No se pudo registrar el pago. Volvé a intentar.');
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title="Pago de tarjeta"
      description="Reduce la deuda de la tarjeta y el saldo de la cuenta de origen. No se cuenta como gasto nuevo."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Select
          label="Tarjeta"
          options={cardOptions}
          value={watch('card_id') || null}
          onValueChange={(value) => setValue('card_id', value, { shouldDirty: true })}
        />
        {errors.card_id ? <p className="text-xs text-expense">{errors.card_id.message}</p> : null}
        {selectedCard?.balanceDue !== null && selectedCard?.balanceDue !== undefined ? (
          <p className="text-xs text-ink-muted">
            Deuda actual: {formatMoney(selectedCard.balanceDue, selectedCard.currency)}
          </p>
        ) : null}
        <Select
          label="Cuenta de origen"
          options={accountOptions}
          value={watch('from_account_id') || null}
          onValueChange={(value) => setValue('from_account_id', value, { shouldDirty: true })}
        />
        {errors.from_account_id ? <p className="text-xs text-expense">{errors.from_account_id.message}</p> : null}
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
        <Input
          label="Notas"
          error={errors.notes?.message}
          value={watch('notes') ?? ''}
          onChange={(e) => setValue('notes', e.target.value === '' ? null : e.target.value, { shouldDirty: true })}
        />
        <Button type="submit" loading={isSubmitting}>
          Registrar pago
        </Button>
      </form>
    </Dialog>
  );
}
