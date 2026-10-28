import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Estado vacío como invitación a actuar, no como aviso ("Apple design"
 * §16, "frontend-design": un vacío explica qué hacer, no se disculpa).
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-sunken text-ink-muted">
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
