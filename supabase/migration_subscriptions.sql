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
