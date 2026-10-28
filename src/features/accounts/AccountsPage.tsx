import { Wallet } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';

export function AccountsPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold text-ink">Cuentas</h1>
      <EmptyState
        icon={Wallet}
        title="Sin cuentas ni tarjetas"
        description="Agregá tu primera cuenta de efectivo, bancaria o tarjeta para empezar a registrar movimientos."
      />
    </div>
  );
}
