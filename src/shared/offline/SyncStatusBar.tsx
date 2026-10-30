import type { ReactNode } from 'react';
import { CloudOff, RefreshCw, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/shared/ui/Button';
import { useAuthStore } from '@/shared/lib/auth';
import { useOfflineStore } from '@/shared/offline/store';
import { usePendingOps } from '@/shared/offline/usePendingOps';
import { flushQueue } from '@/shared/offline/sync';

/**
 * Barra global de conexión/sincronización (plan Fase 13 — "estados de
 * sincronización veraces"). Nunca dice "guardado" ni "listo" para algo
 * pendiente (regla global 16): solo informa cuántas operaciones faltan
 * enviar y si hubo un error real de servidor en alguna de ellas.
 */
export function SyncStatusBar() {
  const userId = useAuthStore((state) => state.user?.id);
  const { online, syncing } = useOfflineStore();
  const { pending, failed } = usePendingOps(userId);

  if (!userId) return null;
  if (online && !syncing && pending.length === 0 && failed.length === 0) return null;

  let content: ReactNode;
  if (!online) {
    content = (
      <>
        <CloudOff className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          Sin conexión — mostrando datos guardados
          {pending.length > 0 ? ` · ${pending.length} sin enviar` : ''}
        </span>
      </>
    );
  } else if (syncing) {
    content = (
      <>
        <RefreshCw className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">Sincronizando…</span>
      </>
    );
  } else if (failed.length > 0) {
    content = (
      <>
        <TriangleAlert className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          {failed.length === 1 ? '1 operación falló' : `${failed.length} operaciones fallaron`}
        </span>
        <Link to="/settings" className="shrink-0 text-sm font-medium underline">
          Ver
        </Link>
      </>
    );
  } else {
    content = (
      <>
        <CloudOff className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          {pending.length === 1 ? '1 operación sin enviar' : `${pending.length} operaciones sin enviar`}
        </span>
        <Button size="sm" intent="ghost" className="shrink-0" onClick={() => void flushQueue(userId)}>
          Reintentar
        </Button>
      </>
    );
  }

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 flex items-center gap-2 border-t border-border bg-surface px-4 py-2 pr-[calc(1rem+env(safe-area-inset-right))] pl-[calc(1rem+env(safe-area-inset-left))] text-sm text-ink shadow-[var(--shadow-elevation-sm)] md:bottom-0"
    >
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2">{content}</div>
    </div>
  );
}
