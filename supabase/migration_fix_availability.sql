-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Fix therapist_availability — RLS + UNIQUE constraint
-- Ejecutar en Supabase SQL Editor (una sola vez)
--
-- Problema 1: políticas RLS con FOR ALL USING(...) sin WITH CHECK
--   explícito no cubren INSERT en PostgreSQL 15+ (Supabase).
--   Error: 42501 — new row violates row-level security policy.
--
-- Problema 2: upsert con onConflict requería UNIQUE constraint
--   que no existía. Reemplazado por DELETE+INSERT en el frontend.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Corregir políticas RLS ─────────────────────────────────────
DROP POLICY IF EXISTS "ta_all"    ON therapist_availability;
DROP POLICY IF EXISTS "ta_select" ON therapist_availability;

CREATE POLICY "ta_select" ON therapist_availability
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ta_insert" ON therapist_availability
  FOR INSERT WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "ta_update" ON therapist_availability
  FOR UPDATE USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "ta_delete" ON therapist_availability
  FOR DELETE USING (auth.uid() = therapist_id);

-- ── 2. Agregar UNIQUE constraint (opcional, mejora integridad) ────
ALTER TABLE therapist_availability
  ALTER COLUMN day_of_week SET NOT NULL;

ALTER TABLE therapist_availability
  DROP CONSTRAINT IF EXISTS therapist_availability_therapist_day_unique;

ALTER TABLE therapist_availability
  ADD CONSTRAINT therapist_availability_therapist_day_unique
  UNIQUE (therapist_id, day_of_week);
