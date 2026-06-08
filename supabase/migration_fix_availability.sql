-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Fix therapist_availability — UNIQUE constraint
-- Ejecutar en Supabase SQL Editor (una sola vez)
--
-- Problema: upsert(..., { onConflict: 'therapist_id,day_of_week' })
-- requiere un UNIQUE constraint o UNIQUE INDEX en esas columnas.
-- Sin él PostgreSQL lanza error y el guardado falla.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Eliminar duplicados si existen (mantener el más reciente) ──
DELETE FROM therapist_availability
WHERE id NOT IN (
  SELECT DISTINCT ON (therapist_id, day_of_week) id
  FROM therapist_availability
  ORDER BY therapist_id, day_of_week, id
);

-- ── 2. Agregar UNIQUE constraint ─────────────────────────────────
ALTER TABLE therapist_availability
  ADD CONSTRAINT therapist_availability_therapist_day_unique
  UNIQUE (therapist_id, day_of_week);

-- ── 3. Asegurar que day_of_week no sea nulo ───────────────────────
ALTER TABLE therapist_availability
  ALTER COLUMN day_of_week SET NOT NULL;
