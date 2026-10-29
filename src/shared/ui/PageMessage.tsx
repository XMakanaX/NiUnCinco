import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const messageStyles = cva(
  'flex items-start gap-2 rounded-[var(--radius-md)] border p-3 text-sm',
  {
    variants: {
      tone: {
        info: 'border-border bg-surface-sunken text-ink',
        success: 'border-income/30 bg-income-surface text-income',
        error: 'border-expense/30 bg-expense-surface text-expense',
      },
    },
    defaultVariants: { tone: 'info' },
  },
);

const TONE_ICON = {
  info: Info,
  success: CircleCheck,
  error: CircleAlert,
} as const;

interface PageMessageProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof messageStyles> {
  children: ReactNode;
}

/**
 * Mensaje inline para resultado de formularios y estado de página
 * (confirmación, error de validación o de servidor). No es un toast:
 * queda anclado en el flujo, no desaparece solo (ver shared/lib/toast.ts
 * para notificaciones efímeras).
 */
export function PageMessage({ className, tone = 'info', children, ...props }: PageMessageProps) {
  const Icon = TONE_ICON[tone ?? 'info'];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={clsx(messageStyles({ tone }), className)} {...props}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}
