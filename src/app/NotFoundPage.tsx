import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Button } from '@/shared/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="p-4">
      <EmptyState
        icon={Compass}
        title="Página no encontrada"
        description="La ruta que buscás no existe o cambió de lugar."
        action={
          <Button intent="secondary" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        }
      />
    </div>
  );
}
