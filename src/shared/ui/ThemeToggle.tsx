import { Moon, Sun, SunMoon } from 'lucide-react';
import clsx from 'clsx';
import { useThemeStore, type ThemePreference } from '@/shared/lib/theme';

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'system', label: 'Sistema', icon: SunMoon },
  { value: 'dark', label: 'Oscuro', icon: Moon },
];

export function ThemeToggle() {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex rounded-[var(--radius-sm)] border border-border bg-surface-sunken p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={clsx(
              'flex h-9 items-center gap-1.5 rounded-[calc(var(--radius-sm)-2px)] px-3 text-sm font-medium transition-colors duration-150',
              active ? 'bg-surface text-ink shadow-[var(--shadow-elevation-sm)]' : 'text-ink-muted',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
