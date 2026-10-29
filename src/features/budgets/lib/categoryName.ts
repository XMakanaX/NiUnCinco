import type { Category } from '@/features/categories/api/useCategories';

export function categoryNameFor(categories: Category[], categoryId: string | null): string | null {
  if (categoryId === null) return null;
  return categories.find((c) => c.id === categoryId)?.name ?? 'Categoría eliminada';
}
