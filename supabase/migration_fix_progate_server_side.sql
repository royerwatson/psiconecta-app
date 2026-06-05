-- =============================================================
-- migration_fix_progate_server_side.sql
-- Refuerzo server-side del plan de suscripción para el módulo psicométrico.
--
-- Problema previo:
--   ProGate.jsx solo bloquea la UI. Las tablas del módulo de tests
--   (tests, items, test_assignments, etc.) tenían políticas abiertas
--   a CUALQUIER usuario autenticado, independientemente del plan.
--   Un terapeuta con plan básico podía consultar la API directamente
--   y obtener todos los tests, ítems y resultados.
--
-- Solución:
--   1. Función is_pro_therapist() — SECURITY DEFINER, evita recursión.
--   2. Actualizar políticas SELECT del catálogo de tests para requerir
--      plan pro/premium, excepto para pacientes que tienen un test asignado.
--   3. Actualizar política de creación de test_assignments para requerir
--      plan pro/premium con CHECK.
--
-- Nota: DSM-5-TR, CIE-11, escalas, biblioteca y protocolos son archivos
-- estáticos en /src/data/ (bundleados con el JS), por lo que ProGate.jsx
-- sigue siendo la única protección posible para esos módulos.
-- Para protección real habría que moverlos a Edge Functions.
-- =============================================================

-- 1. Función helper para verificar plan pro/premium
CREATE OR REPLACE FUNCTION is_pro_therapist()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM therapist_profiles
    WHERE user_id = auth.uid()
      AND subscription_plan IN ('pro', 'premium')
  );
$$;

REVOKE ALL ON FUNCTION is_pro_therapist() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_pro_therapist() TO authenticated;

-- 2. tests — solo terapeutas pro, admins, o pacientes con asignación activa
DROP POLICY IF EXISTS "tests_read" ON tests;
CREATE POLICY "tests_read" ON tests
  FOR SELECT TO authenticated
  USING (
    is_active = TRUE
    AND (
      -- Terapeuta con plan activo puede ver el catálogo completo
      is_pro_therapist()

      -- Admin gestiona el catálogo
      OR is_admin()

      -- Paciente puede leer el test que tiene asignado (para tomarlo)
      OR EXISTS (
        SELECT 1 FROM test_assignments ta
        JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
        WHERE ta.test_id = tests.id
          AND tr.patient_id = auth.uid()
          AND ta.status IN ('pending', 'in_progress')
      )
    )
  );

-- 3. test_sections, items, response_options, scoring_rules
--    Misma lógica: pro o paciente con test asignado
DROP POLICY IF EXISTS "test_sections_read" ON test_sections;
CREATE POLICY "test_sections_read" ON test_sections
  FOR SELECT TO authenticated
  USING (
    is_pro_therapist()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM test_assignments ta
      JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
      JOIN tests t ON t.id = ta.test_id
      WHERE t.id = (SELECT test_id FROM test_sections WHERE id = test_sections.id)
        AND tr.patient_id = auth.uid()
        AND ta.status IN ('pending', 'in_progress')
    )
  );

DROP POLICY IF EXISTS "items_read" ON items;
CREATE POLICY "items_read" ON items
  FOR SELECT TO authenticated
  USING (
    is_pro_therapist()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM test_sections ts
      JOIN test_assignments ta ON ta.test_id = (
        SELECT test_id FROM test_sections WHERE id = items.section_id
      )
      JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
      WHERE tr.patient_id = auth.uid()
        AND ta.status IN ('pending', 'in_progress')
    )
  );

DROP POLICY IF EXISTS "response_options_read" ON response_options;
CREATE POLICY "response_options_read" ON response_options
  FOR SELECT TO authenticated
  USING (
    is_pro_therapist()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM items i
      JOIN test_sections ts ON ts.id = i.section_id
      JOIN test_assignments ta ON ta.test_id = ts.test_id
      JOIN therapeutic_relationships tr ON tr.id = ta.relationship_id
      WHERE i.id = response_options.item_id
        AND tr.patient_id = auth.uid()
        AND ta.status IN ('pending', 'in_progress')
    )
  );

DROP POLICY IF EXISTS "scoring_rules_read" ON scoring_rules;
CREATE POLICY "scoring_rules_read" ON scoring_rules
  FOR SELECT TO authenticated
  USING (
    is_pro_therapist()
    OR is_admin()
    -- Paciente puede leer sus propios resultados (scores ya calculados)
    OR EXISTS (
      SELECT 1 FROM test_results tr2
      WHERE tr2.scoring_rule_id = scoring_rules.id
        AND EXISTS (
          SELECT 1 FROM test_sessions ts
          WHERE ts.id = tr2.session_id AND ts.respondent_id = auth.uid()
        )
    )
  );

-- 4. test_assignments — solo terapeutas pro pueden CREAR asignaciones
--    La lectura ya estaba correctamente restringida (ta_therapist + ta_patient_read)
DROP POLICY IF EXISTS "ta_therapist" ON test_assignments;
CREATE POLICY "ta_therapist" ON test_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.id = relationship_id AND tr.therapist_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Para crear/modificar asignaciones se requiere plan pro
    is_pro_therapist()
    AND EXISTS (
      SELECT 1 FROM therapeutic_relationships tr
      WHERE tr.id = relationship_id AND tr.therapist_id = auth.uid()
    )
  );

COMMENT ON FUNCTION is_pro_therapist() IS
  'Verifica si el usuario actual es un terapeuta con plan pro o premium. SECURITY DEFINER para evitar recursión en RLS.';
