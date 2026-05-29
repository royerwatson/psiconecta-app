-- =============================================================
-- PSICONECTA — Seed Data: Instrumentos Psicométricos
-- PHQ-9, GAD-7, DASS-21, PCL-5, BIG FIVE (NEO-FFI)
-- =============================================================

-- ─── HELPER: función para obtener section_id por test slug ───
-- Usamos CTEs para mantener referencias limpias

-- =============================================================
-- 1. PHQ-9 — Patient Health Questionnaire (Depresión)
-- Kroenke, Spitzer & Williams (2001) | Dominio público
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'phq9',
    'PHQ-9 — Cuestionario de Salud del Paciente',
    'Instrumento de 9 ítems para el cribado y seguimiento de la severidad de la depresión mayor. Cada ítem corresponde a un criterio diagnóstico del DSM-5. El ítem 9 evalúa pensamientos de muerte y es alerta obligatoria.',
    'sintomas', 'public_domain', 1,
    'Kroenke K, Spitzer RL, Williams JB (2001)',
    13, 5, '["self"]'::jsonb,
    7, 5.0, ARRAY['clinica','tcc','pareja','infantil']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'PHQ-9',
    'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, 'Poco interés o placer en hacer cosas', 'PHQ9_Q1', 'likert', 'total', NULL),
    ((SELECT id FROM s), 1, 'Sentirse desanimado/a, deprimido/a o sin esperanza', 'PHQ9_Q2', 'likert', 'total', NULL),
    ((SELECT id FROM s), 2, 'Problemas para dormir o para permanecer dormido/a, o dormir demasiado', 'PHQ9_Q3', 'likert', 'total', NULL),
    ((SELECT id FROM s), 3, 'Sentirse cansado/a o tener poca energía', 'PHQ9_Q4', 'likert', 'total', NULL),
    ((SELECT id FROM s), 4, 'Tener poco apetito o comer en exceso', 'PHQ9_Q5', 'likert', 'total', NULL),
    ((SELECT id FROM s), 5, 'Sentirse mal consigo mismo/a, o sentir que es un fracaso o que ha decepcionado a su familia o a usted mismo/a', 'PHQ9_Q6', 'likert', 'total', NULL),
    ((SELECT id FROM s), 6, 'Problemas para concentrarse en cosas tales como leer el periódico o ver la televisión', 'PHQ9_Q7', 'likert', 'total', NULL),
    ((SELECT id FROM s), 7, 'Se ha movido o hablado tan despacio que otras personas lo han notado, o lo contrario: ha estado tan inquieto/a que se ha movido mucho más de lo habitual', 'PHQ9_Q8', 'likert', 'total', NULL),
    ((SELECT id FROM s), 8, 'Pensamientos de que estaría mejor muerto/a o de hacerse daño de alguna manera', 'PHQ9_Q9', 'likert', 'total', 1)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nunca', 0),
  (1, 'Varios días', 1),
  (2, 'Más de la mitad de los días', 2),
  (3, 'Casi todos los días', 3)
) AS o(order_index, label, value);

-- Scoring rules PHQ-9
WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Puntuación Total', 'sum',
    ARRAY['PHQ9_Q1','PHQ9_Q2','PHQ9_Q3','PHQ9_Q4','PHQ9_Q5','PHQ9_Q6','PHQ9_Q7','PHQ9_Q8','PHQ9_Q9'],
    1.0
  FROM tests t WHERE t.slug = 'phq9'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  4,  'Mínimo',   'minimal',  '#22c55e', 'Sin depresión significativa. Síntomas dentro del rango normal.', 'Monitoreo rutinario. Reaplicar en 4 semanas si el clínico lo considera pertinente.', FALSE),
  ((SELECT id FROM sr), 5,  9,  'Leve',     'mild',     '#86efac', 'Depresión leve. Algunos síntomas presentes pero funcionalidad conservada.', 'Psicoeducación y técnicas de autoayuda. Considerar seguimiento en 2 semanas.', FALSE),
  ((SELECT id FROM sr), 10, 14, 'Moderado', 'moderate', '#f59e0b', 'Depresión moderada. Impacto notable en funcionamiento diario.', 'Intervención terapéutica activa indicada. Considerar evaluación de tratamiento farmacológico.', FALSE),
  ((SELECT id FROM sr), 15, 19, 'Moderadamente severo', 'moderately_severe', '#f97316', 'Depresión moderadamente severa. Funcionamiento significativamente comprometido.', 'Tratamiento activo urgente: psicoterapia y evaluación psiquiátrica recomendada.', FALSE),
  ((SELECT id FROM sr), 20, 27, 'Severo',   'severe',   '#ef4444', 'Depresión severa. Riesgo alto. Requiere atención inmediata.', 'Derivación urgente o evaluación psiquiátrica. Protocolo de seguridad si hay ideación suicida.', TRUE);


-- =============================================================
-- 2. GAD-7 — Generalized Anxiety Disorder Scale
-- Spitzer et al. (2006) | Dominio público
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'gad7',
    'GAD-7 — Escala de Trastorno de Ansiedad Generalizada',
    'Instrumento de 7 ítems para el cribado y seguimiento de la severidad del trastorno de ansiedad generalizada. Frecuentemente usado junto al PHQ-9 para evaluación de salud mental general.',
    'sintomas', 'public_domain', 1,
    'Spitzer RL, Kroenke K, Williams JBW, Löwe B (2006)',
    13, 5, '["self"]'::jsonb,
    14, 4.0, ARRAY['clinica','tcc','pareja']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'GAD-7',
    'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
  VALUES
    ((SELECT id FROM s), 0, 'Sentirse nervioso/a, ansioso/a o muy alterado/a', 'GAD7_Q1', 'likert', 'total'),
    ((SELECT id FROM s), 1, 'No poder dejar de preocuparse o no poder controlar la preocupación', 'GAD7_Q2', 'likert', 'total'),
    ((SELECT id FROM s), 2, 'Preocuparse demasiado por diferentes cosas', 'GAD7_Q3', 'likert', 'total'),
    ((SELECT id FROM s), 3, 'Dificultad para relajarse', 'GAD7_Q4', 'likert', 'total'),
    ((SELECT id FROM s), 4, 'Estar tan inquieto/a que resulta difícil permanecer sentado/a tranquilamente', 'GAD7_Q5', 'likert', 'total'),
    ((SELECT id FROM s), 5, 'Irritarse o molestarse con facilidad', 'GAD7_Q6', 'likert', 'total'),
    ((SELECT id FROM s), 6, 'Sentir miedo como si algo horrible fuera a pasar', 'GAD7_Q7', 'likert', 'total')
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nunca', 0),
  (1, 'Varios días', 1),
  (2, 'Más de la mitad de los días', 2),
  (3, 'Casi todos los días', 3)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Puntuación Total', 'sum',
    ARRAY['GAD7_Q1','GAD7_Q2','GAD7_Q3','GAD7_Q4','GAD7_Q5','GAD7_Q6','GAD7_Q7'],
    1.0
  FROM tests t WHERE t.slug = 'gad7'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  4,  'Mínimo',   'minimal',  '#22c55e', 'Sin ansiedad significativa.', 'Monitoreo rutinario.', FALSE),
  ((SELECT id FROM sr), 5,  9,  'Leve',     'mild',     '#86efac', 'Ansiedad leve. Funcionalidad conservada.', 'Técnicas de relajación y psicoeducación. Seguimiento en 2-3 semanas.', FALSE),
  ((SELECT id FROM sr), 10, 14, 'Moderado', 'moderate', '#f59e0b', 'Ansiedad moderada. Impacto en funcionamiento.', 'Intervención terapéutica indicada. TCC con foco en preocupación crónica.', FALSE),
  ((SELECT id FROM sr), 15, 21, 'Severo',   'severe',   '#ef4444', 'Ansiedad severa. Funcionamiento significativamente comprometido.', 'Tratamiento activo urgente. Evaluación para tratamiento farmacológico coadyuvante.', TRUE);


-- =============================================================
-- 3. DASS-21 — Depression Anxiety Stress Scales
-- Lovibond & Lovibond (1995) | Dominio público
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'dass21',
    'DASS-21 — Escalas de Depresión, Ansiedad y Estrés',
    'Instrumento de 21 ítems que mide tres estados emocionales negativos: depresión, ansiedad y estrés. Cada subescala tiene 7 ítems. Los scores se multiplican por 2 para equivalencia con el DASS-42.',
    'sintomas', 'public_domain', 1,
    'Lovibond SH, Lovibond PF (1995)',
    18, 10, '["self"]'::jsonb,
    21, 6.0, ARRAY['clinica','tcc']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'DASS-21',
    'Por favor lea cada afirmación y elija un número del 0 al 3 que indique cuánto se aplica a usted durante la semana pasada. No hay respuestas correctas o incorrectas.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
  VALUES
    ((SELECT id FROM s), 0,  'Me costó mucho relajarme',                                            'DASS21_Q1',  'likert', 'estres'),
    ((SELECT id FROM s), 1,  'Me di cuenta que tenía la boca seca',                                 'DASS21_Q2',  'likert', 'ansiedad'),
    ((SELECT id FROM s), 2,  'No podía sentir ningún sentimiento positivo',                         'DASS21_Q3',  'likert', 'depresion'),
    ((SELECT id FROM s), 3,  'Tuve dificultad en respirar (respiración acelerada, falta de aire)',  'DASS21_Q4',  'likert', 'ansiedad'),
    ((SELECT id FROM s), 4,  'Me costó mucho tener iniciativa para hacer cosas',                    'DASS21_Q5',  'likert', 'depresion'),
    ((SELECT id FROM s), 5,  'Reaccioné exageradamente en ciertas situaciones',                     'DASS21_Q6',  'likert', 'estres'),
    ((SELECT id FROM s), 6,  'Sentí que mis manos temblaban',                                       'DASS21_Q7',  'likert', 'ansiedad'),
    ((SELECT id FROM s), 7,  'Sentí que tenía muchos nervios',                                      'DASS21_Q8',  'likert', 'estres'),
    ((SELECT id FROM s), 8,  'Estaba preocupado por situaciones en que podía tener pánico',         'DASS21_Q9',  'likert', 'ansiedad'),
    ((SELECT id FROM s), 9,  'Sentí que no tenía nada que esperar',                                 'DASS21_Q10', 'likert', 'depresion'),
    ((SELECT id FROM s), 10, 'Noté que me estaba agitando',                                         'DASS21_Q11', 'likert', 'estres'),
    ((SELECT id FROM s), 11, 'Me fue difícil relajarme',                                            'DASS21_Q12', 'likert', 'estres'),
    ((SELECT id FROM s), 12, 'Me sentí triste y deprimido/a',                                       'DASS21_Q13', 'likert', 'depresion'),
    ((SELECT id FROM s), 13, 'No toleré nada que no me dejara continuar con lo que estaba haciendo','DASS21_Q14', 'likert', 'estres'),
    ((SELECT id FROM s), 14, 'Sentí que estaba al punto de pánico',                                 'DASS21_Q15', 'likert', 'ansiedad'),
    ((SELECT id FROM s), 15, 'No me pude entusiasmar con nada',                                     'DASS21_Q16', 'likert', 'depresion'),
    ((SELECT id FROM s), 16, 'Sentí que valía muy poco como persona',                               'DASS21_Q17', 'likert', 'depresion'),
    ((SELECT id FROM s), 17, 'Sentí que estaba muy irritable',                                      'DASS21_Q18', 'likert', 'estres'),
    ((SELECT id FROM s), 18, 'Sentí latidos de mi corazón a pesar de no haber hecho esfuerzo físico','DASS21_Q19','likert', 'ansiedad'),
    ((SELECT id FROM s), 19, 'Tuve miedo sin razón',                                                'DASS21_Q20', 'likert', 'ansiedad'),
    ((SELECT id FROM s), 20, 'Sentí que la vida no tenía ningún sentido',                           'DASS21_Q21', 'likert', 'depresion')
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'No me aplicó nada', 0),
  (1, 'Me aplicó un poco, o durante parte del tiempo', 1),
  (2, 'Me aplicó bastante, o durante una buena parte del tiempo', 2),
  (3, 'Me aplicó mucho, o la mayor parte del tiempo', 3)
) AS o(order_index, label, value);

-- Scoring rules DASS-21 (x2 para equivalencia con DASS-42)
DO $$
DECLARE v_test_id UUID; v_sr_dep UUID; v_sr_anx UUID; v_sr_str UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'dass21';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test_id, 'depresion', 'Depresión', 'sum',
    ARRAY['DASS21_Q3','DASS21_Q5','DASS21_Q10','DASS21_Q13','DASS21_Q16','DASS21_Q17','DASS21_Q21'], 2.0)
  RETURNING id INTO v_sr_dep;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test_id, 'ansiedad', 'Ansiedad', 'sum',
    ARRAY['DASS21_Q2','DASS21_Q4','DASS21_Q7','DASS21_Q9','DASS21_Q15','DASS21_Q19','DASS21_Q20'], 2.0)
  RETURNING id INTO v_sr_anx;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test_id, 'estres', 'Estrés', 'sum',
    ARRAY['DASS21_Q1','DASS21_Q6','DASS21_Q8','DASS21_Q11','DASS21_Q12','DASS21_Q14','DASS21_Q18'], 2.0)
  RETURNING id INTO v_sr_str;

  -- Rangos Depresión
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, is_risk_level)
  VALUES
    (v_sr_dep, 0,  9,  'Normal',              'normal',    '#22c55e', 'Sin síntomas depresivos significativos.', FALSE),
    (v_sr_dep, 10, 13, 'Leve',                'mild',      '#86efac', 'Depresión leve.', FALSE),
    (v_sr_dep, 14, 20, 'Moderado',            'moderate',  '#f59e0b', 'Depresión moderada.', FALSE),
    (v_sr_dep, 21, 27, 'Severo',              'severe',    '#f97316', 'Depresión severa.', FALSE),
    (v_sr_dep, 28, 99, 'Extremadamente Severo','extreme',  '#ef4444', 'Depresión extremadamente severa. Alerta clínica.', TRUE);

  -- Rangos Ansiedad
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, is_risk_level)
  VALUES
    (v_sr_anx, 0,  7,  'Normal',              'normal',    '#22c55e', 'Sin síntomas ansiosos significativos.', FALSE),
    (v_sr_anx, 8,  9,  'Leve',                'mild',      '#86efac', 'Ansiedad leve.', FALSE),
    (v_sr_anx, 10, 14, 'Moderado',            'moderate',  '#f59e0b', 'Ansiedad moderada.', FALSE),
    (v_sr_anx, 15, 19, 'Severo',              'severe',    '#f97316', 'Ansiedad severa.', FALSE),
    (v_sr_anx, 20, 99, 'Extremadamente Severo','extreme',  '#ef4444', 'Ansiedad extremadamente severa.', TRUE);

  -- Rangos Estrés
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, is_risk_level)
  VALUES
    (v_sr_str, 0,  14, 'Normal',              'normal',    '#22c55e', 'Sin estrés significativo.', FALSE),
    (v_sr_str, 15, 18, 'Leve',                'mild',      '#86efac', 'Estrés leve.', FALSE),
    (v_sr_str, 19, 25, 'Moderado',            'moderate',  '#f59e0b', 'Estrés moderado.', FALSE),
    (v_sr_str, 26, 33, 'Severo',              'severe',    '#f97316', 'Estrés severo.', FALSE),
    (v_sr_str, 34, 99, 'Extremadamente Severo','extreme',  '#ef4444', 'Estrés extremadamente severo.', TRUE);
END $$;


-- =============================================================
-- 4. PCL-5 — PTSD Checklist for DSM-5
-- Weathers et al. (2013) | Dominio público (VA)
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'pcl5',
    'PCL-5 — Lista de Verificación de PTSD para el DSM-5',
    'Instrumento de 20 ítems para el cribado y monitoreo del Trastorno de Estrés Postraumático según criterios DSM-5. Organizado en 4 clusters: intrusión, evitación, cogniciones/ánimo negativos e hiperactivación.',
    'sintomas', 'public_domain', 1,
    'Weathers FW, Litz BT, Keane TM, Palmieri PA, Marx BP, Schnurr PP (2013)',
    18, 10, '["self"]'::jsonb,
    30, 10.0, ARRAY['clinica','tcc']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'PCL-5',
    'A continuación hay una lista de problemas que las personas a veces tienen en respuesta a una experiencia muy estresante. Pensando en su experiencia más estresante durante el último mes, ¿cuánto le ha molestado cada problema?'
  FROM t RETURNING id
)
INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
VALUES
  ((SELECT id FROM s), 0,  'Recuerdos repetitivos, perturbadores e involuntarios de la experiencia estresante',                                    'PCL5_Q1',  'likert', 'intrusion'),
  ((SELECT id FROM s), 1,  'Sueños perturbadores de la experiencia estresante',                                                                   'PCL5_Q2',  'likert', 'intrusion'),
  ((SELECT id FROM s), 2,  'De repente sentirse o actuar como si la experiencia estresante estuviera ocurriendo de nuevo (flashbacks)',            'PCL5_Q3',  'likert', 'intrusion'),
  ((SELECT id FROM s), 3,  'Sentirse muy molesto/a cuando algo le recuerda la experiencia estresante',                                            'PCL5_Q4',  'likert', 'intrusion'),
  ((SELECT id FROM s), 4,  'Tener fuertes reacciones físicas cuando algo le recuerda la experiencia estresante',                                  'PCL5_Q5',  'likert', 'intrusion'),
  ((SELECT id FROM s), 5,  'Evitar recuerdos, pensamientos o sentimientos relacionados con la experiencia estresante',                            'PCL5_Q6',  'likert', 'evitacion'),
  ((SELECT id FROM s), 6,  'Evitar recordatorios externos de la experiencia estresante (personas, lugares, conversaciones, actividades, objetos)', 'PCL5_Q7',  'likert', 'evitacion'),
  ((SELECT id FROM s), 7,  'Dificultad para recordar partes importantes de la experiencia estresante',                                            'PCL5_Q8',  'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 8,  'Tener creencias negativas fuertes sobre sí mismo/a, otras personas o el mundo',                                      'PCL5_Q9',  'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 9,  'Culparse a sí mismo/a o a otros por la experiencia estresante o lo que sucedió después',                             'PCL5_Q10', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 10, 'Tener sentimientos negativos fuertes como miedo, horror, enojo, culpa o vergüenza',                                  'PCL5_Q11', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 11, 'Perder interés en actividades que antes disfrutaba',                                                                  'PCL5_Q12', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 12, 'Sentirse distante o alejado de otras personas',                                                                       'PCL5_Q13', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 13, 'Dificultad para experimentar sentimientos positivos',                                                                 'PCL5_Q14', 'likert', 'cognicion_animo'),
  ((SELECT id FROM s), 14, 'Comportamiento irritable, arrebatos de ira o agresión',                                                               'PCL5_Q15', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 15, 'Asumir demasiados riesgos o hacer cosas que podrían causarle daño',                                                  'PCL5_Q16', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 16, 'Estar demasiado alerta, vigilante o en guardia',                                                                      'PCL5_Q17', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 17, 'Sentirse sobresaltado/a o asustado/a fácilmente',                                                                     'PCL5_Q18', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 18, 'Dificultad para concentrarse',                                                                                        'PCL5_Q19', 'likert', 'hiperactivacion'),
  ((SELECT id FROM s), 19, 'Dificultad para conciliar o mantener el sueño',                                                                       'PCL5_Q20', 'likert', 'hiperactivacion');

-- Response options PCL-5 (0-4)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM items i
JOIN test_sections s ON s.id = i.section_id
JOIN tests t ON t.id = s.test_id AND t.slug = 'pcl5'
CROSS JOIN (VALUES
  (0, 'Nada', 0),
  (1, 'Un poco', 1),
  (2, 'Moderadamente', 2),
  (3, 'Bastante', 3),
  (4, 'Extremadamente', 4)
) AS o(order_index, label, value);

-- Scoring rules PCL-5
DO $$
DECLARE v_test_id UUID; v_total UUID; v_intr UUID; v_evit UUID; v_cog UUID; v_hip UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'pcl5';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'total', 'Puntuación Total', 'sum',
    ARRAY['PCL5_Q1','PCL5_Q2','PCL5_Q3','PCL5_Q4','PCL5_Q5','PCL5_Q6','PCL5_Q7','PCL5_Q8',
          'PCL5_Q9','PCL5_Q10','PCL5_Q11','PCL5_Q12','PCL5_Q13','PCL5_Q14','PCL5_Q15',
          'PCL5_Q16','PCL5_Q17','PCL5_Q18','PCL5_Q19','PCL5_Q20'])
  RETURNING id INTO v_total;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'intrusion', 'Intrusión (Criterio B)', 'sum', ARRAY['PCL5_Q1','PCL5_Q2','PCL5_Q3','PCL5_Q4','PCL5_Q5'])
  RETURNING id INTO v_intr;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'evitacion', 'Evitación (Criterio C)', 'sum', ARRAY['PCL5_Q6','PCL5_Q7'])
  RETURNING id INTO v_evit;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'cognicion_animo', 'Cognición y Ánimo Negativos (Criterio D)', 'sum',
    ARRAY['PCL5_Q8','PCL5_Q9','PCL5_Q10','PCL5_Q11','PCL5_Q12','PCL5_Q13','PCL5_Q14'])
  RETURNING id INTO v_cog;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'hiperactivacion', 'Hiperactivación (Criterio E)', 'sum',
    ARRAY['PCL5_Q15','PCL5_Q16','PCL5_Q17','PCL5_Q18','PCL5_Q19','PCL5_Q20'])
  RETURNING id INTO v_hip;

  -- Rangos total
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_total, 0,  19, 'Subclínico',     'subclinical', '#22c55e', 'Síntomas de estrés postraumático subclinicos.', 'Monitoreo. Psicoeducación sobre respuestas al trauma.', FALSE),
    (v_total, 20, 49, 'Moderado',        'moderate',   '#f59e0b', 'Síntomas de PTSD moderados. Posible diagnóstico.', 'Evaluación diagnóstica formal. TCC centrada en trauma o EMDR recomendado.', FALSE),
    (v_total, 50, 80, 'Severo',          'severe',     '#ef4444', 'PTSD severo. Evaluación clínica urgente.', 'Tratamiento intensivo. Considerar evaluación de riesgo completa. Protocolo de seguridad.', TRUE);
END $$;


-- =============================================================
-- 5. AUDIT — Alcohol Use Disorders Identification Test
-- Saunders et al. (1993) | OMS — Dominio público
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'audit',
    'AUDIT — Test de Identificación de Trastornos por Uso de Alcohol',
    'Instrumento de 10 ítems desarrollado por la OMS para identificar personas con consumo de riesgo, dependencia al alcohol y daño relacionado. Ajuste por género en interpretación.',
    'sintomas', 'public_domain', 1,
    'Saunders JB, Aasland OG, Babor TF, de la Fuente JR, Grant M (1993) — OMS',
    18, 5, '["self"]'::jsonb,
    90, NULL, ARRAY['clinica','tcc']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'AUDIT',
    'Por favor responda las siguientes preguntas sobre su consumo de alcohol durante el último año.'
  FROM t RETURNING id
)
INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
VALUES
  ((SELECT id FROM s), 0, '¿Con qué frecuencia consume alguna bebida alcohólica?', 'AUDIT_Q1', 'likert', 'consumo', NULL),
  ((SELECT id FROM s), 1, '¿Cuántas bebidas alcohólicas suele tomar en un día de consumo normal?', 'AUDIT_Q2', 'likert', 'consumo', NULL),
  ((SELECT id FROM s), 2, '¿Con qué frecuencia toma 6 o más bebidas alcohólicas en una sola ocasión?', 'AUDIT_Q3', 'likert', 'consumo', NULL),
  ((SELECT id FROM s), 3, '¿Con qué frecuencia en el último año no pudo parar de beber una vez que había empezado?', 'AUDIT_Q4', 'likert', 'dependencia', NULL),
  ((SELECT id FROM s), 4, '¿Con qué frecuencia en el último año dejó de hacer algo que debía hacer por beber?', 'AUDIT_Q5', 'likert', 'dependencia', NULL),
  ((SELECT id FROM s), 5, '¿Con qué frecuencia en el último año bebió por la mañana después de haber bebido en exceso el día anterior?', 'AUDIT_Q6', 'likert', 'dependencia', 1),
  ((SELECT id FROM s), 6, '¿Con qué frecuencia en el último año tuvo remordimientos o se sintió culpable después de beber?', 'AUDIT_Q7', 'likert', 'dano', NULL),
  ((SELECT id FROM s), 7, '¿Con qué frecuencia en el último año no pudo recordar lo que sucedió la noche anterior porque estuvo bebiendo?', 'AUDIT_Q8', 'likert', 'dano', NULL),
  ((SELECT id FROM s), 8, '¿Usted o alguna otra persona resultó lesionada a causa de su consumo de alcohol?', 'AUDIT_Q9', 'multiple_choice', 'dano', 2),
  ((SELECT id FROM s), 9, '¿Algún familiar, amigo, médico u otro profesional de la salud ha mostrado preocupación por su consumo de alcohol o le ha sugerido que deje de beber?', 'AUDIT_Q10', 'multiple_choice', 'dano', 2);

-- Scoring rules AUDIT
DO $$
DECLARE v_test_id UUID; v_total UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'audit';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'total', 'Puntuación Total', 'sum',
    ARRAY['AUDIT_Q1','AUDIT_Q2','AUDIT_Q3','AUDIT_Q4','AUDIT_Q5','AUDIT_Q6','AUDIT_Q7','AUDIT_Q8','AUDIT_Q9','AUDIT_Q10'])
  RETURNING id INTO v_total;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_total, 0,  7,  'Consumo de bajo riesgo',        'low_risk',  '#22c55e', 'Consumo dentro de rangos de bajo riesgo.', 'Educación sobre límites de consumo responsable.', FALSE),
    (v_total, 8,  15, 'Consumo de riesgo',              'risky',     '#f59e0b', 'Consumo de riesgo. Posibles problemas relacionados al alcohol.', 'Intervención breve motivacional. Psicoeducación sobre riesgos.', FALSE),
    (v_total, 16, 19, 'Consumo perjudicial',            'harmful',   '#f97316', 'Daño relacionado al alcohol presente.', 'Evaluación diagnóstica. Intervención más intensiva. Considerar derivación especializada.', FALSE),
    (v_total, 20, 40, 'Probable dependencia al alcohol','dependence','#ef4444', 'Alta probabilidad de dependencia al alcohol.', 'Derivación urgente a tratamiento especializado en adicciones. No suspender abruptamente sin supervisión médica.', TRUE);
END $$;


-- =============================================================
-- 6. MoCA — Montreal Cognitive Assessment
-- Nasreddine et al. (2005) | Libre uso con registro
-- NOTA: Requiere registro institucional en mocatest.org
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'moca',
    'MoCA — Evaluación Cognitiva Montreal',
    'Instrumento de cribado cognitivo global de 30 puntos. Evalúa: atención, concentración, funciones ejecutivas, memoria, lenguaje, habilidades visuoconstructivas, pensamiento abstracto, cálculo y orientación. Score se ajusta +1 punto para personas con ≤12 años de educación.',
    'neuropsicologia', 'free_clinical', 1,
    'Nasreddine ZS et al. (2005) — mocatest.org',
    18, 15, '["self"]'::jsonb,
    180, 2.0, ARRAY['neuropsicologia']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'MoCA',
    'Administración presencial o telemática supervisada por profesional. Registre las puntuaciones según el manual oficial (mocatest.org).'
  FROM t RETURNING id
)
INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
VALUES
  ((SELECT id FROM s), 0,  'Alternancia visuoespacial / ejecutiva (5 pts)',           'MOCA_EXEC',    'cognitive_task', 'ejecutiva'),
  ((SELECT id FROM s), 1,  'Copia de cubo (1 pt)',                                    'MOCA_CUBO',    'cognitive_task', 'visuoespacial'),
  ((SELECT id FROM s), 2,  'Dibujo del reloj (3 pts)',                                'MOCA_RELOJ',   'cognitive_task', 'visuoespacial'),
  ((SELECT id FROM s), 3,  'Denominación de animales (3 pts)',                        'MOCA_DENOM',   'cognitive_task', 'lenguaje'),
  ((SELECT id FROM s), 4,  'Dígitos en orden directo (1 pt)',                         'MOCA_DIG_F',   'cognitive_task', 'atencion'),
  ((SELECT id FROM s), 5,  'Dígitos en orden inverso (1 pt)',                         'MOCA_DIG_B',   'cognitive_task', 'atencion'),
  ((SELECT id FROM s), 6,  'Vigilancia auditiva (1 pt)',                              'MOCA_VIGIL',   'cognitive_task', 'atencion'),
  ((SELECT id FROM s), 7,  'Serie de 7s (3 pts)',                                     'MOCA_SERIE7',  'cognitive_task', 'atencion'),
  ((SELECT id FROM s), 8,  'Repetición de frases (2 pts)',                            'MOCA_FRASES',  'cognitive_task', 'lenguaje'),
  ((SELECT id FROM s), 9,  'Fluencia verbal letra F (1 pt)',                          'MOCA_FLUENC',  'cognitive_task', 'lenguaje'),
  ((SELECT id FROM s), 10, 'Similitudes / Abstracción (2 pts)',                       'MOCA_ABSTR',   'cognitive_task', 'ejecutiva'),
  ((SELECT id FROM s), 11, 'Recuerdo diferido sin clave (5 pts)',                     'MOCA_REC',     'cognitive_task', 'memoria'),
  ((SELECT id FROM s), 12, 'Orientación (6 pts)',                                     'MOCA_ORIENT',  'cognitive_task', 'orientacion');

-- Scoring rules MoCA
DO $$
DECLARE v_test_id UUID; v_total UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'moca';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes)
  VALUES (v_test_id, 'total', 'Puntuación Total (ajustada)', 'sum',
    ARRAY['MOCA_EXEC','MOCA_CUBO','MOCA_RELOJ','MOCA_DENOM','MOCA_DIG_F','MOCA_DIG_B',
          'MOCA_VIGIL','MOCA_SERIE7','MOCA_FRASES','MOCA_FLUENC','MOCA_ABSTR','MOCA_REC','MOCA_ORIENT'])
  RETURNING id INTO v_total;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_total, 26, 30, 'Normal',                          'normal',   '#22c55e', 'Función cognitiva dentro del rango normal.', 'Sin intervención necesaria. Reaplicar en 12 meses si hay cambios.', FALSE),
    (v_total, 18, 25, 'Deterioro cognitivo leve',        'mci',      '#f59e0b', 'Posible deterioro cognitivo leve (DCL). Requiere evaluación diagnóstica completa.', 'Derivación a neuropsicología para evaluación completa. Descartar causas tratables.', FALSE),
    (v_total, 0,  17, 'Posible demencia',                'dementia', '#ef4444', 'Puntaje compatible con deterioro cognitivo moderado o demencia.', 'Derivación urgente a neurología o psiquiatría. Evaluación neuropsicológica completa.', TRUE);
END $$;


-- =============================================================
-- FIN DEL SEED — 6 instrumentos cargados:
-- PHQ-9, GAD-7, DASS-21, PCL-5, AUDIT, MoCA
-- =============================================================
