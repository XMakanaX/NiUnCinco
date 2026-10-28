import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-[var(--radius-md)] border border-border bg-surface p-4 shadow-[var(--shadow-elevation-sm)]',
        className,
      )}
      {...props}
    />
  );
}
