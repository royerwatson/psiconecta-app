-- migration_assessment_sessions.sql
-- Tablas para el flujo de evaluaciones psicométricas con reporte Claude

-- 1. Sesiones de evaluación (una por test completado)
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug              TEXT        NOT NULL,                          -- 'ansiedad', 'depresion', etc.
  instrument        TEXT        NOT NULL,                          -- 'GAD-7', 'PHQ-9', etc.
  instrument_full   TEXT        NOT NULL,
  responses         JSONB       NOT NULL,                          -- [{index, value, label}]
  total_score       INTEGER     NOT NULL,
  max_score         INTEGER     NOT NULL,
  severity_label    TEXT        NOT NULL,
  severity_hex      TEXT        NOT NULL,
  dimension_scores  JSONB,                                         -- [{name, raw, max, pct}]
  paid              BOOLEAN     NOT NULL DEFAULT FALSE,
  amount_paid       DECIMAL(10,2),
  payment_intent_id TEXT,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Reportes generados por Claude (uno por sesión pagada)
CREATE TABLE IF NOT EXISTS assessment_reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID        NOT NULL UNIQUE REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interpretation   TEXT        NOT NULL,   -- 2-3 párrafos contextuales
  normative_context TEXT       NOT NULL,   -- comparación poblacional
  recommendations  JSONB       NOT NULL,   -- [{title, description}]
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_reports   ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario accede a sus sesiones
DROP POLICY IF EXISTS "as_own" ON assessment_sessions;
CREATE POLICY "as_own" ON assessment_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Solo el propio usuario accede a sus reportes
DROP POLICY IF EXISTS "ar_own" ON assessment_reports;
CREATE POLICY "ar_own" ON assessment_reports
  FOR ALL USING (auth.uid() = user_id);

-- Admin puede ver todo
DROP POLICY IF EXISTS "as_admin" ON assessment_sessions;
CREATE POLICY "as_admin" ON assessment_sessions
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "ar_admin" ON assessment_reports;
CREATE POLICY "ar_admin" ON assessment_reports
  FOR ALL USING (is_admin());

-- Índices
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user    ON assessment_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_slug    ON assessment_sessions (slug);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_paid    ON assessment_sessions (paid);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_session  ON assessment_reports (session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_user     ON assessment_reports (user_id);
