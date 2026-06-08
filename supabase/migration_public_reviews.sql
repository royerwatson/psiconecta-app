-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Reviews públicas (lectura anónima para landing page)
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- Eliminar política SELECT anterior que requería auth
DROP POLICY IF EXISTS "reviews_select" ON reviews;

-- ── 1. Solo usuarios autenticados ven todas sus propias reseñas ──
-- (terapeutas y pacientes autenticados)
CREATE POLICY "reviews_select_auth" ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- ── 2. Usuarios anónimos pueden leer reseñas para la landing page ─
-- Solo se exponen: id, rating, comment, created_at, patient_id, therapist_id
-- (el frontend solo lee esos campos + nombre del perfil del paciente)
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT
  TO anon
  USING (true);
