-- =============================================================
-- migration_fix_profile_role_escalation.sql
-- SEGURIDAD CRÍTICA: Previene que un usuario autenticado
-- modifique su propio campo "role" o "is_active" en profiles.
--
-- Problema previo:
--   La política "profiles_update" solo tenía USING (auth.uid() = id),
--   sin WITH CHECK, permitiendo que cualquier usuario cambie su rol
--   a 'admin', 'therapist' u otro mediante una llamada directa a la API.
--
-- Solución:
--   Reemplazar la política con una que incluya WITH CHECK validando
--   que role e is_active no cambian respecto al valor actual en la BD.
--
-- Impacto en el frontend:
--   NINGUNO. Ningún formulario del frontend envía "role" ni "is_active"
--   en sus updates de perfil. Los campos bloqueados son:
--     - role      → solo puede cambiarse via RPC con SECURITY DEFINER
--     - is_active → solo puede cambiarse via Edge Function admin-toggle-user
-- =============================================================

-- 1. Eliminar la política insegura existente
DROP POLICY IF EXISTS "profiles_update" ON profiles;

-- 2. Crear la política segura con WITH CHECK
--    La subconsulta lee el valor ACTUAL de role e is_active desde la BD
--    y exige que el valor propuesto en el UPDATE sea idéntico.
--    Un usuario puede actualizar todos los demás campos de su perfil
--    (full_name, avatar_url, city, country, phone, is_anonymous, etc.)
--    pero NO puede cambiar role ni is_active.
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role      = (SELECT role      FROM profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM profiles WHERE id = auth.uid())
  );

-- 3. Función RPC segura para que el admin cambie el rol de un usuario
--    (SECURITY DEFINER = se ejecuta con privilegios del owner, bypassea RLS)
--    Solo accesible si el caller tiene role = 'admin' en profiles.
CREATE OR REPLACE FUNCTION admin_set_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que quien llama es admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden cambiar roles.';
  END IF;

  -- Validar que el rol sea uno de los permitidos
  IF new_role NOT IN ('client', 'therapist', 'admin') THEN
    RAISE EXCEPTION 'Rol inválido: %', new_role;
  END IF;

  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$;

-- Revocar ejecución pública; solo roles autenticados pueden llamarla
REVOKE ALL ON FUNCTION admin_set_user_role(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_set_user_role(UUID, TEXT) TO authenticated;

-- 4. Comentario de auditoría
COMMENT ON POLICY "profiles_update" ON profiles IS
  'Permite al usuario actualizar su propio perfil. Bloquea cambios en role e is_active mediante WITH CHECK con subconsulta al valor actual.';
