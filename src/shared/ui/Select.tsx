import { Select as BaseSelect } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface SelectProps<T extends string> {
  label: string;
  options: SelectOption<T>[];
  value: T | null;
  onValueChange: (value: T) => void;
  placeholder?: string;
}

export function Select<T extends string>({
  label,
  options,
  value,
  onValueChange,
  placeholder = 'Elegí una opción',
}: SelectProps<T>) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <BaseSelect.Root
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next as T);
        }}
      >
        <BaseSelect.Label className="text-sm font-medium text-ink">{label}</BaseSelect.Label>
        <BaseSelect.Trigger className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-border bg-surface px-3 text-ink transition-colors duration-150 data-[popup-open]:border-brand">
          <BaseSelect.Value placeholder={placeholder} className="min-w-0 truncate text-left" />
          <BaseSelect.Icon className="shrink-0">
            <ChevronDown className="size-4 text-ink-muted" aria-hidden />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner sideOffset={6}>
            <BaseSelect.Popup className="max-h-[min(20rem,60dvh)] max-w-[calc(100vw-2rem)] min-w-[var(--anchor-width)] overflow-y-auto overscroll-contain rounded-[var(--radius-sm)] border border-border bg-surface p-1 shadow-[var(--shadow-elevation-md)] transition-[opacity,transform] duration-150 ease-[var(--ease-out)] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className="flex h-10 min-w-0 cursor-default items-center justify-between gap-2 rounded-[calc(var(--radius-sm)-2px)] px-2.5 text-sm text-ink outline-hidden data-[highlighted]:bg-surface-sunken"
                  >
                    <BaseSelect.ItemText className="min-w-0 truncate">{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className="shrink-0">
                      <Check className="size-4 text-brand" aria-hidden />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
