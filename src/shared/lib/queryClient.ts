import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente único de React Query. En la Fase 6 se le añade persistQueryClient
 * contra IndexedDB (lectura offline, plan §4.8) — por ahora solo cache en
 * memoria con reintentos razonables.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});
