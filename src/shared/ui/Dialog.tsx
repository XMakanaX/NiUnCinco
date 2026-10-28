import type { ReactElement, ReactNode } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';

interface DialogProps {
  trigger: ReactElement;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Diálogo modal centrado (transform-origin: center es correcto aquí —
 * a diferencia de un popover, un modal no está anclado a un disparador
 * puntual, ver emil-design-eng). Base UI resuelve foco, dismissal y
 * accesibilidad; esto solo aplica el sistema de diseño encima.
 */
export function Dialog({ trigger, title, description, children, open, onOpenChange }: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Trigger render={trigger} />
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 bg-ink/40 transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <BaseDialog.Popup
          className="fixed top-1/2 left-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] bg-surface p-6 shadow-[var(--shadow-elevation-lg)] transition-[opacity,transform] duration-200 ease-[var(--ease-out)] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0"
        >
          <BaseDialog.Title className="text-lg font-semibold text-ink">{title}</BaseDialog.Title>
          {description ? (
            <BaseDialog.Description className="mt-1 text-sm text-ink-muted">
              {description}
            </BaseDialog.Description>
          ) : null}
          <div className="mt-4">{children}</div>
          <BaseDialog.Close
            className="absolute top-4 right-4 rounded-full p-1 text-ink-muted transition-colors hover:bg-surface-sunken"
            aria-label="Cerrar"
          >
            <X className="size-4" aria-hidden />
          </BaseDialog.Close>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
