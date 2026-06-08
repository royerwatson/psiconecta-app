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
