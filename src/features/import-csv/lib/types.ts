export interface ParsedFile {
  fileName: string;
  rows: string[][];
}

export interface ColumnOption {
  value: string;
  label: string;
}

/** Opciones de columna para los `Select` de mapeo, a partir de las filas
 * crudas ya separadas (con o sin encabezado). `-1` siempre significa "no
 * mapear esta columna" para los campos opcionales. */
export function buildColumnOptions(rows: string[][], hasHeaderRow: boolean): ColumnOption[] {
  if (rows.length === 0) return [];
  const columnCount = Math.max(...rows.map((r) => r.length));
  const header = hasHeaderRow ? rows[0] : undefined;
  const sampleRow = hasHeaderRow ? rows[1] : rows[0];

  return Array.from({ length: columnCount }, (_, index) => {
    const headerLabel = header?.[index]?.trim();
    const sample = sampleRow?.[index]?.trim();
    const label = headerLabel
      ? headerLabel
      : sample
        ? `Columna ${index + 1} (ej: "${sample.slice(0, 20)}")`
        : `Columna ${index + 1}`;
    return { value: String(index), label };
  });
}
