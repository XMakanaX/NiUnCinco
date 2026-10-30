import { z } from 'zod';
import { DATE_FORMATS } from './lib/parseDate';

/** Cómo decidir si una fila es ingreso o gasto (plan Fase 11: "no
 * clasifiqués importes negativos sin considerar el formato de origen"). */
export const signConventionSchema = z.enum([
  'negative-expense',
  'negative-income',
  'all-expense',
  'all-income',
  'type-column',
]);
export type SignConvention = z.infer<typeof signConventionSchema>;

export const importMappingSchema = z
  .object({
    accountId: z.string().uuid({ error: 'Elegí una cuenta destino' }),
    hasHeaderRow: z.boolean(),
    dateColumn: z.number().int().min(0, 'Elegí la columna de fecha'),
    dateFormat: z.enum(DATE_FORMATS),
    descriptionColumn: z.number().int().min(-1),
    amountColumn: z.number().int().min(0, 'Elegí la columna de importe'),
    decimalSeparator: z.enum([',', '.']),
    currencyColumn: z.number().int().min(-1),
    defaultCurrency: z.enum(['CRC', 'USD']),
    signConvention: signConventionSchema,
    typeColumn: z.number().int().min(-1),
    expenseTypeValues: z.string(),
    incomeTypeValues: z.string(),
  })
  .refine((data) => data.signConvention !== 'type-column' || data.typeColumn >= 0, {
    message: 'Elegí la columna de tipo',
    path: ['typeColumn'],
  });
export type ImportMapping = z.infer<typeof importMappingSchema>;
