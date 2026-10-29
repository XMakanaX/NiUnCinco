import type { ReactElement, ReactNode } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface DialogProps {
  trigger: ReactElement;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Diálogo modal: hoja inferior en móvil (<md, pulgar al alcance, scroll
 * interno acotado a la pantalla — ver skill mobile-native), centrado en
 * md+ (transform-origin: center, ver emil-design-eng). Base UI resuelve
 * foco, dismissal y accesibilidad; esto solo aplica el sistema de diseño.
 */
export function Dialog({ trigger, title, description, children, open, onOpenChange }: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Trigger render={trigger} />
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 bg-ink/40 transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <BaseDialog.Popup
          className={clsx(
            // Móvil: hoja inferior, alto acotado al viewport (nunca se
            // desborda por arriba y por abajo a la vez como el modal
            // centrado lo hacía con formularios largos).
            'fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col',
            'rounded-t-[var(--radius-lg)] bg-surface shadow-[var(--shadow-elevation-lg)]',
            'transition-transform duration-300 ease-[var(--ease-drawer)]',
            'data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full',
            // md+: modal centrado (comportamiento previo).
            'md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2',
            'md:w-[calc(100vw-2rem)] md:max-w-md md:max-h-[85dvh]',
            'md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-lg)]',
            'md:transition-[opacity,transform] md:duration-200 md:ease-[var(--ease-out)]',
            'md:data-[starting-style]:translate-y-[-50%] md:data-[starting-style]:scale-95 md:data-[starting-style]:opacity-0',
            'md:data-[ending-style]:translate-y-[-50%] md:data-[ending-style]:scale-95 md:data-[ending-style]:opacity-0',
          )}
        >
          {/* Asa: afordancia de hoja arrastrable, solo en móvil. */}
          <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-border-strong md:hidden" aria-hidden />

          {/* Cabecera fija: el botón cerrar nunca se va con el scroll. */}
          <div className="shrink-0 px-6 pt-4 pr-16 md:pt-6">
            <BaseDialog.Title className="text-lg font-semibold text-ink">{title}</BaseDialog.Title>
            {description ? (
              <BaseDialog.Description className="mt-1 text-sm text-ink-muted [overflow-wrap:anywhere]">
                {description}
              </BaseDialog.Description>
            ) : null}
          </div>

          {/* Cuerpo: único que scrollea. min-h-0 es obligatorio — sin él,
              flex-1 hereda min-height: auto y overflow-y-auto no hace nada. */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pb-6">
            {children}
          </div>

          <BaseDialog.Close
            className="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-sunken"
            aria-label="Cerrar"
          >
            <X className="size-5" aria-hidden />
          </BaseDialog.Close>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
