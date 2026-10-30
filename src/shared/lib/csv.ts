/**
 * Parser CSV mínimo, sin dependencia nueva (regla global — evitar
 * dependencias redundantes). Soporta comillas dobles (con `""` escapado
 * dentro de un campo), campos con el delimitador o saltos de línea
 * embebidos, y CRLF/LF. No asume separador: Fase 11 deja que el usuario
 * lo elija o lo detecta de la primera línea.
 */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === delimiter) {
      pushField();
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      pushRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) pushRow();

  return rows.filter((r) => !(r.length === 1 && r[0]!.trim() === ''));
}

const CANDIDATE_DELIMITERS = [',', ';', '\t'] as const;

/** Elige el delimitador cuya cantidad de apariciones es más consistente
 * entre las primeras líneas — no asume que todo CSV usa coma (plan
 * Fase 11: "no supongás que todos los bancos usan el mismo formato"). */
export function detectDelimiter(text: string): (typeof CANDIDATE_DELIMITERS)[number] {
  const sampleLines = text.split(/\r?\n/).slice(0, 5).filter(Boolean);
  let best: (typeof CANDIDATE_DELIMITERS)[number] = ',';
  let bestScore = -1;

  for (const delimiter of CANDIDATE_DELIMITERS) {
    const counts = sampleLines.map((line) => line.split(delimiter).length - 1);
    if (counts.length === 0 || counts[0] === 0) continue;
    const allSame = counts.every((c) => c === counts[0]);
    const score = allSame ? counts[0]! : -1;
    if (score > bestScore) {
      bestScore = score;
      best = delimiter;
    }
  }

  return best;
}
