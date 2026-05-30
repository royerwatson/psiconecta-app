-- =============================================================
-- PSICONECTA — Seed: Instrumentos Neuropsicológicos
-- SLUMS, DEX, TMT-A, TMT-B, Digit Span F/B, FAS, SDMT
-- =============================================================
-- NOTA IMPORTANTE: Los instrumentos neuropsicológicos de rendimiento
-- (TMT, Digit Span, FAS, SDMT) son pruebas de ejecución administradas
-- por el terapeuta/evaluador, NO instrumentos de autoinforme.
-- En la plataforma, el terapeuta registra los resultados brutos
-- y el sistema calcula percentiles e interpreta automáticamente.
-- Los ítems representan las instrucciones/registros del evaluador.
-- =============================================================

-- =============================================================
-- 1. SLUMS — Saint Louis University Mental Status Examination
-- Tariq et al. (2006) | Dominio público (Saint Louis University)
-- 11 tareas evaluadas por clínico, 0-30 puntos
-- Cribado cognitivo sensible a deterioro leve (MCI)
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'slums',
    'SLUMS — Examen del Estado Mental de Saint Louis',
    'Instrumento de cribado cognitivo de 11 tareas. Detecta Deterioro Cognitivo Leve (MCI) con mayor sensibilidad que el MMSE. Puntuación máxima: 30. Los puntos de corte varían según nivel educativo. Administrado por profesional de salud.',
    'neuropsicologia', 'public_domain', 1,
    'Tariq SH, Tumosa N, Chibnall JT, Perry MH, Morley JE (2006)',
    60, 10, '["clinician"]'::jsonb,
    90, 2.0, ARRAY['clinica','neuropsico']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'SLUMS',
    'INSTRUCCIONES PARA EL EVALUADOR: Administre las tareas en orden. Registre los puntos obtenidos por el paciente en cada ítem. Verifique el nivel educativo del paciente antes de interpretar los resultados.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  '¿Qué día de la semana es hoy? (1 punto)',                                              'SLUMS_Q1',  'likert', 'orientacion', NULL),
    ((SELECT id FROM s), 1,  '¿Qué año es? (1 punto)',                                                               'SLUMS_Q2',  'likert', 'orientacion', NULL),
    ((SELECT id FROM s), 2,  '¿Qué estado/ciudad estamos? (1 punto)',                                                'SLUMS_Q3',  'likert', 'orientacion', NULL),
    ((SELECT id FROM s), 3,  'Cuente hacia atrás desde 20 hasta 1 (Error = 0; 1-2 errores = 1 pt; sin errores = 2)','SLUMS_Q4',  'likert', 'atencion',    NULL),
    ((SELECT id FROM s), 4,  'Diga los meses del año al revés (Error = 0; 1-2 errores = 1 pt; sin errores = 2)',    'SLUMS_Q5',  'likert', 'atencion',    NULL),
    ((SELECT id FROM s), 5,  'Nombre de 5 objetos comunes en 1 minuto: marque ✓ si nombra ≥ 5 (2 ptos)',            'SLUMS_Q6',  'likert', 'memoria',     NULL),
    ((SELECT id FROM s), 6,  'Historia de 5 detalles: recuerda ≥ 4 detalles (4 ptos)',                              'SLUMS_Q7',  'likert', 'memoria',     NULL),
    ((SELECT id FROM s), 7,  'Calcule: si tiene $100 y gasta $7 al día ¿cuántos días dura? (2 ptos)',               'SLUMS_Q8',  'likert', 'calculo',     NULL),
    ((SELECT id FROM s), 8,  'Nombre de 4 animales: marque los que nombra (4 ptos)',                                 'SLUMS_Q9',  'likert', 'lenguaje',    NULL),
    ((SELECT id FROM s), 9,  'Prueba del reloj: dibuje las 11:10 (2 ptos)',                                          'SLUMS_Q10', 'likert', 'visoespacial',NULL),
    ((SELECT id FROM s), 10, 'Figuras geométricas: identifica las dos iguales (2 ptos)',                             'SLUMS_Q11', 'likert', 'visoespacial',NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, '0 puntos', 0),
  (1, '1 punto',  1),
  (2, '2 puntos', 2),
  (3, '3 puntos', 3),
  (4, '4 puntos', 4)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID; sr_total UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'slums';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'total', 'Puntuación Total SLUMS', 'sum',
    ARRAY['SLUMS_Q1','SLUMS_Q2','SLUMS_Q3','SLUMS_Q4','SLUMS_Q5','SLUMS_Q6','SLUMS_Q7','SLUMS_Q8','SLUMS_Q9','SLUMS_Q10','SLUMS_Q11'], 1.0)
  RETURNING id INTO sr_total;

  -- Puntos de corte para educación universitaria (≥ 12 años de escolaridad)
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 27, 30, 'Normal',   'normal',   '#22c55e', 'Funcionamiento cognitivo normal (educación ≥ 12 años).',               'Sin intervención específica. Reevaluar anualmente.', FALSE),
    (sr_total, 21, 26, 'MCI',      'mci',      '#f59e0b', 'Deterioro Cognitivo Leve probable (educación ≥ 12 años).',             'Evaluación neuropsicológica completa. Descartar causas tratables.', FALSE),
    (sr_total, 0,  20, 'Demencia', 'dementia', '#ef4444', 'Compatible con Demencia (educación ≥ 12 años). URGENT.',              'Derivación urgente a neurología/neuropsicología. Evaluación de capacidad y seguridad.', TRUE);
END $$;


-- =============================================================
-- 2. DEX — Dysexecutive Questionnaire
-- Wilson et al. (1996) | Behavioral Assessment of Dysexecutive Syndrome (BADS)
-- 20 ítems, 0-4, síntomas de disfunción ejecutiva en vida cotidiana
-- Versión autoinforme y versión cuidador
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'dex',
    'DEX — Cuestionario Disejecutivo (Autoinforme)',
    'Cuestionario de 20 ítems que evalúa la frecuencia de síntomas disejecutivos en la vida cotidiana: inhibición, intención, memoria executiva, planificación, cognición social y regulación emocional.',
    'neuropsicologia', 'restricted', 1,
    'Wilson BA, Alderman N, Burgess PW, Emslie H, Evans JJ (1996)',
    16, 7, '["self","informant"]'::jsonb,
    30, 5.0, ARRAY['clinica','neuropsico']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'DEX',
    'A continuación se describen problemas que pueden tener las personas en su vida diaria. Por favor indica con qué frecuencia te ha ocurrido cada uno de estos problemas en las últimas semanas.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Digo o hago cosas embarazosas sin darme cuenta de que son embarazosas',          'DEX_Q1',  'likert', 'inhibicion',    NULL),
    ((SELECT id FROM s), 1,  'Actúo sin pensar en las consecuencias',                                           'DEX_Q2',  'likert', 'inhibicion',    NULL),
    ((SELECT id FROM s), 2,  'Tengo dificultad para hacer planes de futuro',                                    'DEX_Q3',  'likert', 'planificacion', NULL),
    ((SELECT id FROM s), 3,  'Tengo cambios de humor sin razón aparente',                                       'DEX_Q4',  'likert', 'regulacion',    NULL),
    ((SELECT id FROM s), 4,  'No me doy cuenta de mis propios problemas',                                       'DEX_Q5',  'likert', 'conciencia',    NULL),
    ((SELECT id FROM s), 5,  'Me cuesta cambiar de una actividad a otra',                                       'DEX_Q6',  'likert', 'flexibilidad',  NULL),
    ((SELECT id FROM s), 6,  'Me resulta difícil empezar tareas aunque las tenga planificadas',                 'DEX_Q7',  'likert', 'intencion',     NULL),
    ((SELECT id FROM s), 7,  'Digo o hago cosas sin pensar y luego me arrepiento',                             'DEX_Q8',  'likert', 'inhibicion',    NULL),
    ((SELECT id FROM s), 8,  'Me resulta difícil hacer más de una cosa a la vez',                              'DEX_Q9',  'likert', 'planificacion', NULL),
    ((SELECT id FROM s), 9,  'No aprendo de mis errores',                                                       'DEX_Q10', 'likert', 'conciencia',    NULL),
    ((SELECT id FROM s), 10, 'Me resulta difícil parar de hacer algo aunque sepa que está mal',                'DEX_Q11', 'likert', 'inhibicion',    NULL),
    ((SELECT id FROM s), 11, 'Actúo de forma inapropiada en situaciones sociales sin darme cuenta',            'DEX_Q12', 'likert', 'social',        NULL),
    ((SELECT id FROM s), 12, 'Me resulta difícil organizar mis actividades diarias',                           'DEX_Q13', 'likert', 'planificacion', NULL),
    ((SELECT id FROM s), 13, 'Me resulta difícil tomar decisiones',                                            'DEX_Q14', 'likert', 'planificacion', NULL),
    ((SELECT id FROM s), 14, 'Pierdo el control de mis emociones fácilmente',                                  'DEX_Q15', 'likert', 'regulacion',    NULL),
    ((SELECT id FROM s), 15, 'Me resulta difícil ver las consecuencias de mis actos',                          'DEX_Q16', 'likert', 'conciencia',    NULL),
    ((SELECT id FROM s), 16, 'Tiendo a exagerar mis sentimientos',                                              'DEX_Q17', 'likert', 'regulacion',    NULL),
    ((SELECT id FROM s), 17, 'Digo lo que se me pasa por la cabeza sin filtros',                               'DEX_Q18', 'likert', 'inhibicion',    NULL),
    ((SELECT id FROM s), 18, 'Me resulta difícil mantener la motivación para terminar lo que empiezo',         'DEX_Q19', 'likert', 'intencion',     NULL),
    ((SELECT id FROM s), 19, 'Me resulta difícil entender los sentimientos de los demás',                      'DEX_Q20', 'likert', 'social',        NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nunca',          0),
  (1, 'Raramente',      1),
  (2, 'A veces',        2),
  (3, 'Frecuentemente', 3),
  (4, 'Casi siempre',   4)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Disfunción Ejecutiva Total', 'sum',
    ARRAY['DEX_Q1','DEX_Q2','DEX_Q3','DEX_Q4','DEX_Q5','DEX_Q6','DEX_Q7','DEX_Q8','DEX_Q9','DEX_Q10','DEX_Q11','DEX_Q12','DEX_Q13','DEX_Q14','DEX_Q15','DEX_Q16','DEX_Q17','DEX_Q18','DEX_Q19','DEX_Q20'],
    1.0
  FROM tests t WHERE t.slug = 'dex'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  19, 'Normal',              'normal',   '#22c55e', 'Funcionamiento ejecutivo cotidiano dentro de rango normal.',           'Sin intervención específica.', FALSE),
  ((SELECT id FROM sr), 20, 39, 'Disfunción leve',     'mild',     '#f59e0b', 'Síntomas disejecutivos leves con impacto en vida cotidiana.',          'Evaluación neuropsicológica formal. Estrategias compensatorias.', FALSE),
  ((SELECT id FROM sr), 40, 59, 'Disfunción moderada', 'moderate', '#f97316', 'Síntomas disejecutivos moderados. Impacto funcional notable.',         'Rehabilitación cognitiva. Coordinación con neurología.', FALSE),
  ((SELECT id FROM sr), 60, 80, 'Disfunción severa',   'severe',   '#ef4444', 'Síntomas disejecutivos severos. Alta discapacidad funcional.',          'Derivación urgente a neuropsicología. Evaluación de autonomía.', TRUE);


-- =============================================================
-- 3. TMT-A — Trail Making Test Part A
-- Reitan (1958) | Dominio público
-- Prueba de ejecución: conectar 25 números en orden (1-25)
-- El evaluador registra el tiempo en segundos
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'tmt-a',
    'TMT-A — Test de Trazado de Sendero (Parte A)',
    'Prueba de velocidad de procesamiento, atención sostenida y función motora. El paciente conecta 25 números del 1 al 25 lo más rápido posible. Se registra el tiempo en segundos. Administrado por evaluador. Normativas por edad.',
    'neuropsicologia', 'public_domain', 1,
    'Reitan RM (1958)',
    18, 5, '["clinician"]'::jsonb,
    90, 10.0, ARRAY['clinica','neuropsico']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'TMT-A',
    'INSTRUCCIONES PARA EL EVALUADOR: Presente la hoja con los números del 1 al 25 distribuidos aleatoriamente. Diga al paciente: "Conecte los números del 1 al 25 en orden tan rápido como pueda sin levantar el lápiz del papel". Registre el tiempo en segundos. Tiempo máximo: 300 segundos.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, 'Tiempo de ejecución en segundos (0 = no completó en 300s)',           'TMTA_Q1', 'free_text',   'tiempo',  NULL),
    ((SELECT id FROM s), 1, 'Número de errores cometidos',                                          'TMTA_Q2', 'likert', 'errores', NULL),
    ((SELECT id FROM s), 2, '¿Completó la tarea? (1=Sí, 0=No)',                                    'TMTA_Q3', 'multiple_choice', 'total',   NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, '0 errores', 0),(1, '1 error', 1),(2, '2 errores', 2),(3, '3 errores', 3),
  (4, '4 errores', 4),(5, '5+ errores',5)
) AS o(order_index, label, value)
WHERE item_code = 'TMTA_Q2';

-- Insertar opciones para ítem binario Q3
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM items i
JOIN test_sections s ON i.section_id = s.id
JOIN tests t ON s.test_id = t.id
CROSS JOIN (VALUES (0,'No',0),(1,'Sí',1)) AS o(order_index, label, value)
WHERE t.slug = 'tmt-a' AND i.item_code = 'TMTA_Q3';

DO $$
DECLARE
  tid UUID; sr_total UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'tmt-a';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'tiempo', 'Tiempo TMT-A (segundos)', 'sum', ARRAY['TMTA_Q1'], 1.0)
  RETURNING id INTO sr_total;

  -- Normativas para adultos 18-59 años (percentiles basados en Tombaugh 2004)
  -- Más alto = peor rendimiento
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 0,   29,  'Excelente', 'normal',   '#15803d', 'Tiempo muy rápido (percentil ≥ 75). Velocidad de procesamiento excelente.','Sin intervención.', FALSE),
    (sr_total, 30,  49,  'Normal',    'normal',   '#22c55e', 'Tiempo dentro del rango normal (percentil 25-75).',                        'Sin intervención.', FALSE),
    (sr_total, 50,  78,  'Límite',    'mild',     '#f59e0b', 'Tiempo lento (percentil 10-24). Posible enlentecimiento cognitivo.',       'Evaluación neuropsicológica. Comparar con TMT-B.', FALSE),
    (sr_total, 79,  300, 'Deterioro', 'severe',   '#ef4444', 'Tiempo muy lento (percentil < 10). Posible deterioro atencional/motor.',   'Derivación a neuropsicología. Evaluación completa.', TRUE);
END $$;


-- =============================================================
-- 4. TMT-B — Trail Making Test Part B
-- Reitan (1958) | Dominio público
-- Conectar alternando números y letras (1-A-2-B...) — Función ejecutiva
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'tmt-b',
    'TMT-B — Test de Trazado de Sendero (Parte B)',
    'Evalúa flexibilidad cognitiva y función ejecutiva. El paciente conecta alternando números y letras (1-A-2-B-3-C...) lo más rápido posible. La diferencia TMT-B minus TMT-A refleja el costo ejecutivo. Administrado por evaluador.',
    'neuropsicologia', 'public_domain', 1,
    'Reitan RM (1958)',
    18, 5, '["clinician"]'::jsonb,
    90, 15.0, ARRAY['clinica','neuropsico']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'TMT-B',
    'INSTRUCCIONES PARA EL EVALUADOR: Presente la hoja con números (1-13) y letras (A-L) distribuidos aleatoriamente. Diga: "Conecte alternando números y letras en orden (1-A-2-B-3-C...) tan rápido como pueda". Registre el tiempo en segundos. Tiempo máximo: 300 segundos.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, 'Tiempo de ejecución en segundos (0 = no completó en 300s)',     'TMTB_Q1', 'free_text',   'tiempo',  NULL),
    ((SELECT id FROM s), 1, 'Número de errores cometidos',                                    'TMTB_Q2', 'likert', 'errores', NULL),
    ((SELECT id FROM s), 2, '¿Completó la tarea? (1=Sí, 0=No)',                              'TMTB_Q3', 'multiple_choice', 'total',   NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0,'0 errores',0),(1,'1 error',1),(2,'2 errores',2),(3,'3-5 errores',3),(4,'6+ errores',4)
) AS o(order_index, label, value)
WHERE item_code = 'TMTB_Q2';

INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM items i
JOIN test_sections s ON i.section_id = s.id
JOIN tests t ON s.test_id = t.id
CROSS JOIN (VALUES (0,'No',0),(1,'Sí',1)) AS o(order_index, label, value)
WHERE t.slug = 'tmt-b' AND i.item_code = 'TMTB_Q3';

DO $$
DECLARE
  tid UUID; sr_total UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'tmt-b';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'tiempo', 'Tiempo TMT-B (segundos)', 'sum', ARRAY['TMTB_Q1'], 1.0)
  RETURNING id INTO sr_total;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 0,   74,  'Excelente', 'normal',   '#15803d', 'Tiempo muy rápido. Flexibilidad cognitiva excelente.',             'Sin intervención.', FALSE),
    (sr_total, 75,  120, 'Normal',    'normal',   '#22c55e', 'Tiempo dentro del rango normal.',                                  'Sin intervención.', FALSE),
    (sr_total, 121, 180, 'Límite',    'mild',     '#f59e0b', 'Tiempo lento. Posible dificultad de función ejecutiva.',           'Evaluación neuropsicológica. Comparar cociente TMT-B/A.', FALSE),
    (sr_total, 181, 300, 'Deterioro', 'severe',   '#ef4444', 'Tiempo muy lento. Posible deterioro ejecutivo/frontal.',           'Derivación a neuropsicología. Evaluación completa.', TRUE);
END $$;


-- =============================================================
-- 5. Digit Span — Prueba de Amplitud de Dígitos (Directa e Inversa)
-- Wechsler (1939, actualizado WAIS-IV 2008) | Evaluación estándar
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'digit-span',
    'Digit Span — Amplitud de Dígitos (Directa e Inversa)',
    'Evalúa memoria de trabajo y span atencional. El evaluador lee secuencias de dígitos y el paciente las repite directamente (forward) e inversamente (backward). La amplitud máxima correcta es el puntaje. Adaptado para administración clínica.',
    'neuropsicologia', 'public_domain', 1,
    'Wechsler D (1939) — Actualizado WAIS-IV (2008)',
    16, 5, '["clinician"]'::jsonb,
    30, 1.0, ARRAY['clinica','neuropsico']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'Digit Span',
    'INSTRUCCIONES: Lea las secuencias de dígitos al paciente a razón de 1 dígito por segundo. Para Forward: el paciente repite en el mismo orden. Para Backward: repite en orden inverso. Registre la longitud máxima de secuencia correcta.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, 'Amplitud máxima correcta — Dígitos Directos (Forward)',  'DS_FWD', 'likert', 'forward',  NULL),
    ((SELECT id FROM s), 1, 'Amplitud máxima correcta — Dígitos Inversos (Backward)', 'DS_BWD', 'likert', 'backward', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, '2 dígitos', 2),(1, '3 dígitos', 3),(2, '4 dígitos', 4),
  (3, '5 dígitos', 5),(4, '6 dígitos', 6),(5, '7 dígitos', 7),
  (6, '8 dígitos', 8),(7, '9 dígitos', 9)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID; sr_fwd UUID; sr_bwd UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'digit-span';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'forward', 'Dígitos Directos', 'sum', ARRAY['DS_FWD'], 1.0) RETURNING id INTO sr_fwd;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'backward', 'Dígitos Inversos', 'sum', ARRAY['DS_BWD'], 1.0) RETURNING id INTO sr_bwd;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_fwd, 7, 9, 'Normal alto', 'normal',   '#22c55e', 'Span atencional excelente (7+ dígitos).',              'Sin intervención específica.', FALSE),
    (sr_fwd, 5, 6, 'Normal',      'normal',   '#86efac', 'Span atencional dentro del rango normal (5-6 dígitos).','Sin intervención específica.', FALSE),
    (sr_fwd, 3, 4, 'Bajo',        'mild',     '#f59e0b', 'Span atencional bajo (3-4 dígitos). Posible inatención.','Evaluar con otras pruebas atencionales.', FALSE),
    (sr_fwd, 2, 2, 'Deterioro',   'severe',   '#ef4444', 'Span atencional muy reducido (< 3). Posible deterioro.', 'Evaluación neuropsicológica completa.', TRUE),
    (sr_bwd, 5, 9, 'Normal',      'normal',   '#22c55e', 'Memoria de trabajo adecuada (≥ 5 dígitos inversos).',  'Sin intervención específica.', FALSE),
    (sr_bwd, 3, 4, 'Bajo',        'mild',     '#f59e0b', 'Memoria de trabajo baja (3-4 inversos).',              'Evaluar función ejecutiva y memoria de trabajo.', FALSE),
    (sr_bwd, 2, 2, 'Deterioro',   'severe',   '#ef4444', 'Memoria de trabajo muy reducida (< 3 inversos).',      'Evaluación neuropsicológica completa.', TRUE);
END $$;


-- =============================================================
-- 6. FAS — Verbal Fluency Test (Fluidez Verbal Fonémica)
-- Benton & Hamsher (1976) | Dominio público
-- El paciente genera palabras con letras F, A, S en 60 segundos cada una
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'fas-fluency',
    'FAS — Prueba de Fluidez Verbal Fonémica',
    'Evalúa fluidez verbal fonémica (función ejecutiva frontal) y recuperación léxica. El paciente dice la mayor cantidad de palabras que empiecen por F, A y S en 60 segundos cada letra. Se excluyen nombres propios, números y variantes de la misma palabra.',
    'neuropsicologia', 'public_domain', 1,
    'Benton AL & Hamsher K (1976)',
    16, 5, '["clinician"]'::jsonb,
    30, 4.0, ARRAY['clinica','neuropsico']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'FAS',
    'INSTRUCCIONES: Diga al paciente: "Voy a pedirle que diga palabras que empiecen por una letra específica. Por ejemplo, si la letra fuera P, podría decir: perro, plato, puerta... y así. Tiene 60 segundos para cada letra. No vale repetir palabras, nombres propios ni números. ¿Listo/a?". Registre el número de palabras válidas para cada letra.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, 'Número de palabras válidas con letra F (60 segundos)',   'FAS_F', 'likert', 'total', NULL),
    ((SELECT id FROM s), 1, 'Número de palabras válidas con letra A (60 segundos)',   'FAS_A', 'likert', 'total', NULL),
    ((SELECT id FROM s), 2, 'Número de palabras válidas con letra S (60 segundos)',   'FAS_S', 'likert', 'total', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0,'0-3 palabras',2),(1,'4-6 palabras',5),(2,'7-9 palabras',8),
  (3,'10-12 palabras',11),(4,'13-15 palabras',14),(5,'16-18 palabras',17),
  (6,'19-21 palabras',20),(7,'22+ palabras',22)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID; sr_total UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'fas-fluency';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'total', 'FAS Total (F+A+S)', 'sum', ARRAY['FAS_F','FAS_A','FAS_S'], 1.0)
  RETURNING id INTO sr_total;

  -- Normativas Tombaugh et al. (1999), adultos 18-59 años, educación media
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 0,  29, 'Deterioro',   'severe',  '#ef4444', 'Fluidez fonémica significativamente reducida (< 30). Posible disfunción frontal o afasia.',     'Evaluación neuropsicológica completa. Descartar afasia.', TRUE),
    (sr_total, 30, 39, 'Límite',      'moderate','#f59e0b', 'Fluidez fonémica en rango límite (30-39).',                                                      'Comparar con fluidez semántica. Monitorear.', FALSE),
    (sr_total, 40, 54, 'Normal',      'normal',  '#22c55e', 'Fluidez fonémica dentro del rango normal (40-54).',                                               'Sin intervención específica.', FALSE),
    (sr_total, 55, 99, 'Excelente',   'normal',  '#15803d', 'Fluidez fonémica excelente (≥ 55).',                                                              'Sin intervención específica.', FALSE);
END $$;


-- =============================================================
-- 7. SDMT — Symbol Digit Modalities Test
-- Smith (1973) | Licencia — Western Psychological Services
-- 90 segundos: asociar símbolos a dígitos. Velocidad de procesamiento.
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'sdmt',
    'SDMT — Test de Símbolos y Dígitos',
    'Mide velocidad de procesamiento de información, atención sostenida y función visomotora. El paciente tiene 90 segundos para asociar símbolos a sus dígitos correspondientes usando una clave. Sensible a desmielinización y daño cerebral difuso.',
    'neuropsicologia', 'restricted', 1,
    'Smith A (1973)',
    8, 5, '["clinician","self"]'::jsonb,
    30, 5.0, ARRAY['clinica','neuropsico']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'SDMT',
    'INSTRUCCIONES: Presente la hoja con la clave de 9 símbolos (cada uno asociado a un dígito 1-9) y 110 pares símbolo-espacio en blanco. Diga: "Mire la clave en la parte superior. Tiene que escribir el número que corresponde a cada símbolo lo más rápido posible durante 90 segundos". Registre el número de respuestas correctas en 90 segundos.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, 'Número de respuestas correctas en 90 segundos',       'SDMT_Q1', 'likert', 'total', NULL),
    ((SELECT id FROM s), 1, 'Número de errores cometidos',                          'SDMT_Q2', 'likert', 'errores', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0,'0-20 respuestas',10),(1,'21-30 respuestas',25),(2,'31-40 respuestas',35),
  (3,'41-50 respuestas',45),(4,'51-60 respuestas',55),(5,'61-70 respuestas',65),
  (6,'71-80 respuestas',75),(7,'81+ respuestas',85)
) AS o(order_index, label, value)
WHERE item_code = 'SDMT_Q1';

INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM items i
JOIN test_sections s ON i.section_id = s.id
JOIN tests t ON s.test_id = t.id
CROSS JOIN (VALUES
  (0,'0 errores',0),(1,'1-2 errores',1),(2,'3-5 errores',3),(3,'6+ errores',6)
) AS o(order_index, label, value)
WHERE t.slug = 'sdmt' AND i.item_code = 'SDMT_Q2';

DO $$
DECLARE
  tid UUID; sr_total UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'sdmt';
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'total', 'Respuestas Correctas SDMT', 'sum', ARRAY['SDMT_Q1'], 1.0)
  RETURNING id INTO sr_total;

  -- Normativas para adultos 18-59 años (Benedict et al. 2006 — versión oral)
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 0,  30, 'Deterioro significativo', 'severe',  '#ef4444', 'Velocidad de procesamiento muy reducida (< 30). Alta probabilidad de disfunción cognitiva.',  'Derivación urgente a neuropsicología. Descartar EM, daño cerebral difuso.', TRUE),
    (sr_total, 31, 44, 'Límite',                  'moderate','#f59e0b', 'Velocidad de procesamiento baja (31-44). Posible enlentecimiento cognitivo.',                  'Evaluación neuropsicológica. Comparar con TMT-A.', FALSE),
    (sr_total, 45, 60, 'Normal',                   'normal',  '#22c55e', 'Velocidad de procesamiento dentro del rango normal (45-60).',                                  'Sin intervención específica.', FALSE),
    (sr_total, 61, 99, 'Excelente',                'normal',  '#15803d', 'Velocidad de procesamiento excelente (≥ 61).',                                                  'Sin intervención específica.', FALSE);
END $$;
