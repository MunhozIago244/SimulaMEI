-- ============================================================
-- SimulaMEI — Migration 008: Accountant multi-tenant foundation
-- Escritórios, membros, clientes, alertas, API keys e assinaturas B2B.
-- ============================================================

create table if not exists public.accountant_offices (
  id                         uuid primary key default uuid_generate_v4(),
  owner_user_id              uuid not null references auth.users(id) on delete cascade,
  name                       text not null,
  cnpj                       text,
  telefone                   text,
  plan                       text not null default 'starter_trial'
    check (plan in ('starter_trial', 'starter', 'pro', 'enterprise')),
  max_clients                integer not null default 30 check (max_clients > 0),
  trial_ends_at              timestamptz,
  white_label                jsonb not null default '{}'::jsonb,
  stripe_customer_id         text,
  stripe_subscription_id     text unique,
  stripe_subscription_status text,
  current_period_end         timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (owner_user_id)
);

drop trigger if exists on_accountant_offices_updated on public.accountant_offices;
create trigger on_accountant_offices_updated
  before update on public.accountant_offices
  for each row execute procedure public.handle_updated_at();

create table if not exists public.office_members (
  id          uuid primary key default uuid_generate_v4(),
  office_id   uuid not null references public.accountant_offices(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member')),
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (office_id, user_id)
);

drop trigger if exists on_office_members_updated on public.office_members;
create trigger on_office_members_updated
  before update on public.office_members
  for each row execute procedure public.handle_updated_at();

create table if not exists public.office_clients (
  id                         uuid primary key default uuid_generate_v4(),
  office_id                  uuid not null references public.accountant_offices(id) on delete cascade,
  linked_user_id             uuid references auth.users(id) on delete set null,
  name                       text not null,
  email                      text,
  cnae                       text,
  tipo_mei                   text not null default 'geral' check (tipo_mei in ('geral', 'caminhoneiro')),
  uf                         text,
  municipio                  text,
  observacoes                text,
  ativo                      boolean not null default true,
  inactive_reason            text check (inactive_reason in ('manual', 'plan_limit')),
  disabled_by_plan_limit_at  timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  check (
    (ativo = true and inactive_reason is null and disabled_by_plan_limit_at is null)
    or
    (ativo = false)
  )
);

drop trigger if exists on_office_clients_updated on public.office_clients;
create trigger on_office_clients_updated
  before update on public.office_clients
  for each row execute procedure public.handle_updated_at();

create table if not exists public.office_simulations (
  id          uuid primary key default uuid_generate_v4(),
  office_id   uuid not null references public.accountant_offices(id) on delete cascade,
  client_id   uuid not null references public.office_clients(id) on delete cascade,
  performed_by uuid references auth.users(id) on delete set null,
  entrada     jsonb not null,
  resultado   jsonb not null,
  tax_rule_version text,
  created_at  timestamptz not null default now()
);

create table if not exists public.office_alerts (
  id              uuid primary key default uuid_generate_v4(),
  office_id       uuid not null references public.accountant_offices(id) on delete cascade,
  client_id       uuid not null references public.office_clients(id) on delete cascade,
  tipo            text not null check (tipo in ('teto_70', 'teto_80', 'teto_95', 'teto_100', 'teto_excesso_grave', 'anexo_transicao', 'fator_r_risco')),
  mes_referencia  text not null,
  payload         jsonb not null,
  notificado_em   timestamptz,
  resolved_at     timestamptz,
  resolved_by     uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (client_id, tipo, mes_referencia)
);

drop trigger if exists on_office_alerts_updated on public.office_alerts;
create trigger on_office_alerts_updated
  before update on public.office_alerts
  for each row execute procedure public.handle_updated_at();

create table if not exists public.office_api_keys (
  id           uuid primary key default uuid_generate_v4(),
  office_id    uuid not null references public.accountant_offices(id) on delete cascade,
  name         text not null,
  key_hash     text not null unique,
  key_prefix   text not null,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists public.office_api_usage (
  id          uuid primary key default uuid_generate_v4(),
  office_id   uuid not null references public.accountant_offices(id) on delete cascade,
  api_key_id  uuid references public.office_api_keys(id) on delete set null,
  endpoint    text not null,
  method      text not null,
  status_code integer not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.office_subscriptions (
  id                         uuid primary key default uuid_generate_v4(),
  office_id                  uuid not null references public.accountant_offices(id) on delete cascade,
  status                     text not null default 'pending'
    check (status in ('pending', 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'unpaid')),
  plan                       text not null check (plan in ('starter', 'pro', 'enterprise')),
  stripe_customer_id         text,
  stripe_subscription_id     text unique,
  stripe_checkout_session_id text unique,
  current_period_end         timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  unique (office_id)
);

drop trigger if exists on_office_subscriptions_updated on public.office_subscriptions;
create trigger on_office_subscriptions_updated
  before update on public.office_subscriptions
  for each row execute procedure public.handle_updated_at();

create table if not exists public.processed_stripe_events (
  stripe_event_id text primary key,
  event_type      text,
  processed_at    timestamptz not null default now()
);

create index if not exists idx_accountant_offices_owner on public.accountant_offices(owner_user_id);
create index if not exists idx_office_members_user on public.office_members(user_id);
create index if not exists idx_office_members_office_role on public.office_members(office_id, role);
create index if not exists idx_office_clients_office_active on public.office_clients(office_id, ativo);
create index if not exists idx_office_clients_email on public.office_clients(email);
create index if not exists idx_office_clients_cnae on public.office_clients(cnae);
create index if not exists idx_office_simulations_client_created on public.office_simulations(client_id, created_at desc);
create index if not exists idx_office_alerts_office_created on public.office_alerts(office_id, created_at desc);
create index if not exists idx_office_alerts_unresolved on public.office_alerts(office_id, created_at desc) where resolved_at is null;
create index if not exists idx_office_api_keys_office on public.office_api_keys(office_id);
create index if not exists idx_office_api_keys_active on public.office_api_keys(office_id) where revoked_at is null;
create index if not exists idx_office_api_usage_office_created on public.office_api_usage(office_id, created_at desc);

create or replace function public.is_office_member(p_office_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.office_members om
     where om.office_id = p_office_id
       and om.user_id = auth.uid()
       and om.accepted_at is not null
  );
$$;

create or replace function public.is_office_admin(p_office_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.office_members om
     where om.office_id = p_office_id
       and om.user_id = auth.uid()
       and om.accepted_at is not null
       and om.role in ('owner', 'admin')
  );
$$;

alter table public.accountant_offices enable row level security;
alter table public.office_members enable row level security;
alter table public.office_clients enable row level security;
alter table public.office_simulations enable row level security;
alter table public.office_alerts enable row level security;
alter table public.office_api_keys enable row level security;
alter table public.office_api_usage enable row level security;
alter table public.office_subscriptions enable row level security;
alter table public.processed_stripe_events enable row level security;

drop policy if exists "accountant_offices: select member" on public.accountant_offices;
create policy "accountant_offices: select member"
  on public.accountant_offices for select
  using (public.is_office_member(id));

drop policy if exists "accountant_offices: insert owner" on public.accountant_offices;
create policy "accountant_offices: insert owner"
  on public.accountant_offices for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "accountant_offices: update admin" on public.accountant_offices;
create policy "accountant_offices: update admin"
  on public.accountant_offices for update
  using (public.is_office_admin(id));

drop policy if exists "office_members: select member" on public.office_members;
create policy "office_members: select member"
  on public.office_members for select
  using (public.is_office_member(office_id));

drop policy if exists "office_members: insert admin" on public.office_members;
create policy "office_members: insert admin"
  on public.office_members for insert
  with check (public.is_office_admin(office_id));

drop policy if exists "office_members: update admin" on public.office_members;
create policy "office_members: update admin"
  on public.office_members for update
  using (public.is_office_admin(office_id));

drop policy if exists "office_clients: all member" on public.office_clients;
create policy "office_clients: all member"
  on public.office_clients for all
  using (public.is_office_member(office_id))
  with check (public.is_office_member(office_id));

drop policy if exists "office_simulations: all member" on public.office_simulations;
create policy "office_simulations: all member"
  on public.office_simulations for all
  using (public.is_office_member(office_id))
  with check (public.is_office_member(office_id));

drop policy if exists "office_alerts: all member" on public.office_alerts;
create policy "office_alerts: all member"
  on public.office_alerts for all
  using (public.is_office_member(office_id))
  with check (public.is_office_member(office_id));

drop policy if exists "office_api_keys: all admin" on public.office_api_keys;
create policy "office_api_keys: all admin"
  on public.office_api_keys for all
  using (public.is_office_admin(office_id))
  with check (public.is_office_admin(office_id));

drop policy if exists "office_api_usage: select member" on public.office_api_usage;
create policy "office_api_usage: select member"
  on public.office_api_usage for select
  using (public.is_office_member(office_id));

drop policy if exists "office_subscriptions: select admin" on public.office_subscriptions;
create policy "office_subscriptions: select admin"
  on public.office_subscriptions for select
  using (public.is_office_admin(office_id));

comment on table public.accountant_offices is
  'Tenant B2B do SimulaMEI para escritórios contábeis. MVP limita owner a um escritório por unique(owner_user_id).';

comment on column public.office_clients.inactive_reason is
  'Distingue inativação manual de pausa por limite de plano. Webhooks de downgrade só podem alterar plan_limit.';

comment on table public.processed_stripe_events is
  'Idempotência de webhook Stripe. Inserir stripe_event_id antes de qualquer mutação de assinatura.';

-- ROLLBACK:
-- drop policy if exists "office_subscriptions: select admin" on public.office_subscriptions;
-- drop policy if exists "office_api_usage: select member" on public.office_api_usage;
-- drop policy if exists "office_api_keys: all admin" on public.office_api_keys;
-- drop policy if exists "office_alerts: all member" on public.office_alerts;
-- drop policy if exists "office_simulations: all member" on public.office_simulations;
-- drop policy if exists "office_clients: all member" on public.office_clients;
-- drop policy if exists "office_members: update admin" on public.office_members;
-- drop policy if exists "office_members: insert admin" on public.office_members;
-- drop policy if exists "office_members: select member" on public.office_members;
-- drop policy if exists "accountant_offices: update admin" on public.accountant_offices;
-- drop policy if exists "accountant_offices: insert owner" on public.accountant_offices;
-- drop policy if exists "accountant_offices: select member" on public.accountant_offices;
-- drop function if exists public.is_office_admin(uuid);
-- drop function if exists public.is_office_member(uuid);
-- drop table if exists public.processed_stripe_events;
-- drop table if exists public.office_subscriptions;
-- drop table if exists public.office_api_usage;
-- drop table if exists public.office_api_keys;
-- drop table if exists public.office_alerts;
-- drop table if exists public.office_simulations;
-- drop table if exists public.office_clients;
-- drop table if exists public.office_members;
-- drop table if exists public.accountant_offices;
