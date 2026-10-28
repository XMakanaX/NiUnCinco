import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import clsx from 'clsx';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string | undefined;
  leadingElement?: ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * Campo de texto con label, hint y error. `ref` como prop normal: React 19
 * ya no requiere `forwardRef` (ver skill vercel-composition-patterns).
 */
export function Input({
  label,
  hint,
  error,
  leadingElement,
  className,
  ref,
  ...props
}: InputProps) {
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div
        className={clsx(
          'flex items-center gap-2 rounded-[var(--radius-sm)] border bg-surface px-3',
          'transition-colors duration-150 has-[input:focus-visible]:border-brand',
          error ? 'border-expense' : 'border-border',
        )}
      >
        {leadingElement ? (
          <span className="text-ink-muted" aria-hidden>
            {leadingElement}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'h-11 w-full bg-transparent text-ink outline-none placeholder:text-ink-muted',
            className,
          )}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={clsx(hintId, errorId) || undefined}
          {...props}
        />
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-expense">
          {error}
        </p>
      ) : null}
    </div>
  );
}
