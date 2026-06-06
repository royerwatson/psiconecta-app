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
