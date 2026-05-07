-- ============================================================
-- SimulaMEI — Migration 004: Security hardening
-- Rate limiting server-side, ip_hash indexes and stronger hash semantics.
-- ============================================================

create table if not exists public.rate_limit_buckets (
  namespace text not null,
  subject_hash text not null,
  window_start timestamptz not null,
  hits integer not null default 0 check (hits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (namespace, subject_hash, window_start)
);

drop trigger if exists on_rate_limit_buckets_updated on public.rate_limit_buckets;

create trigger on_rate_limit_buckets_updated
  before update on public.rate_limit_buckets
  for each row execute procedure public.handle_updated_at();

create index if not exists idx_rate_limit_buckets_updated_at
  on public.rate_limit_buckets(updated_at desc);

alter table public.rate_limit_buckets enable row level security;

create or replace function public.consume_rate_limit(
  p_namespace text,
  p_subject_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz,
  hit_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_hit_count integer;
begin
  if p_namespace is null or btrim(p_namespace) = '' then
    raise exception 'namespace_required';
  end if;

  if p_subject_hash is null or btrim(p_subject_hash) = '' then
    raise exception 'subject_hash_required';
  end if;

  if p_limit <= 0 then
    raise exception 'limit_must_be_positive';
  end if;

  if p_window_seconds <= 0 then
    raise exception 'window_must_be_positive';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_buckets (namespace, subject_hash, window_start, hits)
  values (p_namespace, p_subject_hash, v_window_start, 1)
  on conflict (namespace, subject_hash, window_start)
  do update set
    hits = public.rate_limit_buckets.hits + 1,
    updated_at = now()
  returning hits into v_hit_count;

  return query
  select
    v_hit_count <= p_limit,
    greatest(p_limit - v_hit_count, 0),
    v_window_start + make_interval(secs => p_window_seconds),
    v_hit_count;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

comment on column public.api_keys.key_hash is
  'HMAC-SHA256 da chave com APP_HASH_SECRET; nunca armazenar plaintext nem SHA-256 puro.';

create index if not exists idx_leads_ip_hash_created_at
  on public.leads(ip_hash, created_at desc);

create index if not exists idx_simulations_ip_hash_created_at
  on public.simulations(ip_hash, created_at desc);

alter table public.user_profiles
  drop constraint if exists user_profiles_nome_length,
  drop constraint if exists user_profiles_nome_negocio_length,
  drop constraint if exists user_profiles_telefone_length,
  drop constraint if exists user_profiles_cnae_principal_length,
  drop constraint if exists user_profiles_municipio_length,
  drop constraint if exists user_profiles_uf_length,
  drop constraint if exists user_profiles_objetivo_principal_length;

alter table public.user_profiles
  add constraint user_profiles_nome_length
    check (nome is null or char_length(nome) <= 120),
  add constraint user_profiles_nome_negocio_length
    check (nome_negocio is null or char_length(nome_negocio) <= 160),
  add constraint user_profiles_telefone_length
    check (telefone is null or char_length(telefone) <= 32),
  add constraint user_profiles_cnae_principal_length
    check (cnae_principal is null or char_length(cnae_principal) <= 16),
  add constraint user_profiles_municipio_length
    check (municipio is null or char_length(municipio) <= 120),
  add constraint user_profiles_uf_length
    check (uf is null or char_length(uf) = 2),
  add constraint user_profiles_objetivo_principal_length
    check (objetivo_principal is null or char_length(objetivo_principal) <= 120);

-- ROLLBACK:
-- drop index if exists idx_simulations_ip_hash_created_at;
-- drop index if exists idx_leads_ip_hash_created_at;
-- comment on column public.api_keys.key_hash is null;
-- drop function if exists public.consume_rate_limit(text, text, integer, integer);
-- drop trigger if exists on_rate_limit_buckets_updated on public.rate_limit_buckets;
-- drop table if exists public.rate_limit_buckets;
-- alter table public.user_profiles
--   drop constraint if exists user_profiles_nome_length,
--   drop constraint if exists user_profiles_nome_negocio_length,
--   drop constraint if exists user_profiles_telefone_length,
--   drop constraint if exists user_profiles_cnae_principal_length,
--   drop constraint if exists user_profiles_municipio_length,
--   drop constraint if exists user_profiles_uf_length,
--   drop constraint if exists user_profiles_objetivo_principal_length;
