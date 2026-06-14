-- ════════════════════════════════════════════════════════════════════
-- EMERGENCIA: Restaurar acceso a profiles + fix FindTherapist
-- EJECUTAR PRIMERO ESTE ARCHIVO en Supabase SQL Editor.
-- Es 100% idempotente — safe de correr múltiples veces.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Función is_admin() — SECURITY DEFINER (evita recursión RLS) ──
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ── 2. Política profiles_select (simplificada — sin subqueries) ──────
--    Eliminamos las subconsultas a sessions/therapeutic_relationships
--    para evitar posibles errores de RLS en esas tablas.
--    Terapeutas son semi-públicos; cada usuario lee su propio perfil.
DROP POLICY IF EXISTS "profiles_select" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id       -- cada usuario lee su propio perfil
    OR role = 'therapist' -- terapeutas visibles para todos (directorio)
    OR is_admin()         -- admin ve todo
  );

-- ── 3. Columnas de perfil profesional (FindTherapist las necesita) ───
ALTER TABLE therapist_profiles
  ADD COLUMN IF NOT EXISTS languages        TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approaches       TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education        TEXT;

-- ── 4. Política tp_select en therapist_profiles ───────────────────────
DROP POLICY IF EXISTS "tp_select" ON therapist_profiles;

CREATE POLICY "tp_select" ON therapist_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 5. VERIFICACIÓN — todos deben ser TRUE ───────────────────────────
SELECT
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
    AS "is_admin() existe"                                        ,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles_select'
  )
    AS "profiles_select existe"                                   ,
  (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_name = 'therapist_profiles'
      AND column_name IN ('languages','years_experience','approaches','education')
  ) = 4
    AS "columnas FindTherapist OK"                                ,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'therapist_profiles' AND policyname = 'tp_select'
  )
    AS "tp_select existe"                                         ;
