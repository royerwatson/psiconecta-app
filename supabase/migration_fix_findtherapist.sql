-- ════════════════════════════════════════════════════════════════════
-- FIX: FindTherapist — columnas faltantes + RLS profiles + tp_select
-- Completamente idempotente. Ejecutar en Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Columnas de perfil profesional ────────────────────────────────
--    Puede que no existan si migration_payouts_and_payment_fields.sql
--    no fue ejecutada en este proyecto de Supabase.
ALTER TABLE therapist_profiles
  ADD COLUMN IF NOT EXISTS languages        TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approaches       TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS education        TEXT;

-- ── 2. Función is_admin() (SECURITY DEFINER) ─────────────────────────
--    Necesaria para la política profiles_select. Si ya existe, se
--    reemplaza sin error gracias a CREATE OR REPLACE.
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

-- ── 3. Política profiles_select ───────────────────────────────────────
--    Permite que cualquier usuario autenticado vea los perfiles de
--    terapeutas (role = 'therapist'). Los perfiles de pacientes solo
--    son visibles para sus propios terapeutas (sesión o relación activa).
DROP POLICY IF EXISTS "profiles_select" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (
    -- Propio perfil
    auth.uid() = id

    -- Terapeutas son semi-públicos (directorio, booking, chat)
    OR role = 'therapist'

    -- Admin ve todo
    OR is_admin()

    -- Terapeuta con sesión agendada/completada con este paciente
    OR EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.patient_id   = profiles.id
        AND s.therapist_id = auth.uid()
    )

    -- Terapeuta con relación terapéutica formal
    OR EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.patient_id   = profiles.id
        AND tr.therapist_id = auth.uid()
    )
  );

-- ── 4. Política tp_select en therapist_profiles ───────────────────────
--    Cualquier usuario autenticado puede ver el directorio de terapeutas.
DROP POLICY IF EXISTS "tp_select" ON therapist_profiles;

CREATE POLICY "tp_select" ON therapist_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ── 5. Verificación ───────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'therapist_profiles'
     AND column_name IN ('languages','years_experience','approaches','education')
  ) = 4                                          AS columnas_ok,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
                                                 AS is_admin_ok,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'therapist_profiles' AND policyname = 'tp_select'
  )                                              AS tp_select_ok,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles_select'
  )                                              AS profiles_select_ok;
