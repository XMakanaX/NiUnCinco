import { useState } from 'react';
import { Download } from 'lucide-react';
import { Input } from '@/shared/ui/Input';
import { Select, type SelectOption } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';
import { supabase } from '@/shared/lib/supabase';
import { toCsv } from '@/shared/lib/csv';
import { todayInAppTimeZone } from '@/shared/lib/date';
import type { Account } from '@/features/accounts/api/useAccounts';
import type { Card } from '@/features/accounts/api/useCards';
import type { Category } from '@/features/categories/api/useCategories';
import type { Database } from '@/types/database';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

const ALL = '__all__';
const CURRENCY_OPTIONS: SelectOption<string>[] = [
  { label: 'Todas', value: ALL },
  { label: 'CRC', value: 'CRC' },
  { label: 'USD', value: 'USD' },
];

const TYPE_LABEL: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  transfer: 'Transferencia',
  card_payment: 'Pago de tarjeta',
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  voided: 'Anulado',
};

interface Column {
  key: string;
  label: string;
  value: (row: TransactionRow, ctx: ExportPanelProps) => string;
}

const COLUMNS: Column[] = [
  { key: 'occurred_on', label: 'Fecha', value: (row) => row.occurred_on },
  { key: 'type', label: 'Tipo', value: (row) => TYPE_LABEL[row.type] ?? row.type },
  { key: 'amount', label: 'Monto', value: (row) => String(row.amount) },
  { key: 'currency', label: 'Moneda', value: (row) => row.currency },
  {
    key: 'account',
    label: 'Cuenta',
    value: (row, ctx) => (row.account_id ? ctx.accounts.find((a) => a.id === row.account_id)?.name ?? '' : ''),
  },
  {
    key: 'card',
    label: 'Tarjeta',
    value: (row, ctx) => (row.card_id ? ctx.cards.find((c) => c.id === row.card_id)?.name ?? '' : ''),
  },
  {
    key: 'category',
    label: 'Categoría',
    value: (row, ctx) =>
      row.category_id ? ctx.categories.find((c) => c.id === row.category_id)?.name ?? '' : '',
  },
  { key: 'merchant', label: 'Comercio', value: (row) => row.merchant ?? '' },
  { key: 'notes', label: 'Notas', value: (row) => row.notes ?? '' },
  { key: 'status', label: 'Estado', value: (row) => STATUS_LABEL[row.status] ?? row.status },
];

interface ExportPanelProps {
  accounts: Account[];
  cards: Card[];
  categories: Category[];
}

function downloadCsv(filename: string, content: string) {
  // BOM UTF-8: Excel en Windows no detecta UTF-8 sin él y rompe tildes/ñ.
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exportación CSV de movimientos propios (plan Fase 12): periodo y
 * columnas seleccionables. RLS ya limita la consulta a los movimientos
 * del usuario autenticado — la exportación nunca puede incluir datos de
 * otra cuenta, sin chequeo adicional en el cliente.
 */
export function ExportPanel(props: ExportPanelProps) {
  const [from, setFrom] = useState(() => todayInAppTimeZone().slice(0, 8) + '01');
  const [to, setTo] = useState(() => todayInAppTimeZone());
  const [currency, setCurrency] = useState(ALL);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(COLUMNS.map((c) => c.key)));
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle');

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleExport = async () => {
    setStatus('loading');
    let query = supabase
      .from('transactions')
      .select('*')
      .gte('occurred_on', from)
      .lte('occurred_on', to)
      .order('occurred_on', { ascending: true });
    if (currency !== ALL) query = query.eq('currency', currency);

    const { data, error } = await query;
    if (error) {
      setStatus('error');
      return;
    }
    if (!data || data.length === 0) {
      setStatus('empty');
      return;
    }

    const columns = COLUMNS.filter((c) => selectedColumns.has(c.key));
    const header = columns.map((c) => c.label);
    const rows = (data as TransactionRow[]).map((row) => columns.map((c) => c.value(row, props)));
    const csv = toCsv([header, ...rows]);
    downloadCsv(`movimientos_${from}_${to}.csv`, csv);
    setStatus('idle');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <Select label="Moneda" options={CURRENCY_OPTIONS} value={currency} onValueChange={setCurrency} />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Columnas</span>
        <div className="grid grid-cols-2 gap-2">
          {COLUMNS.map((column) => (
            <label key={column.key} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={selectedColumns.has(column.key)}
                onChange={() => toggleColumn(column.key)}
                className="size-4 accent-brand"
              />
              {column.label}
            </label>
          ))}
        </div>
      </div>

      {status === 'error' ? <PageMessage tone="error">No se pudo generar la exportación.</PageMessage> : null}
      {status === 'empty' ? (
        <PageMessage tone="info">No hay movimientos en ese rango para exportar.</PageMessage>
      ) : null}

      <Button
        onClick={handleExport}
        loading={status === 'loading'}
        disabled={selectedColumns.size === 0 || !from || !to}
      >
        <Download className="size-4" aria-hidden />
        Exportar CSV
      </Button>
    </div>
  );
}
