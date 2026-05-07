-- ============================================================
-- SimulaMEI — Migration 006: Growth, monitor and monetization
-- LGPD explícita no gate, monitor mensal e fundação de compras.
-- ============================================================

alter table public.leads
  add column if not exists consentimento_lgpd boolean not null default false,
  add column if not exists consentimento_em timestamptz;

comment on column public.leads.consentimento_lgpd is
  'Consentimento explícito para política de privacidade antes do unlock do relatório.';

comment on column public.leads.consentimento_em is
  'Timestamp do consentimento explícito LGPD no gate de e-mail.';

alter table public.user_profiles
  add column if not exists calendario_fiscal_opt_in boolean not null default true,
  add column if not exists alertas_email_ativos boolean not null default true,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_status text;

create table if not exists public.monthly_inputs (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  ano              int not null check (ano >= 2020),
  mes              int not null check (mes between 1 and 12),
  faturamento_mes  numeric not null check (faturamento_mes >= 0),
  folha_mes        numeric not null default 0 check (folha_mes >= 0),
  cnae             text not null,
  tipo_mei         text not null check (tipo_mei in ('geral', 'caminhoneiro')),
  rbt12            numeric,
  projecao_anual   numeric,
  fator_r          numeric,
  anexo_calculado  text,
  tax_rule_version text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, ano, mes)
);

drop trigger if exists on_monthly_inputs_updated on public.monthly_inputs;

create trigger on_monthly_inputs_updated
  before update on public.monthly_inputs
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_monthly_inputs_user_period on public.monthly_inputs(user_id, ano desc, mes desc);
create index if not exists idx_monthly_inputs_anexo on public.monthly_inputs(anexo_calculado);

alter table public.monthly_inputs enable row level security;

drop policy if exists "monthly_inputs: select own" on public.monthly_inputs;
create policy "monthly_inputs: select own"
  on public.monthly_inputs for select
  using (auth.uid() = user_id);

drop policy if exists "monthly_inputs: insert own" on public.monthly_inputs;
create policy "monthly_inputs: insert own"
  on public.monthly_inputs for insert
  with check (auth.uid() = user_id);

drop policy if exists "monthly_inputs: update own" on public.monthly_inputs;
create policy "monthly_inputs: update own"
  on public.monthly_inputs for update
  using (auth.uid() = user_id);

drop policy if exists "monthly_inputs: delete own" on public.monthly_inputs;
create policy "monthly_inputs: delete own"
  on public.monthly_inputs for delete
  using (auth.uid() = user_id);

create table if not exists public.purchases (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id) on delete set null,
  lead_id             uuid references public.leads(id) on delete set null,
  produto             text not null check (produto in ('relatorio', 'monitor_mensal', 'monitor_anual')),
  status              text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  valor_centavos      integer not null check (valor_centavos >= 0),
  moeda               text not null default 'brl',
  stripe_session_id   text unique,
  stripe_payment_id   text unique,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists on_purchases_updated on public.purchases;

create trigger on_purchases_updated
  before update on public.purchases
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_purchases_user_id on public.purchases(user_id);
create index if not exists idx_purchases_status on public.purchases(status);

alter table public.purchases enable row level security;

drop policy if exists "purchases: select own" on public.purchases;
create policy "purchases: select own"
  on public.purchases for select
  using (auth.uid() = user_id);

drop policy if exists "purchases: insert own" on public.purchases;
create policy "purchases: insert own"
  on public.purchases for insert
  with check (auth.uid() = user_id);

comment on table public.monthly_inputs is
  'Série mensal do Monitor SimulaMEI. Persistida já com RBT12 observado, projeção anual, Fator R e anexo calculado para leitura rápida no dashboard.';

comment on table public.purchases is
  'Fundação de monetização para relatório PDF e planos recorrentes.';

-- ROLLBACK:
-- drop policy if exists "purchases: insert own" on public.purchases;
-- drop policy if exists "purchases: select own" on public.purchases;
-- drop trigger if exists on_purchases_updated on public.purchases;
-- drop table if exists public.purchases;
-- drop policy if exists "monthly_inputs: delete own" on public.monthly_inputs;
-- drop policy if exists "monthly_inputs: update own" on public.monthly_inputs;
-- drop policy if exists "monthly_inputs: insert own" on public.monthly_inputs;
-- drop policy if exists "monthly_inputs: select own" on public.monthly_inputs;
-- drop trigger if exists on_monthly_inputs_updated on public.monthly_inputs;
-- drop table if exists public.monthly_inputs;
-- alter table public.user_profiles
--   drop column if exists stripe_subscription_status,
--   drop column if exists stripe_customer_id,
--   drop column if exists alertas_email_ativos,
--   drop column if exists calendario_fiscal_opt_in;
-- alter table public.leads
--   drop column if exists consentimento_em,
--   drop column if exists consentimento_lgpd;
