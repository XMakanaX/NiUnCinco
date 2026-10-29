-- Fase 6: núcleo financiero (ingresos, gastos, transferencias, pagos de
-- tarjeta). Transferencias y pagos de tarjeta tocan dos tablas a la vez
-- (transfers/card_payments + transactions) — regla global 14 del plan
-- maestro exige que eso sea una sola operación atómica, no varias
-- llamadas sueltas desde el cliente. Postgres ejecuta cada función en
-- una sola transacción implícita: si el segundo insert falla (por
-- ejemplo por un client_id repetido — reintento de un envío que sí llegó
-- la primera vez), todo el intento se revierte, incluida la fila nueva
-- de transfers/card_payments. Así la idempotencia de la cola offline
-- (regla global 9) también cubre a estas dos entidades, aunque su propia
-- tabla no tenga client_id.
--
-- Ingresos y gastos no necesitan RPC: son un solo insert en
-- `transactions`, ya atómico por sí mismo.

alter table public.transfers
  add column status text not null default 'confirmed' check (status in ('confirmed', 'voided'));

alter table public.card_payments
  add column status text not null default 'confirmed' check (status in ('confirmed', 'voided'));

-- Las vistas de saldo (Fase 5) deben ignorar transferencias/pagos
-- anulados igual que ya ignoran transacciones `voided` — mismas columnas,
-- se puede reemplazar con `create or replace view`.

create or replace view public.account_balances
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
  where status = 'confirmed'
  group by from_account_id
) tr_out on tr_out.from_account_id = a.id
left join (
  select to_account_id, sum(amount) as total
  from public.transfers
  where status = 'confirmed'
  group by to_account_id
) tr_in on tr_in.to_account_id = a.id
left join (
  select from_account_id, sum(amount) as total
  from public.card_payments
  where status = 'confirmed'
  group by from_account_id
) cp on cp.from_account_id = a.id;

create or replace view public.card_balances
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
  where status = 'confirmed'
  group by card_id
) cp on cp.card_id = c.id;

-- ============================================================
-- create_transfer — transferencia entre cuentas propias (regla de
-- negocio: no es ingreso ni gasto). Crea la fila en `transfers` y sus
-- dos asientos en `transactions` (salida/entrada, mismo transfer_id)
-- para que aparezcan en el listado de movimientos de ambas cuentas.
-- ============================================================

create or replace function public.create_transfer(
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_currency text,
  p_occurred_on date,
  p_notes text,
  p_client_id_out uuid,
  p_client_id_in uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_transfer_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.transfers (
    user_id, from_account_id, to_account_id, amount, currency, occurred_on, notes
  ) values (
    v_user_id, p_from_account_id, p_to_account_id, p_amount, p_currency, p_occurred_on, p_notes
  )
  returning id into v_transfer_id;

  insert into public.transactions (
    user_id, client_id, type, amount, currency, occurred_on, account_id, transfer_id, notes, status
  ) values
    (v_user_id, p_client_id_out, 'transfer', p_amount, p_currency, p_occurred_on, p_from_account_id, v_transfer_id, p_notes, 'confirmed'),
    (v_user_id, p_client_id_in, 'transfer', p_amount, p_currency, p_occurred_on, p_to_account_id, v_transfer_id, p_notes, 'confirmed');

  return v_transfer_id;
end;
$$;

revoke execute on function public.create_transfer(uuid, uuid, numeric, text, date, text, uuid, uuid) from public, anon;
grant execute on function public.create_transfer(uuid, uuid, numeric, text, date, text, uuid, uuid) to authenticated;

-- ============================================================
-- void_transfer — anula una transferencia: marca `transfers` y sus dos
-- `transactions` ligadas como `voided` en la misma operación (no se
-- borra: regla de negocio "anular", no "eliminar").
-- ============================================================

create or replace function public.void_transfer(p_transfer_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.transfers set status = 'voided' where id = p_transfer_id;
  update public.transactions set status = 'voided' where transfer_id = p_transfer_id;
end;
$$;

revoke execute on function public.void_transfer(uuid) from public, anon;
grant execute on function public.void_transfer(uuid) to authenticated;

-- ============================================================
-- create_card_payment — pago de tarjeta de crédito: reduce la deuda y
-- el saldo de la cuenta de origen; no vuelve a contar como gasto.
-- ============================================================

create or replace function public.create_card_payment(
  p_card_id uuid,
  p_from_account_id uuid,
  p_amount numeric,
  p_currency text,
  p_occurred_on date,
  p_notes text,
  p_client_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_payment_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.card_payments (
    user_id, card_id, from_account_id, amount, currency, occurred_on, notes
  ) values (
    v_user_id, p_card_id, p_from_account_id, p_amount, p_currency, p_occurred_on, p_notes
  )
  returning id into v_payment_id;

  insert into public.transactions (
    user_id, client_id, type, amount, currency, occurred_on, account_id, card_payment_id, notes, status
  ) values (
    v_user_id, p_client_id, 'card_payment', p_amount, p_currency, p_occurred_on, p_from_account_id, v_payment_id, p_notes, 'confirmed'
  );

  return v_payment_id;
end;
$$;

revoke execute on function public.create_card_payment(uuid, uuid, numeric, text, date, text, uuid) from public, anon;
grant execute on function public.create_card_payment(uuid, uuid, numeric, text, date, text, uuid) to authenticated;

-- ============================================================
-- void_card_payment — anula un pago de tarjeta (misma lógica que
-- void_transfer).
-- ============================================================

create or replace function public.void_card_payment(p_card_payment_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.card_payments set status = 'voided' where id = p_card_payment_id;
  update public.transactions set status = 'voided' where card_payment_id = p_card_payment_id;
end;
$$;

revoke execute on function public.void_card_payment(uuid) from public, anon;
grant execute on function public.void_card_payment(uuid) to authenticated;
