import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/shared/lib/auth';

/** Rutas de auth (login/registro/recuperación): ya logueado, va al inicio. */
export function GuestOnly() {
  const session = useAuthStore((state) => state.session);
  const initializing = useAuthStore((state) => state.initializing);

  if (!initializing && session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
