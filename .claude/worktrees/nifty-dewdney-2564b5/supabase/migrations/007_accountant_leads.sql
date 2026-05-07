-- ============================================================
-- SimulaMEI — Migration 007: Accountant lead pipeline
-- Captura qualificada para o plano contador antes do multi-tenant.
-- ============================================================

create table if not exists public.accountant_leads (
  id                 uuid primary key default uuid_generate_v4(),
  email              text not null unique,
  nome_escritorio    text not null,
  telefone           text,
  carteira_range     text not null check (carteira_range in ('1-20', '21-50', '51-150', '150+')),
  ferramenta_atual   text,
  origem             text,
  user_agent         text,
  ip_hash            text,
  consentimento_lgpd boolean not null default false,
  consentimento_em   timestamptz,
  status             text not null default 'novo' check (status in ('novo', 'contactado', 'qualificado', 'descartado')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists on_accountant_leads_updated on public.accountant_leads;

create trigger on_accountant_leads_updated
  before update on public.accountant_leads
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_accountant_leads_carteira_range
  on public.accountant_leads(carteira_range);

create index if not exists idx_accountant_leads_status_created_at
  on public.accountant_leads(status, created_at desc);

create index if not exists idx_accountant_leads_ip_hash_created_at
  on public.accountant_leads(ip_hash, created_at desc);

alter table public.accountant_leads enable row level security;

drop policy if exists "accountant_leads: insert anon" on public.accountant_leads;
create policy "accountant_leads: insert anon"
  on public.accountant_leads for insert
  with check (consentimento_lgpd = true);

comment on table public.accountant_leads is
  'Pipeline comercial do plano contador. Separado de leads de simulação MEI para permitir qualificação por tamanho de carteira e follow-up Enterprise.';

comment on column public.accountant_leads.carteira_range is
  'Faixa declarada de clientes MEI gerenciados pelo escritório. Leads 150+ exigem follow-up imediato.';

-- ROLLBACK:
-- drop policy if exists "accountant_leads: insert anon" on public.accountant_leads;
-- drop trigger if exists on_accountant_leads_updated on public.accountant_leads;
-- drop table if exists public.accountant_leads;
