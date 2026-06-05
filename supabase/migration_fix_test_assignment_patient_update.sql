-- =============================================================
-- PSICONECTA — Fix: política RLS UPDATE para paciente en test_assignments
-- Problema: el paciente (assignee) no puede actualizar el status de la
--           asignación al completar el test, por lo que:
--             • PendingTestsSection sigue mostrando el test
--             • TakeTestPage no bloquea el retomado
--             • CompletedTestsSection del terapeuta nunca recibe el test
-- =============================================================

CREATE POLICY "ta_assignee_update" ON test_assignments FOR UPDATE TO authenticated
  USING (assignee_user_id = auth.uid())
  WITH CHECK (
    -- El paciente solo puede avanzar el status (no puede cancelar ni retroceder)
    status IN ('in_progress', 'completed')
  );
