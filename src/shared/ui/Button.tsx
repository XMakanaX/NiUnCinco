import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const buttonStyles = cva(
  [
    // Feedback en pointer-down, no en click (apple-design §1). Solo
    // transform/opacity para quedar en compositor (emil-design-eng).
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)]',
    'text-sm font-medium transition-[transform,background-color,color,border-color]',
    'duration-150 ease-[var(--ease-out)] active:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      intent: {
        primary: 'bg-brand text-brand-contrast hover:bg-brand-strong',
        secondary: 'border border-border bg-surface text-ink hover:bg-surface-sunken',
        ghost: 'text-ink hover:bg-surface-sunken',
        destructive: 'bg-expense text-white hover:brightness-95',
      },
      size: {
        // min-h-11 (~44px): tamaño táctil cómodo (plan maestro regla 13).
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4',
        lg: 'h-12 px-6 text-base',
        // Botón solo-icono: 44×44 exacto (plan maestro regla 13) — `sm`
        // con un solo ícono queda en 36px, por debajo del mínimo táctil.
        icon: 'size-11 shrink-0 p-0',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonStyles>;

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    ButtonVariants {
  children: ReactNode;
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Sin `forwardRef` (React 19 acepta `ref` como prop normal, ver skill
 * vercel-composition-patterns). Necesario para componer con el patrón
 * `render` de Base UI: `<Dialog.Trigger render={<Button>…</Button>} />`
 * fusiona ref + props de Base UI sobre este botón.
 */
export function Button({
  className,
  intent,
  size,
  fullWidth,
  loading = false,
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={clsx(buttonStyles({ intent, size, fullWidth }), className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}
