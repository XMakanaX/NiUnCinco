import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Inbox } from 'lucide-react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('muestra título y descripción como invitación a actuar', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Sin movimientos todavía"
        description="Registrá tu primer gasto para verlo acá."
      />,
    );
    expect(screen.getByText('Sin movimientos todavía')).toBeInTheDocument();
    expect(screen.getByText('Registrá tu primer gasto para verlo acá.')).toBeInTheDocument();
  });
});
