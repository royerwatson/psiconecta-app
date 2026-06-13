-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  PSICONECTA — MIGRACIONES FINALES                                    ║
-- ║  Pegar COMPLETO en Supabase SQL Editor y ejecutar de una sola vez.  ║
-- ║  100% idempotente: se puede re-ejecutar sin daño.                   ║
-- ║                                                                      ║
-- ║  Bloques 1-3 (profile fields, payouts, comisiones) ya aplicados.    ║
-- ║  Este archivo aplica los bloques 4-7 + seed escalas clínicas.       ║
-- ╚══════════════════════════════════════════════════════════════════════╝


-- ══════════════════════════════════════════════════════════════════════
-- BLOQUE 4: Columna is_anonymous en profiles
-- Necesaria para get_public_reviews — oculta el nombre del paciente
-- en reseñas si el paciente optó por anonimato.
-- ══════════════════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;


-- ══════════════════════════════════════════════════════════════════════
-- BLOQUE 5: Reviews públicas para la landing (RPC segura)
-- En vez de abrir RLS a anon (expone patient_id/session_id),
-- una función SECURITY DEFINER devuelve solo campos seguros.
-- ══════════════════════════════════════════════════════════════════════

-- Política SELECT para usuarios autenticados
DROP POLICY IF EXISTS "reviews_select"        ON reviews;
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
DROP POLICY IF EXISTS "reviews_select_auth"   ON reviews;

CREATE POLICY "reviews_select_auth" ON reviews
  FOR SELECT TO authenticated USING (true);

-- RPC pública: accesible por visitantes anónimos
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

REVOKE ALL  ON FUNCTION get_public_reviews(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_reviews(int) TO anon, authenticated;


-- ══════════════════════════════════════════════════════════════════════
-- BLOQUE 6: Tabla deletion_requests
-- Derecho de supresión (Ley 172-13 RD / RGPD)
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS deletion_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_role    TEXT,
  user_email   TEXT,
  user_name    TEXT,
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_note   TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Solo una solicitud pendiente por usuario a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_deletion_requests_one_pending
  ON deletion_requests (user_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status
  ON deletion_requests (status);

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deletion_requests_insert_own"  ON deletion_requests;
DROP POLICY IF EXISTS "deletion_requests_select_own"  ON deletion_requests;
DROP POLICY IF EXISTS "deletion_requests_admin_update" ON deletion_requests;

CREATE POLICY "deletion_requests_insert_own" ON deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "deletion_requests_select_own" ON deletion_requests
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "deletion_requests_admin_update" ON deletion_requests
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());


-- ══════════════════════════════════════════════════════════════════════
-- BLOQUE 7: Tabla emergency_contacts
-- Separa los contactos de emergencia de profiles para proteger privacidad.
-- Acceso: paciente (propio) | terapeuta con relación activa | admin.
-- ══════════════════════════════════════════════════════════════════════
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

DROP POLICY IF EXISTS "ec_patient_select"   ON emergency_contacts;
DROP POLICY IF EXISTS "ec_patient_insert"   ON emergency_contacts;
DROP POLICY IF EXISTS "ec_patient_update"   ON emergency_contacts;
DROP POLICY IF EXISTS "ec_patient_delete"   ON emergency_contacts;
DROP POLICY IF EXISTS "ec_therapist_select" ON emergency_contacts;
DROP POLICY IF EXISTS "ec_admin_select"     ON emergency_contacts;

CREATE POLICY "ec_patient_select" ON emergency_contacts
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "ec_patient_insert" ON emergency_contacts
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "ec_patient_update" ON emergency_contacts
  FOR UPDATE USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "ec_patient_delete" ON emergency_contacts
  FOR DELETE USING (patient_id = auth.uid());

-- Terapeuta con relación terapéutica activa (para emergencias clínicas)
CREATE POLICY "ec_therapist_select" ON emergency_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.patient_id   = emergency_contacts.patient_id
        AND tr.therapist_id = auth.uid()
        AND tr.status       = 'active'
    )
  );

CREATE POLICY "ec_admin_select" ON emergency_contacts
  FOR SELECT USING (is_admin());

-- Migrar datos existentes en profiles → emergency_contacts (si los hay)
INSERT INTO emergency_contacts (patient_id, contact_name, contact_phone)
SELECT id, emergency_contact, emergency_phone
FROM profiles
WHERE emergency_contact IS NOT NULL
  AND emergency_phone   IS NOT NULL
ON CONFLICT (patient_id) DO NOTHING;

-- Eliminar columnas de profiles (los datos ya están en emergency_contacts)
ALTER TABLE profiles
  DROP COLUMN IF EXISTS emergency_contact,
  DROP COLUMN IF EXISTS emergency_phone;


-- ══════════════════════════════════════════════════════════════════════
-- BLOQUE 8: Tabla device_tokens
-- Tokens FCM/APNs para push notifications (iOS, Android, web)
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS device_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dt_select_own" ON device_tokens;
DROP POLICY IF EXISTS "dt_insert_own" ON device_tokens;
DROP POLICY IF EXISTS "dt_update_own" ON device_tokens;
DROP POLICY IF EXISTS "dt_delete_own" ON device_tokens;

CREATE POLICY "dt_select_own" ON device_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "dt_insert_own" ON device_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "dt_update_own" ON device_tokens
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dt_delete_own" ON device_tokens
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens (user_id);


-- ══════════════════════════════════════════════════════════════════════
-- BLOQUE 9: Tests psicométricos — 6 escalas clínicas nuevas
-- Necesario para que el botón "Aplicar a paciente" funcione en
-- ClinicalScalesPage. Los slugs deben coincidir con SCALE_SLUG_MAP.
-- ══════════════════════════════════════════════════════════════════════
INSERT INTO tests (slug, title, description, category, estimated_minutes, is_active)
VALUES
  (
    'isi',
    'Índice de Severidad del Insomnio (ISI)',
    'Evalúa la naturaleza, severidad e impacto del insomnio durante las últimas 2 semanas. 7 ítems, puntuación 0-28.',
    'sueño',
    3,
    true
  ),
  (
    'pss10',
    'Escala de Estrés Percibido — PSS-10',
    'Mide el grado en que situaciones de la vida se perciben como estresantes durante el último mes. 10 ítems con ítems inversos.',
    'estrés',
    3,
    true
  ),
  (
    'dass21',
    'DASS-21 — Depresión, Ansiedad y Estrés',
    'Mide tres dimensiones del malestar psicológico: depresión, ansiedad y estrés. 21 ítems divididos en 3 subescalas de 7 ítems.',
    'multidominio',
    7,
    true
  ),
  (
    'spin',
    'Inventario de Fobia Social (SPIN)',
    'Evalúa el miedo, la evitación y el malestar fisiológico en situaciones sociales. 17 ítems, punto de corte ≥19.',
    'ansiedad',
    5,
    true
  ),
  (
    'dast10',
    'Test de Detección de Abuso de Drogas — DAST-10',
    'Cribado del uso problemático de drogas (excluye alcohol y tabaco) en los últimos 12 meses. 10 ítems Sí/No.',
    'sustancias',
    3,
    true
  ),
  (
    'cssrs',
    'Escala Columbia de Ideación Suicida — C-SSRS',
    'Evalúa la presencia y severidad de ideación e intento de suicidio. Versión de cribado clínico. 6 ítems secuenciales.',
    'riesgo',
    5,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title              = EXCLUDED.title,
  description        = EXCLUDED.description,
  category           = EXCLUDED.category,
  estimated_minutes  = EXCLUDED.estimated_minutes,
  is_active          = EXCLUDED.is_active;


-- ══════════════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL
-- Todas las columnas deben ser TRUE / las tablas deben existir.
-- Revisar el resultado antes de cerrar el SQL Editor.
-- ══════════════════════════════════════════════════════════════════════
SELECT
  -- Columna is_anonymous
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_anonymous'
  )                                                           AS col_is_anonymous_ok,

  -- RPC reviews
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_public_reviews')
                                                              AS rpc_reviews_ok,

  -- Tablas nuevas
  to_regclass('public.deletion_requests')  IS NOT NULL        AS deletion_requests_ok,
  to_regclass('public.emergency_contacts') IS NOT NULL        AS emergency_contacts_ok,
  to_regclass('public.device_tokens')      IS NOT NULL        AS device_tokens_ok,

  -- Columnas emergency eliminadas de profiles
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name IN ('emergency_contact', 'emergency_phone')
  )                                                           AS old_emergency_cols_removed,

  -- Escalas clínicas nuevas en tests
  (SELECT COUNT(*) FROM tests WHERE slug IN ('isi','pss10','dass21','spin','dast10','cssrs'))
                                                              AS new_scales_count;  -- debe ser 6
