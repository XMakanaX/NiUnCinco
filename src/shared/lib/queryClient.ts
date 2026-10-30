import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente único de React Query. `src/app/providers.tsx` lo envuelve en
 * `PersistQueryClientProvider` (Fase 13) con un persister sobre IndexedDB
 * (`src/shared/lib/idbPersister.ts`) para lectura offline en frío. `retry`
 * en 0 para mutaciones evita reintentos automáticos que escondan un error
 * de red detrás de varios intentos silenciosos — la cola offline (Fase 13)
 * ya se encarga de reintentar cuando corresponde.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
    mutations: {
      retry: 0,
    },
  },
});
