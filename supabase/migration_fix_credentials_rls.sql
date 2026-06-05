-- =============================================================
-- migration_fix_credentials_rls.sql
-- Corrige las políticas RLS de therapist_credentials.
--
-- Problemas previos:
--   1. tc_select: solo el propio terapeuta puede leer sus credenciales.
--      El admin no puede leerlas → la pantalla AdminTherapists muestra
--      la tabla vacía aunque la query se ejecute sin error aparente.
--
--   2. No existe política UPDATE → el admin no puede cambiar status
--      ni rejection_reason. El flujo approveDoc/rejectDoc falla
--      silenciosamente si RLS está activo (error 403 ignorado).
--
-- Solución:
--   - tc_select: añadir OR is_admin() para que el admin lea todo.
--   - tc_admin_update: nueva política UPDATE exclusiva para admins,
--     que permite modificar status, rejection_reason, reviewed_by
--     y reviewed_at. El terapeuta NO puede modificar sus credenciales
--     (solo insertar nuevas).
--
-- Nota: is_admin() fue creada en migration_fix_profiles_select.sql.
--       Ejecutar esa migración primero si no se ha hecho.
-- =============================================================

-- 1. Reemplazar tc_select con versión que incluye admin
DROP POLICY IF EXISTS "tc_select" ON therapist_credentials;

CREATE POLICY "tc_select" ON therapist_credentials
  FOR SELECT
  USING (
    auth.uid() = therapist_id   -- terapeuta ve sus propios docs
    OR is_admin()               -- admin ve todos
  );

-- 2. Nueva política UPDATE exclusiva para administradores
CREATE POLICY "tc_admin_update" ON therapist_credentials
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (
    is_admin()
    -- Solo se pueden cambiar los campos de revisión; el documento
    -- original (therapist_id, document_url, document_type) es inmutable.
    AND therapist_id   = (SELECT therapist_id   FROM therapist_credentials c WHERE c.id = therapist_credentials.id)
    AND document_url   = (SELECT document_url   FROM therapist_credentials c WHERE c.id = therapist_credentials.id)
    AND document_type  = (SELECT document_type  FROM therapist_credentials c WHERE c.id = therapist_credentials.id)
  );

COMMENT ON POLICY "tc_select" ON therapist_credentials IS
  'Terapeuta ve sus propios documentos; admin ve todos.';

COMMENT ON POLICY "tc_admin_update" ON therapist_credentials IS
  'Solo admins pueden aprobar/rechazar documentos. Campos del documento son inmutables.';
