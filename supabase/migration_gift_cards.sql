-- ── Gift Cards & Patient Credits ────────────────────────────────────────────
-- Ejecutar en Supabase Dashboard → SQL Editor

-- 1. Tabla de gift cards
CREATE TABLE IF NOT EXISTS gift_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT UNIQUE NOT NULL,                    -- PSICO-XXXX-XXXX
  amount_usd       DECIMAL(10,2) NOT NULL CHECK (amount_usd >= 25),
  sender_name      TEXT NOT NULL,
  sender_email     TEXT NOT NULL,
  recipient_name   TEXT NOT NULL,
  recipient_email  TEXT NOT NULL,
  message          TEXT,
  paypal_order_id  TEXT,
  paypal_capture_id TEXT,
  status           TEXT NOT NULL DEFAULT 'pending_payment'
                   CHECK (status IN ('pending_payment','paid','redeemed','expired')),
  redeemed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code   ON gift_cards (code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards (status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON gift_cards (recipient_email);

-- RLS: solo service_role puede insertar/actualizar (Edge Functions)
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gift cards visible por recipiente autenticado" ON gift_cards;
CREATE POLICY "Gift cards visible por recipiente autenticado"
  ON gift_cards FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      redeemed_by = auth.uid()
    )
  );

-- 2. Tabla de créditos de pacientes
CREATE TABLE IF NOT EXISTS patient_credits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_usd    DECIMAL(10,2) NOT NULL CHECK (amount_usd > 0),
  source        TEXT NOT NULL DEFAULT 'gift_card' CHECK (source IN ('gift_card', 'refund', 'promo')),
  gift_card_id  UUID REFERENCES gift_cards(id) ON DELETE SET NULL,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_credits_user ON patient_credits (user_id);

ALTER TABLE patient_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Paciente ve sus propios créditos" ON patient_credits;
CREATE POLICY "Paciente ve sus propios créditos"
  ON patient_credits FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Columna credit_used en session_payments para rastrear uso de crédito
ALTER TABLE session_payments
  ADD COLUMN IF NOT EXISTS credit_used_usd DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gift_card_id UUID REFERENCES gift_cards(id) ON DELETE SET NULL;

-- 4. Función para obtener balance de créditos de un usuario
CREATE OR REPLACE FUNCTION get_patient_credit_balance(p_user_id UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(amount_usd), 0)
  FROM patient_credits
  WHERE user_id = p_user_id
    AND (expires_at IS NULL OR expires_at > NOW());
$$ LANGUAGE sql SECURITY DEFINER;
