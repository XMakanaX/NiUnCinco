import { Skeleton } from '@/shared/ui/Skeleton';

interface LoadingStateProps {
  rows?: number;
}

/**
 * Carga de página/lista completa (varias filas tipo skeleton). Para
 * carga dentro de un botón, usar `Button loading` en su lugar.
 */
export function LoadingState({ rows = 3 }: LoadingStateProps) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}
