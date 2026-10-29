import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Ingresá un nombre').max(60, 'Máximo 60 caracteres'),
  kind: z.enum(['expense', 'income'], { error: 'Elegí gasto o ingreso' }),
  parent_id: z.string().uuid().nullable(),
  color: z.string().nullable(),
});
export type CategoryInput = z.infer<typeof categorySchema>;
