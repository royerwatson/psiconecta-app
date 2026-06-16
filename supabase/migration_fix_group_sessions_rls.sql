-- Fix RLS en group_sessions
-- El admin no puede crear sesiones grupales porque gs_all exige auth.uid() = therapist_id.
-- El admin tiene un therapist_id diferente al suyo, así que la policy lo bloquea.

DROP POLICY IF EXISTS "gs_admin" ON group_sessions;

CREATE POLICY "gs_admin" ON group_sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
