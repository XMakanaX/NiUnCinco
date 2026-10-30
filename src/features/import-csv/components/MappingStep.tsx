import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';
import { PageMessage } from '@/shared/ui/PageMessage';
import { Select, type SelectOption } from '@/shared/ui/Select';
import type { Account } from '@/features/accounts/api/useAccounts';
import { DATE_FORMATS, type DateFormat } from '../lib/parseDate';
import { buildColumnOptions } from '../lib/types';
import { importMappingSchema, type ImportMapping, type SignConvention } from '../schema';

const NONE = '-1';

const SIGN_CONVENTION_OPTIONS: SelectOption<SignConvention>[] = [
  { value: 'negative-expense', label: 'Negativo = gasto, positivo = ingreso' },
  { value: 'negative-income', label: 'Negativo = ingreso, positivo = gasto' },
  { value: 'all-expense', label: 'Todas las filas son gastos' },
  { value: 'all-income', label: 'Todas las filas son ingresos' },
  { value: 'type-column', label: 'Usar una columna de tipo' },
];

const DATE_FORMAT_OPTIONS: SelectOption<DateFormat>[] = DATE_FORMATS.map((format) => ({
  value: format,
  label: format,
}));

interface MappingStepProps {
  rows: string[][];
  accounts: Account[];
  onBack: () => void;
  onSubmit: (mapping: ImportMapping, dataRows: string[][]) => void;
}

export function MappingStep({ rows, accounts, onBack, onSubmit }: MappingStepProps) {
  const [hasHeaderRow, setHasHeaderRow] = useState(true);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [dateColumn, setDateColumn] = useState<string | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>('DD/MM/YYYY');
  const [descriptionColumn, setDescriptionColumn] = useState<string>(NONE);
  const [amountColumn, setAmountColumn] = useState<string | null>(null);
  const [decimalSeparator, setDecimalSeparator] = useState<',' | '.'>(',');
  const [currencyColumn, setCurrencyColumn] = useState<string>(NONE);
  const [defaultCurrency, setDefaultCurrency] = useState<'CRC' | 'USD'>('CRC');
  const [signConvention, setSignConvention] = useState<SignConvention>('negative-expense');
  const [typeColumn, setTypeColumn] = useState<string | null>(null);
  const [expenseTypeValues, setExpenseTypeValues] = useState('');
  const [incomeTypeValues, setIncomeTypeValues] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const columnOptions = useMemo(() => buildColumnOptions(rows, hasHeaderRow), [rows, hasHeaderRow]);
  const columnOptionsWithNone: SelectOption<string>[] = useMemo(
    () => [{ value: NONE, label: '(sin mapear)' }, ...columnOptions],
    [columnOptions],
  );
  const accountOptions: SelectOption<string>[] = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` })),
    [accounts],
  );

  const dataRows = hasHeaderRow ? rows.slice(1) : rows;
  const previewRows = rows.slice(0, 6);

  const handleSubmit = () => {
    setFormError(null);
    const candidate = {
      accountId: accountId ?? '',
      hasHeaderRow,
      dateColumn: dateColumn !== null ? Number(dateColumn) : -1,
      dateFormat,
      descriptionColumn: Number(descriptionColumn),
      amountColumn: amountColumn !== null ? Number(amountColumn) : -1,
      decimalSeparator,
      currencyColumn: Number(currencyColumn),
      defaultCurrency,
      signConvention,
      typeColumn: typeColumn !== null ? Number(typeColumn) : -1,
      expenseTypeValues,
      incomeTypeValues,
    };

    const result = importMappingSchema.safeParse(candidate);
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? 'Revisá el mapeo de columnas.');
      return;
    }
    onSubmit(result.data, dataRows);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-x-auto">
        <h2 className="mb-2 text-sm font-semibold text-ink">Previsualización ({rows.length} filas detectadas)</h2>
        <table className="w-full min-w-max text-left text-sm">
          <tbody>
            {previewRows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex === 0 && hasHeaderRow ? 'font-medium text-ink' : 'text-ink-muted'}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="max-w-48 truncate border-b border-border px-2 py-1">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="flex flex-col gap-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={hasHeaderRow}
            onChange={(e) => setHasHeaderRow(e.target.checked)}
            className="size-4"
          />
          La primera fila es encabezado
        </label>

        <Select label="Cuenta destino" options={accountOptions} value={accountId} onValueChange={setAccountId} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Columna de fecha" options={columnOptions} value={dateColumn} onValueChange={setDateColumn} />
          <Select label="Formato de fecha" options={DATE_FORMAT_OPTIONS} value={dateFormat} onValueChange={setDateFormat} />
        </div>

        <Select
          label="Columna de descripción/comercio (opcional)"
          options={columnOptionsWithNone}
          value={descriptionColumn}
          onValueChange={setDescriptionColumn}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Columna de importe" options={columnOptions} value={amountColumn} onValueChange={setAmountColumn} />
          <Select
            label="Separador decimal"
            options={[
              { value: ',', label: 'Coma (1.000,50)' },
              { value: '.', label: 'Punto (1,000.50)' },
            ]}
            value={decimalSeparator}
            onValueChange={setDecimalSeparator}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Columna de moneda (opcional)"
            options={columnOptionsWithNone}
            value={currencyColumn}
            onValueChange={setCurrencyColumn}
          />
          <Select
            label="Moneda por defecto (si no hay columna)"
            options={[
              { value: 'CRC', label: 'Colones (CRC)' },
              { value: 'USD', label: 'Dólares (USD)' },
            ]}
            value={defaultCurrency}
            onValueChange={setDefaultCurrency}
          />
        </div>

        <Select
          label="¿Cómo distinguimos ingreso de gasto?"
          options={SIGN_CONVENTION_OPTIONS}
          value={signConvention}
          onValueChange={setSignConvention}
        />

        {signConvention === 'type-column' ? (
          <div className="flex flex-col gap-4 rounded-[var(--radius-sm)] border border-border p-3">
            <Select label="Columna de tipo" options={columnOptions} value={typeColumn} onValueChange={setTypeColumn} />
            <Input
              label="Valores que significan gasto"
              hint="Separá varios con coma, ej: débito, gasto, D"
              value={expenseTypeValues}
              onChange={(e) => setExpenseTypeValues(e.target.value)}
            />
            <Input
              label="Valores que significan ingreso"
              hint="Separá varios con coma, ej: crédito, ingreso, C"
              value={incomeTypeValues}
              onChange={(e) => setIncomeTypeValues(e.target.value)}
            />
          </div>
        ) : null}

        {formError ? <PageMessage tone="error">{formError}</PageMessage> : null}

        <div className="flex gap-2">
          <Button intent="secondary" onClick={onBack}>
            Atrás
          </Button>
          <Button onClick={handleSubmit}>Validar filas</Button>
        </div>
      </Card>
    </div>
  );
}
