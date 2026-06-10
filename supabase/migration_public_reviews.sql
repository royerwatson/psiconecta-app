-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Reviews públicas para la landing page (v2 — RPC segura)
-- Ejecutar en Supabase SQL Editor (una sola vez)
--
-- ¿Por qué RPC y no abrir RLS a anon?
--   1. Una política `TO anon USING (true)` expone TODAS las columnas
--      de `reviews` (patient_id, session_id, etc.) a cualquier visitante.
--   2. La landing necesita el nombre del paciente, pero `profiles`
--      NO debe ser legible por anónimos: el join devolvería null igualmente.
-- Solución: función SECURITY DEFINER que devuelve solo campos seguros,
-- con el nombre ya anonimizado server-side (respeta is_anonymous).
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Política SELECT para usuarios autenticados ─────────────────
DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_select_public" ON reviews;
DROP POLICY IF EXISTS "reviews_select_auth" ON reviews;

CREATE POLICY "reviews_select_auth" ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- ── 2. RPC pública para la landing ────────────────────────────────
CREATE OR REPLACE FUNCTION get_public_reviews(limit_count int DEFAULT 20)
RETURNS TABLE (
  id           uuid,
  rating       int,
  comment      text,
  created_at   timestamptz,
  display_name text,
  initials     text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    r.id,
    r.rating,
    r.comment,
    r.created_at,
    CASE
      WHEN COALESCE(p.is_anonymous, false) OR p.full_name IS NULL
        THEN 'Paciente anónimo'
      ELSE split_part(trim(p.full_name), ' ', 1)
           || CASE
                WHEN split_part(trim(p.full_name), ' ', 2) <> ''
                  THEN ' ' || left(split_part(trim(p.full_name), ' ', 2), 1) || '.'
                ELSE ''
              END
    END AS display_name,
    CASE
      WHEN COALESCE(p.is_anonymous, false) OR p.full_name IS NULL
        THEN 'PA'
      ELSE upper(
        left(split_part(trim(p.full_name), ' ', 1), 1)
        || COALESCE(NULLIF(left(split_part(trim(p.full_name), ' ', 2), 1), ''), '')
      )
    END AS initials
  FROM reviews r
  LEFT JOIN profiles p ON p.id = r.patient_id
  WHERE r.rating >= 4
    AND r.comment IS NOT NULL
    AND r.comment <> ''
  ORDER BY r.created_at DESC
  LIMIT LEAST(GREATEST(limit_count, 1), 50);
$$;

-- Accesible para visitantes anónimos y usuarios autenticados
REVOKE ALL ON FUNCTION get_public_reviews(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_reviews(int) TO anon, authenticated;
