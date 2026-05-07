-- ============================================================
-- SimulaMEI — Migration 010: Roles, profile activities and leads access
-- Supports auth gating, contador/admin access and richer onboarding context.
-- ============================================================

alter table public.user_profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'contador', 'admin')),
  add column if not exists atividades_realizadas text;

create index if not exists idx_user_profiles_role on public.user_profiles(role);

alter table public.accountant_leads
  add column if not exists contador_id uuid references auth.users(id) on delete set null;

create index if not exists idx_accountant_leads_contador_id
  on public.accountant_leads(contador_id);

create or replace function public.current_user_profile_role()
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select up.role from public.user_profiles up where up.id = auth.uid()),
    'user'
  );
$$;

drop policy if exists "accountant_leads: select contador or admin" on public.accountant_leads;
create policy "accountant_leads: select contador or admin"
  on public.accountant_leads for select
  using (
    public.current_user_profile_role() = 'admin'
    or (
      public.current_user_profile_role() = 'contador'
      and (contador_id is null or contador_id = auth.uid())
    )
  );

-- ROLLBACK:
-- drop policy if exists "accountant_leads: select contador or admin" on public.accountant_leads;
-- drop function if exists public.current_user_profile_role();
-- drop index if exists idx_accountant_leads_contador_id;
-- alter table public.accountant_leads drop column if exists contador_id;
-- drop index if exists idx_user_profiles_role;
-- alter table public.user_profiles
--   drop column if exists atividades_realizadas,
--   drop column if exists role;
