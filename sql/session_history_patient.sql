-- ─── Historial de sesiones visible al paciente ───────────────────────────────
-- Ejecutar en: Supabase → SQL Editor → New query

-- 1. Columna que el terapeuta activa para compartir notas con el paciente
alter table clinical_history
  add column if not exists is_released      boolean     default false,
  add column if not exists released_notes   text;       -- resumen amigable para el paciente

-- 2. Retroalimentación escrita por el paciente sobre la sesión
alter table sessions
  add column if not exists patient_feedback    text,
  add column if not exists patient_feedback_at timestamptz;

-- ─── RLS adicional ────────────────────────────────────────────────────────────

-- El paciente puede leer su propio historial clínico SOLO cuando is_released = true
-- (Asumiendo que la política existente ya restringe por patient_id; agregamos el filtro)
-- Si no existe política de SELECT para pacientes en clinical_history, créala:
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'clinical_history'
      and policyname = 'patient_read_released_history'
  ) then
    execute $policy$
      create policy "patient_read_released_history"
        on clinical_history for select
        using (
          auth.uid() = patient_id
          and is_released = true
        )
    $policy$;
  end if;
end $$;

-- El paciente puede actualizar SOLO sus campos de feedback en sessions
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'sessions'
      and policyname = 'patient_update_own_feedback'
  ) then
    execute $policy$
      create policy "patient_update_own_feedback"
        on sessions for update
        using (auth.uid() = patient_id)
        with check (auth.uid() = patient_id)
    $policy$;
  end if;
end $$;

-- El terapeuta puede marcar notas como liberadas
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'clinical_history'
      and policyname = 'therapist_release_notes'
  ) then
    execute $policy$
      create policy "therapist_release_notes"
        on clinical_history for update
        using (auth.uid() = therapist_id)
        with check (auth.uid() = therapist_id)
    $policy$;
  end if;
end $$;
