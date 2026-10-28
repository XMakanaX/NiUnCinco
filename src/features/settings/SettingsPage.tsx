import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { supabase } from '@/shared/lib/supabase';
import { APP_TIME_ZONE } from '@/shared/lib/date';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { LoadingState } from '@/shared/ui/LoadingState';
import { toast } from '@/shared/lib/toast';
import { useProfile, useUpdateProfile } from '@/features/settings/api/useProfile';
import { profileSchema, type ProfileInput } from '@/features/settings/schema';

const CURRENCY_OPTIONS = [
  { label: 'Colones (CRC)', value: 'CRC' as const },
  { label: 'Dólares (USD)', value: 'USD' as const },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { data: profile, isPending, isError } = useProfile();
  const updateProfile = useUpdateProfile();

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
    } catch {
      toast.error('No se pudo actualizar el perfil');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
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

      <Button intent="secondary" onClick={handleSignOut}>
        <LogOut className="size-4" aria-hidden />
        Cerrar sesión
      </Button>
    </div>
  );
}
