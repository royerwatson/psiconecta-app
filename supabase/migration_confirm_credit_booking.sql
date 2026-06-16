-- Función para confirmar una cita pagada 100% con crédito de regalo
-- SECURITY DEFINER: corre con privilegios de superusuario, bypasea RLS de patient_credits
CREATE OR REPLACE FUNCTION confirm_credit_booking(
  p_therapist_id  UUID,
  p_scheduled_at  TIMESTAMPTZ,
  p_is_urgent     BOOLEAN,
  p_price_base    NUMERIC,
  p_credit_used   NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         UUID := auth.uid();
  v_final_price     NUMERIC;
  v_commission_rate NUMERIC;
  v_platform_fee    NUMERIC;
  v_therapist_net   NUMERIC;
  v_session_id      UUID;
  v_credit          RECORD;
  v_remaining       NUMERIC;
BEGIN
  -- Verificar autenticación
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Calcular precio final con cargo urgente si aplica
  v_final_price := ROUND(p_price_base * CASE WHEN p_is_urgent THEN 1.3 ELSE 1.0 END, 2);

  -- El crédito a descontar no puede exceder el precio final
  v_remaining := ROUND(LEAST(p_credit_used, v_final_price), 2);

  -- Verificar que cubre el total
  IF v_remaining < v_final_price THEN
    RAISE EXCEPTION 'Crédito insuficiente para cubrir la sesión';
  END IF;

  -- Obtener tasa de comisión del terapeuta
  SELECT COALESCE(commission_rate, 0.20)
    INTO v_commission_rate
    FROM therapist_profiles
   WHERE user_id = p_therapist_id;

  v_platform_fee  := ROUND(v_final_price * v_commission_rate, 2);
  v_therapist_net := ROUND(v_final_price - v_platform_fee, 2);

  -- Crear sesión directamente como scheduled (sin PayPal)
  INSERT INTO sessions (
    therapist_id, patient_id, scheduled_at,
    status, price, is_urgent, duration,
    commission_rate, platform_commission, therapist_net
  ) VALUES (
    p_therapist_id, v_user_id, p_scheduled_at,
    'scheduled', v_final_price, p_is_urgent, 60,
    v_commission_rate, v_platform_fee, v_therapist_net
  )
  RETURNING id INTO v_session_id;

  -- Descontar crédito de patient_credits (filas más antiguas primero)
  FOR v_credit IN
    SELECT id, amount_usd
      FROM patient_credits
     WHERE user_id   = v_user_id
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    IF v_credit.amount_usd <= v_remaining THEN
      -- Fila completamente agotada → eliminar
      v_remaining := ROUND(v_remaining - v_credit.amount_usd, 2);
      DELETE FROM patient_credits WHERE id = v_credit.id;
    ELSE
      -- Fila parcialmente usada → actualizar
      UPDATE patient_credits
         SET amount_usd = ROUND(amount_usd - v_remaining, 2)
       WHERE id = v_credit.id;
      v_remaining := 0;
    END IF;
  END LOOP;

  -- Si no había suficiente crédito, revertir sesión
  IF v_remaining > 0.01 THEN
    DELETE FROM sessions WHERE id = v_session_id;
    RAISE EXCEPTION 'Crédito insuficiente al descontar';
  END IF;

  RETURN v_session_id;
END;
$$;

-- Permitir que pacientes autenticados la ejecuten
GRANT EXECUTE ON FUNCTION confirm_credit_booking(UUID, TIMESTAMPTZ, BOOLEAN, NUMERIC, NUMERIC) TO authenticated;
