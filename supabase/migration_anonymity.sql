-- ─────────────────────────────────────────────────────────────────────────────
-- migration_anonymity.sql
-- Agrega modo anónimo para pacientes.
-- Cuando is_anonymous = true, los terapeutas y otros usuarios ven
-- solo las iniciales del paciente (ej. "M. G.") en lugar del nombre completo.
-- El paciente siempre ve su propio nombre completo.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_anonymous
  ON profiles (is_anonymous) WHERE is_anonymous = TRUE;

COMMENT ON COLUMN profiles.is_anonymous IS
  'Cuando TRUE, los terapeutas y otros usuarios ven solo las iniciales del paciente.';
