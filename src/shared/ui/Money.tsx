import clsx from 'clsx';
import type { CurrencyCode } from '@/shared/lib/money';
import { formatMoney } from '@/shared/lib/money';

type MoneyTone = 'neutral' | 'income' | 'expense';

interface MoneyProps {
  amount: number;
  currency: CurrencyCode;
  tone?: MoneyTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TONE_CLASSES: Record<MoneyTone, string> = {
  neutral: 'text-ink',
  income: 'text-income',
  expense: 'text-expense',
};

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  // En móvil (2 cols a 320px) text-3xl desborda la tarjeta KPI; se escala
  // desde text-2xl y solo crece a 3xl desde md.
  lg: 'text-2xl tracking-tight md:text-3xl',
} as const;

/**
 * Componente firma del sistema de diseño: todo monto se muestra en la
 * fuente monoespaciada de sistema (cifras tabulares reales, alinean en
 * columna como un estado de cuenta) y SOLO toma el color de ingreso/gasto
 * cuando el llamador lo pide explícitamente — el saldo total del dashboard
 * se queda neutro a propósito (un balance que cambia de color según el
 * signo se siente como un ticker de bolsa, no como control personal).
 */
export function Money({ amount, currency, tone = 'neutral', size = 'md', className }: MoneyProps) {
  return (
    <span
      className={clsx(
        'font-mono tabular-nums whitespace-nowrap',
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {formatMoney(amount, currency)}
    </span>
  );
}
