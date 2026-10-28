import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/shared/lib/auth';
import { LoadingState } from '@/shared/ui/LoadingState';

export function RequireAuth() {
  const session = useAuthStore((state) => state.session);
  const initializing = useAuthStore((state) => state.initializing);
  const location = useLocation();

  if (initializing) {
    return <LoadingState />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
