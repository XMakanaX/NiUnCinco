import { TriangleAlert } from 'lucide-react';
import { useNavigate, useRouteError } from 'react-router';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Button } from '@/shared/ui/Button';

/**
 * errorElement de las rutas: captura errores de carga/render inesperados
 * (distinto de NotFoundPage, que es para rutas que no existen).
 */
export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  if (import.meta.env.DEV) {
    console.error(error);
  }

  return (
    <div className="p-4">
      <EmptyState
        icon={TriangleAlert}
        title="Algo salió mal"
        description="Ocurrió un error inesperado. Podés volver al inicio e intentar de nuevo."
        action={
          <Button intent="secondary" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        }
      />
    </div>
  );
}
