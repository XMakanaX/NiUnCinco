import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { PageMessage } from '@/shared/ui/PageMessage';
import { Card } from '@/shared/ui/Card';
import { detectDelimiter, parseCsv } from '@/shared/lib/csv';
import type { ParsedFile } from '../lib/types';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface FileStepProps {
  onParsed: (file: ParsedFile, delimiter: string) => void;
}

/**
 * El archivo nunca se sube: se lee como texto en memoria con
 * `File.text()` y se descarta la referencia apenas se termina de
 * parsear (plan Fase 11: "procesá de forma segura y no los conservés
 * innecesariamente"). Nada de esto toca Supabase Storage.
 */
export function FileStep({ onParsed }: FileStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (file.size === 0) {
      setError('El archivo está vacío.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('El archivo supera los 5 MB. Dividilo en partes más pequeñas.');
      return;
    }

    setIsReading(true);
    try {
      const text = await file.text();
      if (text.trim() === '') {
        setError('El archivo está vacío.');
        return;
      }
      const delimiter = detectDelimiter(text);
      const rows = parseCsv(text, delimiter);
      if (rows.length === 0) {
        setError('No se encontraron filas en el archivo.');
        return;
      }
      onParsed({ fileName: file.name, rows }, delimiter);
    } catch {
      setError('No se pudo leer el archivo. Verificá que sea un CSV de texto plano.');
    } finally {
      setIsReading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Card className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
        <FileUp className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-ink">Elegí un archivo CSV</h2>
        <p className="max-w-sm text-sm text-ink-muted">
          Exportá los movimientos desde tu banco como CSV y subilos acá. Soportamos coma, punto y
          coma o tabulador como separador — lo detectamos solo.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        id="csv-file-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button loading={isReading} onClick={() => document.getElementById('csv-file-input')?.click()}>
        Seleccionar archivo
      </Button>
      {error ? <PageMessage tone="error">{error}</PageMessage> : null}
    </Card>
  );
}
