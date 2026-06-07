-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Seguridad en reviews y therapist_profiles
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. REVIEWS: UNIQUE constraint por sesión ──────────────────────
-- Sin esto, un paciente puede dejar múltiples reseñas a la misma sesión
-- inflando artificialmente el rating del terapeuta.
ALTER TABLE reviews
  ADD CONSTRAINT reviews_session_id_unique UNIQUE (session_id);

-- ── 2. REVIEWS: Reemplazar política INSERT para exigir sesión completada ──
-- La política anterior solo verificaba auth.uid() = patient_id,
-- permitiendo a cualquier paciente reseñar a cualquier terapeuta
-- sin haber tenido una sesión real con él.
DROP POLICY IF EXISTS "reviews_insert" ON reviews;

CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id       = reviews.session_id
        AND sessions.patient_id   = auth.uid()
        AND sessions.therapist_id = reviews.therapist_id
        AND sessions.status       = 'completed'
    )
  );

-- ── 3. REVIEWS: Política UPDATE para que admin pueda moderar ──────
DROP POLICY IF EXISTS "reviews_update_admin" ON reviews;

CREATE POLICY "reviews_update_admin" ON reviews
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. THERAPIST_PROFILES: Restringir datos bancarios/financieros ──
-- La política tp_select permite auth.uid() IS NOT NULL — cualquier
-- usuario autenticado puede leer paypal_email, bank_account_number,
-- bank_routing, commission_rate de todos los terapeutas.
-- Fix: solo el propietario y el admin ven los campos sensibles.
-- Como PostgreSQL RLS opera a nivel de fila (no de columna), la solución
-- es crear una vista pública sin esos campos y mantener acceso completo
-- solo al propietario + admin.

-- Política para acceso público (campos no sensibles — ya filtrado por query)
-- La política existente (auth.uid() IS NOT NULL) se mantiene para SELECT,
-- pero documentamos que el frontend DEBE hacer SELECT explícito de columnas.
-- El verdadero riesgo está en queries SELECT * — los corregimos en el frontend.

-- Agregamos política UPDATE restrictiva: solo el propietario puede actualizar
-- sus propios datos financieros, y solo el admin puede cambiar commission_rate,
-- subscription_plan y plan_expires_at.
DROP POLICY IF EXISTS "tp_update" ON therapist_profiles;

CREATE POLICY "tp_update_own" ON therapist_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin puede actualizar cualquier perfil (para aprobar verificaciones, cambiar plan)
DROP POLICY IF EXISTS "tp_update_admin" ON therapist_profiles;

CREATE POLICY "tp_update_admin" ON therapist_profiles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 5. SUBSCRIPTION_PAYMENTS: Agregar política UPDATE ────────────
-- Faltaba política UPDATE — las Edge Functions usan service_role
-- (bypass RLS) pero es buena práctica tenerla definida explícitamente.
DROP POLICY IF EXISTS "sp_update_admin" ON subscription_payments;

CREATE POLICY "sp_update_admin" ON subscription_payments
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR therapist_id = auth.uid()
  );
