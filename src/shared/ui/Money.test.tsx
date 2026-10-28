import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Money } from './Money';

describe('Money', () => {
  it('renderiza el monto formateado en CRC', () => {
    render(<Money amount={45000} currency="CRC" />);
    expect(screen.getByText(/45\s?000/)).toBeInTheDocument();
  });

  it('el tono no cambia el valor mostrado, solo la clase', () => {
    render(<Money amount={1000} currency="USD" tone="expense" />);
    const el = screen.getByText(/1\s?000|1,000/);
    expect(el.className).toContain('text-expense');
  });
});
