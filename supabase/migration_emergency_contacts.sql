-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Contacto de emergencia → tabla separada con RLS estricta
-- Ejecutar en Supabase SQL Editor (una sola vez)
--
-- Problema: emergency_contact/emergency_phone vivían en `profiles`,
-- cuya política SELECT es `auth.uid() IS NOT NULL` — cualquier usuario
-- autenticado podía leer el contacto de emergencia de cualquier paciente.
--
-- Acceso tras esta migración:
--   - Paciente: gestiona su propio contacto
--   - Terapeuta: SOLO si tiene relación terapéutica activa con el paciente
--   - Admin: lectura (para gestión de crisis)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Tabla ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  contact_name  TEXT NOT NULL CHECK (char_length(contact_name) <= 200),
  contact_phone TEXT NOT NULL CHECK (char_length(contact_phone) <= 30),
  relationship  TEXT CHECK (char_length(relationship) <= 100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- ── 2. RLS: políticas separadas por operación (lección de
--    migration_fix_availability: FOR ALL sin WITH CHECK no cubre INSERT) ─
DROP POLICY IF EXISTS "ec_patient_select" ON emergency_contacts;
CREATE POLICY "ec_patient_select" ON emergency_contacts
  FOR SELECT USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "ec_patient_insert" ON emergency_contacts;
CREATE POLICY "ec_patient_insert" ON emergency_contacts
  FOR INSERT WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "ec_patient_update" ON emergency_contacts;
CREATE POLICY "ec_patient_update" ON emergency_contacts
  FOR UPDATE USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "ec_patient_delete" ON emergency_contacts;
CREATE POLICY "ec_patient_delete" ON emergency_contacts
  FOR DELETE USING (patient_id = auth.uid());

-- Terapeuta con relación activa puede LEER (caso de crisis)
DROP POLICY IF EXISTS "ec_therapist_select" ON emergency_contacts;
CREATE POLICY "ec_therapist_select" ON emergency_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.patient_id   = emergency_contacts.patient_id
        AND tr.therapist_id = auth.uid()
        AND tr.status       = 'active'
    )
  );

-- Admin puede leer
DROP POLICY IF EXISTS "ec_admin_select" ON emergency_contacts;
CREATE POLICY "ec_admin_select" ON emergency_contacts
  FOR SELECT USING (is_admin());

-- ── 3. Migrar datos existentes desde profiles ─────────────────────
INSERT INTO emergency_contacts (patient_id, contact_name, contact_phone)
SELECT id, emergency_contact, emergency_phone
FROM profiles
WHERE emergency_contact IS NOT NULL
  AND emergency_phone   IS NOT NULL
ON CONFLICT (patient_id) DO NOTHING;

-- ── 4. Eliminar columnas de profiles ──────────────────────────────
ALTER TABLE profiles
  DROP COLUMN IF EXISTS emergency_contact,
  DROP COLUMN IF EXISTS emergency_phone;
