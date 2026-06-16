-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Comisiones y pagos para sesiones grupales
-- Plan gratuito: 25% Psiconecta / 75% terapeuta
-- Plan Pro/Premium: 15% Psiconecta / 85% terapeuta
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Agregar group_commission_rate a therapist_profiles ─────────
ALTER TABLE therapist_profiles
  ADD COLUMN IF NOT EXISTS group_commission_rate NUMERIC(4,2) DEFAULT 0.25;

-- ── 2. Poblar con valores según plan actual ───────────────────────
UPDATE therapist_profiles
SET group_commission_rate = CASE subscription_plan
  WHEN 'pro'     THEN 0.15
  WHEN 'premium' THEN 0.15
  ELSE                 0.25
END;

-- ── 3. Actualizar trigger para mantener ambas comisiones en sync ──
CREATE OR REPLACE FUNCTION sync_commission_rate()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.commission_rate := CASE NEW.subscription_plan
    WHEN 'pro'     THEN 0.10
    WHEN 'premium' THEN 0.10
    ELSE                 0.20
  END;
  NEW.group_commission_rate := CASE NEW.subscription_plan
    WHEN 'pro'     THEN 0.15
    WHEN 'premium' THEN 0.15
    ELSE                 0.25
  END;
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN therapist_profiles.group_commission_rate IS
  'Comisión en sesiones grupales: 0.25 (25%) plan Gratuito | 0.15 (15%) plan Pro/Premium';

-- ── 4. Agregar columnas de pago a group_session_participants ──────
ALTER TABLE group_session_participants
  ADD COLUMN IF NOT EXISTS paid              BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS amount_paid       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS platform_fee      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS therapist_net     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at           TIMESTAMPTZ;

-- ── 5. Actualizar therapist_pending_earnings para incluir grupos ──
DROP VIEW IF EXISTS therapist_pending_earnings;
CREATE VIEW therapist_pending_earnings AS
WITH individual AS (
  SELECT
    tp.user_id                                                          AS therapist_id,
    COALESCE(SUM(s.therapist_net) FILTER (WHERE s.status = 'completed'), 0) AS earned,
    COUNT(s.id) FILTER (WHERE s.status = 'completed')                  AS sessions_count
  FROM therapist_profiles tp
  LEFT JOIN sessions s ON s.therapist_id = tp.user_id
  GROUP BY tp.user_id
),
group_earn AS (
  SELECT
    gs.therapist_id,
    COALESCE(SUM(gsp.therapist_net) FILTER (WHERE gsp.paid = true), 0) AS earned,
    COUNT(gsp.id) FILTER (WHERE gsp.paid = true)                        AS sessions_count
  FROM group_sessions gs
  LEFT JOIN group_session_participants gsp ON gsp.group_session_id = gs.id
  GROUP BY gs.therapist_id
),
base AS (
  SELECT
    tp.user_id                                                AS therapist_id,
    p.full_name                                               AS therapist_name,
    tp.specialty,
    tp.payment_method,
    tp.paypal_email,
    tp.bank_name,
    tp.bank_account_name,
    tp.bank_account_number,
    tp.bank_routing,
    COALESCE(i.sessions_count, 0) + COALESCE(g.sessions_count, 0) AS sessions_count,
    COALESCE(i.earned, 0) + COALESCE(g.earned, 0)            AS total_earned,
    COALESCE(
      (SELECT SUM(py.amount) FROM payouts py
       WHERE py.therapist_id = tp.user_id AND py.status = 'completed'), 0
    )                                                         AS total_paid
  FROM therapist_profiles tp
  JOIN profiles p ON p.id = tp.user_id
  LEFT JOIN individual i ON i.therapist_id = tp.user_id
  LEFT JOIN group_earn g ON g.therapist_id = tp.user_id
)
SELECT
  therapist_id,
  therapist_name,
  specialty,
  payment_method,
  paypal_email,
  bank_name,
  bank_account_name,
  bank_account_number,
  bank_routing,
  sessions_count,
  total_earned,
  total_paid,
  total_earned - total_paid AS pending_amount
FROM base
WHERE total_earned - total_paid > 0;

ALTER VIEW therapist_pending_earnings SET (security_invoker = true);
REVOKE ALL ON therapist_pending_earnings FROM anon;
GRANT SELECT ON therapist_pending_earnings TO authenticated;

-- ── 6. RLS: admin puede gestionar participantes ───────────────────
DROP POLICY IF EXISTS "gsp_admin" ON group_session_participants;
CREATE POLICY "gsp_admin" ON group_session_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

SELECT 'Migración group_session_payments completada ✅' AS resultado;
