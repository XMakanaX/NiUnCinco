import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/lib/auth';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';
import { Logo } from '@/shared/ui/Logo';
import { updatePasswordSchema, type UpdatePasswordInput } from '@/features/auth/schema';

/**
 * Destino del enlace de recuperación de contraseña: no se protege con
 * RequireAuth ni GuestOnly porque Supabase crea una sesión temporal de
 * "recovery" al abrir el enlace — ambos guards la tratarían mal.
 */
export function UpdatePasswordPage() {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const initializing = useAuthStore((state) => state.initializing);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({ resolver: zodResolver(updatePasswordSchema) });

  const onSubmit = async ({ password }: UpdatePasswordInput) => {
    setFormError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setFormError(error.message);
      return;
    }
    navigate('/', { replace: true });
  };

  if (initializing) {
    return null;
  }

  if (!session) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Logo className="mb-6" withWordmark />
          <h1 className="text-xl font-semibold text-ink">Enlace inválido o vencido</h1>
          <PageMessage tone="error" className="mt-4">
            Pedí un nuevo enlace de recuperación.
          </PageMessage>
          <Link to="/reset-password" className="mt-4 inline-block text-sm font-medium text-ink hover:underline">
            Recuperar contraseña
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Logo className="mb-6" withWordmark />
        <h1 className="text-xl font-semibold text-ink">Elegí una nueva contraseña</h1>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Contraseña nueva"
            type="password"
            autoComplete="new-password"
            hint="Mínimo 8 caracteres"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          {formError ? <PageMessage tone="error">{formError}</PageMessage> : null}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Guardar contraseña
          </Button>
        </form>
      </div>
    </main>
  );
}
