-- ============================================================
-- PSICONECTA — Datos de prueba
-- Cliente  : cce2c20d-7dd8-4e8f-821c-5377ada5181f
-- Terapeuta: 7a8affc7-d79e-452e-8e47-8aa2f869258f
-- ============================================================

-- ── 1. Completar perfil del terapeuta ────────────────────────
UPDATE public.therapist_profiles
SET
  specialty           = 'Psicología cognitivo-conductual',
  bio                 = 'Psicóloga clínica con más de 8 años de experiencia en el tratamiento de ansiedad, depresión y trastornos del estado de ánimo. Enfoque humanista-cognitivo con especial interés en mindfulness y terapia de aceptación y compromiso (ACT).',
  license_number      = 'PSI-2024-00789',
  price_per_session   = 800,
  rating              = 4.8,
  review_count        = 24,
  verified            = true,
  verification_status = 'verified',
  available_urgent    = true
WHERE user_id = '7a8affc7-d79e-452e-8e47-8aa2f869258f';

-- ── 2. Actualizar nombre del terapeuta en profiles ────────────
UPDATE public.profiles
SET full_name = 'Dra. Laura Martínez'
WHERE id = '7a8affc7-d79e-452e-8e47-8aa2f869258f';

-- ── 3. Actualizar nombre del paciente ─────────────────────────
UPDATE public.profiles
SET full_name = 'Carlos Ramírez'
WHERE id = 'cce2c20d-7dd8-4e8f-821c-5377ada5181f';

-- ── 4. Disponibilidad del terapeuta (horarios semanales) ──────
-- Limpiamos disponibilidad previa
DELETE FROM public.therapist_availability
WHERE therapist_id = '7a8affc7-d79e-452e-8e47-8aa2f869258f';

INSERT INTO public.therapist_availability (therapist_id, day_of_week, start_time, end_time) VALUES
  ('7a8affc7-d79e-452e-8e47-8aa2f869258f', 1, '09:00', '13:00'), -- Lunes mañana
  ('7a8affc7-d79e-452e-8e47-8aa2f869258f', 1, '15:00', '18:00'), -- Lunes tarde
  ('7a8affc7-d79e-452e-8e47-8aa2f869258f', 2, '09:00', '13:00'), -- Martes mañana
  ('7a8affc7-d79e-452e-8e47-8aa2f869258f', 3, '10:00', '14:00'), -- Miércoles
  ('7a8affc7-d79e-452e-8e47-8aa2f869258f', 4, '09:00', '13:00'), -- Jueves mañana
  ('7a8affc7-d79e-452e-8e47-8aa2f869258f', 4, '16:00', '19:00'), -- Jueves tarde
  ('7a8affc7-d79e-452e-8e47-8aa2f869258f', 5, '09:00', '12:00'); -- Viernes

-- ── 5. Sesión agendada (mañana a las 10am) ────────────────────
INSERT INTO public.sessions (
  id,
  therapist_id,
  patient_id,
  scheduled_at,
  duration,
  status,
  price,
  is_urgent,
  notes
) VALUES (
  'aaaaaaaa-0001-4000-a000-000000000001',
  '7a8affc7-d79e-452e-8e47-8aa2f869258f',
  'cce2c20d-7dd8-4e8f-821c-5377ada5181f',
  (NOW() + INTERVAL '1 day')::date + TIME '10:00:00',
  60,
  'scheduled',
  800,
  false,
  'Primera sesión de evaluación. Motivo de consulta: ansiedad generalizada y dificultad para conciliar el sueño.'
)
ON CONFLICT (id) DO NOTHING;

-- ── 6. Sesión completada (hace 1 semana — para ver historial) ──
INSERT INTO public.sessions (
  id,
  therapist_id,
  patient_id,
  scheduled_at,
  duration,
  status,
  price,
  is_urgent,
  notes
) VALUES (
  'aaaaaaaa-0002-4000-a000-000000000002',
  '7a8affc7-d79e-452e-8e47-8aa2f869258f',
  'cce2c20d-7dd8-4e8f-821c-5377ada5181f',
  NOW() - INTERVAL '7 days',
  60,
  'completed',
  800,
  false,
  'Sesión inicial completada. Buen rapport terapéutico.'
)
ON CONFLICT (id) DO NOTHING;

-- ── 7. Historial clínico de la sesión completada ──────────────
INSERT INTO public.clinical_history (
  session_id,
  therapist_id,
  patient_id,
  diagnosis,
  treatment_plan,
  session_notes,
  risk_level
) VALUES (
  'aaaaaaaa-0002-4000-a000-000000000002',
  '7a8affc7-d79e-452e-8e47-8aa2f869258f',
  'cce2c20d-7dd8-4e8f-821c-5377ada5181f',
  'Trastorno de ansiedad generalizada (F41.1). Sintomatología leve-moderada. Insomnio de conciliación secundario.',
  'Terapia cognitivo-conductual (TCC) de 12 sesiones. Fase 1 (sesiones 1-3): psicoeducación y registro de pensamientos. Fase 2 (sesiones 4-8): reestructuración cognitiva. Fase 3 (sesiones 9-12): exposición gradual y prevención de recaídas.',
  'Paciente acude voluntariamente. Refiere ansiedad de 6/10 en semana típica. Identifica disparadores: trabajo y relaciones interpersonales. Motivación alta para el tratamiento. Se inicia psicoeducación sobre el modelo cognitivo de la ansiedad.',
  'low'
);

-- ── 8. Tareas asignadas al paciente ───────────────────────────
INSERT INTO public.tasks (therapist_id, patient_id, session_id, title, description, due_date, completed) VALUES
(
  '7a8affc7-d79e-452e-8e47-8aa2f869258f',
  'cce2c20d-7dd8-4e8f-821c-5377ada5181f',
  'aaaaaaaa-0002-4000-a000-000000000002',
  'Registro de pensamientos automáticos',
  'Durante esta semana, anota en un cuaderno los momentos en que sientas ansiedad. Escribe: situación, pensamiento automático, emoción (0-10) y reacción. Trae el registro a la próxima sesión.',
  (NOW() + INTERVAL '1 day')::date,
  false
),
(
  '7a8affc7-d79e-452e-8e47-8aa2f869258f',
  'cce2c20d-7dd8-4e8f-821c-5377ada5181f',
  'aaaaaaaa-0002-4000-a000-000000000002',
  'Técnica de respiración diafragmática',
  'Practica la respiración diafragmática 2 veces al día: 5 minutos por la mañana al despertar y 5 minutos antes de dormir. Inhala 4 segundos, sostén 4 segundos, exhala 6 segundos.',
  (NOW() + INTERVAL '3 days')::date,
  false
),
(
  '7a8affc7-d79e-452e-8e47-8aa2f869258f',
  'cce2c20d-7dd8-4e8f-821c-5377ada5181f',
  'aaaaaaaa-0002-4000-a000-000000000002',
  'Lectura: "El poder del ahora" — Cap. 1',
  'Lee el primer capítulo del libro recomendado y anota 3 ideas que te hayan llamado la atención para comentarlas en sesión.',
  (NOW() + INTERVAL '6 days')::date,
  false
),
(
  '7a8affc7-d79e-452e-8e47-8aa2f869258f',
  'cce2c20d-7dd8-4e8f-821c-5377ada5181f',
  'aaaaaaaa-0002-4000-a000-000000000002',
  'Actividad física moderada',
  'Realiza al menos 3 sesiones de 30 minutos de caminata o ejercicio suave esta semana. La actividad física reduce el cortisol y mejora la calidad del sueño.',
  (NOW() + INTERVAL '7 days')::date,
  true -- esta ya la completó
);

-- ── 9. Registros de estado de ánimo (última semana) ───────────
INSERT INTO public.mood_logs (patient_id, mood_score, notes, created_at) VALUES
  ('cce2c20d-7dd8-4e8f-821c-5377ada5181f', 2, 'Semana difícil en el trabajo', NOW() - INTERVAL '6 days'),
  ('cce2c20d-7dd8-4e8f-821c-5377ada5181f', 3, 'Un poco mejor, dormí más', NOW() - INTERVAL '5 days'),
  ('cce2c20d-7dd8-4e8f-821c-5377ada5181f', 2, 'Reunión estresante', NOW() - INTERVAL '4 days'),
  ('cce2c20d-7dd8-4e8f-821c-5377ada5181f', 3, 'Practiqué la respiración', NOW() - INTERVAL '3 days'),
  ('cce2c20d-7dd8-4e8f-821c-5377ada5181f', 4, 'Mejor ánimo, salí a caminar', NOW() - INTERVAL '2 days'),
  ('cce2c20d-7dd8-4e8f-821c-5377ada5181f', 4, 'Fin de semana tranquilo', NOW() - INTERVAL '1 day');

-- ── 10. Reseña de la sesión completada ────────────────────────
INSERT INTO public.reviews (session_id, therapist_id, patient_id, rating, comment) VALUES (
  'aaaaaaaa-0002-4000-a000-000000000002',
  '7a8affc7-d79e-452e-8e47-8aa2f869258f',
  'cce2c20d-7dd8-4e8f-821c-5377ada5181f',
  5,
  'La Dra. Laura me hizo sentir muy cómodo desde el primer momento. Explica todo muy claro y se nota que realmente escucha. Salí de la sesión con herramientas concretas para manejar mi ansiedad.'
)
ON CONFLICT DO NOTHING;

-- ── 11. Check-in de IA de ayer (para que no aparezca el modal hoy) ──
-- Comenta estas líneas si quieres ver el check-in al entrar al dashboard
INSERT INTO public.ai_checkins (patient_id, therapist_id, questions_answers, risk_level, ai_message, notified) VALUES (
  'cce2c20d-7dd8-4e8f-821c-5377ada5181f',
  '7a8affc7-d79e-452e-8e47-8aa2f869258f',
  'Sueño: Bien | Ansiedad: Un poco | Pensamientos negativos: Algunos leves | Energía: Normal',
  'low',
  'Gracias por compartir cómo te sientes. Sigue adelante, lo estás haciendo bien.',
  false
);

-- ============================================================
-- ✅ Datos de prueba insertados correctamente
-- El terapeuta aparecerá verificado en la búsqueda de pacientes
-- La sesión de mañana aparecerá en ambos dashboards
-- ============================================================
