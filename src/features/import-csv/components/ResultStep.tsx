import { useNavigate } from 'react-router';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import type { ImportResult } from '../api/useImportCsv';

interface ResultStepProps {
  result: ImportResult;
  totalRows: number;
  rejectedCount: number;
  excludedDuplicateCount: number;
  onImportAnother: () => void;
}

export function ResultStep({ result, totalRows, rejectedCount, excludedDuplicateCount, onImportAnother }: ResultStepProps) {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink">Importación completa</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-ink-muted">Filas en el archivo</dt>
        <dd className="text-right text-ink">{totalRows}</dd>
        <dt className="text-ink-muted">Rechazadas (error de datos)</dt>
        <dd className="text-right text-ink">{rejectedCount}</dd>
        <dt className="text-ink-muted">Excluidas por posible duplicado</dt>
        <dd className="text-right text-ink">{excludedDuplicateCount}</dd>
        <dt className="text-ink-muted">Enviadas a importar</dt>
        <dd className="text-right text-ink">{result.sent}</dd>
        <dt className="font-medium text-ink">Importadas</dt>
        <dd className="text-right font-medium text-income">{result.imported}</dd>
        <dt className="text-ink-muted">Omitidas (ya existían, mismo archivo)</dt>
        <dd className="text-right text-ink">{result.skippedAsDuplicate}</dd>
      </dl>
      <div className="flex gap-2">
        <Button intent="secondary" onClick={onImportAnother}>
          Importar otro archivo
        </Button>
        <Button onClick={() => navigate('/transactions')}>Ver movimientos</Button>
      </div>
    </Card>
  );
}
