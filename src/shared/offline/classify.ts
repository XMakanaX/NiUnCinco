import { isUniqueViolation } from '@/shared/lib/postgresErrors';

export type FailureKind = 'network' | 'duplicate' | 'permanent';

/** Sin conexión o `fetch` fallido — nunca un error real de validación/RLS. */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (error instanceof TypeError) return true;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '');
    return /fetch|network/i.test(message);
  }
  return false;
}

/**
 * Clasifica el fallo de una operación encolada: `duplicate` (reintento con
 * el mismo `client_id`, ya aplicada) se descarta en silencio igual que en
 * los hooks en línea; `network` deja la operación pendiente; `permanent`
 * (validación, RLS, regla de negocio) se marca `failed` y no bloquea el
 * resto de la cola.
 */
export function classifyFailure(error: unknown): FailureKind {
  if (isUniqueViolation(error)) return 'duplicate';
  if (isNetworkError(error)) return 'network';
  return 'permanent';
}

export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Error desconocido');
  }
  return 'Error desconocido';
}
