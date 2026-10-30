import { type ReactNode, useEffect } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Toaster } from 'sonner';
import { queryClient } from '@/shared/lib/queryClient';
import { createIdbPersister } from '@/shared/lib/idbPersister';
import { toast } from '@/shared/lib/toast';
import { useAuthStore } from '@/shared/lib/auth';
import { SyncStatusBar } from '@/shared/offline/SyncStatusBar';
import { useOfflineSync } from '@/app/offline/useOfflineSync';

const persister = createIdbPersister();
const MAX_AGE = 1000 * 60 * 60 * 24; // 24h: pasado ese tiempo, el cache restaurado se descarta en vez de mostrarse como vigente.

export function AppProviders({ children }: { children: ReactNode }) {
  // `buster` cambia con el usuario: un cache persistido con otro id se
  // descarta en la restauración en vez de mostrar datos de otra cuenta
  // (regla global de aislamiento entre usuarios — ver también
  // `signOutAndWipe` en `src/shared/lib/auth.ts`, que lo borra del todo).
  const userId = useAuthStore((state) => state.user?.id);
  useOfflineSync();
  useServiceWorkerToasts();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: MAX_AGE, buster: userId ?? 'anonymous' }}
    >
      {children}
      <SyncStatusBar />
      <Toaster richColors position="top-center" />
    </PersistQueryClientProvider>
  );
}

/** `registerType: 'prompt'` (Fase 13): el service worker nuevo espera a
 * que el usuario confirme antes de tomar control — una recarga automática
 * podría borrar un formulario a medio llenar. */
function useServiceWorkerToasts() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (offlineReady) toast.info('Lista para usar sin conexión');
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast.action('Nueva versión disponible', {
        label: 'Actualizar',
        onClick: () => void updateServiceWorker(true),
      });
    }
  }, [needRefresh, updateServiceWorker]);
}
