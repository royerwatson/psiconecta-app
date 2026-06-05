-- =============================================================
-- migration_fix_sessions_update.sql
-- SEGURIDAD ALTA: Añade WITH CHECK a la política sessions_update.
--
-- Problema previo:
--   La política solo tenía USING sin WITH CHECK, lo que permitía
--   a cualquier terapeuta o paciente modificar campos arbitrarios:
--   price, therapist_net, platform_commission, therapist_id,
--   patient_id, video_room_url, etc.
--
-- Lo que actualiza el frontend (único uso legítimo):
--   - { status: 'completed' }  → TherapistSchedule, VideoCall
--   - { status: 'cancelled' }  → MyAppointments (paciente)
--   Nada más. Los campos financieros y de propiedad solo los
--   modifican las Edge Functions con service_role (bypass RLS).
--
-- La nueva política WITH CHECK bloquea cambios en:
--   - therapist_id, patient_id  → propietarios de la sesión
--   - price                     → acordado al crear la sesión
--   - therapist_net             → calculado por Edge Function
--   - platform_commission       → calculado por Edge Function
--
-- Nota sobre COALESCE:
--   Los campos financieros pueden ser NULL antes de que el pago
--   se complete. COALESCE(x, 0) permite comparar NULL = NULL
--   sin que la condición falle.
-- =============================================================

DROP POLICY IF EXISTS "sessions_update" ON sessions;

CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE
  USING (
    auth.uid() = therapist_id OR auth.uid() = patient_id
  )
  WITH CHECK (
    -- El usuario sigue siendo participante de la sesión
    (auth.uid() = therapist_id OR auth.uid() = patient_id)

    -- Los participantes no pueden reasignarse
    AND therapist_id = (SELECT therapist_id FROM sessions s WHERE s.id = sessions.id)
    AND patient_id   = (SELECT patient_id   FROM sessions s WHERE s.id = sessions.id)

    -- El precio pactado no puede modificarse desde el cliente
    AND COALESCE(price, 0) =
        COALESCE((SELECT price FROM sessions s WHERE s.id = sessions.id), 0)

    -- Los campos de liquidación solo los escribe la Edge Function
    AND COALESCE(therapist_net, 0) =
        COALESCE((SELECT therapist_net FROM sessions s WHERE s.id = sessions.id), 0)

    AND COALESCE(platform_commission, 0) =
        COALESCE((SELECT platform_commission FROM sessions s WHERE s.id = sessions.id), 0)
  );

COMMENT ON POLICY "sessions_update" ON sessions IS
  'Permite actualizar status y notes. Bloquea cambios en therapist_id, patient_id, price, therapist_net y platform_commission desde el cliente.';
