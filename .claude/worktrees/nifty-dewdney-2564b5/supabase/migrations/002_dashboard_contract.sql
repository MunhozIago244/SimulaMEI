-- ============================================================
-- SimulaMEI — Migration 002: Dashboard contract
-- Alinha a tabela simulations ao contrato atual EntradaSimulacao.
-- ============================================================

drop view if exists public.stats_public;

drop index if exists public.idx_simulations_faturamento;

alter table public.simulations
  drop column if exists faturamento_anual;

alter table public.simulations
  add column if not exists faturamento_acumulado numeric
  generated always as ((entrada->>'faturamentoAcumulado')::numeric) stored;

create index if not exists idx_simulations_faturamento
  on public.simulations(faturamento_acumulado);

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
-- drop index if exists public.idx_simulations_faturamento;
-- alter table public.simulations drop column if exists faturamento_acumulado;
-- alter table public.simulations add column if not exists faturamento_anual numeric;
-- create or replace view public.stats_public as
-- select
--   count(*) as total_simulacoes,
--   count(distinct cnae) as cnaes_distintos,
--   avg((entrada->>'faturamentoAnual')::numeric) as faturamento_medio,
--   max(created_at) as ultima_simulacao,
--   count(*) filter (where created_at > now() - interval '24 hours') as simulacoes_hoje,
--   count(*) filter (where created_at > now() - interval '7 days') as simulacoes_semana
-- from public.simulations;
