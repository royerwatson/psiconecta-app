-- ─────────────────────────────────────────────────────────────────────────────
-- migration_subscription_update.sql
-- Actualiza modelo de suscripción a 2 planes:
--   basic — Gratuito, 10% comisión (funciones core)
--   pro   — $50/mes, 10% comisión (+ herramientas clínicas)
--
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Actualizar trigger: pro y premium mantienen 10% (mismo que basic)
--    La diferencia es acceso a funcionalidades, no comisión
CREATE OR REPLACE FUNCTION sync_commission_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- Todos los planes tienen 10% de comisión
  -- El plan pro/premium da acceso a herramientas clínicas, no reduce comisión
  NEW.commission_rate := 0.10;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Sincronizar todas las filas existentes a 10%
UPDATE therapist_profiles SET commission_rate = 0.10;

-- 3. Migrar terapeutas con plan 'premium' a 'pro' (plan eliminado)
UPDATE therapist_profiles
SET subscription_plan = 'pro'
WHERE subscription_plan = 'premium';

-- 4. Comentario actualizado
COMMENT ON COLUMN therapist_profiles.commission_rate IS
  'Tasa de comisión fija: 0.10 (10%) para todos los planes. El plan pro da acceso a herramientas clínicas.';
