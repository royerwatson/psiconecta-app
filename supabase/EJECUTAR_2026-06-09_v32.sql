-- ╔════════════════════════════════════════════════════════════════╗
-- ║  PSICONECTA — MIGRACIONES PENDIENTES (sesión 2026-06-09 v32)    ║
-- ║  Ejecutar COMPLETO en Supabase SQL Editor (es idempotente).     ║
-- ║  Orden ya resuelto: no reordenar los bloques.                   ║
-- ╚════════════════════════════════════════════════════════════════╝


-- ════════════════════════ [migration_add_profile_fields.sql] ════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Nuevos campos en profiles
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Sexo ───────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender text
  CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say'));

-- ── 2. Fecha de nacimiento ────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birth_date date;

-- ── 3. Idioma preferido ───────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'es'
  CHECK (preferred_language IN ('es', 'en', 'fr', 'pt', 'de', 'it', 'ar', 'other'));

-- ── 4. Índice para matching por idioma ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_language
  ON profiles (preferred_language);

-- ════════════════════════ [migration_payouts_and_payment_fields.sql] ════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Tabla payouts + campos de pago en therapist_profiles
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Campos de método de cobro en therapist_profiles ────────────
ALTER TABLE therapist_profiles
  ADD COLUMN IF NOT EXISTS payment_method      TEXT DEFAULT 'bank_transfer'
    CHECK (payment_method IN ('bank_transfer', 'paypal')),
  ADD COLUMN IF NOT EXISTS paypal_email        TEXT,
  ADD COLUMN IF NOT EXISTS bank_name           TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name   TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_routing        TEXT;

-- ── 2. Campos de perfil profesional (usados en búsqueda/matching) ─
ALTER TABLE therapist_profiles
  ADD COLUMN IF NOT EXISTS languages        TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approaches       TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education        TEXT;

-- ── 3. Tabla payouts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id           UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount                 NUMERIC(10,2) NOT NULL,
  currency               TEXT NOT NULL DEFAULT 'USD',
  payment_method         TEXT NOT NULL DEFAULT 'bank_transfer',
  -- Snapshot de datos al momento del pago
  paypal_email           TEXT,
  bank_name              TEXT,
  bank_account_name      TEXT,
  bank_account_number    TEXT,
  bank_routing           TEXT,
  -- Estado
  status                 TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  reference              TEXT,          -- número de referencia bancaria
  paid_at                TIMESTAMPTZ,
  error_message          TEXT,
  -- PayPal específico
  paypal_payout_batch_id TEXT,
  paypal_payout_item_id  TEXT,
  -- Metadatos
  note                   TEXT,
  period_start           DATE,
  period_end             DATE,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. RLS en payouts ─────────────────────────────────────────────
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Admin puede ver y crear/actualizar todos los payouts
-- NOTA: FOR ALL USING(...) sin WITH CHECK no cubre INSERT en PostgreSQL 15
-- (misma causa raíz que el bug de therapist_availability). Se usa is_admin()
-- (SECURITY DEFINER, creada en migration_fix_profiles_select.sql).
DROP POLICY IF EXISTS "payouts_admin_all" ON payouts;
CREATE POLICY "payouts_admin_all" ON payouts
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Terapeuta puede ver sus propios payouts
DROP POLICY IF EXISTS "payouts_therapist_select" ON payouts;
CREATE POLICY "payouts_therapist_select" ON payouts
  FOR SELECT
  USING (therapist_id = auth.uid());

-- ── 5. Índices ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payouts_therapist_id
  ON payouts (therapist_id);

CREATE INDEX IF NOT EXISTS idx_payouts_status
  ON payouts (status);

-- ── 6. Vista therapist_pending_earnings ───────────────────────────
-- Usada por AdminPayouts.jsx para mostrar ganancias pendientes de liquidar
CREATE OR REPLACE VIEW therapist_pending_earnings AS
SELECT
  tp.user_id                                                         AS therapist_id,
  p.full_name                                                        AS therapist_name,
  tp.specialty,
  tp.payment_method,
  tp.paypal_email,
  tp.bank_name,
  tp.bank_account_name,
  tp.bank_account_number,
  tp.bank_routing,
  COUNT(s.id) FILTER (WHERE s.status = 'completed')                 AS sessions_count,
  COALESCE(
    SUM(s.therapist_net) FILTER (WHERE s.status = 'completed'), 0
  )                                                                  AS total_earned,
  COALESCE(
    (SELECT SUM(py.amount)
     FROM payouts py
     WHERE py.therapist_id = tp.user_id
       AND py.status = 'completed'), 0
  )                                                                  AS total_paid,
  COALESCE(
    SUM(s.therapist_net) FILTER (WHERE s.status = 'completed'), 0
  ) - COALESCE(
    (SELECT SUM(py.amount)
     FROM payouts py
     WHERE py.therapist_id = tp.user_id
       AND py.status = 'completed'), 0
  )                                                                  AS pending_amount,
  MIN(s.scheduled_at) FILTER (WHERE s.status = 'completed')         AS earliest_session,
  MAX(s.scheduled_at) FILTER (WHERE s.status = 'completed')         AS latest_session
FROM therapist_profiles tp
JOIN profiles p ON p.id = tp.user_id
LEFT JOIN sessions s ON s.therapist_id = tp.user_id
GROUP BY
  tp.user_id, p.full_name, tp.specialty,
  tp.payment_method, tp.paypal_email,
  tp.bank_name, tp.bank_account_name, tp.bank_account_number, tp.bank_routing
HAVING
  COALESCE(SUM(s.therapist_net) FILTER (WHERE s.status = 'completed'), 0)
  - COALESCE(
      (SELECT SUM(py.amount) FROM payouts py
       WHERE py.therapist_id = tp.user_id AND py.status = 'completed'), 0
    ) > 0;

-- ── 7. Seguridad de la vista ──────────────────────────────────────
-- Las vistas se ejecutan con permisos del propietario (postgres) y SALTAN
-- el RLS de las tablas subyacentes: sin esto, cualquier usuario autenticado
-- podría leer cuentas bancarias de todos los terapeutas vía PostgREST.
-- security_invoker = true (PG15) evalúa RLS con el rol del caller;
-- el admin sigue viendo todo gracias a sus políticas is_admin().
ALTER VIEW therapist_pending_earnings SET (security_invoker = true);

REVOKE ALL ON therapist_pending_earnings FROM anon;
GRANT SELECT ON therapist_pending_earnings TO authenticated;

-- ════════════════════════ [migration_commission_rates.sql] ════════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Comisiones por plan (básico 20%, pro 10%)
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Actualizar trigger sync_commission_rate ────────────────────
CREATE OR REPLACE FUNCTION sync_commission_rate()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.commission_rate := CASE NEW.subscription_plan
    WHEN 'pro'     THEN 0.10
    WHEN 'premium' THEN 0.10
    ELSE                 0.20  -- basic / gratuito
  END;
  RETURN NEW;
END;
$$;

-- ── 2. Actualizar todos los registros existentes ──────────────────
UPDATE therapist_profiles
SET commission_rate = CASE subscription_plan
  WHEN 'pro'     THEN 0.10
  WHEN 'premium' THEN 0.10
  ELSE                 0.20
END;

-- ── 3. Actualizar DEFAULT del column ──────────────────────────────
ALTER TABLE therapist_profiles
  ALTER COLUMN commission_rate SET DEFAULT 0.20;

-- ── 4. Actualizar comentario ──────────────────────────────────────
COMMENT ON COLUMN therapist_profiles.commission_rate IS
  'Tasa de comisión: 0.20 (20%) plan Gratuito | 0.10 (10%) plan Pro/Premium';

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
