-- =============================================================
-- migration_consent.sql
-- Consentimiento informado digital para servicios terapéuticos.
-- El paciente firma una vez por cada terapeuta con quien agenda.
-- =============================================================

CREATE TABLE IF NOT EXISTS consent_signatures (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  therapist_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_version TEXT NOT NULL DEFAULT 'v1.0',
  signed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (patient_id, therapist_id, document_version)
);

CREATE INDEX IF NOT EXISTS idx_consent_patient   ON consent_signatures (patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_therapist ON consent_signatures (therapist_id);

ALTER TABLE consent_signatures ENABLE ROW LEVEL SECURITY;

-- Paciente ve y crea sus propias firmas
CREATE POLICY "consent_patient_select" ON consent_signatures
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "consent_patient_insert" ON consent_signatures
  FOR INSERT WITH CHECK (patient_id = auth.uid());

-- Admin ve todas
CREATE POLICY "consent_admin_select" ON consent_signatures
  FOR SELECT USING (is_admin());
