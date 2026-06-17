-- migration_assessment_packs.sql
-- Tablas para el flujo de paquetes temáticos de evaluación

-- 1. Compras de packs (una por pack adquirido)
CREATE TABLE IF NOT EXISTS assessment_pack_purchases (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_slug         TEXT          NOT NULL,                     -- 'bienestar', 'laboral', 'completo'
  tests             JSONB         NOT NULL,                     -- ['ansiedad', 'depresion', 'sueno']
  amount_paid       DECIMAL(10,2),
  payment_intent_id TEXT,
  paid              BOOLEAN       NOT NULL DEFAULT FALSE,
  paid_at           TIMESTAMPTZ,
  session_ids       JSONB         NOT NULL DEFAULT '[]',        -- IDs de assessment_sessions completadas
  completed         BOOLEAN       NOT NULL DEFAULT FALSE,       -- true cuando todos los tests están hechos
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2. Reportes combinados generados por Claude (uno por pack completado)
CREATE TABLE IF NOT EXISTS assessment_pack_reports (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id      UUID          NOT NULL UNIQUE REFERENCES assessment_pack_purchases(id) ON DELETE CASCADE,
  user_id          UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pack_slug        TEXT          NOT NULL,
  combined_report  TEXT          NOT NULL,   -- análisis narrativo cruzado
  cross_analysis   TEXT          NOT NULL,   -- patrones entre dimensiones
  recommendations  JSONB         NOT NULL,   -- [{title, description}]
  session_results  JSONB         NOT NULL,   -- snapshot de cada test
  generated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE assessment_pack_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_pack_reports   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_own"   ON assessment_pack_purchases;
CREATE POLICY "app_own" ON assessment_pack_purchases
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "apr_own"   ON assessment_pack_reports;
CREATE POLICY "apr_own" ON assessment_pack_reports
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "app_admin" ON assessment_pack_purchases;
CREATE POLICY "app_admin" ON assessment_pack_purchases
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "apr_admin" ON assessment_pack_reports;
CREATE POLICY "apr_admin" ON assessment_pack_reports
  FOR ALL USING (is_admin());

-- Índices
CREATE INDEX IF NOT EXISTS idx_app_user    ON assessment_pack_purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_app_slug    ON assessment_pack_purchases (pack_slug);
CREATE INDEX IF NOT EXISTS idx_app_paid    ON assessment_pack_purchases (paid);
CREATE INDEX IF NOT EXISTS idx_apr_purchase ON assessment_pack_reports (purchase_id);
CREATE INDEX IF NOT EXISTS idx_apr_user    ON assessment_pack_reports (user_id);
