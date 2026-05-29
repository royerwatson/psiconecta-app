-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Rol de administrador
-- Ejecutar en SQL Editor de Supabase
-- ══════════════════════════════════════════════════════════════════

-- 1. Agregar 'admin' al CHECK de roles en profiles
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('patient', 'therapist', 'admin'));

-- 2. Política RLS: el admin puede ver todos los perfiles
CREATE POLICY "admin_select_all_profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR auth.uid() = id
  );

-- 3. El admin puede ver todas las sesiones
CREATE POLICY "admin_select_all_sessions" ON sessions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR auth.uid() = patient_id
    OR auth.uid() = therapist_id
  );

-- 4. El admin puede actualizar therapist_profiles (para verificar)
CREATE POLICY "admin_update_therapist_profiles" ON therapist_profiles
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    OR auth.uid() = user_id
  );

-- 5. Crear tu cuenta de administrador
-- IMPORTANTE: Primero debes registrarte con el email de admin en la app
-- Luego ejecuta este UPDATE con tu user ID real:
-- UPDATE profiles SET role = 'admin' WHERE id = 'TU_USER_ID_AQUI';

SELECT 'Migración de admin completada ✅' AS resultado;
