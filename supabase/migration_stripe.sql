-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Soporte de pagos con Stripe
-- Ejecutar en el SQL Editor de Supabase (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- 1. Ampliar el CHECK de status para incluir 'payment_pending'
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_status_check;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('payment_pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));

-- 2. Agregar columnas de pago
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 3. Actualizar la política RLS de sessions para que 'payment_pending'
--    sea visible al paciente (ya están cubiertas por las políticas existentes
--    porque filtran por patient_id/therapist_id, no por status)
--    No se requiere cambio adicional en RLS.

-- 4. Limpiar sesiones payment_pending huérfanas (más de 1 hora sin pagar)
--    Opcional: puedes crear un cron job en Supabase para esto
CREATE OR REPLACE FUNCTION cleanup_pending_sessions()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM sessions
  WHERE status = 'payment_pending'
    AND created_at < NOW() - INTERVAL '1 hour';
END;
$$;

SELECT 'Migración de Stripe completada ✅' AS resultado;
