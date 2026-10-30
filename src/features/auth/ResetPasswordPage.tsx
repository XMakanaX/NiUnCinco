import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/shared/lib/supabase';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';
import { Logo } from '@/shared/ui/Logo';
import { resetPasswordRequestSchema, type ResetPasswordRequestInput } from '@/features/auth/schema';

export function ResetPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordRequestInput>({ resolver: zodResolver(resetPasswordRequestSchema) });

  const onSubmit = async ({ email }: ResetPasswordRequestInput) => {
    setFormError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Logo className="mb-6" withWordmark />
        <h1 className="text-xl font-semibold text-ink">Recuperar contraseña</h1>
        {sent ? (
          <PageMessage tone="success" className="mt-4">
            Si ese correo tiene una cuenta, te enviamos un enlace para restablecer la contraseña.
          </PageMessage>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Correo"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            {formError ? <PageMessage tone="error">{formError}</PageMessage> : null}
            <Button type="submit" fullWidth loading={isSubmitting}>
              Enviar enlace
            </Button>
          </form>
        )}
        <Link to="/login" className="mt-4 inline-block text-sm font-medium text-ink hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
