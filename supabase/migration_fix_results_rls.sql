-- =============================================================
-- PSICONECTA — Fix: política RLS INSERT para test_results
-- Migración: migration_fix_results_rls.sql
-- Problema: el paciente no podía insertar sus propios resultados
--           porque la única política FOR ALL era "results_therapist",
--           cuyo USING exige que auth.uid() sea el terapeuta del caso.
--           El INSERT fallaba silenciosamente → test_results vacía.
-- =============================================================

-- Permite al respondent (paciente) insertar resultados para sus propias sesiones
CREATE POLICY "results_respondent_insert" ON test_results FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = session_id
        AND ts.respondent_id = auth.uid()
    )
  );
