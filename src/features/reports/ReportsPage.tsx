import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';

export function ReportsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-ink">Informes</h1>
      <EmptyState
        icon={BarChart3}
        title="Sin datos para analizar todavía"
        description="Con tus primeros movimientos registrados vas a poder buscar, filtrar y exportar informes aquí (Fase 12)."
      />
    </div>
  );
}
