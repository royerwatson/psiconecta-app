-- migration_annual_billing.sql
-- Agrega soporte para ciclo de facturación anual en suscripciones.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Fecha: 2026-06-14

-- 1. Columna billing_cycle en therapist_profiles
ALTER TABLE therapist_profiles
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'
  CHECK (billing_cycle IN ('monthly', 'annual'));

-- 2. Columna billing_cycle en subscription_payments (para auditoría)
ALTER TABLE subscription_payments
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'
  CHECK (billing_cycle IN ('monthly', 'annual'));

-- 3. Índice para filtrar por ciclo en el panel admin
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_billing_cycle
  ON therapist_profiles (billing_cycle);
