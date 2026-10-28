import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const badgeStyles = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-sunken text-ink-muted',
        brand: 'bg-brand/10 text-brand',
        income: 'bg-income-surface text-income',
        expense: 'bg-expense-surface text-expense',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeStyles> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={clsx(badgeStyles({ tone }), className)} {...props} />;
}
