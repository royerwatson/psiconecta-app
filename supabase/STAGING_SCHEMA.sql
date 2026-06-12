-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  PSICONECTA — ESQUEMA COMPLETO PARA STAGING (generado 2026-06-12) ║
-- ║  Ejecutar en el SQL Editor del proyecto Supabase de STAGING.      ║
-- ║  Réplica del estado de producción: tablas, triggers, RLS,         ║
-- ║  storage, funciones y seeds psicométricos.                        ║
-- ║  Si un bloque falla, anota el error y el nombre del [archivo].    ║
-- ╚══════════════════════════════════════════════════════════════════╝


-- ════════════════════ [schema_1_tables.sql] ════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('therapist', 'client')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  specialty           TEXT,
  bio                 TEXT,
  license_number      TEXT,
  price_per_session   NUMERIC DEFAULT 0,
  rating              NUMERIC DEFAULT 0,
  review_count        INT DEFAULT 0,
  verified            BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending',
  available_urgent    BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_credentials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_url  TEXT NOT NULL,
  status        TEXT DEFAULT 'pending',
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS therapist_availability (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week   INT,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id    UUID REFERENCES profiles(id),
  patient_id      UUID REFERENCES profiles(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration        INT DEFAULT 60,
  status          TEXT DEFAULT 'scheduled',
  price           NUMERIC DEFAULT 0,
  is_urgent       BOOLEAN DEFAULT FALSE,
  video_room_url  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID REFERENCES sessions(id),
  therapist_id    UUID REFERENCES profiles(id),
  patient_id      UUID REFERENCES profiles(id),
  diagnosis       TEXT,
  treatment_plan  TEXT,
  session_notes   TEXT,
  risk_level      TEXT DEFAULT 'low',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id  UUID REFERENCES profiles(id),
  patient_id    UUID REFERENCES profiles(id),
  session_id    UUID REFERENCES sessions(id),
  title         TEXT NOT NULL,
  description   TEXT,
  due_date      DATE,
  completed     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id    UUID REFERENCES profiles(id),
  receiver_id  UUID REFERENCES profiles(id),
  content      TEXT NOT NULL,
  read         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID REFERENCES sessions(id),
  therapist_id  UUID REFERENCES profiles(id),
  patient_id    UUID REFERENCES profiles(id),
  rating        INT,
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mood_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES profiles(id),
  mood_score  INT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_checkins (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID REFERENCES profiles(id),
  therapist_id      UUID REFERENCES profiles(id),
  questions_answers TEXT,
  risk_level        TEXT DEFAULT 'low',
  ai_message        TEXT,
  notified          BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id     UUID REFERENCES profiles(id),
  title            TEXT NOT NULL,
  description      TEXT,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration         INT DEFAULT 60,
  max_participants INT DEFAULT 10,
  price            NUMERIC DEFAULT 0,
  video_room_url   TEXT,
  status           TEXT DEFAULT 'scheduled',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_session_participants (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_session_id UUID REFERENCES group_sessions(id) ON DELETE CASCADE,
  patient_id       UUID REFERENCES profiles(id),
  joined_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_session_id, patient_id)
);


-- ════════════════════ [schema_2_triggers.sql] ════════════════════

CREATE OR REPLACE FUNCTION update_therapist_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE therapist_profiles
  SET
    rating       = (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.therapist_id = NEW.therapist_id),
    review_count = (SELECT COUNT(*) FROM reviews r WHERE r.therapist_id = NEW.therapist_id)
  WHERE user_id = NEW.therapist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_insert ON reviews;
CREATE TRIGGER on_review_insert
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_therapist_rating();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca bloquear el registro aunque falle la creación del perfil
  RAISE LOG 'handle_new_user() error for user %: % (%)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ════════════════════ [schema_3_rls.sql] ════════════════════

ALTER TABLE profiles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_credentials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_checkins                ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "tp_select" ON therapist_profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "tp_insert" ON therapist_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tp_update" ON therapist_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "tc_select" ON therapist_credentials FOR SELECT USING (auth.uid() = therapist_id);
CREATE POLICY "tc_insert" ON therapist_credentials FOR INSERT WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "ta_select" ON therapist_availability FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ta_all"    ON therapist_availability FOR ALL USING (auth.uid() = therapist_id);

CREATE POLICY "sessions_select" ON sessions FOR SELECT
  USING (auth.uid() = therapist_id OR auth.uid() = patient_id);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE
  USING (auth.uid() = therapist_id OR auth.uid() = patient_id);

CREATE POLICY "ch_select" ON clinical_history FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = therapist_id);
CREATE POLICY "ch_insert" ON clinical_history FOR INSERT WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = therapist_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = therapist_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (auth.uid() = therapist_id OR auth.uid() = patient_id);

CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "mood_select" ON mood_logs FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "mood_insert" ON mood_logs FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "checkin_select" ON ai_checkins FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = therapist_id);
CREATE POLICY "checkin_insert" ON ai_checkins FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "gs_select" ON group_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gs_all"    ON group_sessions FOR ALL   USING (auth.uid() = therapist_id);

CREATE POLICY "gsp_select" ON group_session_participants FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gsp_insert" ON group_session_participants FOR INSERT WITH CHECK (auth.uid() = patient_id);


-- ════════════════════ [schema_4_storage.sql] ════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('credentials', 'credentials', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "creds_select"   ON storage.objects FOR SELECT USING (bucket_id = 'credentials' AND auth.uid() IS NOT NULL);
CREATE POLICY "creds_insert"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'credentials' AND auth.uid() IS NOT NULL);


-- ════════════════════ [migration_admin.sql] ════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Rol de administrador
-- Ejecutar en SQL Editor de Supabase
-- ══════════════════════════════════════════════════════════════════

-- 1. Agregar 'admin' al CHECK de roles en profiles
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('patient', 'therapist', 'admin'));

-- 2. Política RLS: el admin puede ver todos los perfiles
CREATE POLICY "admin_select_all_profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR auth.uid() = id
  );

-- 3. El admin puede ver todas las sesiones
CREATE POLICY "admin_select_all_sessions" ON sessions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR auth.uid() = patient_id
    OR auth.uid() = therapist_id
  );

-- 4. El admin puede actualizar therapist_profiles (para verificar)
CREATE POLICY "admin_update_therapist_profiles" ON therapist_profiles
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR auth.uid() = user_id
  );

-- 5. Crear tu cuenta de administrador
-- IMPORTANTE: Primero debes registrarte con el email de admin en la app
-- Luego ejecuta este UPDATE con tu user ID real:
-- UPDATE profiles SET role = 'admin' WHERE id = 'TU_USER_ID_AQUI';

SELECT 'Migración de admin completada ✅' AS resultado;


-- ════════════════════ [migration_payments.sql] ════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Soporte de pagos (PayPal / cualquier pasarela)
-- Ejecutar en el SQL Editor de Supabase → una sola vez
-- ══════════════════════════════════════════════════════════════════

-- 1. Ampliar el CHECK de status para incluir 'payment_pending'
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('payment_pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));

-- 2. Agregar columnas de pago
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,   -- ID de captura de PayPal
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;       -- Fecha/hora del pago confirmado

-- 3. Limpiar sesiones payment_pending huérfanas (> 1 hora sin pago)
CREATE OR REPLACE FUNCTION cleanup_pending_sessions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM sessions
  WHERE status = 'payment_pending'
    AND created_at < NOW() - INTERVAL '1 hour';
END;
$$;

SELECT 'Migración de pagos completada ✅' AS resultado;


-- ════════════════════ [migration_stripe.sql] ════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Soporte de pagos con Stripe
-- Ejecutar en el SQL Editor de Supabase (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- 1. Ampliar el CHECK de status para incluir 'payment_pending'
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('payment_pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));

-- 2. Agregar columnas de pago
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 3. Actualizar la política RLS de sessions para que 'payment_pending'
--    sea visible al paciente (ya están cubiertas por las políticas existentes
--    porque filtran por patient_id/therapist_id, no por status)
--    No se requiere cambio adicional en RLS.

-- 4. Limpiar sesiones payment_pending huérfanas (más de 1 hora sin pagar)
--    Opcional: puedes crear un cron job en Supabase para esto
CREATE OR REPLACE FUNCTION cleanup_pending_sessions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM sessions
  WHERE status = 'payment_pending'
    AND created_at < NOW() - INTERVAL '1 hour';
END;
$$;

SELECT 'Migración de Stripe completada ✅' AS resultado;


-- ════════════════════ [migration_subscriptions.sql] ════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- migration_subscriptions.sql
-- Modelo de negocio: planes de suscripción + comisión por sesión
--
-- Planes:
--   basic   — Gratis, 10% comisión
--   pro     — $39/mes, 7.5% comisión + mayor visibilidad + badge
--   premium — $79/mes, 5% comisión + todo lo anterior + estadísticas avanzadas
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tipo enum para planes
DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('basic', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Columnas de plan en therapist_profiles
ALTER TABLE therapist_profiles
  ADD COLUMN IF NOT EXISTS subscription_plan  subscription_plan NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS plan_started_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commission_rate    NUMERIC(5,4) NOT NULL DEFAULT 0.10;

-- 3. Función que mantiene commission_rate sincronizado con subscription_plan
CREATE OR REPLACE FUNCTION sync_commission_rate()
RETURNS TRIGGER AS $$
BEGIN
  NEW.commission_rate := CASE NEW.subscription_plan
    WHEN 'pro'     THEN 0.075
    WHEN 'premium' THEN 0.050
    ELSE                 0.100
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_commission ON therapist_profiles;
CREATE TRIGGER trg_sync_commission
  BEFORE INSERT OR UPDATE OF subscription_plan
  ON therapist_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_commission_rate();

-- Sincronizar filas existentes
UPDATE therapist_profiles SET commission_rate = CASE subscription_plan
  WHEN 'pro'     THEN 0.075
  WHEN 'premium' THEN 0.050
  ELSE                 0.100
END;

-- 4. Historial de pagos de suscripción
CREATE TABLE IF NOT EXISTS subscription_payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan              subscription_plan NOT NULL,
  amount_usd        NUMERIC(10,2) NOT NULL,  -- 39.00 o 79.00
  paypal_order_id   TEXT,
  paypal_capture_id TEXT,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed | refunded
  period_start      TIMESTAMPTZ NOT NULL,
  period_end        TIMESTAMPTZ NOT NULL,           -- +30 días
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Columnas de comisión en sessions (para auditoría y liquidaciones)
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS platform_commission NUMERIC(10,2),  -- lo que retiene la plataforma
  ADD COLUMN IF NOT EXISTS therapist_net       NUMERIC(10,2),  -- lo que recibe el terapeuta
  ADD COLUMN IF NOT EXISTS commission_rate     NUMERIC(5,4);   -- tasa aplicada (snapshot)

-- 6. Índices útiles
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_plan
  ON therapist_profiles (subscription_plan);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_therapist
  ON subscription_payments (therapist_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_commission
  ON sessions (therapist_id, platform_commission)
  WHERE platform_commission IS NOT NULL;

-- 7. RLS para subscription_payments
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Terapeuta ve sus propios pagos"
  ON subscription_payments FOR SELECT
  USING (therapist_id = auth.uid());

CREATE POLICY "Solo admins insertan pagos de suscripción"
  ON subscription_payments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR therapist_id = auth.uid()
  );

-- 8. Vista de resumen financiero por terapeuta (útil para el admin)
CREATE OR REPLACE VIEW therapist_financial_summary AS
SELECT
  tp.user_id,
  p.full_name,
  tp.subscription_plan,
  tp.commission_rate,
  tp.plan_expires_at,
  COUNT(s.id) FILTER (WHERE s.status = 'completed')            AS sessions_completed,
  COALESCE(SUM(s.price) FILTER (WHERE s.status = 'completed'), 0) AS gross_revenue,
  COALESCE(SUM(s.platform_commission) FILTER (WHERE s.status = 'completed'), 0) AS total_commission,
  COALESCE(SUM(s.therapist_net) FILTER (WHERE s.status = 'completed'), 0)      AS therapist_earnings
FROM therapist_profiles tp
JOIN profiles p ON p.id = tp.user_id
LEFT JOIN sessions s ON s.therapist_id = tp.user_id
GROUP BY tp.user_id, p.full_name, tp.subscription_plan, tp.commission_rate, tp.plan_expires_at;

COMMENT ON TABLE subscription_payments IS 'Historial de pagos de suscripción de terapeutas (Basic gratis, Pro $39, Premium $79)';
COMMENT ON COLUMN therapist_profiles.commission_rate IS 'Tasa de comisión de la plataforma: 0.10 basic | 0.075 pro | 0.05 premium';


-- ════════════════════ [migration_subscription_update.sql] ════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- migration_subscription_update.sql
-- Actualiza modelo de suscripción a 2 planes:
--   basic — Gratuito, 10% comisión (funciones core)
--   pro   — $50/mes, 10% comisión (+ herramientas clínicas)
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Actualizar trigger: pro y premium mantienen 10% (mismo que basic)
--    La diferencia es acceso a funcionalidades, no comisión
CREATE OR REPLACE FUNCTION sync_commission_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- Todos los planes tienen 10% de comisión
  -- El plan pro/premium da acceso a herramientas clínicas, no reduce comisión
  NEW.commission_rate := 0.10;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Sincronizar todas las filas existentes a 10%
UPDATE therapist_profiles SET commission_rate = 0.10;

-- 3. Migrar terapeutas con plan 'premium' a 'pro' (plan eliminado)
UPDATE therapist_profiles
SET subscription_plan = 'pro'
WHERE subscription_plan = 'premium';

-- 4. Comentario actualizado
COMMENT ON COLUMN therapist_profiles.commission_rate IS
  'Tasa de comisión fija: 0.10 (10%) para todos los planes. El plan pro da acceso a herramientas clínicas.';


-- ════════════════════ [migration_psychometrics_core.sql] ════════════════════

-- =============================================================
-- PSICONECTA — Módulo Psicométrico
-- Migración: Núcleo de Tests + Módulo Clínico + RLS
-- Versión: 1.1 | Mayo 2025
-- Sin ENUMs — usa VARCHAR con CHECK para máxima compatibilidad Supabase
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- SECCIÓN 1: NÚCLEO DE TESTS (Catálogo de instrumentos)
-- =============================================================

CREATE TABLE IF NOT EXISTS tests (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                   VARCHAR(50)  UNIQUE NOT NULL,
  name                   VARCHAR(200) NOT NULL,
  description            TEXT,
  category               VARCHAR(50)  NOT NULL
                           CHECK (category IN ('sintomas','personalidad','cognitivo','funcional',
                                               'riesgo','relacional','neuropsicologia','infantil')),
  license_type           VARCHAR(50)  DEFAULT 'public_domain',
  version                INT          DEFAULT 1,
  author                 VARCHAR(200),
  min_age_self_report    INT          DEFAULT 18,
  max_age                INT,
  estimated_minutes      INT          DEFAULT 10,
  respondent_versions    JSONB        DEFAULT '["self"]'::jsonb,
  min_reapplication_days INT          DEFAULT 7,
  rci_threshold          FLOAT,
  branches               TEXT[]       DEFAULT '{}',
  is_active              BOOLEAN      DEFAULT TRUE,
  notes                  TEXT,
  created_at             TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_sections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id      UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  order_index  INT  NOT NULL DEFAULT 0,
  title        VARCHAR(200),
  instructions TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, order_index)
);

CREATE TABLE IF NOT EXISTS items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id        UUID        NOT NULL REFERENCES test_sections(id) ON DELETE CASCADE,
  order_index       INT         NOT NULL DEFAULT 0,
  text              TEXT        NOT NULL,
  text_en           TEXT,
  item_code         VARCHAR(20),
  item_type         VARCHAR(30) DEFAULT 'likert'
                      CHECK (item_type IN ('likert','multiple_choice','vas','free_text','cognitive_task')),
  is_reverse_scored BOOLEAN     DEFAULT FALSE,
  subscale          VARCHAR(100),
  alert_threshold   INT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, order_index)
);

CREATE TABLE IF NOT EXISTS response_options (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID         NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  order_index INT          NOT NULL DEFAULT 0,
  label       VARCHAR(200) NOT NULL,
  label_en    VARCHAR(200),
  value       INT          NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(item_id, order_index)
);

CREATE TABLE IF NOT EXISTS scoring_rules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id        UUID         NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  subscale_name  VARCHAR(100) NOT NULL,
  display_name   VARCHAR(200),
  formula        VARCHAR(50)  DEFAULT 'sum'
                   CHECK (formula IN ('sum','average','weighted_sum')),
  item_codes     TEXT[],
  item_weights   JSONB        DEFAULT '{}'::jsonb,
  multiply_by    FLOAT        DEFAULT 1.0,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(test_id, subscale_name)
);

CREATE TABLE IF NOT EXISTS interpretation_ranges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scoring_rule_id UUID         NOT NULL REFERENCES scoring_rules(id) ON DELETE CASCADE,
  score_min       FLOAT        NOT NULL,
  score_max       FLOAT        NOT NULL,
  severity_label  VARCHAR(100) NOT NULL,
  severity_code   VARCHAR(20),
  color_hex       VARCHAR(7),
  description     TEXT,
  recommendation  TEXT,
  is_risk_level   BOOLEAN      DEFAULT FALSE,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);


-- =============================================================
-- SECCIÓN 2: MÓDULO CLÍNICO
-- =============================================================

CREATE TABLE IF NOT EXISTS therapeutic_relationships (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id  UUID        NOT NULL REFERENCES profiles(id),
  patient_id    UUID        NOT NULL REFERENCES profiles(id),
  status        VARCHAR(20) DEFAULT 'active'
                  CHECK (status IN ('active','paused','closed')),
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(therapist_id, patient_id)
);

CREATE TABLE IF NOT EXISTS test_assignments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id  UUID        NOT NULL REFERENCES therapeutic_relationships(id),
  test_id          UUID        NOT NULL REFERENCES tests(id),
  assignee_user_id UUID        REFERENCES profiles(id),
  assignment_mode  VARCHAR(20) DEFAULT 'single'
                     CHECK (assignment_mode IN ('single','multi_respondent','dyadic')),
  status           VARCHAR(20) DEFAULT 'pending'
                     CHECK (status IN ('pending','in_progress','completed','partial','expired','cancelled')),
  reason           TEXT,
  instructions     TEXT,
  assigned_at      TIMESTAMPTZ DEFAULT NOW(),
  due_at           TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  notified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id   UUID        NOT NULL REFERENCES test_assignments(id),
  respondent_id   UUID        NOT NULL REFERENCES profiles(id),
  respondent_role VARCHAR(50) DEFAULT 'self',
  status          VARCHAR(20) DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress','completed','abandoned')),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  last_item_index INT         DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS item_responses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id     UUID        NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  item_id        UUID        NOT NULL REFERENCES items(id),
  response_value INT,
  response_text  TEXT,
  responded_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, item_id)
);

CREATE TABLE IF NOT EXISTS test_results (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id                UUID    NOT NULL REFERENCES test_sessions(id),
  scoring_rule_id           UUID    NOT NULL REFERENCES scoring_rules(id),
  raw_score                 FLOAT   NOT NULL,
  adjusted_score            FLOAT,
  severity_label            VARCHAR(100),
  severity_code             VARCHAR(20),
  previous_session_id       UUID    REFERENCES test_sessions(id),
  previous_score            FLOAT,
  score_delta               FLOAT,
  rci_value                 FLOAT,
  is_clinically_significant BOOLEAN,
  ai_narrative              JSONB,
  ai_reviewed               BOOLEAN     DEFAULT FALSE,
  ai_reviewed_at            TIMESTAMPTZ,
  released_to_patient       BOOLEAN     DEFAULT FALSE,
  released_at               TIMESTAMPTZ,
  released_by               UUID        REFERENCES profiles(id),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, scoring_rule_id)
);

CREATE TABLE IF NOT EXISTS clinical_opinions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID        NOT NULL REFERENCES test_sessions(id),
  therapist_id UUID        NOT NULL REFERENCES profiles(id),
  opinion_text TEXT        NOT NULL,
  edit_count   INT         DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, therapist_id)
);

CREATE TABLE IF NOT EXISTS risk_alerts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id       UUID        NOT NULL REFERENCES test_sessions(id),
  patient_id       UUID        NOT NULL REFERENCES profiles(id),
  therapist_id     UUID        NOT NULL REFERENCES profiles(id),
  alert_type       VARCHAR(100) NOT NULL,
  description      TEXT         NOT NULL,
  severity         VARCHAR(20)  DEFAULT 'high'
                     CHECK (severity IN ('medium','high','critical')),
  is_acknowledged  BOOLEAN      DEFAULT FALSE,
  acknowledged_at  TIMESTAMPTZ,
  acknowledged_by  UUID         REFERENCES profiles(id),
  action_taken     TEXT,
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         REFERENCES profiles(id),
  action      VARCHAR(100) NOT NULL,
  resource    VARCHAR(100),
  resource_id UUID,
  metadata    JSONB        DEFAULT '{}'::jsonb,
  ip_address  INET,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);


-- =============================================================
-- SECCIÓN 3: ÍNDICES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_test_assignments_relationship ON test_assignments(relationship_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_status       ON test_assignments(status);
CREATE INDEX IF NOT EXISTS idx_test_assignments_due          ON test_assignments(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_sessions_assignment      ON test_sessions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_respondent      ON test_sessions(respondent_id);
CREATE INDEX IF NOT EXISTS idx_item_responses_session        ON item_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_test_results_session          ON test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_test_results_released         ON test_results(released_to_patient);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_patient           ON risk_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_unack             ON risk_alerts(is_acknowledged) WHERE is_acknowledged = FALSE;
CREATE INDEX IF NOT EXISTS idx_therapeutic_rel_therapist     ON therapeutic_relationships(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapeutic_rel_patient       ON therapeutic_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user                ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created             ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_section                 ON items(section_id, order_index);
CREATE INDEX IF NOT EXISTS idx_response_options_item         ON response_options(item_id, order_index);


-- =============================================================
-- SECCIÓN 4: ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE tests                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sections             ENABLE ROW LEVEL SECURITY;
ALTER TABLE items                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_options          ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpretation_ranges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_assignments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_responses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_opinions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                 ENABLE ROW LEVEL SECURITY;

-- Catálogo: lectura para todos los autenticados
CREATE POLICY "tests_read"              ON tests              FOR SELECT TO authenticated USING (is_active = TRUE);
CREATE POLICY "test_sections_read"      ON test_sections      FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "items_read"              ON items              FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "response_options_read"   ON response_options   FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "scoring_rules_read"      ON scoring_rules      FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "interpretation_read"     ON interpretation_ranges FOR SELECT TO authenticated USING (TRUE);

-- Admin gestiona catálogo
CREATE POLICY "tests_admin"             ON tests              FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Relaciones terapéuticas
CREATE POLICY "tr_read"                 ON therapeutic_relationships FOR SELECT TO authenticated
  USING (therapist_id = auth.uid() OR patient_id = auth.uid());

CREATE POLICY "tr_therapist_insert"     ON therapeutic_relationships FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'therapist')
    AND therapist_id = auth.uid()
  );

CREATE POLICY "tr_therapist_update"     ON therapeutic_relationships FOR UPDATE TO authenticated
  USING (therapist_id = auth.uid());

-- Asignaciones
CREATE POLICY "ta_therapist"            ON test_assignments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.id = relationship_id AND tr.therapist_id = auth.uid()
    )
  );

CREATE POLICY "ta_patient_read"         ON test_assignments FOR SELECT TO authenticated
  USING (
    assignee_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.id = relationship_id AND tr.patient_id = auth.uid()
    )
  );

-- Sesiones
CREATE POLICY "ts_respondent"           ON test_sessions FOR ALL TO authenticated
  USING (respondent_id = auth.uid());

CREATE POLICY "ts_therapist_read"       ON test_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
      WHERE ta.id = assignment_id AND tr.therapist_id = auth.uid()
    )
  );

-- Respuestas
CREATE POLICY "ir_respondent"           ON item_responses FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM test_sessions ts WHERE ts.id = session_id AND ts.respondent_id = auth.uid())
  );

CREATE POLICY "ir_therapist_read"       ON item_responses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN test_assignments ta ON ta.id = ts.assignment_id
      JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
      WHERE ts.id = session_id AND tr.therapist_id = auth.uid()
    )
  );

-- Resultados
CREATE POLICY "results_therapist"       ON test_results FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN test_assignments ta ON ta.id = ts.assignment_id
      JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
      WHERE ts.id = session_id AND tr.therapist_id = auth.uid()
    )
  );

CREATE POLICY "results_patient"         ON test_results FOR SELECT TO authenticated
  USING (
    released_to_patient = TRUE
    AND EXISTS (SELECT 1 FROM test_sessions ts WHERE ts.id = session_id AND ts.respondent_id = auth.uid())
  );

-- Opiniones clínicas: solo el terapeuta autor
CREATE POLICY "opinions_therapist"      ON clinical_opinions FOR ALL TO authenticated
  USING (therapist_id = auth.uid());

-- Alertas: terapeuta del caso
CREATE POLICY "alerts_therapist"        ON risk_alerts FOR ALL TO authenticated
  USING (therapist_id = auth.uid());

-- Audit log
CREATE POLICY "audit_admin_read"        ON audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "audit_insert"            ON audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());


-- =============================================================
-- SECCIÓN 5: FUNCIÓN HELPER
-- =============================================================

CREATE OR REPLACE FUNCTION has_active_relationship(p_therapist_id UUID, p_patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM therapeutic_relationships
    WHERE therapist_id = p_therapist_id
      AND patient_id   = p_patient_id
      AND status       = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================
-- FIN DE MIGRACIÓN v1.1
-- =============================================================


-- ════════════════════ [migration_messages_read_at.sql] ════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- migration_messages_read_at.sql
-- Agrega read_at a messages para el badge de mensajes no leídos en el chat.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Agregar columna read_at (reemplaza el booleano read con timestamp preciso)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Migrar datos existentes: si read = true, poner read_at = created_at
UPDATE messages
SET read_at = created_at
WHERE read = TRUE AND read_at IS NULL;

-- 3. Índice para consultas de no leídos (filtro por receptor y read_at nulo)
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (receiver_id, read_at)
  WHERE read_at IS NULL;

-- 4. RPC: marcar como leídos todos los mensajes de sender → receiver
--    (se llama al abrir una conversación)
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_sender_id   UUID,
  p_receiver_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages
  SET    read_at = NOW(),
         read    = TRUE
  WHERE  sender_id   = p_sender_id
    AND  receiver_id = p_receiver_id
    AND  read_at IS NULL;
END;
$$;

-- 5. RPC: contar total de mensajes no leídos para un usuario
CREATE OR REPLACE FUNCTION count_unread_messages(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM   messages
  WHERE  receiver_id = p_user_id
    AND  read_at IS NULL;
  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON COLUMN messages.read_at IS 'NULL = no leído; timestamp = momento en que el receptor lo leyó';


-- ════════════════════ [migration_anonymity.sql] ════════════════════

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


-- ════════════════════ [migration_credentials.sql] ════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- migration_credentials.sql
-- Actualiza therapist_credentials para requerir exactamente 3 documentos:
--   titulo_profesional   — Título profesional universitario
--   exequatur            — Exequátur emitido por el Estado
--   colegio_psicologico  — Acreditación del Colegio Dominicano de Psicólogos
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Agregar tipo de documento
ALTER TABLE therapist_credentials
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by   UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Índice para consultar por tipo y terapeuta
CREATE INDEX IF NOT EXISTS idx_credentials_therapist_type
  ON therapist_credentials (therapist_id, document_type);

-- 3. Comentarios
COMMENT ON COLUMN therapist_credentials.document_type IS
  'titulo_profesional | exequatur | colegio_psicologico';
COMMENT ON COLUMN therapist_credentials.rejection_reason IS
  'Motivo de rechazo del documento por parte del administrador';


-- ════════════════════ [migration_avatars_bucket.sql] ════════════════════

-- ============================================================
-- Bucket público "avatars" + políticas de storage
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Crear el bucket (público = las URLs no requieren autenticación)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,    -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public            = true,
      file_size_limit   = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Cualquiera puede leer los avatares (imágenes públicas)
DROP POLICY IF EXISTS "Public avatar read" ON storage.objects;
CREATE POLICY "Public avatar read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Solo el propio usuario puede subir su avatar
--    Ruta esperada dentro del bucket: "avatars/<user_id>.<ext>"
--    storage.filename() devuelve la parte final del path, p.ej. "abc123.jpg"
DROP POLICY IF EXISTS "User can upload own avatar" ON storage.objects;
CREATE POLICY "User can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND storage.filename(name) LIKE (auth.uid()::text || '.%')
);

-- 4. Solo el propio usuario puede reemplazar (upsert) su avatar
DROP POLICY IF EXISTS "User can update own avatar" ON storage.objects;
CREATE POLICY "User can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND storage.filename(name) LIKE (auth.uid()::text || '.%')
);

-- 5. Solo el propio usuario puede borrar su avatar
DROP POLICY IF EXISTS "User can delete own avatar" ON storage.objects;
CREATE POLICY "User can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND storage.filename(name) LIKE (auth.uid()::text || '.%')
);


-- ════════════════════ [migration_blocked_dates.sql] ════════════════════

-- Migration: Therapist blocked dates table
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS therapist_blocked_dates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_date  DATE NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (therapist_id, blocked_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS therapist_blocked_dates_therapist_idx
  ON therapist_blocked_dates(therapist_id, blocked_date);

-- RLS
ALTER TABLE therapist_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Therapist can manage their own blocked dates
CREATE POLICY "therapist_manage_own_blocked_dates"
  ON therapist_blocked_dates
  FOR ALL
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

-- Patients can read blocked dates to know when NOT to book
CREATE POLICY "patients_read_blocked_dates"
  ON therapist_blocked_dates
  FOR SELECT
  USING (TRUE);


-- ════════════════════ [migration_mood_notif.sql] ════════════════════

-- ============================================================
-- Migración: contexto en mood_logs + preferencias de notificaciones
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columnas de contexto a mood_logs
ALTER TABLE mood_logs
  ADD COLUMN IF NOT EXISTS context_tags TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS note         TEXT;

-- 2. Tabla de preferencias de notificaciones por usuario
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id                     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_session_confirmation  BOOLEAN NOT NULL DEFAULT true,
  email_session_reminder      BOOLEAN NOT NULL DEFAULT true,
  email_new_message           BOOLEAN NOT NULL DEFAULT true,
  email_therapist_change      BOOLEAN NOT NULL DEFAULT true,
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User manages own notification prefs" ON notification_preferences;
CREATE POLICY "User manages own notification prefs"
ON notification_preferences
FOR ALL
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- ════════════════════ [migration_consent.sql] ════════════════════

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


-- ════════════════════ [migration_deactivate_users.sql] ════════════════════

-- Migration: Add is_active flag to profiles
-- Run this in Supabase SQL editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON profiles(is_active);

-- Admin can update any profile's is_active status
-- (Assuming admin role has full access or this is done via service role)


-- ════════════════════ [migration_fix_results_rls.sql] ════════════════════

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


-- ════════════════════ [migration_fix_test_assignment_patient_update.sql] ════════════════════

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


-- ════════════════════ [migration_checkin_reviewed.sql] ════════════════════

-- Migration: add therapist_reviewed_at to ai_checkins
-- Allows therapists to dismiss/verify a wellness check-in from the dashboard.
-- Once set, the check-in no longer appears on the therapist's dashboard.

ALTER TABLE ai_checkins
  ADD COLUMN IF NOT EXISTS therapist_reviewed_at TIMESTAMPTZ DEFAULT NULL;

-- Allow the therapist to update their own patients' check-ins
CREATE POLICY IF NOT EXISTS "Therapist can review checkins"
  ON ai_checkins
  FOR UPDATE
  USING (therapist_id = auth.uid())
  WITH CHECK (therapist_id = auth.uid());


-- ════════════════════ [migration_fix_profile_role_escalation.sql] ════════════════════

-- =============================================================
-- migration_fix_profile_role_escalation.sql
-- SEGURIDAD CRÍTICA: Previene que un usuario autenticado
-- modifique su propio campo "role" o "is_active" en profiles.
--
-- Problema previo:
--   La política "profiles_update" solo tenía USING (auth.uid() = id),
--   sin WITH CHECK, permitiendo que cualquier usuario cambie su rol
--   a 'admin', 'therapist' u otro mediante una llamada directa a la API.
--
-- Solución:
--   Reemplazar la política con una que incluya WITH CHECK validando
--   que role e is_active no cambian respecto al valor actual en la BD.
--
-- Impacto en el frontend:
--   NINGUNO. Ningún formulario del frontend envía "role" ni "is_active"
--   en sus updates de perfil. Los campos bloqueados son:
--     - role      → solo puede cambiarse via RPC con SECURITY DEFINER
--     - is_active → solo puede cambiarse via Edge Function admin-toggle-user
-- =============================================================

-- 1. Eliminar la política insegura existente
DROP POLICY IF EXISTS "profiles_update" ON profiles;

-- 2. Crear la política segura con WITH CHECK
--    La subconsulta lee el valor ACTUAL de role e is_active desde la BD
--    y exige que el valor propuesto en el UPDATE sea idéntico.
--    Un usuario puede actualizar todos los demás campos de su perfil
--    (full_name, avatar_url, city, country, phone, is_anonymous, etc.)
--    pero NO puede cambiar role ni is_active.
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role      = (SELECT role      FROM profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM profiles WHERE id = auth.uid())
  );

-- 3. Función RPC segura para que el admin cambie el rol de un usuario
--    (SECURITY DEFINER = se ejecuta con privilegios del owner, bypassea RLS)
--    Solo accesible si el caller tiene role = 'admin' en profiles.
CREATE OR REPLACE FUNCTION admin_set_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que quien llama es admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden cambiar roles.';
  END IF;

  -- Validar que el rol sea uno de los permitidos
  IF new_role NOT IN ('client', 'therapist', 'admin') THEN
    RAISE EXCEPTION 'Rol inválido: %', new_role;
  END IF;

  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$;

-- Revocar ejecución pública; solo roles autenticados pueden llamarla
REVOKE ALL ON FUNCTION admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_set_user_role(UUID, TEXT) TO authenticated;

-- 4. Comentario de auditoría
COMMENT ON POLICY "profiles_update" ON profiles IS
  'Permite al usuario actualizar su propio perfil. Bloquea cambios en role e is_active mediante WITH CHECK con subconsulta al valor actual.';


-- ════════════════════ [migration_fix_profiles_select.sql] ════════════════════

-- =============================================================
-- migration_fix_profiles_select.sql
-- SEGURIDAD ALTA: Restringe la lectura de profiles por rol.
--
-- Problema previo:
--   USING (auth.uid() IS NOT NULL) → cualquier usuario autenticado
--   puede leer todos los perfiles: teléfono, contacto de emergencia,
--   país, email y cualquier otro campo de todos los pacientes.
--
-- Reglas de la nueva política:
--   1. Propio perfil          → siempre visible para el usuario
--   2. Terapeutas             → visibles para todos los autenticados
--                               (directorio público, FindTherapist)
--   3. Perfil de paciente     → visible para terapeutas que tengan
--                               al menos una sesión o relación terapéutica
--                               activa con ese paciente
--   4. Administradores        → ven todos los perfiles
--
-- Técnica anti-recursión:
--   La verificación de admin usa una función SECURITY DEFINER que
--   accede a profiles con privilegios del owner, evitando que la
--   política se llame a sí misma en bucle infinito.
-- =============================================================

-- 1. Función helper para verificar rol admin (evita recursión en RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- 2. Eliminar política laxa existente
DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- 3. Nueva política restrictiva
--    Orden de condiciones optimizado: las más baratas primero (uid = id, role = 'therapist')
--    para que Postgres haga short-circuit antes de evaluar las subconsultas.
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (
    -- Propio perfil
    auth.uid() = id

    -- Terapeutas son semi-públicos (directorio, booking, chat)
    OR role = 'therapist'

    -- Admin ve todo (función SECURITY DEFINER para evitar recursión)
    OR is_admin()

    -- Terapeuta con sesión agendada/completada con este paciente
    OR EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.patient_id = profiles.id
        AND s.therapist_id = auth.uid()
    )

    -- Terapeuta con relación terapéutica formal (módulo psicométrico)
    OR EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.patient_id = profiles.id
        AND tr.therapist_id = auth.uid()
    )
  );

COMMENT ON POLICY "profiles_select" ON profiles IS
  'Terapeutas semi-públicos; pacientes solo visibles para sus terapeutas (sesión o relación) y admins.';


-- ════════════════════ [migration_fix_sessions_update.sql] ════════════════════

-- =============================================================
-- migration_fix_sessions_update.sql
-- SEGURIDAD ALTA: Añade WITH CHECK a la política sessions_update.
--
-- Problema previo:
--   La política solo tenía USING sin WITH CHECK, lo que permitía
--   a cualquier terapeuta o paciente modificar campos arbitrarios:
--   price, therapist_net, platform_commission, therapist_id,
--   patient_id, video_room_url, etc.
--
-- Lo que actualiza el frontend (único uso legítimo):
--   - { status: 'completed' }  → TherapistSchedule, VideoCall
--   - { status: 'cancelled' }  → MyAppointments (paciente)
--   Nada más. Los campos financieros y de propiedad solo los
--   modifican las Edge Functions con service_role (bypass RLS).
--
-- La nueva política WITH CHECK bloquea cambios en:
--   - therapist_id, patient_id  → propietarios de la sesión
--   - price                     → acordado al crear la sesión
--   - therapist_net             → calculado por Edge Function
--   - platform_commission       → calculado por Edge Function
--
-- Nota sobre COALESCE:
--   Los campos financieros pueden ser NULL antes de que el pago
--   se complete. COALESCE(x, 0) permite comparar NULL = NULL
--   sin que la condición falle.
-- =============================================================

DROP POLICY IF EXISTS "sessions_update" ON sessions;

CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE
  USING (
    auth.uid() = therapist_id OR auth.uid() = patient_id
  )
  WITH CHECK (
    -- El usuario sigue siendo participante de la sesión
    (auth.uid() = therapist_id OR auth.uid() = patient_id)

    -- Los participantes no pueden reasignarse
    AND therapist_id = (SELECT therapist_id FROM sessions s WHERE s.id = sessions.id)
    AND patient_id   = (SELECT patient_id   FROM sessions s WHERE s.id = sessions.id)

    -- El precio pactado no puede modificarse desde el cliente
    AND COALESCE(price, 0) =
        COALESCE((SELECT price FROM sessions s WHERE s.id = sessions.id), 0)

    -- Los campos de liquidación solo los escribe la Edge Function
    AND COALESCE(therapist_net, 0) =
        COALESCE((SELECT therapist_net FROM sessions s WHERE s.id = sessions.id), 0)

    AND COALESCE(platform_commission, 0) =
        COALESCE((SELECT platform_commission FROM sessions s WHERE s.id = sessions.id), 0)
  );

COMMENT ON POLICY "sessions_update" ON sessions IS
  'Permite actualizar status y notes. Bloquea cambios en therapist_id, patient_id, price, therapist_net y platform_commission desde el cliente.';


-- ════════════════════ [migration_fix_credentials_rls.sql] ════════════════════

-- =============================================================
-- migration_fix_credentials_rls.sql
-- Corrige las políticas RLS de therapist_credentials.
--
-- Problemas previos:
--   1. tc_select: solo el propio terapeuta puede leer sus credenciales.
--      El admin no puede leerlas → la pantalla AdminTherapists muestra
--      la tabla vacía aunque la query se ejecute sin error aparente.
--
--   2. No existe política UPDATE → el admin no puede cambiar status
--      ni rejection_reason. El flujo approveDoc/rejectDoc falla
--      silenciosamente si RLS está activo (error 403 ignorado).
--
-- Solución:
--   - tc_select: añadir OR is_admin() para que el admin lea todo.
--   - tc_admin_update: nueva política UPDATE exclusiva para admins,
--     que permite modificar status, rejection_reason, reviewed_by
--     y reviewed_at. El terapeuta NO puede modificar sus credenciales
--     (solo insertar nuevas).
--
-- Nota: is_admin() fue creada en migration_fix_profiles_select.sql.
--       Ejecutar esa migración primero si no se ha hecho.
-- =============================================================

-- 1. Reemplazar tc_select con versión que incluye admin
DROP POLICY IF EXISTS "tc_select" ON therapist_credentials;

CREATE POLICY "tc_select" ON therapist_credentials
  FOR SELECT
  USING (
    auth.uid() = therapist_id   -- terapeuta ve sus propios docs
    OR is_admin()               -- admin ve todos
  );

-- 2. Nueva política UPDATE exclusiva para administradores
CREATE POLICY "tc_admin_update" ON therapist_credentials
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (
    is_admin()
    -- Solo se pueden cambiar los campos de revisión; el documento
    -- original (therapist_id, document_url, document_type) es inmutable.
    AND therapist_id   = (SELECT therapist_id   FROM therapist_credentials c WHERE c.id = therapist_credentials.id)
    AND document_url   = (SELECT document_url   FROM therapist_credentials c WHERE c.id = therapist_credentials.id)
    AND document_type  = (SELECT document_type  FROM therapist_credentials c WHERE c.id = therapist_credentials.id)
  );

COMMENT ON POLICY "tc_select" ON therapist_credentials IS
  'Terapeuta ve sus propios documentos; admin ve todos.';

COMMENT ON POLICY "tc_admin_update" ON therapist_credentials IS
  'Solo admins pueden aprobar/rechazar documentos. Campos del documento son inmutables.';


-- ════════════════════ [migration_fix_progate_server_side.sql] ════════════════════

-- =============================================================
-- migration_fix_progate_server_side.sql
-- Refuerzo server-side del plan de suscripción para el módulo psicométrico.
--
-- Problema previo:
--   ProGate.jsx solo bloquea la UI. Las tablas del módulo de tests
--   (tests, items, test_assignments, etc.) tenían políticas abiertas
--   a CUALQUIER usuario autenticado, independientemente del plan.
--   Un terapeuta con plan básico podía consultar la API directamente
--   y obtener todos los tests, ítems y resultados.
--
-- Solución:
--   1. Función is_pro_therapist() — SECURITY DEFINER, evita recursión.
--   2. Actualizar políticas SELECT del catálogo de tests para requerir
--      plan pro/premium, excepto para pacientes que tienen un test asignado.
--   3. Actualizar política de creación de test_assignments para requerir
--      plan pro/premium con CHECK.
--
-- Nota: DSM-5-TR, CIE-11, escalas, biblioteca y protocolos son archivos
-- estáticos en /src/data/ (bundleados con el JS), por lo que ProGate.jsx
-- sigue siendo la única protección posible para esos módulos.
-- Para protección real habría que moverlos a Edge Functions.
-- =============================================================

-- 1. Función helper para verificar plan pro/premium
CREATE OR REPLACE FUNCTION is_pro_therapist()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM therapist_profiles
    WHERE user_id = auth.uid()
      AND subscription_plan IN ('pro', 'premium')
  );
$$;

REVOKE ALL ON FUNCTION is_pro_therapist() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_pro_therapist() TO authenticated;

-- 2. tests — solo terapeutas pro, admins, o pacientes con asignación activa
DROP POLICY IF EXISTS "tests_read" ON tests;
CREATE POLICY "tests_read" ON tests
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE
    AND (
      -- Terapeuta con plan activo puede ver el catálogo completo
      is_pro_therapist()

      -- Admin gestiona el catálogo
      OR is_admin()

      -- Paciente puede leer el test que tiene asignado (para tomarlo)
      OR EXISTS (
        SELECT 1 FROM test_assignments ta
        JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
        WHERE ta.test_id = tests.id
          AND tr.patient_id = auth.uid()
          AND ta.status IN ('pending', 'in_progress')
      )
    )
  );

-- 3. test_sections, items, response_options, scoring_rules
--    Misma lógica: pro o paciente con test asignado
DROP POLICY IF EXISTS "test_sections_read" ON test_sections;
CREATE POLICY "test_sections_read" ON test_sections
  FOR SELECT TO authenticated
  USING (
    is_pro_therapist()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
      JOIN tests t ON t.id = ta.test_id
      WHERE t.id = (SELECT test_id FROM test_sections WHERE id = test_sections.id)
        AND tr.patient_id = auth.uid()
        AND ta.status IN ('pending', 'in_progress')
    )
  );

DROP POLICY IF EXISTS "items_read" ON items;
CREATE POLICY "items_read" ON items
  FOR SELECT TO authenticated
  USING (
    is_pro_therapist()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM test_sections ts
      JOIN test_assignments ta ON ta.test_id = (
        SELECT test_id FROM test_sections WHERE id = items.section_id
      )
      JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
      WHERE tr.patient_id = auth.uid()
        AND ta.status IN ('pending', 'in_progress')
    )
  );

DROP POLICY IF EXISTS "response_options_read" ON response_options;
CREATE POLICY "response_options_read" ON response_options
  FOR SELECT TO authenticated
  USING (
    is_pro_therapist()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM items i
      JOIN test_sections ts ON ts.id = i.section_id
      JOIN test_assignments ta ON ta.test_id = ts.test_id
      JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
      WHERE i.id = response_options.item_id
        AND tr.patient_id = auth.uid()
        AND ta.status IN ('pending', 'in_progress')
    )
  );

DROP POLICY IF EXISTS "scoring_rules_read" ON scoring_rules;
CREATE POLICY "scoring_rules_read" ON scoring_rules
  FOR SELECT TO authenticated
  USING (
    is_pro_therapist()
    OR is_admin()
    -- Paciente puede leer sus propios resultados (scores ya calculados)
    OR EXISTS (
      SELECT 1 FROM test_results tr2
      WHERE tr2.scoring_rule_id = scoring_rules.id
        AND EXISTS (
          SELECT 1 FROM test_sessions ts
          WHERE ts.id = tr2.session_id AND ts.respondent_id = auth.uid()
        )
    )
  );

-- 4. test_assignments — solo terapeutas pro pueden CREAR asignaciones
--    La lectura ya estaba correctamente restringida (ta_therapist + ta_patient_read)
DROP POLICY IF EXISTS "ta_therapist" ON test_assignments;
CREATE POLICY "ta_therapist" ON test_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.id = relationship_id AND tr.therapist_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Para crear/modificar asignaciones se requiere plan pro
    is_pro_therapist()
    AND EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.id = relationship_id AND tr.therapist_id = auth.uid()
    )
  );

COMMENT ON FUNCTION is_pro_therapist() IS
  'Verifica si el usuario actual es un terapeuta con plan pro o premium. SECURITY DEFINER para evitar recursión en RLS.';


-- ════════════════════ [migration_fix_length_constraints.sql] ════════════════════

-- =============================================================
-- migration_fix_length_constraints.sql
-- Añade restricciones de longitud máxima en campos de texto libre.
--
-- Sin estos CHECK constraints, un input malicioso puede enviar
-- payloads enormes causando DoS o acumulación excesiva de datos.
-- Las longitudes fueron calibradas para uso clínico real.
-- =============================================================

-- messages: contenido de chat
ALTER TABLE messages
  ADD CONSTRAINT messages_content_length
    CHECK (length(content) BETWEEN 1 AND 10000);

-- clinical_history: campos clínicos
ALTER TABLE clinical_history
  ADD CONSTRAINT clinical_diagnosis_length
    CHECK (diagnosis IS NULL OR length(diagnosis) <= 5000),
  ADD CONSTRAINT clinical_treatment_length
    CHECK (treatment_plan IS NULL OR length(treatment_plan) <= 10000),
  ADD CONSTRAINT clinical_notes_length
    CHECK (session_notes IS NULL OR length(session_notes) <= 10000);

-- patient_tasks: tareas asignadas al paciente
ALTER TABLE patient_tasks
  ADD CONSTRAINT tasks_title_length
    CHECK (length(title) BETWEEN 1 AND 300),
  ADD CONSTRAINT tasks_description_length
    CHECK (description IS NULL OR length(description) <= 3000);

-- ai_checkins: respuestas del check-in de bienestar
ALTER TABLE ai_checkins
  ADD CONSTRAINT checkin_qa_length
    CHECK (questions_answers IS NULL OR length(questions_answers) <= 5000),
  ADD CONSTRAINT checkin_message_length
    CHECK (ai_message IS NULL OR length(ai_message) <= 2000);

-- reviews: comentarios de reseñas
ALTER TABLE reviews
  ADD CONSTRAINT reviews_comment_length
    CHECK (comment IS NULL OR length(comment) <= 2000);

-- therapist_profiles: bio
ALTER TABLE therapist_profiles
  ADD CONSTRAINT tp_bio_length
    CHECK (bio IS NULL OR length(bio) <= 3000);


-- ════════════════════ [migration_fix_reviews_and_tp_security.sql] ════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Seguridad en reviews y therapist_profiles
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. REVIEWS: UNIQUE constraint por sesión ──────────────────────
-- Sin esto, un paciente puede dejar múltiples reseñas a la misma sesión
-- inflando artificialmente el rating del terapeuta.
ALTER TABLE reviews
  ADD CONSTRAINT reviews_session_id_unique UNIQUE (session_id);

-- ── 2. REVIEWS: Reemplazar política INSERT para exigir sesión completada ──
-- La política anterior solo verificaba auth.uid() = patient_id,
-- permitiendo a cualquier paciente reseñar a cualquier terapeuta
-- sin haber tenido una sesión real con él.
DROP POLICY IF EXISTS "reviews_insert" ON reviews;

CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id       = reviews.session_id
        AND sessions.patient_id   = auth.uid()
        AND sessions.therapist_id = reviews.therapist_id
        AND sessions.status       = 'completed'
    )
  );

-- ── 3. REVIEWS: Política UPDATE para que admin pueda moderar ──────
DROP POLICY IF EXISTS "reviews_update_admin" ON reviews;

CREATE POLICY "reviews_update_admin" ON reviews
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. THERAPIST_PROFILES: Restringir datos bancarios/financieros ──
-- La política tp_select permite auth.uid() IS NOT NULL — cualquier
-- usuario autenticado puede leer paypal_email, bank_account_number,
-- bank_routing, commission_rate de todos los terapeutas.
-- Fix: solo el propietario y el admin ven los campos sensibles.
-- Como PostgreSQL RLS opera a nivel de fila (no de columna), la solución
-- es crear una vista pública sin esos campos y mantener acceso completo
-- solo al propietario + admin.

-- Política para acceso público (campos no sensibles — ya filtrado por query)
-- La política existente (auth.uid() IS NOT NULL) se mantiene para SELECT,
-- pero documentamos que el frontend DEBE hacer SELECT explícito de columnas.
-- El verdadero riesgo está en queries SELECT * — los corregimos en el frontend.

-- Agregamos política UPDATE restrictiva: solo el propietario puede actualizar
-- sus propios datos financieros, y solo el admin puede cambiar commission_rate,
-- subscription_plan y plan_expires_at.
DROP POLICY IF EXISTS "tp_update" ON therapist_profiles;

CREATE POLICY "tp_update_own" ON therapist_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin puede actualizar cualquier perfil (para aprobar verificaciones, cambiar plan)
DROP POLICY IF EXISTS "tp_update_admin" ON therapist_profiles;

CREATE POLICY "tp_update_admin" ON therapist_profiles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 5. SUBSCRIPTION_PAYMENTS: Agregar política UPDATE ────────────
-- Faltaba política UPDATE — las Edge Functions usan service_role
-- (bypass RLS) pero es buena práctica tenerla definida explícitamente.
DROP POLICY IF EXISTS "sp_update_admin" ON subscription_payments;

CREATE POLICY "sp_update_admin" ON subscription_payments
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR therapist_id = auth.uid()
  );


-- ════════════════════ [migration_fix_availability.sql] ════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Fix therapist_availability — RLS + UNIQUE constraint
-- Ejecutar en Supabase SQL Editor (una sola vez)
--
-- Problema 1: políticas RLS con FOR ALL USING(...) sin WITH CHECK
--   explícito no cubren INSERT en PostgreSQL 15+ (Supabase).
--   Error: 42501 — new row violates row-level security policy.
--
-- Problema 2: upsert con onConflict requería UNIQUE constraint
--   que no existía. Reemplazado por DELETE+INSERT en el frontend.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Corregir políticas RLS ─────────────────────────────────────
DROP POLICY IF EXISTS "ta_all"    ON therapist_availability;
DROP POLICY IF EXISTS "ta_select" ON therapist_availability;

CREATE POLICY "ta_select" ON therapist_availability
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ta_insert" ON therapist_availability
  FOR INSERT WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "ta_update" ON therapist_availability
  FOR UPDATE USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "ta_delete" ON therapist_availability
  FOR DELETE USING (auth.uid() = therapist_id);

-- ── 2. Agregar UNIQUE constraint (opcional, mejora integridad) ────
ALTER TABLE therapist_availability
  ALTER COLUMN day_of_week SET NOT NULL;

ALTER TABLE therapist_availability
  DROP CONSTRAINT IF EXISTS therapist_availability_therapist_day_unique;

ALTER TABLE therapist_availability
  ADD CONSTRAINT therapist_availability_therapist_day_unique
  UNIQUE (therapist_id, day_of_week);


-- ════════════════════ [fixes inline v16/v17 — solo estaban en el dashboard] ════════════════════

-- v16: trigger handle_new_user robusto (search_path + exception handler)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name','Usuario'),
          NEW.email, COALESCE(NEW.raw_user_meta_data->>'role','client'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user() error for user %: % (%)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END; $fn$;

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- v17: profiles_select simple (las versiones con JOINs crasheaban PostgREST)
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ════════════════════ [migration_refunds.sql] ════════════════════

-- =============================================================
-- migration_refunds.sql
-- Sistema de reembolsos con política temporal:
--   > 24h antes  → 100% reembolso
--   2-24h antes  → 50% reembolso
--   < 2h antes   → sin reembolso (cancelación bloqueada)
-- =============================================================

CREATE TABLE IF NOT EXISTS refunds (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id        UUID NOT NULL REFERENCES sessions(id),
  patient_id        UUID NOT NULL REFERENCES profiles(id),
  therapist_id      UUID NOT NULL REFERENCES profiles(id),
  original_amount   NUMERIC(10,2) NOT NULL,
  refund_percentage INT NOT NULL CHECK (refund_percentage IN (0, 50, 100)),
  refund_amount     NUMERIC(10,2) NOT NULL,
  paypal_capture_id TEXT,          -- capture ID original de la sesión
  paypal_refund_id  TEXT,          -- ID del reembolso en PayPal
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','processing','completed','failed','disputed','resolved')),
  reason            TEXT,          -- motivo del paciente
  admin_notes       TEXT,          -- notas del admin en disputas
  processed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_session   ON refunds (session_id);
CREATE INDEX IF NOT EXISTS idx_refunds_patient   ON refunds (patient_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status    ON refunds (status);

-- RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "refunds_patient_select" ON refunds
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "refunds_patient_insert" ON refunds
  FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "refunds_admin_all" ON refunds
  FOR ALL USING (is_admin());



-- ════════════════════ [migration_add_profile_fields.sql] ════════════════════

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


-- ════════════════════ [migration_payouts_and_payment_fields.sql] ════════════════════

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


-- ════════════════════ [migration_commission_rates.sql] ════════════════════

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


-- ════════════════════ [migration_public_reviews.sql] ════════════════════

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


-- ════════════════════ [migration_deletion_requests.sql] ════════════════════

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


-- ════════════════════ [migration_emergency_contacts.sql] ════════════════════

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


-- ════════════════════ [migration_device_tokens.sql] ════════════════════

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


-- ════════════════════ [migration_fix_messages_policies.sql] ════════════════════

-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Restaurar políticas RLS de messages
-- ✅ EJECUTADO en producción 2026-06-12
--
-- Causa raíz: la política INSERT de messages desapareció (probablemente
-- recreada a medias en el dashboard en alguna sesión anterior). Con RLS
-- activo y sin política INSERT, todo insert se rechaza por defecto →
-- error 42501 "new row violates row-level security policy" al enviar
-- mensajes en el chat (web y app nativa).
--
-- Lección: todo cambio de políticas ejecutado en el dashboard debe
-- guardarse también como archivo de migración en /supabase/.
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Receptor puede marcar como leído (read_at) — indicador Leído/Enviado
DROP POLICY IF EXISTS "messages_update_receiver" ON messages;
CREATE POLICY "messages_update_receiver" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- messages_delete ya existía: FOR DELETE USING (auth.uid() = sender_id)

-- Verificación (4 filas: DELETE, INSERT, SELECT, UPDATE):
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'messages';


-- ════════════════════ [SEEDS — catálogo psicométrico] ════════════════════


-- ──────────── [seed_psychometrics.sql] ────────────

-- =============================================================
-- PSICONECTA — Seed Data: Instrumentos Psicométricos
-- PHQ-9, GAD-7, DASS-21, PCL-5, BIG FIVE (NEO-FFI)
-- =============================================================

-- ─── HELPER: función para obtener section_id por test slug ───
-- Usamos CTEs para mantener referencias limpias

-- =============================================================
-- 1. PHQ-9 — Patient Health Questionnaire (Depresión)
-- Kroenke, Spitzer & Williams (2001) | Dominio público
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'phq9',
    'PHQ-9 — Cuestionario de Salud del Paciente',
    'Instrumento de 9 ítems para el cribado y seguimiento de la severidad de la depresión mayor. Cada ítem corresponde a un criterio diagnóstico del DSM-5. El ítem 9 evalúa pensamientos de muerte y es alerta obligatoria.',
    'sintomas', 'public_domain', 1,
    'Kroenke K, Spitzer RL, Williams JB (2001)',
    13, 5, '["self"]'::jsonb,
    7, 5.0, ARRAY['clinica','tcc','pareja','infantil']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'PHQ-9',
    'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, 'Poco interés o placer en hacer cosas', 'PHQ9_Q1', 'likert', 'total', NULL),
    ((SELECT id FROM s), 1, 'Sentirse desanimado/a, deprimido/a o sin esperanza', 'PHQ9_Q2', 'likert', 'total', NULL),
    ((SELECT id FROM s), 2, 'Problemas para dormir o para permanecer dormido/a, o dormir demasiado', 'PHQ9_Q3', 'likert', 'total', NULL),
    ((SELECT id FROM s), 3, 'Sentirse cansado/a o tener poca energía', 'PHQ9_Q4', 'likert', 'total', NULL),
    ((SELECT id FROM s), 4, 'Tener poco apetito o comer en exceso', 'PHQ9_Q5', 'likert', 'total', NULL),
    ((SELECT id FROM s), 5, 'Sentirse mal consigo mismo/a, o sentir que es un fracaso o que ha decepcionado a su familia o a usted mismo/a', 'PHQ9_Q6', 'likert', 'total', NULL),
    ((SELECT id FROM s), 6, 'Problemas para concentrarse en cosas tales como leer el periódico o ver la televisión', 'PHQ9_Q7', 'likert', 'total', NULL),
    ((SELECT id FROM s), 7, 'Se ha movido o hablado tan despacio que otras personas lo han notado, o lo contrario: ha estado tan inquieto/a que se ha movido mucho más de lo habitual', 'PHQ9_Q8', 'likert', 'total', NULL),
    ((SELECT id FROM s), 8, 'Pensamientos de que estaría mejor muerto/a o de hacerse daño de alguna manera', 'PHQ9_Q9', 'likert', 'total', 1)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nunca', 0),
  (1, 'Varios días', 1),
  (2, 'Más de la mitad de los días', 2),
  (3, 'Casi todos los días', 3)
) AS o(order_index, label, value);

-- Scoring rules PHQ-9
WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Puntuación Total', 'sum',
    ARRAY['PHQ9_Q1','PHQ9_Q2','PHQ9_Q3','PHQ9_Q4','PHQ9_Q5','PHQ9_Q6','PHQ9_Q7','PHQ9_Q8','PHQ9_Q9'],
    1.0
  FROM tests t WHERE t.slug = 'phq9'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  4,  'Mínimo',   'minimal',  '#22c55e', 'Sin depresión significativa. Síntomas dentro del rango normal.', 'Monitoreo rutinario. Reaplicar en 4 semanas si el clínico lo considera pertinente.', FALSE),
  ((SELECT id FROM sr), 5,  9,  'Leve',     'mild',     '#86efac', 'Depresión leve. Algunos síntomas presentes pero funcionalidad conservada.', 'Psicoeducación y técnicas de autoayuda. Considerar seguimiento en 2 semanas.', FALSE),
  ((SELECT id FROM sr), 10, 14, 'Moderado', 'moderate', '#f59e0b', 'Depresión moderada. Impacto notable en funcionamiento diario.', 'Intervención terapéutica activa indicada. Considerar evaluación de tratamiento farmacológico.', FALSE),
  ((SELECT id FROM sr), 15, 19, 'Moderadamente severo', 'moderately_severe', '#f97316', 'Depresión moderadamente severa. Funcionamiento significativamente comprometido.', 'Tratamiento activo urgente: psicoterapia y evaluación psiquiátrica recomendada.', FALSE),
  ((SELECT id FROM sr), 20, 27, 'Severo',   'severe',   '#ef4444', 'Depresión severa. Riesgo alto. Requiere atención inmediata.', 'Derivación urgente o evaluación psiquiátrica. Protocolo de seguridad si hay ideación suicida.', TRUE);


-- =============================================================
-- 2. GAD-7 — Generalized Anxiety Disorder Scale
-- Spitzer et al. (2006) | Dominio público
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'gad7',
    'GAD-7 — Escala de Trastorno de Ansiedad Generalizada',
    'Instrumento de 7 ítems para el cribado y seguimiento de la severidad del trastorno de ansiedad generalizada. Frecuentemente usado junto al PHQ-9 para evaluación de salud mental general.',
    'sintomas', 'public_domain', 1,
    'Spitzer RL, Kroenke K, Williams JBW, Löwe B (2006)',
    13, 5, '["self"]'::jsonb,
    14, 4.0, ARRAY['clinica','tcc','pareja']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'GAD-7',
    'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
  VALUES
    ((SELECT id FROM s), 0, 'Sentirse nervioso/a, ansioso/a o muy alterado/a', 'GAD7_Q1', 'likert', 'total'),
    ((SELECT id FROM s), 1, 'No poder dejar de preocuparse o no poder controlar la preocupación', 'GAD7_Q2', 'likert', 'total'),
    ((SELECT id FROM s), 2, 'Preocuparse demasiado por diferentes cosas', 'GAD7_Q3', 'likert', 'total'),
    ((SELECT id FROM s), 3, 'Dificultad para relajarse', 'GAD7_Q4', 'likert', 'total'),
    ((SELECT id FROM s), 4, 'Estar tan inquieto/a que resulta difícil permanecer sentado/a tranquilamente', 'GAD7_Q5', 'likert', 'total'),
    ((SELECT id FROM s), 5, 'Irritarse o molestarse con facilidad', 'GAD7_Q6', 'likert', 'total'),
    ((SELECT id FROM s), 6, 'Sentir miedo como si algo horrible fuera a pasar', 'GAD7_Q7', 'likert', 'total')
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nunca', 0),
  (1, 'Varios días', 1),
  (2, 'Más de la mitad de los días', 2),
  (3, 'Casi todos los días', 3)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Puntuación Total', 'sum',
    ARRAY['GAD7_Q1','GAD7_Q2','GAD7_Q3','GAD7_Q4','GAD7_Q5','GAD7_Q6','GAD7_Q7'],
    1.0
  FROM tests t WHERE t.slug = 'gad7'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  4,  'Mínimo',   'minimal',  '#22c55e', 'Sin ansiedad significativa.', 'Monitoreo rutinario.', FALSE),
  ((SELECT id FROM sr), 5,  9,  'Leve',     'mild',     '#86efac', 'Ansiedad leve. Funcionalidad conservada.', 'Técnicas de relajación y psicoeducación. Seguimiento en 2-3 semanas.', FALSE),
  ((SELECT id FROM sr), 10, 14, 'Moderado', 'moderate', '#f59e0b', 'Ansiedad moderada. Impacto en funcionamiento.', 'Intervención terapéutica indicada. TCC con foco en preocupación crónica.', FALSE),
  ((SELECT id FROM sr), 15, 21, 'Severo',   'severe',   '#ef4444', 'Ansiedad severa. Funcionamiento significativamente comprometido.', 'Tratamiento activo urgente. Evaluación para tratamiento farmacológico coadyuvante.', TRUE);


-- =============================================================
-- 3. DASS-21 — Depression Anxiety Stress Scales
-- Lovibond & Lovibond (1995) | Dominio público
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'dass21',
    'DASS-21 — Escalas de Depresión, Ansiedad y Estrés',
    'Instrumento de 21 ítems que mide tres estados emocionales negativos: depresión, ansiedad y estrés. Cada subescala tiene 7 ítems. Los scores se multiplican por 2 para equivalencia con el DASS-42.',
    'sintomas', 'public_domain', 1,
    'Lovibond SH, Lovibond PF (1995)',
    18, 10, '["self"]'::jsonb,
    21, 6.0, ARRAY['clinica','tcc']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'DASS-21',
    'Por favor lea cada afirmación y elija un número del 0 al 3 que indique cuánto se aplica a usted durante la semana pasada. No hay respuestas correctas o incorrectas.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
  VALUES
    ((SELECT id FROM s), 0,  'Me costó mucho relajarme',                                            'DASS21_Q1',  'likert', 'estres'),
    ((SELECT id FROM s), 1,  'Me di cuenta que tenía la boca seca',                                 'DASS21_Q2',  'likert', 'ansiedad'),
    ((SELECT id FROM s), 2,  'No podía sentir ningún sentimiento positivo',                         'DASS21_Q3',  'likert', 'depresion'),
    ((SELECT id FROM s), 3,  'Tuve dificultad en respirar (respiración acelerada, falta de aire)',  'DASS21_Q4',  'likert', 'ansiedad'),
    ((SELECT id FROM s), 4,  'Me costó mucho tener iniciativa para hacer cosas',                    'DASS21_Q5',  'likert', 'depresion'),
    ((SELECT id FROM s), 5,  'Reaccioné exageradamente en ciertas situaciones',                     'DASS21_Q6',  'likert', 'estres'),
    ((SELECT id FROM s), 6,  'Sentí que mis manos temblaban',                                       'DASS21_Q7',  'likert', 'ansiedad'),
    ((SELECT id FROM s), 7,  'Sentí que tenía muchos nervios',                                      'DASS21_Q8',  'likert', 'estres'),
    ((SELECT id FROM s), 8,  'Estaba preocupado por situaciones en que podía tener pánico',         'DASS21_Q9',  'likert', 'ansiedad'),
    ((SELECT id FROM s), 9,  'Sentí que no tenía nada que esperar',                                 'DASS21_Q10', 'likert', 'depresion'),
    ((SELECT id FROM s), 10, 'Noté que me estaba agitando',                                         'DASS21_Q11', 'likert', 'estres'),
    ((SELECT id FROM s), 11, 'Me fue difícil relajarme',                                            'DASS21_Q12', 'likert', 'estres'),
    ((SELECT id FROM s), 12, 'Me sentí triste y deprimido/a',                                       'DASS21_Q13', 'likert', 'depresion'),
    ((SELECT id FROM s), 13, 'No toleré nada que no me dejara continuar con lo que estaba haciendo','DASS21_Q14', 'likert', 'estres'),
    ((SELECT id FROM s), 14, 'Sentí que estaba al punto de pánico',                                 'DASS21_Q15', 'likert', 'ansiedad'),
    ((SELECT id FROM s), 15, 'No me pude entusiasmar con nada',                                     'DASS21_Q16', 'likert', 'depresion'),
    ((SELECT id FROM s), 16, 'Sentí que valía muy poco como persona',                               'DASS21_Q17', 'likert', 'depresion'),
    ((SELECT id FROM s), 17, 'Sentí que estaba muy irritable',                                      'DASS21_Q18', 'likert', 'estres'),
    ((SELECT id FROM s), 18, 'Sentí latidos de mi corazón a pesar de no haber hecho esfuerzo físico','DASS21_Q19','likert', 'ansiedad'),
    ((SELECT id FROM s), 19, 'Tuve miedo sin razón',                                                'DASS21_Q20', 'likert', 'ansiedad'),
    ((SELECT id FROM s), 20, 'Sentí que la vida no tenía ningún sentido',                           'DASS21_Q21', 'likert', 'depresion')
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'No me aplicó nada', 0),
  (1, 'Me aplicó un poco, o durante parte del tiempo', 1),
  (2, 'Me aplicó bastante, o durante una buena parte del tiempo', 2),
  (3, 'Me aplicó mucho, o la mayor parte del tiempo', 3)
) AS o(order_index, label, value);

-- Scoring rules DASS-21 (x2 para equivalencia con DASS-42)
DO $$
DECLARE v_test_id UUID; v_sr_dep UUID; v_sr_anx UUID; v_sr_str UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'dass21';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test_id, 'depresion', 'Depresión', 'sum',
    ARRAY['DASS21_Q3','DASS21_Q5','DASS21_Q10','DASS21_Q13','DASS21_Q16','DASS21_Q17','DASS21_Q21'], 2.0)
  RETURNING id INTO v_sr_dep;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test_id, 'ansiedad', 'Ansiedad', 'sum',
    ARRAY['DASS21_Q2','DASS21_Q4','DASS21_Q7','DASS21_Q9','DASS21_Q15','DASS21_Q19','DASS21_Q20'], 2.0)
  RETURNING id INTO v_sr_anx;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test_id, 'estres', 'Estrés', 'sum',
    ARRAY['DASS21_Q1','DASS21_Q6','DASS21_Q8','DASS21_Q11','DASS21_Q12','DASS21_Q14','DASS21_Q18'], 2.0)
  RETURNING id INTO v_sr_str;

  -- Rangos Depresión
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, is_risk_level)
  VALUES
    (v_sr_dep, 0,  9,  'Normal',              'normal',    '#22c55e', 'Sin síntomas depresivos significativos.', FALSE),
    (v_sr_dep, 10, 13, 'Leve',                'mild',      '#86efac', 'Depresión leve.', FALSE),
    (v_sr_dep, 14, 20, 'Moderado',            'moderate',  '#f59e0b', 'Depresión moderada.', FALSE),
    (v_sr_dep, 21, 27, 'Severo',              'severe',    '#f97316', 'Depresión severa.', FALSE),
    (v_sr_dep, 28, 99, 'Extremadamente Severo','extreme',  '#ef4444', 'Depresión extremadamente severa. Alerta clínica.', TRUE);

  -- Rangos Ansiedad
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, is_risk_level)
  VALUES
    (v_sr_anx, 0,  7,  'Normal',              'normal',    '#22c55e', 'Sin síntomas ansiosos significativos.', FALSE),
    (v_sr_anx, 8,  9,  'Leve',                'mild',      '#86efac', 'Ansiedad leve.', FALSE),
    (v_sr_anx, 10, 14, 'Moderado',            'moderate',  '#f59e0b', 'Ansiedad moderada.', FALSE),
    (v_sr_anx, 15, 19, 'Severo',              'severe',    '#f97316', 'Ansiedad severa.', FALSE),
    (v_sr_anx, 20, 99, 'Extremadamente Severo','extreme',  '#ef4444', 'Ansiedad extremadamente severa.', TRUE);

  -- Rangos Estrés
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, is_risk_level)
  VALUES
    (v_sr_str, 0,  14, 'Normal',              'normal',    '#22c55e', 'Sin estrés significativo.', FALSE),
    (v_sr_str, 15, 18, 'Leve',                'mild',      '#86efac', 'Estrés leve.', FALSE),
    (v_sr_str, 19, 25, 'Moderado',            'moderate',  '#f59e0b', 'Estrés moderado.', FALSE),
    (v_sr_str, 26, 33, 'Severo',              'severe',    '#f97316', 'Estrés severo.', FALSE),
    (v_sr_str, 34, 99, 'Extremadamente Severo','extreme',  '#ef4444', 'Estrés extremadamente severo.', TRUE);
END $$;


-- =============================================================
-- 4. PCL-5 — PTSD Checklist for DSM-5
-- Weathers et al. (2013) | Dominio público (VA)
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'pcl5',
    'PCL-5 — Lista de Verificación de PTSD para el DSM-5',
    'Instrumento de 20 ítems para el cribado y monitoreo del Trastorno de Estrés Postraumático según criterios DSM-5. Organizado en 4 clusters: intrusión, evitación, cogniciones/ánimo negativos e hiperactivación.',
    'sintomas', 'public_domain', 1,
    'Weathers FW, Litz BT, Keane TM, Palmieri PA, Marx BP, Schnurr PP (2013)',
    18, 10, '["self"]'::jsonb,
    30, 10.0, ARRAY['clinica','tcc']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'PCL-5',
    'A continuación hay una lista de problemas que las personas a veces tienen en respuesta a una experiencia muy estresante. Pensando en su experiencia más estresante durante el último mes, ¿cuánto le ha molestado cada problema?'
  FROM t RETURNING id
)
INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
VALUES
  ((SELECT id FROM s), 0,  'Recuerdos repetitivos, perturbadores e involuntarios de la experiencia estresante',                                    'PCL5_Q1',  'likert', 'intrusion'),
  ((SELECT id FROM s), 1,  'Sueños perturbadores de la experiencia estresante',                                                                   'PCL5_Q2',  'likert', 'intrusion'),
  ((SELECT id FROM s), 2,  'De repente sentirse o actuar como si la experiencia estresante estuviera ocurriendo de nuevo (flashbacks)',            'PCL5_Q3',  'likert', 'intrusion'),
  ((SELECT id FROM s), 3,  'Sentirse muy molesto/a cuando algo le recuerda la experiencia estresante',                                            'PCL5_Q4',  'likert', 'intrusion'),
  ((SELECT id FROM s), 4,  'Tener fuertes reacciones físicas cuando algo le recuerda la experiencia estresante',                                  'PCL5_Q5',  'likert', 'intrusion'),
  ((SELECT id FROM s), 5,  'Evitar recuerdos, pensamientos o sentimientos relacionados con la experiencia estresante',                            'PCL5_Q6',  'likert', 'evitacion'),
  ((SELECT id FROM s), 6,  'Evitar recordatorios externos de la experiencia estresante (personas, lugares, conversaciones, actividades, objetos)', 'PCL5_Q7',  'likert', 'evitacion'),
  ((SELECT id FROM s), 7,  'Dificultad para recordar partes importantes de la experiencia estresante',                                            'PCL5_Q8',  'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 8,  'Tener creencias negativas fuertes sobre sí mismo/a, otras personas o el mundo',                                      'PCL5_Q9',  'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 9,  'Culparse a sí mismo/a o a otros por la experiencia estresante o lo que sucedió después',                             'PCL5_Q10', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 10, 'Tener sentimientos negativos fuertes como miedo, horror, enojo, culpa o vergüenza',                                  'PCL5_Q11', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 11, 'Perder interés en actividades que antes disfrutaba',                                                                  'PCL5_Q12', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 12, 'Sentirse distante o alejado de otras personas',                                                                       'PCL5_Q13', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 13, 'Dificultad para experimentar sentimientos positivos',                                                                 'PCL5_Q14', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 14, 'Comportamiento irritable, arrebatos de ira o agresión',                                                               'PCL5_Q15', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 15, 'Asumir demasiados riesgos o hacer cosas que podrían causarle daño',                                                  'PCL5_Q16', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 16, 'Estar demasiado alerta, vigilante o en guardia',                                                                      'PCL5_Q17', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 17, 'Sentirse sobresaltado/a o asustado/a fácilmente',                                                                     'PCL5_Q18', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 18, 'Dificultad para concentrarse',                                                                                        'PCL5_Q19', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 19, 'Dificultad para conciliar o mantener el sueño',                                                                       'PCL5_Q20', 'likert', 'hiperactivacion');

-- Response options PCL-5 (0-4)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM items i
JOIN test_sections s ON s.id = i.section_id
JOIN tests t ON t.id = s.test_id AND t.slug = 'pcl5'
CROSS JOIN (VALUES
  (0, 'Nada', 0),
  (1, 'Un poco', 1),
  (2, 'Moderadamente', 2),
  (3, 'Bastante', 3),
  (4, 'Extremadamente', 4)
) AS o(order_index, label, value);

-- Scoring rules PCL-5
DO $$
DECLARE v_test_id UUID; v_total UUID; v_intr UUID; v_evit UUID; v_cog UUID; v_hip UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'pcl5';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'total', 'Puntuación Total', 'sum',
    ARRAY['PCL5_Q1','PCL5_Q2','PCL5_Q3','PCL5_Q4','PCL5_Q5','PCL5_Q6','PCL5_Q7','PCL5_Q8',
          'PCL5_Q9','PCL5_Q10','PCL5_Q11','PCL5_Q12','PCL5_Q13','PCL5_Q14','PCL5_Q15',
          'PCL5_Q16','PCL5_Q17','PCL5_Q18','PCL5_Q19','PCL5_Q20'])
  RETURNING id INTO v_total;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'intrusion', 'Intrusión (Criterio B)', 'sum', ARRAY['PCL5_Q1','PCL5_Q2','PCL5_Q3','PCL5_Q4','PCL5_Q5'])
  RETURNING id INTO v_intr;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'evitacion', 'Evitación (Criterio C)', 'sum', ARRAY['PCL5_Q6','PCL5_Q7'])
  RETURNING id INTO v_evit;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'cognicion_animo', 'Cognición y Ánimo Negativos (Criterio D)', 'sum',
    ARRAY['PCL5_Q8','PCL5_Q9','PCL5_Q10','PCL5_Q11','PCL5_Q12','PCL5_Q13','PCL5_Q14'])
  RETURNING id INTO v_cog;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'hiperactivacion', 'Hiperactivación (Criterio E)', 'sum',
    ARRAY['PCL5_Q15','PCL5_Q16','PCL5_Q17','PCL5_Q18','PCL5_Q19','PCL5_Q20'])
  RETURNING id INTO v_hip;

  -- Rangos total
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_total, 0,  19, 'Subclínico',     'subclinical', '#22c55e', 'Síntomas de estrés postraumático subclinicos.', 'Monitoreo. Psicoeducación sobre respuestas al trauma.', FALSE),
    (v_total, 20, 49, 'Moderado',        'moderate',   '#f59e0b', 'Síntomas de PTSD moderados. Posible diagnóstico.', 'Evaluación diagnóstica formal. TCC centrada en trauma o EMDR recomendado.', FALSE),
    (v_total, 50, 80, 'Severo',          'severe',     '#ef4444', 'PTSD severo. Evaluación clínica urgente.', 'Tratamiento intensivo. Considerar evaluación de riesgo completa. Protocolo de seguridad.', TRUE);
END $$;


-- =============================================================
-- 5. AUDIT — Alcohol Use Disorders Identification Test
-- Saunders et al. (1993) | OMS — Dominio público
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'audit',
    'AUDIT — Test de Identificación de Trastornos por Uso de Alcohol',
    'Instrumento de 10 ítems desarrollado por la OMS para identificar personas con consumo de riesgo, dependencia al alcohol y daño relacionado. Ajuste por género en interpretación.',
    'sintomas', 'public_domain', 1,
    'Saunders JB, Aasland OG, Babor TF, de la Fuente JR, Grant M (1993) — OMS',
    18, 5, '["self"]'::jsonb,
    90, NULL, ARRAY['clinica','tcc']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'AUDIT',
    'Por favor responda las siguientes preguntas sobre su consumo de alcohol durante el último año.'
  FROM t RETURNING id
)
INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
VALUES
  ((SELECT id FROM s), 0, '¿Con qué frecuencia consume alguna bebida alcohólica?', 'AUDIT_Q1', 'likert', 'consumo', NULL),
  ((SELECT id FROM s), 1, '¿Cuántas bebidas alcohólicas suele tomar en un día de consumo normal?', 'AUDIT_Q2', 'likert', 'consumo', NULL),
  ((SELECT id FROM s), 2, '¿Con qué frecuencia toma 6 o más bebidas alcohólicas en una sola ocasión?', 'AUDIT_Q3', 'likert', 'consumo', NULL),
  ((SELECT id FROM s), 3, '¿Con qué frecuencia en el último año no pudo parar de beber una vez que había empezado?', 'AUDIT_Q4', 'likert', 'dependencia', NULL),
  ((SELECT id FROM s), 4, '¿Con qué frecuencia en el último año dejó de hacer algo que debía hacer por beber?', 'AUDIT_Q5', 'likert', 'dependencia', NULL),
  ((SELECT id FROM s), 5, '¿Con qué frecuencia en el último año bebió por la mañana después de haber bebido en exceso el día anterior?', 'AUDIT_Q6', 'likert', 'dependencia', 1),
  ((SELECT id FROM s), 6, '¿Con qué frecuencia en el último año tuvo remordimientos o se sintió culpable después de beber?', 'AUDIT_Q7', 'likert', 'dano', NULL),
  ((SELECT id FROM s), 7, '¿Con qué frecuencia en el último año no pudo recordar lo que sucedió la noche anterior porque estuvo bebiendo?', 'AUDIT_Q8', 'likert', 'dano', NULL),
  ((SELECT id FROM s), 8, '¿Usted o alguna otra persona resultó lesionada a causa de su consumo de alcohol?', 'AUDIT_Q9', 'multiple_choice', 'dano', 2),
  ((SELECT id FROM s), 9, '¿Algún familiar, amigo, médico u otro profesional de la salud ha mostrado preocupación por su consumo de alcohol o le ha sugerido que deje de beber?', 'AUDIT_Q10', 'multiple_choice', 'dano', 2);

-- Scoring rules AUDIT
DO $$
DECLARE v_test_id UUID; v_total UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'audit';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'total', 'Puntuación Total', 'sum',
    ARRAY['AUDIT_Q1','AUDIT_Q2','AUDIT_Q3','AUDIT_Q4','AUDIT_Q5','AUDIT_Q6','AUDIT_Q7','AUDIT_Q8','AUDIT_Q9','AUDIT_Q10'])
  RETURNING id INTO v_total;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_total, 0,  7,  'Consumo de bajo riesgo',        'low_risk',  '#22c55e', 'Consumo dentro de rangos de bajo riesgo.', 'Educación sobre límites de consumo responsable.', FALSE),
    (v_total, 8,  15, 'Consumo de riesgo',              'risky',     '#f59e0b', 'Consumo de riesgo. Posibles problemas relacionados al alcohol.', 'Intervención breve motivacional. Psicoeducación sobre riesgos.', FALSE),
    (v_total, 16, 19, 'Consumo perjudicial',            'harmful',   '#f97316', 'Daño relacionado al alcohol presente.', 'Evaluación diagnóstica. Intervención más intensiva. Considerar derivación especializada.', FALSE),
    (v_total, 20, 40, 'Probable dependencia al alcohol','dependence','#ef4444', 'Alta probabilidad de dependencia al alcohol.', 'Derivación urgente a tratamiento especializado en adicciones. No suspender abruptamente sin supervisión médica.', TRUE);
END $$;


-- =============================================================
-- 6. MoCA — Montreal Cognitive Assessment
-- Nasreddine et al. (2005) | Libre uso con registro
-- NOTA: Requiere registro institucional en mocatest.org
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'moca',
    'MoCA — Evaluación Cognitiva Montreal',
    'Instrumento de cribado cognitivo global de 30 puntos. Evalúa: atención, concentración, funciones ejecutivas, memoria, lenguaje, habilidades visuoconstructivas, pensamiento abstracto, cálculo y orientación. Score se ajusta +1 punto para personas con ≤12 años de educación.',
    'neuropsicologia', 'free_clinical', 1,
    'Nasreddine ZS et al. (2005) — mocatest.org',
    18, 15, '["self"]'::jsonb,
    180, 2.0, ARRAY['neuropsicologia']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'MoCA',
    'Administración presencial o telemática supervisada por profesional. Registre las puntuaciones según el manual oficial (mocatest.org).'
  FROM t RETURNING id
)
INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
VALUES
  ((SELECT id FROM s), 0,  'Alternancia visuoespacial / ejecutiva (5 pts)',           'MOCA_EXEC',    'cognitive_task', 'ejecutiva'),
  ((SELECT id FROM s), 1,  'Copia de cubo (1 pt)',                                    'MOCA_CUBO',    'cognitive_task', 'visuoespacial'),
  ((SELECT id FROM s), 2,  'Dibujo del reloj (3 pts)',                                'MOCA_RELOJ',   'cognitive_task', 'visuoespacial'),
  ((SELECT id FROM s), 3,  'Denominación de animales (3 pts)',                        'MOCA_DENOM',   'cognitive_task', 'lenguaje'),
  ((SELECT id FROM s), 4,  'Dígitos en orden directo (1 pt)',                         'MOCA_DIG_F',   'cognitive_task', 'atencion'),
  ((SELECT id FROM s), 5,  'Dígitos en orden inverso (1 pt)',                         'MOCA_DIG_B',   'cognitive_task', 'atencion'),
  ((SELECT id FROM s), 6,  'Vigilancia auditiva (1 pt)',                              'MOCA_VIGIL',   'cognitive_task', 'atencion'),
  ((SELECT id FROM s), 7,  'Serie de 7s (3 pts)',                                     'MOCA_SERIE7',  'cognitive_task', 'atencion'),
  ((SELECT id FROM s), 8,  'Repetición de frases (2 pts)',                            'MOCA_FRASES',  'cognitive_task', 'lenguaje'),
  ((SELECT id FROM s), 9,  'Fluencia verbal letra F (1 pt)',                          'MOCA_FLUENC',  'cognitive_task', 'lenguaje'),
  ((SELECT id FROM s), 10, 'Similitudes / Abstracción (2 pts)',                       'MOCA_ABSTR',   'cognitive_task', 'ejecutiva'),
  ((SELECT id FROM s), 11, 'Recuerdo diferido sin clave (5 pts)',                     'MOCA_REC',     'cognitive_task', 'memoria'),
  ((SELECT id FROM s), 12, 'Orientación (6 pts)',                                     'MOCA_ORIENT',  'cognitive_task', 'orientacion');

-- Scoring rules MoCA
DO $$
DECLARE v_test_id UUID; v_total UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'moca';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'total', 'Puntuación Total (ajustada)', 'sum',
    ARRAY['MOCA_EXEC','MOCA_CUBO','MOCA_RELOJ','MOCA_DENOM','MOCA_DIG_F','MOCA_DIG_B',
          'MOCA_VIGIL','MOCA_SERIE7','MOCA_FRASES','MOCA_FLUENC','MOCA_ABSTR','MOCA_REC','MOCA_ORIENT'])
  RETURNING id INTO v_total;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_total, 26, 30, 'Normal',                          'normal',   '#22c55e', 'Función cognitiva dentro del rango normal.', 'Sin intervención necesaria. Reaplicar en 12 meses si hay cambios.', FALSE),
    (v_total, 18, 25, 'Deterioro cognitivo leve',        'mci',      '#f59e0b', 'Posible deterioro cognitivo leve (DCL). Requiere evaluación diagnóstica completa.', 'Derivación a neuropsicología para evaluación completa. Descartar causas tratables.', FALSE),
    (v_total, 0,  17, 'Posible demencia',                'dementia', '#ef4444', 'Puntaje compatible con deterioro cognitivo moderado o demencia.', 'Derivación urgente a neurología o psiquiatría. Evaluación neuropsicológica completa.', TRUE);
END $$;


-- =============================================================
-- FIN DEL SEED — 6 instrumentos cargados:
-- PHQ-9, GAD-7, DASS-21, PCL-5, AUDIT, MoCA
-- =============================================================


-- ──────────── [seed_psychometrics_clinica.sql] ────────────

-- =============================================================
-- PSICONECTA — Seed Psicométrico: Clínica General (Parte 2)
-- BDI-II, BAI, SPIN, CAGE, ISI
-- =============================================================

-- =============================================================
-- 1. BDI-II — Beck Depression Inventory II
-- Beck, Steer & Brown (1996) | Pearson (uso clínico libre en investigación)
-- =============================================================
DO $$
DECLARE
  v_test UUID; v_sect UUID; v_sr UUID;
  items UUID[];
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('bdiii', 'BDI-II — Inventario de Depresión de Beck II',
    'Instrumento de 21 ítems que evalúa la presencia y severidad de síntomas depresivos. Cada ítem presenta 4 afirmaciones ordenadas de menor a mayor severidad (0-3). El ítem 9 evalúa ideación suicida y activa alerta inmediata.',
    'sintomas', 'free_clinical', 2,
    'Beck AT, Steer RA, Brown GK (1996)', 13, 10, '["self"]', 7, 5.0,
    ARRAY['clinica','tcc','pareja'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'BDI-II',
    'Este cuestionario consiste en 21 grupos de afirmaciones. Por favor, lea con cuidado cada uno de ellos y, a continuación, señale cuál de las afirmaciones de cada grupo describe mejor cómo se ha sentido durante las últimas dos semanas, incluido el día de hoy.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold) VALUES
    (v_sect,0,'Tristeza: No me siento triste / Me siento triste gran parte del tiempo / Me siento triste continuamente / Me siento tan triste o soy tan infeliz que no puedo soportarlo','BDI2_Q1','likert','total',NULL),
    (v_sect,1,'Pesimismo: No estoy desanimado sobre mi futuro / Me siento más desanimado sobre mi futuro que antes / No espero que las cosas vayan a mejorar / Siento que mi futuro es desesperado y que las cosas solo empeorarán','BDI2_Q2','likert','total',NULL),
    (v_sect,2,'Fracasos pasados: No me siento como un fracasado / He fracasado más de lo que debería / Cuando miro en retrospectiva veo muchos fracasos / Siento que como persona soy un fracaso total','BDI2_Q3','likert','total',NULL),
    (v_sect,3,'Pérdida de placer: Obtengo tanto placer como siempre en las cosas que disfruto / No disfruto tanto de las cosas como antes / Obtengo muy poco placer de las cosas con las que solía disfrutar / No obtengo ningún placer de las cosas que solía disfrutar','BDI2_Q4','likert','total',NULL),
    (v_sect,4,'Sentimientos de culpa: No me siento particularmente culpable / Me siento culpable de muchas cosas que he hecho o debería haber hecho / Me siento bastante culpable la mayor parte del tiempo / Me siento culpable todo el tiempo','BDI2_Q5','likert','total',NULL),
    (v_sect,5,'Sentimientos de castigo: No siento que esté siendo castigado / Siento que quizás esté siendo castigado / Espero ser castigado / Siento que estoy siendo castigado','BDI2_Q6','likert','total',NULL),
    (v_sect,6,'Disconformidad con uno mismo: Siento lo mismo que antes sobre mí mismo / He perdido confianza en mí mismo / Estoy decepcionado conmigo mismo / No me gusto a mí mismo','BDI2_Q7','likert','total',NULL),
    (v_sect,7,'Autocrítica: No me critico ni me culpo más que antes / Soy más crítico conmigo mismo de lo que solía ser / Critico todos mis defectos / Me culpo de todo lo malo que sucede','BDI2_Q8','likert','total',NULL),
    (v_sect,8,'Pensamientos o deseos de suicidio: No tengo ningún pensamiento de hacerme daño / Tengo pensamientos de hacerme daño pero no los llevaré a cabo / Quisiera suicidarme / Me suicidaría si tuviera la oportunidad','BDI2_Q9','likert','total',1),
    (v_sect,9,'Llanto: No lloro más de lo que solía hacerlo / Lloro más de lo que solía hacerlo / Lloro por cualquier pequeñez / Tengo ganas de llorar pero no puedo','BDI2_Q10','likert','total',NULL),
    (v_sect,10,'Agitación: No estoy más inquieto o agitado que de costumbre / Me siento más inquieto o agitado de costumbre / Estoy tan inquieto o agitado que es difícil quedarme quieto / Estoy tan inquieto o agitado que tengo que seguir moviéndome o haciendo algo','BDI2_Q11','likert','total',NULL),
    (v_sect,11,'Pérdida de interés: No he perdido el interés por otras personas o actividades / Estoy menos interesado en otras personas o actividades / He perdido la mayor parte de mi interés en otras personas o actividades / Es difícil interesarme en algo','BDI2_Q12','likert','total',NULL),
    (v_sect,12,'Indecisión: Tomo mis propias decisiones igual que siempre / Me resulta más difícil tomar decisiones que de costumbre / Tengo mucha más dificultad en tomar decisiones de lo que solía tener / Tengo dificultades para tomar cualquier decisión','BDI2_Q13','likert','total',NULL),
    (v_sect,13,'Inutilidad: No siento que sea inútil / No me siento tan valioso o útil como solía sentirme / Me siento más inútil que otras personas / Me siento completamente inútil','BDI2_Q14','likert','total',NULL),
    (v_sect,14,'Pérdida de energía: Tengo tanta energía como siempre / Tengo menos energía de la que solía tener / No tengo suficiente energía para hacer muchas cosas / No tengo suficiente energía para hacer nada','BDI2_Q15','likert','total',NULL),
    (v_sect,15,'Cambios en el sueño: No he experimentado ningún cambio en mis hábitos de sueño / Duermo algo más de lo habitual / Duermo algo menos de lo habitual / Duermo mucho más de lo habitual / Duermo mucho menos de lo habitual / Duermo la mayor parte del día / Me despierto 1-2 horas antes de lo habitual y no puedo volver a dormirme','BDI2_Q16','likert','total',NULL),
    (v_sect,16,'Irritabilidad: No estoy más irritable que de costumbre / Estoy más irritable de lo habitual / Estoy mucho más irritable de lo habitual / Estoy irritable todo el tiempo','BDI2_Q17','likert','total',NULL),
    (v_sect,17,'Cambios en el apetito: No he experimentado ningún cambio en mi apetito / Mi apetito es algo menor de lo habitual / Mi apetito es algo mayor de lo habitual / Mi apetito es mucho menor de lo habitual / Mi apetito es mucho mayor de lo habitual / No tengo nada de apetito / Quiero comer todo el día','BDI2_Q18','likert','total',NULL),
    (v_sect,18,'Dificultad de concentración: Puedo concentrarme tan bien como siempre / No puedo concentrarme tan bien como habitualmente / Me es difícil concentrarme en algo durante mucho tiempo / Encuentro que no puedo concentrarme en nada','BDI2_Q19','likert','total',NULL),
    (v_sect,19,'Cansancio o fatiga: No estoy más cansado o fatigado que de costumbre / Me canso o me fatigo más fácilmente de lo habitual / Estoy demasiado cansado o fatigado para hacer muchas de las cosas que solía hacer / Estoy demasiado cansado o fatigado para hacer la mayoría de las cosas que solía hacer','BDI2_Q20','likert','total',NULL),
    (v_sect,20,'Pérdida de interés en el sexo: No he notado ningún cambio en mi interés por el sexo / Estoy menos interesado en el sexo de lo que solía estar / Ahora estoy mucho menos interesado en el sexo / He perdido completamente el interés en el sexo','BDI2_Q21','likert','total',NULL);

  -- Response options 0-3 para todos los ítems
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES (0,'0',0),(1,'1',1),(2,'2',2),(3,'3',3)) AS o(ord,lbl,val);

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test, 'total', 'Puntuación Total', 'sum',
    ARRAY['BDI2_Q1','BDI2_Q2','BDI2_Q3','BDI2_Q4','BDI2_Q5','BDI2_Q6','BDI2_Q7',
          'BDI2_Q8','BDI2_Q9','BDI2_Q10','BDI2_Q11','BDI2_Q12','BDI2_Q13','BDI2_Q14',
          'BDI2_Q15','BDI2_Q16','BDI2_Q17','BDI2_Q18','BDI2_Q19','BDI2_Q20','BDI2_Q21'], 1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,13,'Mínimo','minimal','#22c55e','Depresión mínima o ausente.','Monitoreo. Reaplicar si el cuadro clínico cambia.',FALSE),
    (v_sr,14,19,'Leve','mild','#86efac','Depresión leve. Algunos síntomas presentes.','Psicoeducación, activación conductual. Seguimiento en 2 semanas.',FALSE),
    (v_sr,20,28,'Moderado','moderate','#f59e0b','Depresión moderada. Impacto funcional significativo.','Intervención psicoterapéutica activa. Evaluar tratamiento farmacológico.',FALSE),
    (v_sr,29,63,'Severo','severe','#ef4444','Depresión severa. Requiere atención clínica inmediata.','Evaluación psiquiátrica urgente. Protocolo de seguridad si hay ideación suicida.',TRUE);
END $$;


-- =============================================================
-- 2. BAI — Beck Anxiety Inventory
-- Beck & Steer (1993) | Pearson (uso clínico libre en investigación)
-- =============================================================
DO $$
DECLARE v_test UUID; v_sect UUID; v_sr UUID;
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('bai', 'BAI — Inventario de Ansiedad de Beck',
    'Instrumento de 21 ítems que mide la severidad de la ansiedad, con énfasis en los síntomas somáticos. Diseñado para discriminar ansiedad de depresión. Complementa al BDI-II.',
    'sintomas', 'free_clinical', 1,
    'Beck AT, Steer RA (1993)', 17, 7, '["self"]', 14, 4.0,
    ARRAY['clinica','tcc'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'BAI',
    'A continuación se presenta una lista de síntomas comunes de ansiedad. Por favor, lea cuidadosamente cada uno de los ítems. Indique cuánto le ha afectado cada síntoma durante la última semana, incluyendo hoy.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale) VALUES
    (v_sect,0,'Entumecimiento u hormigueo','BAI_Q1','likert','total'),
    (v_sect,1,'Sensación de calor','BAI_Q2','likert','total'),
    (v_sect,2,'Temblor en las piernas','BAI_Q3','likert','total'),
    (v_sect,3,'Incapacidad para relajarse','BAI_Q4','likert','total'),
    (v_sect,4,'Miedo a que ocurra lo peor','BAI_Q5','likert','total'),
    (v_sect,5,'Mareo o aturdimiento','BAI_Q6','likert','total'),
    (v_sect,6,'Palpitaciones o aceleración cardíaca','BAI_Q7','likert','total'),
    (v_sect,7,'Inestabilidad o inseguridad','BAI_Q8','likert','total'),
    (v_sect,8,'Terror','BAI_Q9','likert','total'),
    (v_sect,9,'Nerviosismo','BAI_Q10','likert','total'),
    (v_sect,10,'Sensación de ahogo','BAI_Q11','likert','total'),
    (v_sect,11,'Temblores de manos','BAI_Q12','likert','total'),
    (v_sect,12,'Temblor generalizado o estremecimiento','BAI_Q13','likert','total'),
    (v_sect,13,'Miedo a perder el control','BAI_Q14','likert','total'),
    (v_sect,14,'Dificultad para respirar','BAI_Q15','likert','total'),
    (v_sect,15,'Miedo a morir','BAI_Q16','likert','total'),
    (v_sect,16,'Estar asustado/a','BAI_Q17','likert','total'),
    (v_sect,17,'Indigestión o malestar estomacal','BAI_Q18','likert','total'),
    (v_sect,18,'Debilidad','BAI_Q19','likert','total'),
    (v_sect,19,'Rubor o sofoco','BAI_Q20','likert','total'),
    (v_sect,20,'Sudoración (no relacionada con el calor)','BAI_Q21','likert','total');

  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES
    (0,'En absoluto',0),(1,'Levemente, no me molestó mucho',1),
    (2,'Moderadamente, fue muy desagradable pero podía soportarlo',2),
    (3,'Severamente, casi no podía soportarlo',3)) AS o(ord,lbl,val);

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test,'total','Puntuación Total','sum',
    ARRAY['BAI_Q1','BAI_Q2','BAI_Q3','BAI_Q4','BAI_Q5','BAI_Q6','BAI_Q7',
          'BAI_Q8','BAI_Q9','BAI_Q10','BAI_Q11','BAI_Q12','BAI_Q13','BAI_Q14',
          'BAI_Q15','BAI_Q16','BAI_Q17','BAI_Q18','BAI_Q19','BAI_Q20','BAI_Q21'],1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,7,'Mínimo','minimal','#22c55e','Ansiedad mínima o ausente.','Monitoreo rutinario.',FALSE),
    (v_sr,8,15,'Leve','mild','#86efac','Ansiedad leve.','Técnicas de relajación y psicoeducación.',FALSE),
    (v_sr,16,25,'Moderado','moderate','#f59e0b','Ansiedad moderada. Impacto funcional presente.','Intervención terapéutica activa (TCC, técnicas de exposición).',FALSE),
    (v_sr,26,63,'Severo','severe','#ef4444','Ansiedad severa. Consideración de tratamiento combinado.','Evaluación psiquiátrica. TCC intensiva. Considerar farmacoterapia.',TRUE);
END $$;


-- =============================================================
-- 3. SPIN — Social Phobia Inventory
-- Connor et al. (2000) | Dominio público
-- =============================================================
DO $$
DECLARE v_test UUID; v_sect UUID; v_sr UUID;
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('spin', 'SPIN — Inventario de Fobia Social',
    'Instrumento de 17 ítems que evalúa el miedo, la evitación y el malestar fisiológico asociados a situaciones sociales. Diseñado como herramienta de cribado y seguimiento del trastorno de ansiedad social.',
    'sintomas', 'public_domain', 1,
    'Connor KM et al. (2000)', 13, 7, '["self"]', 14, NULL,
    ARRAY['clinica','tcc'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'SPIN',
    'Por favor, ponga una X en la casilla que mejor refleje hasta qué punto los siguientes problemas le afectaron durante la última semana.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale) VALUES
    (v_sect,0,'Tengo miedo a las personas que tienen autoridad','SPIN_Q1','likert','miedo'),
    (v_sect,1,'Me molesta el ruborizarme delante de la gente','SPIN_Q2','likert','fisiologico'),
    (v_sect,2,'Las fiestas y eventos sociales me dan miedo','SPIN_Q3','likert','evitacion'),
    (v_sect,3,'Evito hablar con personas que no conozco','SPIN_Q4','likert','evitacion'),
    (v_sect,4,'Me da miedo que me critiquen','SPIN_Q5','likert','miedo'),
    (v_sect,5,'El miedo a la vergüenza hace que evite hacer cosas o hablar con personas','SPIN_Q6','likert','evitacion'),
    (v_sect,6,'Sudar delante de otras personas me produce angustia','SPIN_Q7','likert','fisiologico'),
    (v_sect,7,'Evito ir a fiestas','SPIN_Q8','likert','evitacion'),
    (v_sect,8,'Evito actividades en las que soy el centro de atención','SPIN_Q9','likert','evitacion'),
    (v_sect,9,'Hablar con desconocidos me da miedo','SPIN_Q10','likert','miedo'),
    (v_sect,10,'Evito dar discursos','SPIN_Q11','likert','evitacion'),
    (v_sect,11,'Haría cualquier cosa para evitar ser criticado/a','SPIN_Q12','likert','evitacion'),
    (v_sect,12,'Los latidos de mi corazón se aceleran cuando estoy con otras personas','SPIN_Q13','likert','fisiologico'),
    (v_sect,13,'Tengo miedo de hacer cosas cuando hay gente mirando','SPIN_Q14','likert','miedo'),
    (v_sect,14,'El mayor temor es quedar en ridículo delante de los demás','SPIN_Q15','likert','miedo'),
    (v_sect,15,'Evito hablar con cualquier figura de autoridad','SPIN_Q16','likert','evitacion'),
    (v_sect,16,'Temblar o estremecerme delante de otras personas me perturba','SPIN_Q17','likert','fisiologico');

  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES
    (0,'Nada',0),(1,'Un poco',1),(2,'Bastante',2),(3,'Mucho',3),(4,'Muchísimo',4)) AS o(ord,lbl,val);

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test,'total','Puntuación Total','sum',
    ARRAY['SPIN_Q1','SPIN_Q2','SPIN_Q3','SPIN_Q4','SPIN_Q5','SPIN_Q6','SPIN_Q7',
          'SPIN_Q8','SPIN_Q9','SPIN_Q10','SPIN_Q11','SPIN_Q12','SPIN_Q13','SPIN_Q14',
          'SPIN_Q15','SPIN_Q16','SPIN_Q17'],1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,18,'Sin fobia social','minimal','#22c55e','No se detecta fobia social significativa.','Monitoreo.',FALSE),
    (v_sr,19,29,'Leve','mild','#86efac','Fobia social leve. Algunas situaciones sociales generan malestar.','Psicoeducación sobre ansiedad social. TCC con componente de exposición gradual.',FALSE),
    (v_sr,30,39,'Moderado','moderate','#f59e0b','Fobia social moderada. Evitación funcional presente.','TCC con exposición. Habilidades sociales. Considerar grupo terapéutico.',FALSE),
    (v_sr,40,49,'Severo','severe','#f97316','Fobia social severa. Deterioro significativo en funcionamiento social.','Tratamiento intensivo. Evaluar farmacoterapia combinada.',TRUE),
    (v_sr,50,68,'Muy severo','extreme','#ef4444','Fobia social muy severa. Deterioro grave en múltiples áreas.','Evaluación psiquiátrica urgente. Tratamiento multimodal intensivo.',TRUE);
END $$;


-- =============================================================
-- 4. CAGE — Alcohol Screening
-- Ewing (1984) | Dominio público
-- =============================================================
DO $$
DECLARE v_test UUID; v_sect UUID; v_sr UUID;
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('cage', 'CAGE — Cribado de Alcohol',
    'Instrumento de 4 ítems de respuesta sí/no para el cribado rápido de problemas con el alcohol. Alta especificidad para dependencia alcohólica. ≥2 respuestas positivas requieren evaluación más exhaustiva.',
    'sintomas', 'public_domain', 1,
    'Ewing JA (1984)', 16, 3, '["self"]', 180, NULL,
    ARRAY['clinica','tcc'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'CAGE',
    'Por favor responda Sí o No a las siguientes preguntas sobre su consumo de alcohol.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold) VALUES
    (v_sect,0,'¿Ha sentido alguna vez que debería beber menos? (Cut down)','CAGE_Q1','multiple_choice','total',NULL),
    (v_sect,1,'¿Le ha molestado que la gente le critique su forma de beber? (Annoyed)','CAGE_Q2','multiple_choice','total',NULL),
    (v_sect,2,'¿Se ha sentido alguna vez mal o culpable por su forma de beber? (Guilty)','CAGE_Q3','multiple_choice','total',NULL),
    (v_sect,3,'¿Alguna vez ha bebido para aliviar el temblor matutino o para calmar los nervios al despertarse? (Eye-opener)','CAGE_Q4','multiple_choice','total',1);

  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES (0,'No',0),(1,'Sí',1)) AS o(ord,lbl,val);

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test,'total','Puntuación Total','sum',ARRAY['CAGE_Q1','CAGE_Q2','CAGE_Q3','CAGE_Q4'],1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,1,'Sin riesgo significativo','minimal','#22c55e','Cribado negativo para dependencia alcohólica.','Educación preventiva si se considera necesario.',FALSE),
    (v_sr,2,4,'Cribado positivo','severe','#ef4444','≥2 respuestas positivas: alta probabilidad de dependencia alcohólica. Requiere evaluación diagnóstica completa (AUDIT recomendado).','Aplicar AUDIT para evaluación más detallada. Entrevista motivacional. Considerar derivación a especialista en adicciones.',TRUE);
END $$;


-- =============================================================
-- 5. ISI — Insomnia Severity Index
-- Morin (1993) | Dominio público
-- =============================================================
DO $$
DECLARE v_test UUID; v_sect UUID; v_sr UUID;
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('isi', 'ISI — Índice de Severidad del Insomnio',
    'Instrumento de 7 ítems que evalúa la naturaleza, severidad y repercusión del insomnio. Mide la dificultad para dormir, insatisfacción con el sueño, interferencia diurna, y nivel de angustia.',
    'sintomas', 'public_domain', 1,
    'Morin CM (1993)', 18, 5, '["self"]', 14, NULL,
    ARRAY['clinica','tcc'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'ISI',
    'Para cada pregunta, por favor rodee con un círculo el número que mejor describa su situación durante las últimas 2 semanas.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale) VALUES
    (v_sect,0,'Dificultad para conciliar el sueño','ISI_Q1','likert','total'),
    (v_sect,1,'Dificultad para mantener el sueño (despertarse durante la noche)','ISI_Q2','likert','total'),
    (v_sect,2,'Despertarse demasiado temprano','ISI_Q3','likert','total'),
    (v_sect,3,'¿Cómo de satisfecho/a está con su sueño actual?','ISI_Q4','likert','total'),
    (v_sect,4,'¿En qué medida considera que su problema de sueño interfiere con su funcionamiento diurno (cansancio, concentración, memoria, humor, rendimiento laboral)?','ISI_Q5','likert','total'),
    (v_sect,5,'¿En qué medida considera que su problema de sueño es perceptible para los demás en cuanto a perjuicio de la calidad de vida?','ISI_Q6','likert','total'),
    (v_sect,6,'¿Cómo de preocupado/a está por su problema de sueño actual?','ISI_Q7','likert','total');

  -- Q1-Q3 y Q5-Q7: Ninguna→Leve→Moderada→Intensa→Muy intensa (0-4)
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES
    (0,'Ninguna',0),(1,'Leve',1),(2,'Moderada',2),(3,'Intensa',3),(4,'Muy intensa',4)) AS o(ord,lbl,val)
  WHERE i.item_code IN ('ISI_Q1','ISI_Q2','ISI_Q3','ISI_Q5','ISI_Q6','ISI_Q7');

  -- Q4 escala inversa: Muy satisfecho→Muy insatisfecho
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES
    (0,'Muy satisfecho/a',0),(1,'Satisfecho/a',1),(2,'Ni satisfecho/a ni insatisfecho/a',2),
    (3,'Insatisfecho/a',3),(4,'Muy insatisfecho/a',4)) AS o(ord,lbl,val)
  WHERE i.item_code = 'ISI_Q4';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test,'total','Puntuación Total','sum',
    ARRAY['ISI_Q1','ISI_Q2','ISI_Q3','ISI_Q4','ISI_Q5','ISI_Q6','ISI_Q7'],1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,7,'Sin insomnio clínicamente significativo','minimal','#22c55e','Sin insomnio clínico.','Higiene del sueño preventiva.',FALSE),
    (v_sr,8,14,'Insomnio subumbral','mild','#86efac','Insomnio por debajo del umbral clínico. Puede requerir atención.','Psicoeducación sobre higiene del sueño. TCC para insomnio (TCC-I) preventiva.',FALSE),
    (v_sr,15,21,'Insomnio moderado','moderate','#f59e0b','Insomnio clínico moderado.','TCC-I estructurada. Evaluar causas subyacentes (ansiedad, depresión).',FALSE),
    (v_sr,22,28,'Insomnio severo','severe','#ef4444','Insomnio clínico severo. Deterioro significativo.','TCC-I intensiva. Evaluación médica para descartar causas orgánicas. Considerar farmacoterapia a corto plazo.',TRUE);
END $$;

-- =============================================================
-- FIN: Clínica General — BDI-II, BAI, SPIN, CAGE, ISI cargados
-- =============================================================
