import clsx from 'clsx';
import { Check } from 'lucide-react';

export const SWATCH_COLORS = [
  '#0e3b36',
  '#2f7a4f',
  '#b3432e',
  '#c08a1e',
  '#3a66ab',
  '#7a4fb3',
  '#b34f8a',
  '#5a5a5a',
] as const;

interface ColorSwatchPickerProps {
  label: string;
  value: string | null;
  onValueChange: (value: string) => void;
}

/** Selector de color identificador para cuentas/tarjetas/categorías. */
export function ColorSwatchPicker({ label, value, onValueChange }: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex gap-2" role="radiogroup" aria-label={label}>
        {SWATCH_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={value === color}
            aria-label={color}
            onClick={() => onValueChange(color)}
            className={clsx(
              'flex size-8 items-center justify-center rounded-full transition-transform duration-150 active:scale-95',
              value === color && 'ring-2 ring-offset-2 ring-offset-surface ring-brand',
            )}
            style={{ backgroundColor: color }}
          >
            {value === color ? <Check className="size-4 text-white" aria-hidden /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
