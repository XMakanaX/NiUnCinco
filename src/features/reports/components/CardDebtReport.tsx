import { Money } from '@/shared/ui/Money';
import type { CurrencyCode } from '@/shared/lib/money';
import type { Card } from '@/features/accounts/api/useCards';

interface CardDebtReportProps {
  cards: Card[];
  currency: CurrencyCode;
  paymentsByCardId: Map<string, number>;
}

/**
 * Deuda actual (vista `card_balances`, Fase 5 — saldo en vivo, no
 * histórico) y pagos hechos dentro del periodo elegido (`card_payments`
 * filtrado por rango, Fase 12) para cada tarjeta de crédito en la moneda
 * seleccionada.
 */
export function CardDebtReport({ cards, currency, paymentsByCardId }: CardDebtReportProps) {
  const creditCards = cards.filter((c) => c.card_type === 'credit' && c.currency === currency);

  if (creditCards.length === 0) {
    return <p className="text-sm text-ink-muted">No hay tarjetas de crédito en esta moneda.</p>;
  }

  const totalDebt = creditCards.reduce((sum, c) => sum + (c.balanceDue ?? 0), 0);
  const totalPaid = creditCards.reduce((sum, c) => sum + (paymentsByCardId.get(c.id) ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 border-b border-border pb-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-ink-muted">Deuda total actual</span>
          <Money amount={totalDebt} currency={currency} size="sm" />
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-ink-muted">Pagado en el periodo</span>
          <Money amount={totalPaid} currency={currency} size="sm" />
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {creditCards.map((card) => (
          <li key={card.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-sm text-ink">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: card.color ?? 'var(--border-strong)' }}
                aria-hidden
              />
              <span className="min-w-0 truncate">{card.name}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pl-4 text-xs text-ink-muted">
              <span>
                Deuda <Money amount={card.balanceDue ?? 0} currency={currency} size="sm" />
              </span>
              <span>
                Pagado <Money amount={paymentsByCardId.get(card.id) ?? 0} currency={currency} size="sm" />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
