import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Check, CloudOff, Wallet, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { EmptyState } from '@/shared/ui/EmptyState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { toast } from '@/shared/lib/toast';
import { formatMoney } from '@/shared/lib/money';
import { todayInAppTimeZone } from '@/shared/lib/date';
import { movementSchema, type MovementInput } from '@/features/transactions/schema';
import { useCreateMovement } from '@/features/transactions/api/useTransactions';
import { useAccounts } from '@/features/accounts/api/useAccounts';
import { useCards } from '@/features/accounts/api/useCards';
import { useCategories } from '@/features/categories/api/useCategories';
import { useProfile } from '@/features/settings/api/useProfile';
import { useQuickExpensePrefs, sortByFrequency } from '@/features/quick-expense/store';
import { usePendingQuickExpenses } from '@/features/quick-expense/offline/usePendingQuickExpenses';
import { isNetworkError } from '@/features/quick-expense/offline/queue';

type PaymentTarget = { kind: 'account' | 'card'; id: string; name: string; color: string | null };

/**
 * Destino del atajo de iOS (regla global 11 del plan maestro): el atajo
 * solo abre esta ruta, la app no puede leer la pulsación del botón de
 * acción ni compras bancarias. Pensada para registrar un gasto en menos
 * de 10 segundos: importe + método de pago + categoría, guardar, y
 * "registrar otro" sin perder la selección.
 */
export function QuickExpensePage() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: cards, isLoading: loadingCards } = useCards();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: profile } = useProfile();
  const createMovement = useCreateMovement();
  const { pending, enqueue } = usePendingQuickExpenses();

  const prefs = useQuickExpensePrefs();
  const clientIdRef = useRef(crypto.randomUUID());
  const [savedJustNow, setSavedJustNow] = useState(false);

  const loading = loadingAccounts || loadingCards || loadingCategories;

  const paymentTargets: PaymentTarget[] = useMemo(() => {
    const accountTargets: PaymentTarget[] = (accounts ?? [])
      .filter((a) => !a.archived_at)
      .map((a) => ({ kind: 'account', id: a.id, name: a.name, color: a.color }));
    const cardTargets: PaymentTarget[] = (cards ?? [])
      .filter((c) => !c.archived_at)
      .map((c) => ({ kind: 'card', id: c.id, name: c.name, color: c.color }));
    const frequency = { ...prefs.accountFrequency, ...prefs.cardFrequency };
    return sortByFrequency([...accountTargets, ...cardTargets], frequency);
  }, [accounts, cards, prefs.accountFrequency, prefs.cardFrequency]);

  const expenseCategories = useMemo(
    () => sortByFrequency((categories ?? []).filter((c) => !c.archived_at && c.kind === 'expense'), prefs.categoryFrequency),
    [categories, prefs.categoryFrequency],
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MovementInput>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      currency: 'CRC',
      occurred_on: todayInAppTimeZone(),
      account_id: null,
      card_id: null,
      category_id: null,
      merchant: null,
      notes: null,
      tags: [],
    },
  });

  const amount = watch('amount');
  const currency = watch('currency');
  const accountId = watch('account_id');
  const cardId = watch('card_id');
  const categoryId = watch('category_id');

  // `useForm` solo toma `defaultValues` en su primer render, que ocurre
  // mientras cuentas/tarjetas/categorías todavía están cargando — por eso
  // el valor inicial real (últimos usados, moneda del perfil) se aplica
  // una sola vez acá, cuando los datos ya llegaron.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current || loading) return;
    initializedRef.current = true;
    const target =
      paymentTargets.find((t) => t.id === prefs.cardId || t.id === prefs.accountId) ?? paymentTargets[0] ?? null;
    const category = expenseCategories.find((c) => c.id === prefs.categoryId) ?? null;
    reset({
      type: 'expense',
      amount: 0,
      currency: profile?.base_currency ?? prefs.currency,
      occurred_on: todayInAppTimeZone(),
      account_id: target?.kind === 'account' ? target.id : null,
      card_id: target?.kind === 'card' ? target.id : null,
      category_id: category?.id ?? null,
      merchant: null,
      notes: null,
      tags: [],
    });
    // Corre una sola vez (initializedRef la bloquea después): no debe
    // volver a pisar la selección del usuario si cambian las frecuencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const selectTarget = (target: PaymentTarget) => {
    setValue('account_id', target.kind === 'account' ? target.id : null, { shouldDirty: true });
    setValue('card_id', target.kind === 'card' ? target.id : null, { shouldDirty: true });
  };

  const onSubmit = async (values: MovementInput) => {
    const clientId = clientIdRef.current;
    try {
      await createMovement.mutateAsync({ clientId, input: values });
      afterSave(values);
      toast.success('Gasto registrado');
    } catch (error) {
      if (isNetworkError(error)) {
        await enqueue({ clientId, input: values, createdAt: new Date().toISOString() });
        afterSave(values);
        toast.info('Sin conexión: el gasto quedó pendiente y se enviará solo al volver la señal.');
      } else {
        toast.error('No se pudo registrar el gasto. Volvé a intentar.');
      }
    }
  };

  const afterSave = (values: MovementInput) => {
    prefs.recordUsage({
      accountId: values.account_id,
      cardId: values.card_id,
      categoryId: values.category_id,
      currency: values.currency,
    });
    clientIdRef.current = crypto.randomUUID();
    setSavedJustNow(true);
    reset({ ...values, amount: 0, merchant: null, notes: null });
  };

  useEffect(() => {
    if (!savedJustNow) return;
    const timeout = setTimeout(() => setSavedJustNow(false), 2500);
    return () => clearTimeout(timeout);
  }, [savedJustNow]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface-sunken pt-[env(safe-area-inset-top)]">
        <LoadingState rows={4} />
      </div>
    );
  }

  if (paymentTargets.length === 0) {
    return (
      <div
        className="flex min-h-dvh flex-col bg-surface-sunken pt-[env(safe-area-inset-top)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <EmptyState
          icon={Wallet}
          title="Falta una cuenta o tarjeta"
          description="Para registrar un gasto rápido primero necesitás al menos una cuenta o tarjeta configurada."
          action={
            <Link
              to="/accounts"
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-sm)] bg-brand px-4 text-sm font-medium text-brand-contrast transition-colors duration-150 hover:bg-brand-strong"
            >
              Ir a Cuentas y tarjetas
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-dvh flex-col gap-6 bg-surface-sunken p-4 pt-[calc(1rem+env(safe-area-inset-top))]"
      style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
    >
      <header className="flex items-center gap-2">
        <Zap className="size-5 text-brand" aria-hidden />
        <h1 className="text-xl font-semibold text-ink">Gasto rápido</h1>
      </header>

      <form className="flex flex-1 flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] bg-surface p-6 shadow-[var(--shadow-elevation-sm)]">
          <div className="flex items-center gap-2">
            <input
              inputMode="decimal"
              type="number"
              step="0.01"
              min="0"
              aria-label="Importe"
              placeholder="0"
              autoFocus
              className="w-48 bg-transparent text-center text-5xl font-semibold text-ink outline-none"
              value={amount || ''}
              onChange={(e) => setValue('amount', e.target.value === '' ? 0 : Number(e.target.value), { shouldDirty: true })}
            />
            <div className="flex flex-col gap-1">
              {(['CRC', 'USD'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setValue('currency', code, { shouldDirty: true })}
                  className={clsx(
                    'rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium transition-colors duration-150',
                    currency === code ? 'bg-brand text-brand-contrast' : 'bg-surface-sunken text-ink-muted',
                  )}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
          {errors.amount ? <p className="text-xs text-expense">{errors.amount.message}</p> : null}
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-ink-muted">Pagar con</h2>
          <div className="flex flex-wrap gap-2">
            {paymentTargets.map((target) => {
              const selected = target.kind === 'account' ? accountId === target.id : cardId === target.id;
              return (
                <button
                  key={`${target.kind}-${target.id}`}
                  type="button"
                  onClick={() => selectTarget(target)}
                  aria-pressed={selected}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-150',
                    selected ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-surface text-ink',
                  )}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: target.color ?? 'var(--border)' }}
                    aria-hidden
                  />
                  {target.name}
                  {selected ? <Check className="size-3.5" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
          {errors.account_id ? <p className="text-xs text-expense">{errors.account_id.message}</p> : null}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-ink-muted">Categoría</h2>
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No hay categorías de gasto todavía — se puede guardar sin una y asignarla después.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((category) => {
                const selected = categoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setValue('category_id', selected ? null : category.id, { shouldDirty: true })
                    }
                    aria-pressed={selected}
                    className={clsx(
                      'flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors duration-150',
                      selected ? 'border-brand bg-brand/10 text-brand' : 'border-border bg-surface text-ink',
                    )}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color ?? 'var(--border)' }}
                      aria-hidden
                    />
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <Input
          label="Comercio o descripción (opcional)"
          placeholder="Ej. Automercado"
          error={errors.merchant?.message}
          {...register('merchant', { setValueAs: (v) => (v === '' ? null : v) })}
        />

        {pending.length > 0 ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-sm text-ink-muted">
            <CloudOff className="size-4 shrink-0" aria-hidden />
            {pending.length === 1
              ? '1 gasto pendiente de enviar (sin conexión)'
              : `${pending.length} gastos pendientes de enviar (sin conexión)`}
          </div>
        ) : null}

        {savedJustNow ? (
          <p className="text-center text-sm font-medium text-income" role="status">
            Guardado — listo para registrar otro.
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2">
          <Button type="submit" size="lg" loading={isSubmitting} disabled={!amount || amount <= 0}>
            {amount ? `Guardar ${formatMoney(amount, currency)}` : 'Guardar gasto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
