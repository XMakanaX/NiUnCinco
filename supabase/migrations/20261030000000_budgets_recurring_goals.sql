-- Fase 9: presupuestos con progreso calculado, pago de gastos
-- recurrentes y aportes/retiros de metas.
--
-- Reembolsos y movimientos anulados (plan Fase 9): no existe un tipo
-- "refund" en `transactions` (solo income/expense/transfer/card_payment).
-- Un reembolso real se modela anulando el gasto original (status
-- 'voided', mecanismo ya existente desde la Fase 6); por eso
-- `budget_progress` solo suma transacciones `status = 'confirmed'` —
-- igual que `account_balances`/`card_balances`/`dashboard_*` — y un
-- gasto anulado nunca cuenta contra el presupuesto.

-- ============================================================
-- budget_progress — monto gastado por presupuesto (mes + moneda +
-- categoría, incluyendo subcategorías de un nivel). `security_invoker`:
-- hereda RLS de budgets/transactions/categories, sin policies propias
-- (mismo patrón que las vistas de saldo de la Fase 5).
-- ============================================================

create or replace view public.budget_progress
with (security_invoker = true) as
select
  b.id,
  b.user_id,
  b.category_id,
  b.period_month,
  b.amount_limit,
  b.currency,
  b.alert_threshold_pct,
  b.archived_at,
  coalesce(spent.total, 0) as amount_spent
from public.budgets b
left join lateral (
  select sum(t.amount) as total
  from public.transactions t
  where t.user_id = b.user_id
    and t.status = 'confirmed'
    and t.type = 'expense'
    and t.currency = b.currency
    and date_trunc('month', t.occurred_on) = b.period_month
    and (
      b.category_id is null
      or t.category_id = b.category_id
      or t.category_id in (
        select c.id from public.categories c where c.parent_id = b.category_id
      )
    )
) spent on true;

-- ============================================================
-- goal_contributions.client_id — idempotencia de la cola offline
-- (regla global 9/12), mismo patrón que `transactions.client_id`.
-- ============================================================

alter table public.goal_contributions
  add column client_id uuid not null default gen_random_uuid();

alter table public.goal_contributions
  alter column client_id drop default;

alter table public.goal_contributions
  add constraint goal_contributions_user_client_uniq unique (user_id, client_id);

-- ============================================================
-- create_goal_contribution — aporte o retiro de una meta. Actualiza
-- `goals.current_amount` en la misma transacción que inserta la fila de
-- `goal_contributions` (regla global 14: operación que toca varios
-- registros a la vez es atómica). Un retiro no puede dejar el saldo de
-- la meta en negativo. Reintento con el mismo `client_id` viola el
-- `unique(user_id, client_id)` de arriba y aborta toda la función,
-- revirtiendo también el `update` de `current_amount` — no hace falta
-- capturar la excepción aquí, el cliente la trata como éxito silencioso
-- igual que en `create_transfer` (Fase 6).
-- ============================================================

create or replace function public.create_goal_contribution(
  p_goal_id uuid,
  p_type text,
  p_amount numeric,
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
  v_current_amount numeric;
  v_contribution_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select current_amount into v_current_amount
  from public.goals
  where id = p_goal_id and user_id = v_user_id;

  if v_current_amount is null then
    raise exception 'goal not found';
  end if;

  if p_type = 'withdrawal' and p_amount > v_current_amount then
    raise exception 'insufficient goal balance';
  end if;

  insert into public.goal_contributions (
    user_id, goal_id, type, amount, occurred_on, notes, client_id
  ) values (
    v_user_id, p_goal_id, p_type, p_amount, p_occurred_on, p_notes, p_client_id
  )
  returning id into v_contribution_id;

  update public.goals
  set current_amount = current_amount
    + case when p_type = 'contribution' then p_amount else -p_amount end
  where id = p_goal_id;

  return v_contribution_id;
end;
$$;

revoke execute on function public.create_goal_contribution(uuid, text, numeric, date, text, uuid) from public, anon;
grant execute on function public.create_goal_contribution(uuid, text, numeric, date, text, uuid) to authenticated;

-- ============================================================
-- mark_recurring_expense_paid — registra el gasto de un periodo y
-- avanza `next_due_on` según la periodicidad, en la misma transacción
-- (regla global 14). Prevención de duplicados: reintento con el mismo
-- `client_id` viola el `unique(user_id, client_id)` de `transactions`
-- (Fase 4) y aborta toda la función, revirtiendo también el avance de
-- `next_due_on` — mismo patrón de idempotencia que `create_transfer`.
-- ============================================================

create or replace function public.mark_recurring_expense_paid(
  p_recurring_expense_id uuid,
  p_occurred_on date,
  p_client_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_expense public.recurring_expenses;
  v_next_due_on date;
  v_transaction_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select * into v_expense
  from public.recurring_expenses
  where id = p_recurring_expense_id and user_id = v_user_id;

  if v_expense.id is null then
    raise exception 'recurring expense not found';
  end if;

  insert into public.transactions (
    user_id, client_id, type, amount, currency, occurred_on,
    account_id, card_id, category_id, merchant, status
  ) values (
    v_user_id, p_client_id, 'expense', v_expense.amount, v_expense.currency, p_occurred_on,
    v_expense.account_id, v_expense.card_id, v_expense.category_id, v_expense.name, 'confirmed'
  )
  returning id into v_transaction_id;

  v_next_due_on := case v_expense.frequency
    when 'weekly' then v_expense.next_due_on + interval '7 days'
    when 'monthly' then v_expense.next_due_on + interval '1 month'
    when 'yearly' then v_expense.next_due_on + interval '1 year'
  end;

  update public.recurring_expenses
  set next_due_on = v_next_due_on
  where id = p_recurring_expense_id;

  return v_transaction_id;
end;
$$;

revoke execute on function public.mark_recurring_expense_paid(uuid, date, uuid) from public, anon;
grant execute on function public.mark_recurring_expense_paid(uuid, date, uuid) to authenticated;
