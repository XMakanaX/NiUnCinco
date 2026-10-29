-- Fase 8: agregados del dashboard. Ingresos/gastos del mes, comparación
-- con el periodo anterior y gastos por categoría necesitan sumar sobre
-- todos los movimientos de un rango de fechas — traerlos uno por uno al
-- cliente para sumarlos ahí violaría "evitar cargar todos los movimientos
-- cuando solo se necesitan agregados" (plan Fase 8). Dos funciones de
-- solo lectura que agregan en la base:
--
--   dashboard_period_totals      — ingreso/gasto total de un rango, en
--                                   una sola moneda (nunca se suma
--                                   CRC+USD sin tasa — regla global 20).
--   dashboard_category_breakdown — gasto o ingreso por categoría del
--                                   mismo rango, para el desglose del
--                                   dashboard.
--
-- `security invoker`: corren con los permisos de quien llama, heredan el
-- RLS de `transactions`/`categories` sin policies propias (mismo patrón
-- que las RPCs de Fase 6).

create or replace function public.dashboard_period_totals(
  p_currency text,
  p_from date,
  p_to date
)
returns table (income numeric, expense numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(amount) filter (where type = 'income'), 0) as income,
    coalesce(sum(amount) filter (where type = 'expense'), 0) as expense
  from public.transactions
  where user_id = (select auth.uid())
    and status = 'confirmed'
    and currency = p_currency
    and occurred_on between p_from and p_to;
$$;

revoke execute on function public.dashboard_period_totals(text, date, date) from public, anon;
grant execute on function public.dashboard_period_totals(text, date, date) to authenticated;

create or replace function public.dashboard_category_breakdown(
  p_currency text,
  p_from date,
  p_to date,
  p_kind text
)
returns table (
  category_id uuid,
  category_name text,
  color text,
  total numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    t.category_id,
    coalesce(c.name, 'Sin categoría') as category_name,
    c.color,
    sum(t.amount) as total
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  where t.user_id = (select auth.uid())
    and t.status = 'confirmed'
    and t.currency = p_currency
    and t.type = p_kind
    and t.occurred_on between p_from and p_to
  group by t.category_id, c.name, c.color
  order by total desc;
$$;

revoke execute on function public.dashboard_category_breakdown(text, date, date, text) from public, anon;
grant execute on function public.dashboard_category_breakdown(text, date, date, text) to authenticated;
