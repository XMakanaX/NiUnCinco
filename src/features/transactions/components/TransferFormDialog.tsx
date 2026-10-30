import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';
import { toast } from '@/shared/lib/toast';
import { todayInAppTimeZone } from '@/shared/lib/date';
import { transferSchema, type TransferInput } from '@/features/transactions/schema';
import { useCreateTransfer } from '@/features/transactions/api/useTransactions';
import { useAccounts } from '@/features/accounts/api/useAccounts';

const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];

function defaultValues(): TransferInput {
  return {
    from_account_id: '',
    to_account_id: '',
    amount: 0,
    currency: 'CRC',
    occurred_on: todayInAppTimeZone(),
    notes: null,
  };
}

interface TransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferFormDialog({ open, onOpenChange }: TransferFormDialogProps) {
  const createTransfer = useCreateTransfer();
  const { data: accounts = [] } = useAccounts();
  const clientIdOutRef = useRef(crypto.randomUUID());
  const clientIdInRef = useRef(crypto.randomUUID());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransferInput>({ resolver: zodResolver(transferSchema), defaultValues: defaultValues() });

  useEffect(() => {
    if (open) {
      clientIdOutRef.current = crypto.randomUUID();
      clientIdInRef.current = crypto.randomUUID();
      reset(defaultValues());
    }
  }, [open, reset]);

  const activeAccounts = accounts.filter((a) => !a.archived_at);
  const accountOptions = activeAccounts.map((a) => ({ label: `${a.name} (${a.currency})`, value: a.id }));

  const fromAccountId = watch('from_account_id');
  const toAccountId = watch('to_account_id');
  const fromAccount = activeAccounts.find((a) => a.id === fromAccountId);
  const toAccount = activeAccounts.find((a) => a.id === toAccountId);
  const currencyMismatch = Boolean(
    fromAccount && toAccount && fromAccount.currency !== toAccount.currency,
  );

  const onSubmit = async (values: TransferInput) => {
    if (currencyMismatch) return;
    try {
      const { queued } = await createTransfer.mutateAsync({
        clientIdOut: clientIdOutRef.current,
        clientIdIn: clientIdInRef.current,
        input: values,
      });
      toast[queued ? 'info' : 'success'](
        queued ? 'Sin conexión: la transferencia quedó pendiente de enviar' : 'Transferencia registrada',
      );
      onOpenChange(false);
    } catch {
      toast.error('No se pudo registrar la transferencia. Volvé a intentar.');
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title="Transferencia entre cuentas"
      description="No cuenta como ingreso ni gasto: solo mueve dinero entre tus propias cuentas."
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Select
          label="Cuenta de origen"
          options={accountOptions}
          value={watch('from_account_id') || null}
          onValueChange={(value) => setValue('from_account_id', value, { shouldDirty: true })}
        />
        {errors.from_account_id ? <p className="text-xs text-expense">{errors.from_account_id.message}</p> : null}
        <Select
          label="Cuenta de destino"
          options={accountOptions}
          value={watch('to_account_id') || null}
          onValueChange={(value) => setValue('to_account_id', value, { shouldDirty: true })}
        />
        {errors.to_account_id ? <p className="text-xs text-expense">{errors.to_account_id.message}</p> : null}
        {currencyMismatch ? (
          <PageMessage tone="error">
            Las cuentas elegidas tienen monedas distintas. Todavía no soportamos conversión en transferencias.
          </PageMessage>
        ) : null}
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
        <Button type="submit" loading={isSubmitting} disabled={currencyMismatch}>
          Transferir
        </Button>
      </form>
    </Dialog>
  );
}
