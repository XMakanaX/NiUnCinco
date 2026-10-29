import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { ColorSwatchPicker } from '@/shared/ui/ColorSwatchPicker';
import { toast } from '@/shared/lib/toast';
import { accountSchema, type AccountInput } from '@/features/accounts/schema';
import { useCreateAccount, useUpdateAccount, type Account } from '@/features/accounts/api/useAccounts';

const TYPE_OPTIONS = [
  { label: 'Efectivo', value: 'cash' as const },
  { label: 'Cuenta bancaria', value: 'bank' as const },
  { label: 'Otra', value: 'other' as const },
];
const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];

const DEFAULT_VALUES: AccountInput = { name: '', type: 'cash', currency: 'CRC', color: null };

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountInput>({ resolver: zodResolver(accountSchema), defaultValues: DEFAULT_VALUES });

  useEffect(() => {
    if (open) {
      reset(
        account
          ? { name: account.name, type: account.type, currency: account.currency, color: account.color }
          : DEFAULT_VALUES,
      );
    }
  }, [open, account, reset]);

  const onSubmit = async (values: AccountInput) => {
    try {
      if (account) {
        await updateAccount.mutateAsync({ id: account.id, input: values });
        toast.success('Cuenta actualizada');
      } else {
        await createAccount.mutateAsync(values);
        toast.success('Cuenta creada');
      }
      onOpenChange(false);
    } catch {
      toast.error('No se pudo guardar la cuenta');
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title={account ? 'Editar cuenta' : 'Nueva cuenta'}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input label="Nombre" error={errors.name?.message} {...register('name')} />
        <Select
          label="Tipo"
          options={TYPE_OPTIONS}
          value={watch('type')}
          onValueChange={(value) => setValue('type', value, { shouldDirty: true })}
        />
        <Select
          label="Moneda"
          options={CURRENCY_OPTIONS}
          value={watch('currency')}
          onValueChange={(value) => setValue('currency', value, { shouldDirty: true })}
        />
        <ColorSwatchPicker
          label="Color"
          value={watch('color')}
          onValueChange={(value) => setValue('color', value, { shouldDirty: true })}
        />
        <Button type="submit" loading={isSubmitting}>
          {account ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </form>
    </Dialog>
  );
}
