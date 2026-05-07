-- ============================================================
-- SimulaMEI — Migration 003: Pré-cadastro obrigatório
-- Campos usados pelo onboarding e pelo dashboard fiscal.
-- ============================================================

alter table public.user_profiles
  add column if not exists nome_negocio text,
  add column if not exists telefone text,
  add column if not exists municipio text,
  add column if not exists uf text,
  add column if not exists faturamento_mensal_estimado numeric,
  add column if not exists faturamento_acumulado_atual numeric,
  add column if not exists folha_mensal numeric,
  add column if not exists mes_atual int check (mes_atual between 1 and 12),
  add column if not exists objetivo_principal text,
  add column if not exists onboarding_completed_at timestamptz;

drop policy if exists "user_profiles: insert own" on public.user_profiles;
create policy "user_profiles: insert own"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- ROLLBACK:
-- alter table public.user_profiles
--   drop column if exists onboarding_completed_at,
--   drop column if exists objetivo_principal,
--   drop column if exists mes_atual,
--   drop column if exists folha_mensal,
--   drop column if exists faturamento_acumulado_atual,
--   drop column if exists faturamento_mensal_estimado,
--   drop column if exists uf,
--   drop column if exists municipio,
--   drop column if exists telefone,
--   drop column if exists nome_negocio;
-- drop policy if exists "user_profiles: insert own" on public.user_profiles;
-- create policy "user_profiles: insert own"
--   on public.user_profiles for insert
--   with check (auth.uid() = id);
