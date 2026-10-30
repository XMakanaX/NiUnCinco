import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Landmark } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { LoadingState } from '@/shared/ui/LoadingState';
import { useAccounts } from '@/features/accounts/api/useAccounts';
import { FileStep } from './components/FileStep';
import { MappingStep } from './components/MappingStep';
import { ReviewStep } from './components/ReviewStep';
import { ResultStep } from './components/ResultStep';
import { validateRows, type InvalidRow, type ValidRow } from './lib/validateRows';
import type { ParsedFile } from './lib/types';
import type { ImportMapping } from './schema';
import type { ImportResult } from './api/useImportCsv';

type WizardState =
  | { step: 'file' }
  | { step: 'mapping'; file: ParsedFile }
  | { step: 'review'; file: ParsedFile; mapping: ImportMapping; valid: ValidRow[]; invalid: InvalidRow[] }
  | {
      step: 'result';
      result: ImportResult;
      totalRows: number;
      rejectedCount: number;
      excludedDuplicateCount: number;
    };

/**
 * Wizard de importación CSV (Fase 11): archivo → mapeo de columnas →
 * validación/duplicados → confirmación → resultado. No se enlaza en el
 * nav de 6 ítems — se accede desde el botón "Importar CSV" de
 * `/transactions`, con sesión ya requerida por el layout de `AppShell`.
 */
export function ImportCsvPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<WizardState>({ step: 'file' });
  const { data: accounts = [], isPending } = useAccounts();

  if (isPending) return <LoadingState />;

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={Landmark}
        title="Creá una cuenta primero"
        description="Necesitás al menos una cuenta para asociar los movimientos importados. Creala desde la pestaña Cuentas."
        action={<Button onClick={() => navigate('/accounts')}>Ir a Cuentas</Button>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button size="icon" intent="ghost" onClick={() => navigate('/transactions')} aria-label="Volver a movimientos">
          <ArrowLeft className="size-4" aria-hidden />
        </Button>
        <h1 className="text-xl font-semibold text-ink">Importar movimientos desde CSV</h1>
      </div>

      {state.step === 'file' ? (
        <FileStep onParsed={(file) => setState({ step: 'mapping', file })} />
      ) : null}

      {state.step === 'mapping' ? (
        <MappingStep
          rows={state.file.rows}
          accounts={accounts}
          onBack={() => setState({ step: 'file' })}
          onSubmit={(mapping, dataRows) => {
            const headerOffset = mapping.hasHeaderRow ? 1 : 0;
            const { valid, invalid } = validateRows(dataRows, mapping, headerOffset);
            setState({ step: 'review', file: state.file, mapping, valid, invalid });
          }}
        />
      ) : null}

      {state.step === 'review' ? (
        <ReviewStep
          accountId={state.mapping.accountId}
          validRows={state.valid}
          invalidRows={state.invalid}
          onBack={() => setState({ step: 'mapping', file: state.file })}
          onImported={(result, context) =>
            setState({
              step: 'result',
              result,
              totalRows: context.totalRows,
              rejectedCount: context.rejectedCount,
              excludedDuplicateCount: context.excludedDuplicateCount,
            })
          }
        />
      ) : null}

      {state.step === 'result' ? (
        <ResultStep
          result={state.result}
          totalRows={state.totalRows}
          rejectedCount={state.rejectedCount}
          excludedDuplicateCount={state.excludedDuplicateCount}
          onImportAnother={() => setState({ step: 'file' })}
        />
      ) : null}
    </div>
  );
}
