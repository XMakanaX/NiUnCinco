import { z } from 'zod';

export const profileSchema = z.object({
  display_name: z.string().trim().max(80, 'Máximo 80 caracteres').optional(),
  base_currency: z.enum(['CRC', 'USD']),
});
export type ProfileInput = z.infer<typeof profileSchema>;
