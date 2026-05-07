-- ============================================================
-- SimulaMEI — Migration 001: Schema inicial
-- TAX_RULE_VERSION: BR-MEI-SN-2026-04-28
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- Tabela: user_profiles
-- Extensão do auth.users do Supabase Auth
-- ============================================================
create table if not exists public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  nome          text,
  nome_negocio  text,
  telefone      text,
  cnae_principal text,
  tipo_mei      text check (tipo_mei in ('geral', 'caminhoneiro')) default 'geral',
  municipio     text,
  uf            text,
  faturamento_mensal_estimado numeric,
  faturamento_acumulado_atual numeric,
  folha_mensal  numeric,
  mes_atual     int check (mes_atual between 1 and 12),
  objetivo_principal text,
  onboarding_completed_at timestamptz,
  plano         text check (plano in ('free', 'pro')) default 'free',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Trigger: atualiza updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_user_profiles_updated on public.user_profiles;

create trigger on_user_profiles_updated
  before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();

-- Trigger: cria perfil automaticamente ao criar usuário no Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- Tabela: leads
-- Captura emails do EmailGate e da lista de contadores
-- ============================================================
create table if not exists public.leads (
  id              uuid primary key default uuid_generate_v4(),
  email           text not null,
  tipo            text not null check (tipo in ('simulacao', 'contador_waitlist')) default 'simulacao',
  -- Dados da simulação no momento da captura
  faturamento_anual    numeric,
  cnae                 text,
  mes_atual            int check (mes_atual between 1 and 12),
  anexo_atual          text,
  alerta_cenario       text,
  tax_rule_version     text,
  -- Metadados
  origem          text,                    -- URL do referer
  user_agent      text,
  ip_hash         text,                    -- Hash do IP para analytics sem PII
  convertido      boolean default false,   -- Virou usuário cadastrado?
  user_id         uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Email único por tipo (mesmo email pode ser lead de simulação E contador)
  unique (email, tipo)
);

drop trigger if exists on_leads_updated on public.leads;

create trigger on_leads_updated
  before update on public.leads
  for each row execute procedure public.handle_updated_at();

-- Índices
create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_tipo on public.leads(tipo);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_convertido on public.leads(convertido) where convertido = false;


-- ============================================================
-- Tabela: simulations
-- Armazena resultado completo de cada simulação
-- ============================================================
create table if not exists public.simulations (
  id              uuid primary key default uuid_generate_v4(),
  -- Vínculo opcional com usuário autenticado
  user_id         uuid references auth.users(id) on delete set null,
  lead_id         uuid references public.leads(id) on delete set null,
  -- Entrada e resultado completos
  entrada         jsonb not null,          -- EntradaSimulacao
  resultado       jsonb not null,          -- ResultadoSimulacao completo
  -- Campos indexáveis extraídos do JSONB para queries rápidas
  faturamento_acumulado numeric generated always as ((entrada->>'faturamentoAcumulado')::numeric) stored,
  cnae                 text generated always as (entrada->>'cnae') stored,
  tipo_mei             text generated always as (entrada->>'tipoMei') stored,
  anexo_atual          text generated always as (resultado->>'anexoAtual') stored,
  tax_rule_version     text generated always as (resultado->>'taxRuleVersion') stored,
  -- Metadados
  ip_hash         text,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- Índices
create index if not exists idx_simulations_user_id on public.simulations(user_id);
create index if not exists idx_simulations_cnae on public.simulations(cnae);
create index if not exists idx_simulations_faturamento on public.simulations(faturamento_acumulado);
create index if not exists idx_simulations_created_at on public.simulations(created_at desc);
create index if not exists idx_simulations_tax_rule on public.simulations(tax_rule_version);


-- ============================================================
-- Tabela: api_keys
-- Para a API pública futura
-- ============================================================
create table if not exists public.api_keys (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,               -- "Minha integração"
  key_hash    text not null unique,        -- HMAC-SHA256 da key com secret do servidor (nunca armazenar em plain text)
  key_prefix  text not null,               -- Primeiros 8 chars para identificação: "smei_a1b2"
  tier        text not null check (tier in ('free', 'pro')) default 'free',
  requests_today   int default 0,
  requests_month   int default 0,
  last_used_at     timestamptz,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists idx_api_keys_user_id on public.api_keys(user_id);
create index if not exists idx_api_keys_key_hash on public.api_keys(key_hash);
create index if not exists idx_api_keys_active on public.api_keys(user_id) where revoked_at is null;


-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- user_profiles: usuário só vê/edita o próprio perfil
alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles: select own" on public.user_profiles;
create policy "user_profiles: select own"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "user_profiles: update own" on public.user_profiles;
create policy "user_profiles: update own"
  on public.user_profiles for update
  using (auth.uid() = id);

drop policy if exists "user_profiles: insert own" on public.user_profiles;
create policy "user_profiles: insert own"
  on public.user_profiles for insert
  with check (auth.uid() = id);


-- leads: insert público (visitantes podem virar leads), select/update apenas autenticados
alter table public.leads enable row level security;

drop policy if exists "leads: insert anon" on public.leads;
create policy "leads: insert anon"
  on public.leads for insert
  with check (true);

drop policy if exists "leads: select own" on public.leads;
create policy "leads: select own"
  on public.leads for select
  using (auth.uid() = user_id);

-- simulations: insert público (simulações podem ser anônimas), select apenas do próprio user
alter table public.simulations enable row level security;

drop policy if exists "simulations: insert anon" on public.simulations;
create policy "simulations: insert anon"
  on public.simulations for insert
  with check (true);

drop policy if exists "simulations: select own" on public.simulations;
create policy "simulations: select own"
  on public.simulations for select
  using (auth.uid() = user_id);


-- api_keys: apenas o próprio usuário
alter table public.api_keys enable row level security;

drop policy if exists "api_keys: all own" on public.api_keys;
create policy "api_keys: all own"
  on public.api_keys for all
  using (auth.uid() = user_id);


-- ============================================================
-- Views utilitárias
-- ============================================================

-- Estatísticas públicas (sem PII) para dashboard
create or replace view public.stats_public as
select
  count(*)                                      as total_simulacoes,
  count(distinct cnae)                          as cnaes_distintos,
  avg(faturamento_acumulado)                    as faturamento_medio,
  max(created_at)                               as ultima_simulacao,
  count(*) filter (where created_at > now() - interval '24 hours') as simulacoes_hoje,
  count(*) filter (where created_at > now() - interval '7 days')   as simulacoes_semana
from public.simulations;

-- ROLLBACK:
-- drop view if exists public.stats_public;
-- drop policy if exists "api_keys: all own" on public.api_keys;
-- drop policy if exists "simulations: select own" on public.simulations;
-- drop policy if exists "simulations: insert anon" on public.simulations;
-- drop policy if exists "leads: select own" on public.leads;
-- drop policy if exists "leads: insert anon" on public.leads;
-- drop policy if exists "user_profiles: insert own" on public.user_profiles;
-- drop policy if exists "user_profiles: update own" on public.user_profiles;
-- drop policy if exists "user_profiles: select own" on public.user_profiles;
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop trigger if exists on_user_profiles_updated on public.user_profiles;
-- drop trigger if exists on_leads_updated on public.leads;
-- drop function if exists public.handle_new_user();
-- drop function if exists public.handle_updated_at();
-- drop table if exists public.api_keys;
-- drop table if exists public.simulations;
-- drop table if exists public.leads;
-- drop table if exists public.user_profiles;
-- drop extension if exists "uuid-ossp";
