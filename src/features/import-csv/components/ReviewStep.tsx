import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { PageMessage } from '@/shared/ui/PageMessage';
import { LoadingState } from '@/shared/ui/LoadingState';
import { useFindSoftDuplicates, useImportCsv, type ImportResult } from '../api/useImportCsv';
import type { InvalidRow, ValidRow } from '../lib/validateRows';

interface ReviewStepProps {
  accountId: string;
  validRows: ValidRow[];
  invalidRows: InvalidRow[];
  onBack: () => void;
  onImported: (result: ImportResult, context: { totalRows: number; rejectedCount: number; excludedDuplicateCount: number }) => void;
}

export function ReviewStep({ accountId, validRows, invalidRows, onBack, onImported }: ReviewStepProps) {
  const findDuplicates = useFindSoftDuplicates();
  const importCsv = useImportCsv();
  const [includedDuplicates, setIncludedDuplicates] = useState<Set<number>>(new Set());
  const [checkedOnce, setCheckedOnce] = useState(false);

  useEffect(() => {
    if (checkedOnce) return;
    setCheckedOnce(true);
    findDuplicates.mutate({ accountId, rows: validRows });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedOnce]);

  const duplicates = findDuplicates.data ?? [];
  const duplicateRowNumbers = new Set(duplicates.map((d) => d.rowNumber));
  const toImport = validRows.filter(
    (row) => !duplicateRowNumbers.has(row.rowNumber) || includedDuplicates.has(row.rowNumber),
  );
  const excludedDuplicateCount = duplicates.length - includedDuplicates.size;

  const toggleDuplicate = (rowNumber: number) => {
    setIncludedDuplicates((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  };

  const handleConfirm = () => {
    importCsv.mutate(
      { accountId, rows: toImport },
      {
        onSuccess: (result) =>
          onImported(result, {
            totalRows: validRows.length + invalidRows.length,
            rejectedCount: invalidRows.length,
            excludedDuplicateCount,
          }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-ink">Validación</h2>
        <p className="text-sm text-ink-muted">
          {validRows.length} fila(s) válida(s), {invalidRows.length} rechazada(s).
        </p>
      </Card>

      {invalidRows.length > 0 ? (
        <Card className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          <h3 className="text-sm font-semibold text-ink">Filas rechazadas</h3>
          <ul className="flex flex-col gap-1 text-sm text-ink-muted">
            {invalidRows.slice(0, 50).map((row) => (
              <li key={row.rowNumber}>
                Fila {row.rowNumber}: {row.reason}
              </li>
            ))}
          </ul>
          {invalidRows.length > 50 ? (
            <p className="text-xs text-ink-muted">y {invalidRows.length - 50} más…</p>
          ) : null}
        </Card>
      ) : null}

      {findDuplicates.isPending ? (
        <LoadingState />
      ) : findDuplicates.isError ? (
        <PageMessage tone="error">No se pudieron revisar posibles duplicados. Podés continuar igual.</PageMessage>
      ) : duplicates.length > 0 ? (
        <Card className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          <h3 className="text-sm font-semibold text-ink">Posibles duplicados ({duplicates.length})</h3>
          <p className="text-xs text-ink-muted">
            Ya existe un movimiento con la misma fecha, importe, moneda y tipo en esta cuenta. Por
            defecto no se importan — marcalos si igual querés incluirlos.
          </p>
          <ul className="flex flex-col gap-1 text-sm text-ink">
            {duplicates.map((d) => (
              <li key={d.rowNumber} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={includedDuplicates.has(d.rowNumber)}
                  onChange={() => toggleDuplicate(d.rowNumber)}
                />
                Fila {d.rowNumber} — importar de todos modos
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {validRows.length === 0 ? (
        <PageMessage tone="error">No hay filas válidas para importar.</PageMessage>
      ) : (
        <PageMessage tone="info">Se van a importar {toImport.length} movimiento(s).</PageMessage>
      )}

      {importCsv.isError ? <PageMessage tone="error">No se pudo completar la importación. Intentá de nuevo.</PageMessage> : null}

      <div className="flex gap-2">
        <Button intent="secondary" onClick={onBack} disabled={importCsv.isPending}>
          Atrás
        </Button>
        <Button onClick={handleConfirm} loading={importCsv.isPending} disabled={toImport.length === 0}>
          Importar {toImport.length} movimiento(s)
        </Button>
      </div>
    </div>
  );
}
