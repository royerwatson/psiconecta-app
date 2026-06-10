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
