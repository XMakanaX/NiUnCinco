import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UsageSelection {
  accountId: string | null;
  cardId: string | null;
  categoryId: string | null;
  currency: 'CRC' | 'USD';
}

interface QuickExpensePrefsState extends UsageSelection {
  accountFrequency: Record<string, number>;
  cardFrequency: Record<string, number>;
  categoryFrequency: Record<string, number>;
  recordUsage: (selection: UsageSelection) => void;
}

/**
 * Valores predeterminados y frecuencia de uso del registro rápido (Fase
 * 7: "valores predeterminados configurables" + "acceso rápido a
 * categorías y tarjetas frecuentes"). Solo en este dispositivo — no es
 * dato financiero, nunca va a Supabase.
 */
export const useQuickExpensePrefs = create<QuickExpensePrefsState>()(
  persist(
    (set) => ({
      accountId: null,
      cardId: null,
      categoryId: null,
      currency: 'CRC',
      accountFrequency: {},
      cardFrequency: {},
      categoryFrequency: {},
      recordUsage: (selection) =>
        set((state) => ({
          ...selection,
          accountFrequency: selection.accountId
            ? bump(state.accountFrequency, selection.accountId)
            : state.accountFrequency,
          cardFrequency: selection.cardId ? bump(state.cardFrequency, selection.cardId) : state.cardFrequency,
          categoryFrequency: selection.categoryId
            ? bump(state.categoryFrequency, selection.categoryId)
            : state.categoryFrequency,
        })),
    }),
    { name: 'quick-expense-prefs' },
  ),
);

function bump(frequency: Record<string, number>, id: string): Record<string, number> {
  return { ...frequency, [id]: (frequency[id] ?? 0) + 1 };
}

export function sortByFrequency<T extends { id: string }>(items: T[], frequency: Record<string, number>): T[] {
  return [...items].sort((a, b) => (frequency[b.id] ?? 0) - (frequency[a.id] ?? 0));
}
