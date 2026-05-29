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
