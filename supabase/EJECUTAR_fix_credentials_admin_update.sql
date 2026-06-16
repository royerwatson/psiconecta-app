-- =====================================================================
-- EJECUTAR_fix_credentials_admin_update.sql
-- Permite al admin aprobar/rechazar documentos de therapist_credentials.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1. Eliminar todas las políticas UPDATE existentes para partir limpio
DROP POLICY IF EXISTS "tc_admin_update" ON therapist_credentials;
DROP POLICY IF EXISTS "tc_update"       ON therapist_credentials;
DROP POLICY IF EXISTS "therapist_credentials_update" ON therapist_credentials;

-- 2. Asegurarse de que is_admin() existe (safe to re-run)
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

-- 3. Política UPDATE simple para admins (sin WITH CHECK complejo)
CREATE POLICY "tc_admin_update" ON therapist_credentials
  FOR UPDATE
  USING (is_admin());

-- 4. Asegurarse de que el admin también puede SELECT (para leer credenciales)
DROP POLICY IF EXISTS "tc_select" ON therapist_credentials;

CREATE POLICY "tc_select" ON therapist_credentials
  FOR SELECT
  USING (
    auth.uid() = therapist_id   -- terapeuta ve sus propios docs
    OR is_admin()               -- admin ve todos
  );

-- Verificación rápida (opcional, ver en Results)
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'therapist_credentials'
ORDER BY cmd, policyname;
