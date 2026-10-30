import type { ImportMapping } from '../schema';
import { parseAmount } from './parseAmount';
import { parseDateWithFormat } from './parseDate';

export interface ValidRow {
  rowNumber: number;
  occurred_on: string;
  amount: number;
  type: 'income' | 'expense';
  currency: 'CRC' | 'USD';
  merchant: string | null;
}

export interface InvalidRow {
  rowNumber: number;
  reason: string;
  raw: string[];
}

export interface ValidationResult {
  valid: ValidRow[];
  invalid: InvalidRow[];
}

function matchesTypeValue(raw: string, configured: string): boolean {
  const candidates = configured
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  return candidates.includes(raw.trim().toLowerCase());
}

/** Clasifica una fila ya parseada como ingreso o gasto según la
 * convención de signo elegida por el usuario — nunca asumida. Devuelve
 * `null` cuando la fila es ambigua (columna de tipo con un valor que no
 * coincide con lo configurado): se deja para revisión, no se adivina. */
function classify(
  mapping: ImportMapping,
  rawAmount: number,
  typeCell: string | undefined,
): { type: 'income' | 'expense'; amount: number } | null {
  switch (mapping.signConvention) {
    case 'all-expense':
      return { type: 'expense', amount: Math.abs(rawAmount) };
    case 'all-income':
      return { type: 'income', amount: Math.abs(rawAmount) };
    case 'negative-expense':
      return rawAmount < 0
        ? { type: 'expense', amount: Math.abs(rawAmount) }
        : { type: 'income', amount: rawAmount };
    case 'negative-income':
      return rawAmount < 0
        ? { type: 'income', amount: Math.abs(rawAmount) }
        : { type: 'expense', amount: rawAmount };
    case 'type-column': {
      if (typeCell === undefined) return null;
      if (matchesTypeValue(typeCell, mapping.expenseTypeValues)) {
        return { type: 'expense', amount: Math.abs(rawAmount) };
      }
      if (matchesTypeValue(typeCell, mapping.incomeTypeValues)) {
        return { type: 'income', amount: Math.abs(rawAmount) };
      }
      return null;
    }
  }
}

/**
 * Valida y normaliza las filas crudas del CSV. Cada fila se evalúa de
 * forma independiente: un error en una fila nunca descarta las demás
 * (plan Fase 11: "validar filas y mostrar errores"). `rowNumber` es
 * 1-indexado contando la fila de encabezado si existe, para que el
 * mensaje de error coincida con lo que el usuario ve en su archivo.
 */
export function validateRows(dataRows: string[][], mapping: ImportMapping, headerOffset: number): ValidationResult {
  const valid: ValidRow[] = [];
  const invalid: InvalidRow[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 1 + headerOffset;
    const dateCell = row[mapping.dateColumn];
    const amountCell = row[mapping.amountColumn];

    if (dateCell === undefined || amountCell === undefined) {
      invalid.push({ rowNumber, reason: 'Fila con menos columnas de las esperadas', raw: row });
      return;
    }

    const occurred_on = parseDateWithFormat(dateCell, mapping.dateFormat);
    if (!occurred_on) {
      invalid.push({ rowNumber, reason: `Fecha inválida: "${dateCell}"`, raw: row });
      return;
    }

    const rawAmount = parseAmount(amountCell, mapping.decimalSeparator);
    if (rawAmount === null || rawAmount === 0) {
      invalid.push({ rowNumber, reason: `Importe inválido: "${amountCell}"`, raw: row });
      return;
    }

    const typeCell = mapping.typeColumn >= 0 ? row[mapping.typeColumn] : undefined;
    const classified = classify(mapping, rawAmount, typeCell);
    if (!classified) {
      invalid.push({
        rowNumber,
        reason: `No se pudo determinar ingreso/gasto a partir de "${typeCell ?? amountCell}"`,
        raw: row,
      });
      return;
    }

    let currency: 'CRC' | 'USD' = mapping.defaultCurrency;
    if (mapping.currencyColumn >= 0) {
      const currencyCell = row[mapping.currencyColumn]?.trim().toUpperCase();
      if (currencyCell !== 'CRC' && currencyCell !== 'USD') {
        invalid.push({ rowNumber, reason: `Moneda desconocida: "${row[mapping.currencyColumn]}"`, raw: row });
        return;
      }
      currency = currencyCell;
    }

    const merchantCell = mapping.descriptionColumn >= 0 ? row[mapping.descriptionColumn]?.trim() : undefined;

    valid.push({
      rowNumber,
      occurred_on,
      amount: classified.amount,
      type: classified.type,
      currency,
      merchant: merchantCell && merchantCell.length > 0 ? merchantCell.slice(0, 80) : null,
    });
  });

  return { valid, invalid };
}
