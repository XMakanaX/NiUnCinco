import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

/**
 * Placeholder de carga con la forma del contenido real (no un spinner
 * genérico) — se le pasa className con el ancho/alto/radio que ocupará
 * el contenido final.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('animate-pulse rounded-[var(--radius-sm)] bg-surface-sunken', className)}
      aria-hidden
      {...props}
    />
  );
}
