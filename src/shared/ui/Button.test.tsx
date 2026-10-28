import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('ejecuta onClick al presionar', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('se deshabilita mientras loading, sin perder el texto', () => {
    render(<Button loading>Guardando</Button>);
    const button = screen.getByRole('button', { name: 'Guardando' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('respeta disabled explícito', () => {
    render(<Button disabled>Eliminar</Button>);
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
  });
});
