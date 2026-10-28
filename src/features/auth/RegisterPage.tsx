import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/shared/lib/supabase';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';
import { registerSchema, type RegisterInput } from '@/features/auth/schema';

export function RegisterPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ email, password }: RegisterInput) => {
    setFormError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold text-ink">Revisá tu correo</h1>
          <PageMessage tone="success" className="mt-4">
            Te enviamos un enlace de confirmación. Abrilo para activar tu cuenta y poder iniciar
            sesión.
          </PageMessage>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-ink hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-ink">Crear cuenta</h1>
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Correo"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Contraseña"
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
            Crear cuenta
          </Button>
        </form>
        <div className="mt-4 text-sm text-ink-muted">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-ink hover:underline">
            Iniciá sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
