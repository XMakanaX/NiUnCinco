import { useState } from 'react';
import { CreditCard, Inbox, Wallet } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Card } from '@/shared/ui/Card';
import { Money } from '@/shared/ui/Money';
import { Badge } from '@/shared/ui/Badge';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Dialog } from '@/shared/ui/Dialog';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { toast } from '@/shared/lib/toast';

/**
 * Vitrina interna de componentes base — Fase 2 del plan maestro. No es
 * una pantalla del producto, no se enlaza en la navegación: existe para
 * revisar el sistema de diseño antes de usarlo en features reales (Fase 3).
 */
export function DesignSystemPage() {
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'credit' | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Sistema de diseño</h1>
        <ThemeToggle />
      </header>

      <Section title="Color">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            ['paper', 'Papel'],
            ['surface', 'Superficie'],
            ['ink', 'Tinta'],
            ['brand', 'Marca'],
            ['income', 'Ingreso'],
            ['expense', 'Gasto'],
          ].map(([token, label]) => (
            <div key={token} className="flex flex-col gap-1.5">
              <div
                className="h-14 rounded-[var(--radius-sm)] border border-border"
                style={{ backgroundColor: `var(--color-${token})` }}
              />
              <span className="text-xs text-ink-muted">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografía y montos">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-muted">
            UI en fuente de sistema. Todo monto en monoespaciada de sistema (cifras tabulares).
          </p>
          <Money amount={1284500} currency="CRC" size="lg" />
          <div className="flex gap-6">
            <Money amount={45000} currency="CRC" tone="income" />
            <Money amount={12990} currency="USD" tone="expense" />
          </div>
        </div>
      </Section>

      <Section title="Botones">
        <div className="flex flex-wrap items-center gap-3">
          <Button intent="primary">Guardar</Button>
          <Button intent="secondary">Cancelar</Button>
          <Button intent="ghost">Ver más</Button>
          <Button intent="destructive">Eliminar</Button>
          <Button loading>Guardando</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </Section>

      <Section title="Campos y selectores">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre de la cuenta" placeholder="Ej. Cuenta BAC" />
          <Input label="Monto" leadingElement="₡" inputMode="decimal" placeholder="0.00" />
          <Input label="Correo" type="email" error="Ingresá un correo válido" />
          <Select
            label="Tipo de cuenta"
            value={accountType}
            onValueChange={setAccountType}
            options={[
              { label: 'Efectivo', value: 'cash' },
              { label: 'Cuenta bancaria', value: 'bank' },
              { label: 'Tarjeta de crédito', value: 'credit' },
            ]}
          />
        </div>
      </Section>

      <Section title="Tarjetas, badges y diálogo">
        <div className="flex flex-wrap items-start gap-4">
          <Card className="w-64">
            <div className="flex items-center gap-2 text-ink-muted">
              <Wallet className="size-4" aria-hidden />
              <span className="text-sm">Cuenta BAC</span>
            </div>
            <Money amount={342100} currency="CRC" size="lg" className="mt-2 block" />
            <Badge tone="brand" className="mt-3">
              Bancaria
            </Badge>
          </Card>
          <Dialog
            trigger={<Button intent="secondary">Abrir diálogo</Button>}
            title="Archivar cuenta"
            description="La cuenta deja de aparecer en el listado; sus movimientos no se borran."
          >
            <div className="flex justify-end gap-2">
              <Button intent="secondary" onClick={() => toast.info('Cancelado')}>
                Cancelar
              </Button>
              <Button intent="destructive" onClick={() => toast.success('Cuenta archivada')}>
                Archivar
              </Button>
            </div>
          </Dialog>
        </div>
      </Section>

      <Section title="Estados">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </Card>
          <Card className="p-0">
            <EmptyState
              icon={Inbox}
              title="Sin movimientos todavía"
              description="Registrá tu primer ingreso o gasto para verlo acá."
              action={
                <Button size="sm" className="mt-2">
                  <CreditCard className="size-4" aria-hidden />
                  Registrar movimiento
                </Button>
              }
            />
          </Card>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}
