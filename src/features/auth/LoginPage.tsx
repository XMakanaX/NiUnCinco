import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/shared/lib/supabase';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';
import { Logo } from '@/shared/ui/Logo';
import { loginSchema, type LoginInput } from '@/features/auth/schema';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setFormError(error.message);
      return;
    }
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/';
    navigate(from, { replace: true });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Logo className="mb-6" withWordmark />
        <h1 className="text-xl font-semibold text-ink">Iniciar sesión</h1>
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
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          {formError ? <PageMessage tone="error">{formError}</PageMessage> : null}
          <Button type="submit" fullWidth loading={isSubmitting}>
            Entrar
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-1 text-sm text-ink-muted">
          <Link to="/reset-password" className="hover:text-ink">
            Olvidé mi contraseña
          </Link>
          <span>
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="font-medium text-ink hover:underline">
              Registrate
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}
