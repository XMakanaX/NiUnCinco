import { ArrowLeftRight } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';

export function TransactionsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-ink">Movimientos</h1>
      <EmptyState
        icon={ArrowLeftRight}
        title="Sin movimientos registrados"
        description="Creá una cuenta primero y después registrá ingresos, gastos o transferencias desde aquí."
      />
    </div>
  );
}
