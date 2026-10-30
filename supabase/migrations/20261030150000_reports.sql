-- Fase 12: agregados de solo lectura para Informes. Mismo criterio que
-- los agregados del dashboard (Fase 8) y `budget_progress` (Fase 9):
-- sumar en la base en vez de traer el historial completo al cliente, y
-- `security invoker` para heredar RLS de `transactions`/`accounts`/
-- `cards` sin policies propias.
--
-- Todas filtran `status = 'confirmed'` — un movimiento anulado nunca
-- cuenta en ningún informe (mismo criterio que `account_balances`/
-- `card_balances`/`dashboard_*`/`budget_progress`), y todas reciben
-- `p_currency` explícito: nunca se suma CRC+USD en un mismo total
-- (regla global 20).

-- ============================================================
-- reports_monthly_series — ingreso/gasto agregados por mes calendario
-- dentro de un rango, para el gráfico de evolución mensual.
-- ============================================================

create or replace function public.reports_monthly_series(
  p_currency text,
  p_from date,
  p_to date
)
returns table (month date, income numeric, expense numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    date_trunc('month', occurred_on)::date as month,
    coalesce(sum(amount) filter (where type = 'income'), 0) as income,
    coalesce(sum(amount) filter (where type = 'expense'), 0) as expense
  from public.transactions
  where user_id = (select auth.uid())
    and status = 'confirmed'
    and currency = p_currency
    and occurred_on between p_from and p_to
  group by date_trunc('month', occurred_on)
  order by month;
$$;

revoke execute on function public.reports_monthly_series(text, date, date) from public, anon;
grant execute on function public.reports_monthly_series(text, date, date) to authenticated;

-- ============================================================
-- reports_breakdown_by_account / _by_card / _by_merchant — mismo patrón
-- que `dashboard_category_breakdown` (Fase 8), pero agrupando por cuenta,
-- tarjeta o comercio en vez de categoría. `p_kind` = 'income' | 'expense'.
-- ============================================================

create or replace function public.reports_breakdown_by_account(
  p_currency text,
  p_from date,
  p_to date,
  p_kind text
)
returns table (
  account_id uuid,
  account_name text,
  color text,
  total numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    t.account_id,
    coalesce(a.name, 'Sin cuenta') as account_name,
    a.color,
    sum(t.amount) as total
  from public.transactions t
  left join public.accounts a on a.id = t.account_id
  where t.user_id = (select auth.uid())
    and t.status = 'confirmed'
    and t.currency = p_currency
    and t.type = p_kind
    and t.occurred_on between p_from and p_to
  group by t.account_id, a.name, a.color
  order by total desc;
$$;

revoke execute on function public.reports_breakdown_by_account(text, date, date, text) from public, anon;
grant execute on function public.reports_breakdown_by_account(text, date, date, text) to authenticated;

create or replace function public.reports_breakdown_by_card(
  p_currency text,
  p_from date,
  p_to date,
  p_kind text
)
returns table (
  card_id uuid,
  card_name text,
  color text,
  total numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    t.card_id,
    coalesce(cd.name, 'Sin tarjeta') as card_name,
    cd.color,
    sum(t.amount) as total
  from public.transactions t
  left join public.cards cd on cd.id = t.card_id
  where t.user_id = (select auth.uid())
    and t.status = 'confirmed'
    and t.currency = p_currency
    and t.type = p_kind
    and t.occurred_on between p_from and p_to
  group by t.card_id, cd.name, cd.color
  order by total desc;
$$;

revoke execute on function public.reports_breakdown_by_card(text, date, date, text) from public, anon;
grant execute on function public.reports_breakdown_by_card(text, date, date, text) to authenticated;

create or replace function public.reports_breakdown_by_merchant(
  p_currency text,
  p_from date,
  p_to date,
  p_kind text
)
returns table (
  merchant text,
  total numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(t.merchant, 'Sin comercio') as merchant,
    sum(t.amount) as total
  from public.transactions t
  where t.user_id = (select auth.uid())
    and t.status = 'confirmed'
    and t.currency = p_currency
    and t.type = p_kind
    and t.occurred_on between p_from and p_to
  group by coalesce(t.merchant, 'Sin comercio')
  order by total desc
  limit 15;
$$;

revoke execute on function public.reports_breakdown_by_merchant(text, date, date, text) from public, anon;
grant execute on function public.reports_breakdown_by_merchant(text, date, date, text) to authenticated;
