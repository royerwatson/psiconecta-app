-- ╔════════════════════════════════════════════════════════════════╗
-- ║  PSICONECTA — BLOQUES FALTANTES (4 a 7) — 2026-06-09            ║
-- ║  Los bloques 1-3 (profile fields, payouts, comisiones) ya       ║
-- ║  están aplicados. Ejecutar este archivo completo.               ║
-- ╚════════════════════════════════════════════════════════════════╝

-- Guarda: asegura columnas que get_public_reviews referencia
-- (idempotente; ya existe si migration_anonymity fue ejecutada)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;


-- ════════════════════════ [migration_public_reviews.sql] ════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Reviews públicas para la landing page (v2 — RPC segura)
-- Ejecutar en Supabase SQL Editor (una sola vez)
--
-- ¿Por qué RPC y no abrir RLS a anon?
--   1. Una política `TO anon USING (true)` expone TODAS las columnas
--      de `reviews` (patient_id, session_id, etc.) a cualquier visitante.
--   2. La landing necesita el nombre del paciente, pero `profiles`
--      NO debe ser legible por anónimos: el join devolvería null igualmente.
-- Solución: función SECURITY DEFINER que devuelve solo campos seguros,
-- con el nombre ya anonimizado server-side (respeta is_anonymous).
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Política SELECT para usuarios autenticados ─────────────────
DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
DROP POLICY IF EXISTS "reviews_select_auth" ON reviews;

CREATE POLICY "reviews_select_auth" ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- ── 2. RPC pública para la landing ────────────────────────────────
CREATE OR REPLACE FUNCTION get_public_reviews(limit_count int DEFAULT 20)
RETURNS TABLE (
  id           uuid,
  rating       int,
  comment      text,
  created_at   timestamptz,
  display_name text,
  initials     text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    CASE
      WHEN COALESCE(p.is_anonymous, false) OR p.full_name IS NULL
        THEN 'Paciente anónimo'
      ELSE split_part(trim(p.full_name), ' ', 1)
           || CASE
                WHEN split_part(trim(p.full_name), ' ', 2) <> ''
                  THEN ' ' || left(split_part(trim(p.full_name), ' ', 2), 1) || '.'
                ELSE ''
              END
    END AS display_name,
    CASE
      WHEN COALESCE(p.is_anonymous, false) OR p.full_name IS NULL
        THEN 'PA'
      ELSE upper(
        left(split_part(trim(p.full_name), ' ', 1), 1)
        || COALESCE(NULLIF(left(split_part(trim(p.full_name), ' ', 2), 1), ''), '')
      )
    END AS initials
  FROM reviews r
  LEFT JOIN profiles p ON p.id = r.patient_id
  WHERE r.rating >= 4
    AND r.comment IS NOT NULL
    AND r.comment <> ''
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(limit_count, 1), 50);
$$;

-- Accesible para visitantes anónimos y usuarios autenticados
REVOKE ALL ON FUNCTION get_public_reviews(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_reviews(int) TO anon, authenticated;

-- ════════════════════════ [migration_deletion_requests.sql] ════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Solicitudes de eliminación de datos (derecho de supresión)
-- Ley 172-13 RD / RGPD — Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS deletion_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_role    TEXT,
  user_email   TEXT,           -- snapshot: sobrevive a la anonimización
  user_name    TEXT,           -- snapshot
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_note   TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Una sola solicitud PENDIENTE por usuario (índice parcial: permite
-- múltiples completed/rejected históricas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_deletion_requests_one_pending
  ON deletion_requests (user_id) WHERE status = 'pending';

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Usuario: crea y ve sus propias solicitudes
DROP POLICY IF EXISTS "deletion_requests_insert_own" ON deletion_requests;
CREATE POLICY "deletion_requests_insert_own" ON deletion_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "deletion_requests_select_own" ON deletion_requests;
CREATE POLICY "deletion_requests_select_own" ON deletion_requests
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

-- Admin: gestiona todas (UPDATE para aprobar/rechazar)
DROP POLICY IF EXISTS "deletion_requests_admin_update" ON deletion_requests;
CREATE POLICY "deletion_requests_admin_update" ON deletion_requests
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status
  ON deletion_requests (status);

-- ════════════════════════ [migration_emergency_contacts.sql] ════════════════════════

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

-- ════════════════════════ [migration_device_tokens.sql] ════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Tokens de dispositivo para push notifications (FCM/APNs)
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS device_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Cada usuario gestiona solo sus propios tokens (políticas por operación)
DROP POLICY IF EXISTS "dt_select_own" ON device_tokens;
CREATE POLICY "dt_select_own" ON device_tokens
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "dt_insert_own" ON device_tokens;
CREATE POLICY "dt_insert_own" ON device_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dt_update_own" ON device_tokens;
CREATE POLICY "dt_update_own" ON device_tokens
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dt_delete_own" ON device_tokens;
CREATE POLICY "dt_delete_own" ON device_tokens
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens (user_id);

-- ── Verificación final (todas deben ser true / 0 filas la última) ──
SELECT
  EXISTS (SELECT 1 FROM pg_proc WHERE proname='get_public_reviews') AS rpc_reviews_ok,
  to_regclass('public.deletion_requests')  IS NOT NULL AS deletion_requests_ok,
  to_regclass('public.emergency_contacts') IS NOT NULL AS emergency_contacts_ok,
  to_regclass('public.device_tokens')      IS NOT NULL AS device_tokens_ok;
