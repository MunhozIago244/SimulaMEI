-- ============================================================
-- SimulaMEI — Migration 005: Account lifecycle and schema docs
-- Liga leads -> usuários por e-mail, documenta colunas geradas e habilita delete do próprio perfil.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;

  update public.leads
     set convertido = true,
         user_id = new.id,
         updated_at = now()
   where email = lower(new.email);

  return new;
end;
$$ language plpgsql security definer;

comment on index public.idx_leads_email is
  'Lookup principal por e-mail normalizado. Usado na conversão lead -> usuário e na exclusão de conta por LGPD.';

comment on column public.simulations.faturamento_acumulado is
  'Derivada de entrada->>faturamentoAcumulado. Qualquer rename no JSONB exige migration coordenada para esta coluna gerada.';

comment on column public.simulations.cnae is
  'Derivada de entrada->>cnae. Mantida para filtros e índices rápidos sem parse de JSONB em runtime.';

comment on column public.simulations.tipo_mei is
  'Derivada de entrada->>tipoMei. Renomes no payload precisam migration explícita.';

comment on column public.simulations.anexo_atual is
  'Derivada de resultado->>anexoAtual para leitura indexada do resultado da simulação.';

comment on column public.simulations.tax_rule_version is
  'Derivada de resultado->>taxRuleVersion para auditoria de versão fiscal.';

drop policy if exists "user_profiles: delete own" on public.user_profiles;
create policy "user_profiles: delete own"
  on public.user_profiles for delete
  using (auth.uid() = id);

-- ROLLBACK:
-- create or replace function public.handle_new_user()
-- returns trigger as $$
-- begin
--   insert into public.user_profiles (id, email)
--   values (new.id, new.email);
--   return new;
-- end;
-- $$ language plpgsql security definer;
-- comment on index public.idx_leads_email is null;
-- comment on column public.simulations.faturamento_acumulado is null;
-- comment on column public.simulations.cnae is null;
-- comment on column public.simulations.tipo_mei is null;
-- comment on column public.simulations.anexo_atual is null;
-- comment on column public.simulations.tax_rule_version is null;
-- drop policy if exists "user_profiles: delete own" on public.user_profiles;
