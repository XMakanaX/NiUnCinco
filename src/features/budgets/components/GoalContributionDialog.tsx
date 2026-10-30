import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog } from '@/shared/ui/Dialog';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { toast } from '@/shared/lib/toast';
import { todayInAppTimeZone } from '@/shared/lib/date';
import { goalContributionSchema, type GoalContributionInput } from '@/features/budgets/schema';
import { useCreateGoalContribution, type Goal } from '@/features/budgets/api/useGoals';

const TYPE_OPTIONS = [
  { label: 'Aporte', value: 'contribution' as const },
  { label: 'Retiro', value: 'withdrawal' as const },
];

const DEFAULT_VALUES: GoalContributionInput = {
  type: 'contribution',
  amount: 0,
  occurred_on: todayInAppTimeZone(),
  notes: null,
};

interface GoalContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
}

/** Aportes/retiros entre cuentas propias y metas no son ingreso ni gasto
 * (regla del plan Fase 9): esta RPC solo toca `goal_contributions` y
 * `goals.current_amount`, nunca `transactions`. */
export function GoalContributionDialog({ open, onOpenChange, goal }: GoalContributionDialogProps) {
  const createContribution = useCreateGoalContribution();
  const clientIdRef = useRef(crypto.randomUUID());

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GoalContributionInput>({
    resolver: zodResolver(goalContributionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  if (!goal) return null;

  const onSubmit = async (values: GoalContributionInput) => {
    try {
      const { queued } = await createContribution.mutateAsync({
        clientId: clientIdRef.current,
        goalId: goal.id,
        input: values,
      });
      clientIdRef.current = crypto.randomUUID();
      toast[queued ? 'info' : 'success'](
        queued
          ? 'Sin conexión: el movimiento de la meta quedó pendiente de enviar'
          : values.type === 'contribution'
            ? 'Aporte registrado'
            : 'Retiro registrado',
      );
      onOpenChange(false);
    } catch (error) {
      // El error de Postgres que llega vía supabase-js es un objeto plano
      // (PostgrestError), no una instancia de `Error` — `instanceof Error`
      // siempre da falso acá.
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
      if (message.includes('insufficient goal balance')) {
        toast.error('El retiro no puede ser mayor al saldo actual de la meta');
      } else {
        toast.error('No se pudo registrar el movimiento de la meta');
      }
    }
  };

  return (
    <Dialog
      trigger={<button type="button" hidden />}
      open={open}
      onOpenChange={onOpenChange}
      title={`${goal.name} — aporte o retiro`}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Select
          label="Tipo"
          options={TYPE_OPTIONS}
          value={watch('type')}
          onValueChange={(value) => setValue('type', value, { shouldDirty: true })}
        />
        <Input
          label="Importe"
          type="number"
          step="0.01"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />
        <Input label="Fecha" type="date" error={errors.occurred_on?.message} {...register('occurred_on')} />
        <Input
          label="Notas"
          hint="Opcional"
          value={watch('notes') ?? ''}
          onChange={(e) => setValue('notes', e.target.value === '' ? null : e.target.value, { shouldDirty: true })}
        />
        <Button type="submit" loading={isSubmitting}>
          Guardar
        </Button>
      </form>
    </Dialog>
  );
}
