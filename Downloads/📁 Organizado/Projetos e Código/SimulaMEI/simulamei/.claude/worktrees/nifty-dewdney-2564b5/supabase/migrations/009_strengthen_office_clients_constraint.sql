-- ============================================================
-- SimulaMEI — Migration 009: Strengthen office_clients inactive constraint
-- Garante que clientes inativos sempre tenham inactive_reason registrado.
-- ============================================================

-- Remove a constraint frouxa que permitia ativo=false sem inactive_reason
alter table public.office_clients
  drop constraint if exists office_clients_check;

-- Adiciona constraint que exige inactive_reason quando ativo=false
alter table public.office_clients
  add constraint office_clients_state_check check (
    (ativo = true and inactive_reason is null and disabled_by_plan_limit_at is null)
    or
    (ativo = false and inactive_reason in ('manual', 'plan_limit'))
  );

-- Rollback:
-- alter table public.office_clients drop constraint office_clients_state_check;
-- alter table public.office_clients add constraint office_clients_check check (
--   (ativo = true and inactive_reason is null and disabled_by_plan_limit_at is null)
--   or (ativo = false)
-- );
