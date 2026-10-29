-- Fase 5: vistas de saldo de cuentas y deuda/crédito disponible de
-- tarjetas. Fuente única de verdad (regla global 15 del plan maestro):
-- cualquier pantalla que muestre saldo (Cuentas, Dashboard en Fase 8)
-- consulta estas vistas en vez de recalcular a mano.
--
-- `security_invoker = true`: la vista corre con los permisos de quien
-- consulta, así que hereda el RLS de accounts/cards/transactions/
-- transfers/card_payments sin necesidad de policies propias.
--
-- Solo cuenta transacciones `status = 'confirmed'` (nunca `pending`: una
-- operación local sin confirmar del servidor no debe alterar el saldo
-- mostrado — regla global 12) ni `voided`.

create view public.account_balances
with (security_invoker = true) as
select
  a.id as account_id,
  a.user_id,
  a.currency,
  coalesce(tx.income, 0) - coalesce(tx.expense, 0)
    - coalesce(tr_out.total, 0) + coalesce(tr_in.total, 0)
    - coalesce(cp.total, 0) as balance
from public.accounts a
left join (
  select
    account_id,
    sum(amount) filter (where type = 'income') as income,
    sum(amount) filter (where type = 'expense') as expense
  from public.transactions
  where status = 'confirmed' and account_id is not null
  group by account_id
) tx on tx.account_id = a.id
left join (
  select from_account_id, sum(amount) as total
  from public.transfers
  group by from_account_id
) tr_out on tr_out.from_account_id = a.id
left join (
  select to_account_id, sum(amount) as total
  from public.transfers
  group by to_account_id
) tr_in on tr_in.to_account_id = a.id
left join (
  select from_account_id, sum(amount) as total
  from public.card_payments
  group by from_account_id
) cp on cp.from_account_id = a.id;

grant select on public.account_balances to authenticated;

-- Deuda y crédito disponible solo aplican a tarjetas de crédito: una
-- compra con débito ya se refleja en el saldo de la cuenta enlazada
-- (account_balances), no en una deuda propia de la tarjeta.

create view public.card_balances
with (security_invoker = true) as
select
  c.id as card_id,
  c.user_id,
  c.currency,
  c.card_type,
  c.credit_limit,
  case when c.card_type = 'credit'
    then coalesce(tx.expense, 0) - coalesce(cp.total, 0)
    else null
  end as balance_due,
  case when c.card_type = 'credit' and c.credit_limit is not null
    then c.credit_limit - (coalesce(tx.expense, 0) - coalesce(cp.total, 0))
    else null
  end as available_credit
from public.cards c
left join (
  select card_id, sum(amount) as expense
  from public.transactions
  where status = 'confirmed' and type = 'expense' and card_id is not null
  group by card_id
) tx on tx.card_id = c.id
left join (
  select card_id, sum(amount) as total
  from public.card_payments
  group by card_id
) cp on cp.card_id = c.id;

grant select on public.card_balances to authenticated;
