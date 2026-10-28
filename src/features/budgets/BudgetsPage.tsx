import { PiggyBank } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';

export function BudgetsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-ink">Presupuestos</h1>
      <EmptyState
        icon={PiggyBank}
        title="Sin presupuestos definidos"
        description="Cuando tengas categorías de gasto, podrás asignarles un límite mensual aquí (Fase 9)."
      />
    </div>
  );
}
