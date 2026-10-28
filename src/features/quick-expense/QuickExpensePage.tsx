import { Zap } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';

/**
 * Destino del atajo de iOS (regla global 11 del plan maestro): solo
 * abre esta ruta, la app no puede leer la pulsación del botón de acción
 * ni compras bancarias. Lógica de registro rápido es Fase 7.
 */
export function QuickExpensePage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-ink">Registro rápido</h1>
      <EmptyState
        icon={Zap}
        title="Registro rápido pendiente de implementar"
        description="Este es el destino del atajo de iPhone. El formulario de gasto rápido llega en la Fase 7."
      />
    </div>
  );
}
