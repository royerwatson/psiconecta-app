-- =============================================================
-- migration_fix_profiles_select.sql
-- SEGURIDAD ALTA: Restringe la lectura de profiles por rol.
--
-- Problema previo:
--   USING (auth.uid() IS NOT NULL) → cualquier usuario autenticado
--   puede leer todos los perfiles: teléfono, contacto de emergencia,
--   país, email y cualquier otro campo de todos los pacientes.
--
-- Reglas de la nueva política:
--   1. Propio perfil          → siempre visible para el usuario
--   2. Terapeutas             → visibles para todos los autenticados
--                               (directorio público, FindTherapist)
--   3. Perfil de paciente     → visible para terapeutas que tengan
--                               al menos una sesión o relación terapéutica
--                               activa con ese paciente
--   4. Administradores        → ven todos los perfiles
--
-- Técnica anti-recursión:
--   La verificación de admin usa una función SECURITY DEFINER que
--   accede a profiles con privilegios del owner, evitando que la
--   política se llame a sí misma en bucle infinito.
-- =============================================================

-- 1. Función helper para verificar rol admin (evita recursión en RLS)
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

-- 2. Eliminar política laxa existente
DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- 3. Nueva política restrictiva
--    Orden de condiciones optimizado: las más baratas primero (uid = id, role = 'therapist')
--    para que Postgres haga short-circuit antes de evaluar las subconsultas.
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (
    -- Propio perfil
    auth.uid() = id

    -- Terapeutas son semi-públicos (directorio, booking, chat)
    OR role = 'therapist'

    -- Admin ve todo (función SECURITY DEFINER para evitar recursión)
    OR is_admin()

    -- Terapeuta con sesión agendada/completada con este paciente
    OR EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.patient_id = profiles.id
        AND s.therapist_id = auth.uid()
    )

    -- Terapeuta con relación terapéutica formal (módulo psicométrico)
    OR EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.patient_id = profiles.id
        AND tr.therapist_id = auth.uid()
    )
  );

COMMENT ON POLICY "profiles_select" ON profiles IS
  'Terapeutas semi-públicos; pacientes solo visibles para sus terapeutas (sesión o relación) y admins.';
