import type { ReactNode } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

/** Barra de pestañas horizontal. Base UI resuelve foco y teclado. */
export function Tabs({ items, value, onValueChange, children }: TabsProps) {
  return (
    <BaseTabs.Root value={value} onValueChange={(next) => onValueChange(next as string)}>
      <BaseTabs.List className="flex gap-1 border-b border-border">
        {items.map((item) => (
          <BaseTabs.Tab
            key={item.value}
            value={item.value}
            className="relative h-10 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-ink-muted outline-none transition-colors duration-150 focus-visible:shadow-[0_0_0_3px_var(--ring-brand)] data-[selected]:text-ink"
          >
            {item.label}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className="absolute bottom-0 h-0.5 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] bg-brand transition-[translate,width] duration-200 ease-[var(--ease-out)]" />
      </BaseTabs.List>
      {children}
    </BaseTabs.Root>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  return (
    <BaseTabs.Panel value={value} className="pt-4">
      {children}
    </BaseTabs.Panel>
  );
}
