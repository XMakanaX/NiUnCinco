import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';

export function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-ink">Inicio</h1>
      <EmptyState
        icon={LayoutDashboard}
        title="Todavía no hay movimientos"
        description="Registrá tu primera cuenta y tu primer movimiento para ver aquí tu resumen financiero."
      />
    </div>
  );
}
