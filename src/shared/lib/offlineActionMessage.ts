import { isNetworkError } from '@/shared/offline/classify';

/**
 * Mensaje de error para las mutaciones que *no* se encolan offline (CRUD de
 * cuentas/tarjetas/categorías/presupuestos/metas/recurrentes, anulaciones,
 * perfil — ver `src/shared/offline/types.ts`). Sin clave de idempotencia en
 * la base, encolarlas arriesgaría duplicados; el plan maestro además
 * prohíbe prometer que una función del servidor opera offline, así que el
 * error lo dice explícito en vez de un mensaje genérico de "volvé a
 * intentar" que sugeriría que un reintento inmediato podría funcionar.
 */
export function offlineActionMessage(error: unknown, fallback: string): string {
  if (isNetworkError(error)) {
    return 'Sin conexión: esta acción necesita internet. Probá de nuevo al reconectar.';
  }
  return fallback;
}
