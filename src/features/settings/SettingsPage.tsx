import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogOut, TriangleAlert, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { signOutAndWipe, useAuthStore } from '@/shared/lib/auth';
import { APP_TIME_ZONE } from '@/shared/lib/date';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { LoadingState } from '@/shared/ui/LoadingState';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { toast } from '@/shared/lib/toast';
import { offlineActionMessage } from '@/shared/lib/offlineActionMessage';
import { usePendingOps } from '@/shared/offline/usePendingOps';
import { discardOp } from '@/shared/offline/queue';
import { flushQueue } from '@/shared/offline/sync';
import { OP_KIND, type OpKind } from '@/shared/offline/types';
import { useProfile, useUpdateProfile } from '@/features/settings/api/useProfile';
import { profileSchema, type ProfileInput } from '@/features/settings/schema';

const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];

const OP_LABEL: Record<OpKind, string> = {
  [OP_KIND.MOVEMENT]: 'Movimiento',
  [OP_KIND.TRANSFER]: 'Transferencia',
  [OP_KIND.CARD_PAYMENT]: 'Pago de tarjeta',
  [OP_KIND.GOAL_CONTRIBUTION]: 'Aporte/retiro de meta',
  [OP_KIND.RECURRING_PAID]: 'Pago de recurrente',
};

export function SettingsPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const { data: profile, isPending, isError } = useProfile();
  const updateProfile = useUpdateProfile();
  const { pending, failed } = usePendingOps(userId);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: '', base_currency: 'CRC' },
  });

  useEffect(() => {
    if (profile) {
      reset({ display_name: profile.display_name ?? '', base_currency: profile.base_currency });
    }
  }, [profile, reset]);

  const onSubmit = async (values: ProfileInput) => {
    try {
      await updateProfile.mutateAsync({
        display_name: values.display_name || null,
        base_currency: values.base_currency,
      });
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error(offlineActionMessage(error, 'No se pudo actualizar el perfil'));
    }
  };

  const doSignOut = async () => {
    await signOutAndWipe();
    setConfirmSignOut(false);
    navigate('/login', { replace: true });
  };

  const handleSignOutClick = () => {
    if (pending.length > 0) {
      setConfirmSignOut(true);
    } else {
      void doSignOut();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-ink">Ajustes</h1>

      <Card>
        <h2 className="text-sm font-medium text-ink-muted">Tema</h2>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-ink-muted">Perfil</h2>
        {isPending ? (
          <LoadingState rows={2} />
        ) : isError ? (
          <p className="mt-2 text-sm text-expense">No se pudo cargar tu perfil.</p>
        ) : (
          <form className="mt-3 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input label="Nombre" error={errors.display_name?.message} {...register('display_name')} />
            <Select
              label="Moneda principal"
              options={CURRENCY_OPTIONS}
              value={watch('base_currency')}
              onValueChange={(value) => setValue('base_currency', value, { shouldDirty: true })}
            />
            <p className="text-xs text-ink-muted">Zona horaria: {APP_TIME_ZONE}</p>
            <Button type="submit" loading={isSubmitting}>
              Guardar cambios
            </Button>
          </form>
        )}
      </Card>

      {failed.length > 0 ? (
        <Card>
          <h2 className="text-sm font-medium text-ink-muted">Operaciones sin enviar</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {failed.map((op) => (
              <li key={op.id} className="flex flex-col gap-1 rounded-[var(--radius-sm)] border border-expense/30 bg-expense-surface p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-expense">
                  <TriangleAlert className="size-4 shrink-0" aria-hidden />
                  {OP_LABEL[op.kind]}
                </div>
                <p className="text-xs text-ink-muted [overflow-wrap:anywhere]">{op.lastError}</p>
                <div className="mt-1 flex gap-2">
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() => userId && void flushQueue(userId, { includeFailed: true })}
                  >
                    Reintentar
                  </Button>
                  <Button size="sm" intent="ghost" onClick={() => void discardOp(op.id)}>
                    <Trash2 className="size-3.5" aria-hidden />
                    Descartar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Button intent="secondary" onClick={handleSignOutClick}>
        <LogOut className="size-4" aria-hidden />
        Cerrar sesión
      </Button>

      <ConfirmDialog
        open={confirmSignOut}
        onOpenChange={setConfirmSignOut}
        title="Cerrar sesión con operaciones pendientes"
        description={`Hay ${pending.length === 1 ? '1 operación' : `${pending.length} operaciones`} sin enviar al servidor. Si cerrás sesión ahora, se descartan y no se registran.`}
        confirmLabel="Cerrar sesión igual"
        destructive
        onConfirm={() => void doSignOut()}
      />
    </div>
  );
}
