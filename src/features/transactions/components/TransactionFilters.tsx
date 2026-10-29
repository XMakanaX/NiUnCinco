import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Dialog } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select, type SelectOption } from '@/shared/ui/Select';

const ALL = '__all__';
const TYPE_OPTIONS: SelectOption<string>[] = [
  { label: 'Todos los tipos', value: ALL },
  { label: 'Ingresos', value: 'income' },
  { label: 'Gastos', value: 'expense' },
  { label: 'Transferencias', value: 'transfer' },
  { label: 'Pagos de tarjeta', value: 'card_payment' },
];

interface Named {
  id: string;
  name: string;
}

export interface TransactionFiltersValue {
  search: string;
  from: string;
  to: string;
  accountId: string;
  cardId: string;
  categoryId: string;
  type: string;
}

interface TransactionFiltersProps {
  value: TransactionFiltersValue;
  onChange: (next: Partial<TransactionFiltersValue>) => void;
  accounts: Named[];
  cards: Named[];
  categories: Named[];
}

/**
 * 7 controles — Desde/Hasta/Buscar/Tipo/Cuenta/Tarjeta/Categoría.
 * < md: solo "Buscar" queda a la vista; el resto vive en un diálogo
 * (hoja inferior) detrás de un botón "Filtros" que cuenta cuántos están
 * activos, para que la lista de movimientos sea lo primero que se ve.
 * >= md: los 7 en un grid, siempre visibles.
 */
export function TransactionFilters({ value, onChange, accounts, cards, categories }: TransactionFiltersProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeCount = [value.from, value.to, value.accountId, value.cardId, value.categoryId, value.type].filter(
    (v) => v && v !== ALL,
  ).length;

  const accountOptions: SelectOption<string>[] = [
    { label: 'Todas las cuentas', value: ALL },
    ...accounts.map((a) => ({ label: a.name, value: a.id })),
  ];
  const cardOptions: SelectOption<string>[] = [
    { label: 'Todas las tarjetas', value: ALL },
    ...cards.map((c) => ({ label: c.name, value: c.id })),
  ];
  const categoryOptions: SelectOption<string>[] = [
    { label: 'Todas las categorías', value: ALL },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const rest = (
    <>
      <Input label="Desde" type="date" value={value.from} onChange={(e) => onChange({ from: e.target.value })} />
      <Input label="Hasta" type="date" value={value.to} onChange={(e) => onChange({ to: e.target.value })} />
      <Select label="Tipo" options={TYPE_OPTIONS} value={value.type} onValueChange={(v) => onChange({ type: v })} />
      <Select
        label="Cuenta"
        options={accountOptions}
        value={value.accountId}
        onValueChange={(v) => onChange({ accountId: v })}
      />
      <Select
        label="Tarjeta"
        options={cardOptions}
        value={value.cardId}
        onValueChange={(v) => onChange({ cardId: v })}
      />
      <Select
        label="Categoría"
        options={categoryOptions}
        value={value.categoryId}
        onValueChange={(v) => onChange({ categoryId: v })}
      />
    </>
  );

  const clearAll = () =>
    onChange({ from: '', to: '', accountId: ALL, cardId: ALL, categoryId: ALL, type: ALL });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 md:hidden">
        <div className="min-w-0 flex-1">
          <Input
            label="Buscar"
            placeholder="Comercio o notas"
            value={value.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <Button intent="secondary" onClick={() => setPanelOpen(true)}>
            <SlidersHorizontal className="size-4" aria-hidden />
            Filtros{activeCount > 0 ? ` (${activeCount})` : ''}
          </Button>
        </div>
      </div>

      <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-4">
        <Input
          label="Buscar"
          placeholder="Comercio o notas"
          value={value.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
        {rest}
      </div>

      <Dialog
        trigger={<button type="button" hidden />}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        title="Filtros"
      >
        <div className="flex flex-col gap-4">
          {rest}
          <div className="flex gap-2">
            <Button intent="secondary" fullWidth onClick={clearAll}>
              Limpiar filtros
            </Button>
            <Button fullWidth onClick={() => setPanelOpen(false)}>
              Ver resultados
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
