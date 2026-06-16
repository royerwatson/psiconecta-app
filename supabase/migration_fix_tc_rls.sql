-- Fix RLS en therapist_credentials
-- El error "new row violates row-level security policy" indica que la política
-- tc_insert no existe en producción o fue sobrescrita incorrectamente.

-- 1. Limpiar políticas existentes
DROP POLICY IF EXISTS "tc_select" ON therapist_credentials;
DROP POLICY IF EXISTS "tc_insert" ON therapist_credentials;
DROP POLICY IF EXISTS "tc_update" ON therapist_credentials;
DROP POLICY IF EXISTS "tc_delete" ON therapist_credentials;

-- 2. Terapeutas pueden ver sus propias credenciales
CREATE POLICY "tc_select" ON therapist_credentials
  FOR SELECT USING (
    auth.uid() = therapist_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Terapeutas pueden insertar sus propias credenciales
CREATE POLICY "tc_insert" ON therapist_credentials
  FOR INSERT WITH CHECK (auth.uid() = therapist_id);

-- 4. Admins pueden actualizar el estado (approved/rejected)
CREATE POLICY "tc_update" ON therapist_credentials
  FOR UPDATE USING (
    auth.uid() = therapist_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
