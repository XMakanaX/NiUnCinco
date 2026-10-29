import { describe, expect, it } from 'vitest';
import { categorySchema } from './schema';

describe('categorySchema', () => {
  it('acepta una categoría válida sin padre', () => {
    const result = categorySchema.safeParse({
      name: 'Mascotas',
      kind: 'expense',
      parent_id: null,
      color: '#b34f8a',
    });
    expect(result.success).toBe(true);
  });

  it('acepta una subcategoría con parent_id', () => {
    const result = categorySchema.safeParse({
      name: 'Veterinario',
      kind: 'expense',
      parent_id: '11111111-1111-4111-8111-111111111111',
      color: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza kind inválido', () => {
    const result = categorySchema.safeParse({
      name: 'Mascotas',
      kind: 'ahorro',
      parent_id: null,
      color: null,
    });
    expect(result.success).toBe(false);
  });
});
