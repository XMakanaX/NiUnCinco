-- Fase 4: esquema inicial, RLS y trigger de alta de usuario.
--
-- Entidades preparadas aquí (plan maestro Fase 4): perfiles, cuentas,
-- tarjetas, categorías, movimientos, transferencias, pagos de tarjeta,
-- presupuestos, gastos recurrentes y metas. La lógica de negocio (saldos
-- consistentes, RPCs atómicas para transferencias/pagos) se implementa en
-- las Fases 5-10 — este archivo solo deja el modelo de datos y su
-- seguridad listos.
--
-- Regla de dinero: numeric(14,2), nunca float. Regla de fecha contable:
-- `date`, nunca timestamptz (ver src/shared/lib/date.ts, APP_TIME_ZONE).
-- RLS: toda tabla con datos de usuario usa (select auth.uid()) en vez de
-- auth.uid() (una evaluación por consulta, no por fila).

create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- profiles — preferencias del usuario (moneda principal, huso horario)
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  base_currency text not null default 'CRC' check (base_currency in ('CRC', 'USD')),
  timezone text not null default 'America/Costa_Rica',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No hay policy de insert/delete: el perfil se crea solo vía el trigger
-- handle_new_user y se elimina en cascada con auth.users.

-- ============================================================
-- accounts — efectivo, bancarias y otras cuentas personales
-- ============================================================

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'other')),
  currency text not null check (currency in ('CRC', 'USD')),
  color text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts (user_id);

alter table public.accounts enable row level security;
alter table public.accounts force row level security;

create policy "accounts_all_own" on public.accounts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- cards — débito y crédito
-- ============================================================

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  card_type text not null check (card_type in ('debit', 'credit')),
  name text not null,
  bank text,
  currency text not null check (currency in ('CRC', 'USD')),
  color text,
  credit_limit numeric(14, 2) check (credit_limit is null or credit_limit >= 0),
  statement_day smallint check (statement_day between 1 and 31),
  due_day smallint check (due_day between 1 and 31),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- límite/corte/vencimiento solo aplican a tarjetas de crédito
  constraint cards_credit_fields_check check (
    card_type = 'credit'
    or (credit_limit is null and statement_day is null and due_day is null)
  )
);

create index cards_user_id_idx on public.cards (user_id);
create index cards_account_id_idx on public.cards (account_id);

alter table public.cards enable row level security;
alter table public.cards force row level security;

create policy "cards_all_own" on public.cards
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- categories — con subcategorías (parent_id self-referencing)
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.categories (id) on delete set null,
  name text not null,
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  color text,
  icon text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, parent_id, name)
);

create index categories_user_id_idx on public.categories (user_id);
create index categories_parent_id_idx on public.categories (parent_id);

alter table public.categories enable row level security;
alter table public.categories force row level security;

create policy "categories_all_own" on public.categories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- transfers — entre cuentas propias (no son ingreso ni gasto, regla 17)
-- ============================================================

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_account_id uuid not null references public.accounts (id) on delete restrict,
  to_account_id uuid not null references public.accounts (id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (currency in ('CRC', 'USD')),
  occurred_on date not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint transfers_distinct_accounts check (from_account_id <> to_account_id)
);

create index transfers_user_id_idx on public.transfers (user_id);
create index transfers_from_account_id_idx on public.transfers (from_account_id);
create index transfers_to_account_id_idx on public.transfers (to_account_id);

alter table public.transfers enable row level security;
alter table public.transfers force row level security;

create policy "transfers_all_own" on public.transfers
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- card_payments — pago de tarjeta de crédito (reduce deuda, no es gasto)
-- ============================================================

create table public.card_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete restrict,
  from_account_id uuid not null references public.accounts (id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (currency in ('CRC', 'USD')),
  occurred_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index card_payments_user_id_idx on public.card_payments (user_id);
create index card_payments_card_id_idx on public.card_payments (card_id);
create index card_payments_from_account_id_idx on public.card_payments (from_account_id);

alter table public.card_payments enable row level security;
alter table public.card_payments force row level security;

create policy "card_payments_all_own" on public.card_payments
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- transactions — ingresos, gastos, y el lado contable de transferencias
-- y pagos de tarjeta (transfer_id / card_payment_id enlazan cada par).
-- ============================================================

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null,
  type text not null check (type in ('income', 'expense', 'transfer', 'card_payment')),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (currency in ('CRC', 'USD')),
  fx_rate numeric(14, 6),
  occurred_on date not null,
  account_id uuid references public.accounts (id) on delete restrict,
  card_id uuid references public.cards (id) on delete restrict,
  category_id uuid references public.categories (id) on delete set null,
  merchant text,
  notes text,
  tags text[] not null default '{}',
  status text not null default 'confirmed' check (status in ('pending', 'confirmed', 'voided')),
  transfer_id uuid references public.transfers (id) on delete cascade,
  card_payment_id uuid references public.card_payments (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- idempotencia de la cola offline: la impone la base de datos (CLAUDE.md)
  unique (user_id, client_id),
  -- todo movimiento necesita una cuenta o una tarjeta de origen
  constraint transactions_source_check check (account_id is not null or card_id is not null),
  constraint transactions_transfer_link_check check (
    (type = 'transfer') = (transfer_id is not null)
  ),
  constraint transactions_card_payment_link_check check (
    (type = 'card_payment') = (card_payment_id is not null)
  )
);

create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_card_id_idx on public.transactions (card_id);
create index transactions_category_id_idx on public.transactions (category_id);
create index transactions_transfer_id_idx on public.transactions (transfer_id);
create index transactions_card_payment_id_idx on public.transactions (card_payment_id);
create index transactions_user_occurred_on_idx on public.transactions (user_id, occurred_on desc);

alter table public.transactions enable row level security;
alter table public.transactions force row level security;

create policy "transactions_all_own" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- budgets — límite general o por categoría, por mes
-- ============================================================

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete cascade,
  period_month date not null,
  amount_limit numeric(14, 2) not null check (amount_limit > 0),
  currency text not null check (currency in ('CRC', 'USD')),
  alert_threshold_pct smallint check (alert_threshold_pct between 1 and 100),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- period_month siempre el primer día del mes (regla aplicada en cliente/RPC)
  constraint budgets_period_month_first_day check (date_trunc('month', period_month) = period_month)
);

create index budgets_user_id_idx on public.budgets (user_id);
create index budgets_category_id_idx on public.budgets (category_id);
-- un presupuesto por categoría y mes
create unique index budgets_user_category_month_uniq on public.budgets (user_id, category_id, period_month)
  where category_id is not null;
-- un único presupuesto general (sin categoría) por mes
create unique index budgets_user_general_month_uniq on public.budgets (user_id, period_month)
  where category_id is null;

alter table public.budgets enable row level security;
alter table public.budgets force row level security;

create policy "budgets_all_own" on public.budgets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- recurring_expenses — servicios, alquiler, suscripciones
-- ============================================================

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (currency in ('CRC', 'USD')),
  category_id uuid references public.categories (id) on delete set null,
  account_id uuid references public.accounts (id) on delete set null,
  card_id uuid references public.cards (id) on delete set null,
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_due_on date not null,
  reminder_enabled boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_expenses_source_check check (account_id is not null or card_id is not null)
);

create index recurring_expenses_user_id_idx on public.recurring_expenses (user_id);
create index recurring_expenses_category_id_idx on public.recurring_expenses (category_id);
create index recurring_expenses_account_id_idx on public.recurring_expenses (account_id);
create index recurring_expenses_card_id_idx on public.recurring_expenses (card_id);

alter table public.recurring_expenses enable row level security;
alter table public.recurring_expenses force row level security;

create policy "recurring_expenses_all_own" on public.recurring_expenses
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- goals — metas de ahorro, con aportes/retiros en goal_contributions
-- ============================================================

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  currency text not null check (currency in ('CRC', 'USD')),
  target_date date,
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_id_idx on public.goals (user_id);

alter table public.goals enable row level security;
alter table public.goals force row level security;

create policy "goals_all_own" on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete cascade,
  type text not null check (type in ('contribution', 'withdrawal')),
  amount numeric(14, 2) not null check (amount > 0),
  occurred_on date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index goal_contributions_user_id_idx on public.goal_contributions (user_id);
create index goal_contributions_goal_id_idx on public.goal_contributions (goal_id);

alter table public.goal_contributions enable row level security;
alter table public.goal_contributions force row level security;

create policy "goal_contributions_all_own" on public.goal_contributions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- updated_at automático
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cards
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.recurring_expenses
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();

-- ============================================================
-- alta de usuario: crea el perfil y siembra categorías iniciales
-- (editables luego — plan Fase 5 regla 7)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);

  insert into public.categories (user_id, name, kind) values
    (new.id, 'Alimentación', 'expense'),
    (new.id, 'Transporte', 'expense'),
    (new.id, 'Vivienda', 'expense'),
    (new.id, 'Servicios', 'expense'),
    (new.id, 'Salud', 'expense'),
    (new.id, 'Entretenimiento', 'expense'),
    (new.id, 'Compras', 'expense'),
    (new.id, 'Educación', 'expense'),
    (new.id, 'Otros', 'expense');

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
