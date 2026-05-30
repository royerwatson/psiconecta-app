-- =============================================================
-- PSICONECTA — Seed: Instrumentos de Pareja y Familia
-- DAS-7, RAS, CSI-16, CSI-4, FACES-IV, FAD-GFS, CTS-2
-- =============================================================

-- =============================================================
-- 1. DAS-7 — Dyadic Adjustment Scale (Forma Breve)
-- Spanier (1976) / Forma breve: Sharpley & Cross (1982)
-- 7 ítems, escalas mixtas, ajuste diádico
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'das7',
    'DAS-7 — Escala de Ajuste Diádico (Forma Breve)',
    'Versión breve de 7 ítems de la Escala de Ajuste Diádico. Evalúa la satisfacción, cohesión y acuerdo en la relación de pareja. Punto de corte ≤ 21 sugiere relación en riesgo o insatisfacción significativa.',
    'relacional', 'public_domain', 1,
    'Spanier GB (1976) — Forma breve: Sharpley & Cross (1982)',
    18, 5, '["self"]'::jsonb,
    14, 3.0, ARRAY['clinica','pareja']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'DAS-7',
    'La mayoría de las personas tienen desacuerdos en sus relaciones. Por favor indica el grado aproximado de acuerdo o desacuerdo entre tú y tu pareja para cada uno de los temas.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, '¿Con qué frecuencia discutes o consideran el divorcio, separación o terminar la relación?',          'DAS7_Q1', 'likert', 'total', NULL),
    ((SELECT id FROM s), 1, '¿Con qué frecuencia tú y tu pareja se pelean?',                                                     'DAS7_Q2', 'likert', 'total', NULL),
    ((SELECT id FROM s), 2, '¿Con qué frecuencia tú y tu pareja se ponen los nervios el uno al otro?',                          'DAS7_Q3', 'likert', 'total', NULL),
    ((SELECT id FROM s), 3, '¿Con qué frecuencia tú y tu pareja hacen cosas juntos que son interesantes?',                      'DAS7_Q4', 'likert', 'total', NULL),
    ((SELECT id FROM s), 4, 'Indica si en las últimas semanas has pensado que las cosas van bien entre tú y tu pareja',          'DAS7_Q5', 'likert', 'total', NULL),
    ((SELECT id FROM s), 5, '¿Con qué frecuencia confías en tu pareja?',                                                         'DAS7_Q6', 'likert', 'total', NULL),
    ((SELECT id FROM s), 6, 'Indica el grado de felicidad, considerando todos los aspectos, que tu relación te proporciona',    'DAS7_Q7', 'likert', 'total', NULL)
  RETURNING id, order_index, item_code
)
-- Items Q1-Q3 tienen escala invertida; Q4-Q7 normal. Cada ítem 0-5.
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Siempre en desacuerdo / Nunca',         0),
  (1, 'Casi siempre en desacuerdo / Raramente', 1),
  (2, 'Frecuentemente en desacuerdo / A veces', 2),
  (3, 'Ocasionalmente en desacuerdo / Con frecuencia', 3),
  (4, 'Casi siempre de acuerdo / Muy frecuente', 4),
  (5, 'Siempre de acuerdo / Constantemente',   5)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Ajuste Diádico Total', 'sum',
    ARRAY['DAS7_Q1','DAS7_Q2','DAS7_Q3','DAS7_Q4','DAS7_Q5','DAS7_Q6','DAS7_Q7'],
    1.0
  FROM tests t WHERE t.slug = 'das7'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  14, 'Distress severo',   'severe',    '#ef4444', 'Relación en distress severo. Alta insatisfacción y conflicto.',           'Terapia de pareja urgente. Evaluar seguridad y coerción en la relación.', TRUE),
  ((SELECT id FROM sr), 15, 21, 'Distress moderado', 'moderate',  '#f97316', 'Relación en distress moderado. Insatisfacción notable.',                  'Terapia de pareja indicada. Trabajo en comunicación y resolución de conflictos.', FALSE),
  ((SELECT id FROM sr), 22, 28, 'Ajuste leve',       'mild',      '#f59e0b', 'Ajuste diádico bajo. Algunas áreas de mejora.',                           'Psicoeducación sobre relaciones. Considerar terapia de pareja preventiva.', FALSE),
  ((SELECT id FROM sr), 29, 35, 'Ajuste adecuado',   'normal',    '#22c55e', 'Relación bien ajustada. Satisfacción general satisfactoria.',             'Sin intervención específica necesaria.', FALSE);


-- =============================================================
-- 2. RAS — Relationship Assessment Scale
-- Hendrick (1988) | Dominio público
-- 7 ítems, 1-5, satisfacción global en la relación
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'ras',
    'RAS — Escala de Evaluación de la Relación',
    'Medida breve de 7 ítems de la satisfacción global con la relación de pareja. Simple, rápida y con buena validez convergente. Puntuación media por ítem: < 3.0 sugiere insatisfacción.',
    'relacional', 'public_domain', 1,
    'Hendrick SS (1988)',
    16, 3, '["self"]'::jsonb,
    14, 0.5, ARRAY['clinica','pareja']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'RAS',
    'Por favor responde las siguientes preguntas pensando en tu relación de pareja actual.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, '¿En qué medida tu pareja satisface tus necesidades?',                         'RAS_Q1', 'likert', 'total', NULL),
    ((SELECT id FROM s), 1, '¿En qué medida es buena tu relación en comparación con la mayoría?',          'RAS_Q2', 'likert', 'total', NULL),
    ((SELECT id FROM s), 2, '¿Con qué frecuencia desearías no haberte metido en esta relación?',           'RAS_Q3', 'likert', 'total', NULL),
    ((SELECT id FROM s), 3, '¿En qué medida tu relación ha satisfecho tus expectativas iniciales?',        'RAS_Q4', 'likert', 'total', NULL),
    ((SELECT id FROM s), 4, '¿En qué medida amas a tu pareja?',                                            'RAS_Q5', 'likert', 'total', NULL),
    ((SELECT id FROM s), 5, '¿Con qué frecuencia tienes problemas en tu relación?',                        'RAS_Q6', 'likert', 'total', NULL),
    ((SELECT id FROM s), 6, '¿En qué medida tu pareja satisface tus necesidades de compañía?',             'RAS_Q7', 'likert', 'total', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Para nada',         1),
  (1, 'Un poco',           2),
  (2, 'Moderadamente',     3),
  (3, 'Bastante',          4),
  (4, 'Completamente',     5)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Satisfacción en la Relación', 'average',
    ARRAY['RAS_Q1','RAS_Q2','RAS_Q3','RAS_Q4','RAS_Q5','RAS_Q6','RAS_Q7'],
    1.0
  FROM tests t WHERE t.slug = 'ras'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 1, 2, 'Insatisfacción severa',  'severe',   '#ef4444', 'Insatisfacción relacional severa. Riesgo de ruptura inminente.',   'Terapia de pareja urgente. Valorar factores de seguridad.', TRUE),
  ((SELECT id FROM sr), 3, 3, 'Insatisfacción moderada','moderate', '#f59e0b', 'Satisfacción moderada-baja. Áreas de conflicto significativas.',  'Terapia de pareja indicada.', FALSE),
  ((SELECT id FROM sr), 4, 4, 'Satisfacción moderada', 'mild',     '#86efac', 'Satisfacción relacional aceptable con áreas de mejora.',          'Psicoeducación o coaching de pareja.', FALSE),
  ((SELECT id FROM sr), 5, 5, 'Alta satisfacción',     'normal',   '#22c55e', 'Alta satisfacción en la relación.',                               'Sin intervención específica necesaria.', FALSE);


-- =============================================================
-- 3. CSI-16 — Couples Satisfaction Index (16 ítems)
-- Funk & Rogge (2007) | Dominio público
-- 16 ítems, escala variable, satisfacción marital
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'csi16',
    'CSI-16 — Índice de Satisfacción de Pareja (16 ítems)',
    'Instrumento de 16 ítems con formato de respuesta mixto que mide satisfacción marital/de pareja. Supera psicométricamente a instrumentos clásicos como el DAS. Punto de corte distress: ≤ 51.5.',
    'relacional', 'public_domain', 1,
    'Funk JL & Rogge RD (2007)',
    18, 6, '["self"]'::jsonb,
    14, 5.0, ARRAY['clinica','pareja']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'CSI-16',
    'Por favor indica tu acuerdo con las siguientes afirmaciones sobre tu relación actual.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Nuestra relación es fuerte',                                                   'CSI16_Q1',  'likert', 'total', NULL),
    ((SELECT id FROM s), 1,  'Mi relación con mi pareja me hace feliz',                                      'CSI16_Q2',  'likert', 'total', NULL),
    ((SELECT id FROM s), 2,  'Nuestra relación es estable',                                                  'CSI16_Q3',  'likert', 'total', NULL),
    ((SELECT id FROM s), 3,  'Mi relación con mi pareja me satisface',                                       'CSI16_Q4',  'likert', 'total', NULL),
    ((SELECT id FROM s), 4,  'Estoy comprometido/a con mi relación',                                         'CSI16_Q5',  'likert', 'total', NULL),
    ((SELECT id FROM s), 5,  'Me siento próximo/a a mi pareja',                                              'CSI16_Q6',  'likert', 'total', NULL),
    ((SELECT id FROM s), 6,  'Mi pareja y yo nos llevamos bien',                                             'CSI16_Q7',  'likert', 'total', NULL),
    ((SELECT id FROM s), 7,  'Mi relación con mi pareja es satisfactoria',                                   'CSI16_Q8',  'likert', 'total', NULL),
    ((SELECT id FROM s), 8,  'Nuestra relación está llena de amor',                                          'CSI16_Q9',  'likert', 'total', NULL),
    ((SELECT id FROM s), 9,  'Me siento bien en mi relación',                                                'CSI16_Q10', 'likert', 'total', NULL),
    ((SELECT id FROM s), 10, 'En general, ¿en qué medida está satisfecho/a con su relación?',               'CSI16_Q11', 'likert', 'total', NULL),
    ((SELECT id FROM s), 11, '¿En qué medida su pareja satisface sus necesidades?',                          'CSI16_Q12', 'likert', 'total', NULL),
    ((SELECT id FROM s), 12, '¿En qué medida su relación satisface sus expectativas originales?',            'CSI16_Q13', 'likert', 'total', NULL),
    ((SELECT id FROM s), 13, '¿En qué medida ama usted a su pareja?',                                        'CSI16_Q14', 'likert', 'total', NULL),
    ((SELECT id FROM s), 14, '¿Con qué frecuencia desearía no haberse metido en esta relación?',             'CSI16_Q15', 'likert', 'total', NULL),
    ((SELECT id FROM s), 15, '¿Con qué frecuencia piensa en terminar la relación?',                          'CSI16_Q16', 'likert', 'total', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Totalmente en desacuerdo', 0),
  (1, 'En desacuerdo',            1),
  (2, 'Neutro',                   2),
  (3, 'De acuerdo',               3),
  (4, 'Totalmente de acuerdo',    4),
  (5, 'Muy de acuerdo',           5)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Satisfacción de Pareja', 'sum',
    ARRAY['CSI16_Q1','CSI16_Q2','CSI16_Q3','CSI16_Q4','CSI16_Q5','CSI16_Q6','CSI16_Q7','CSI16_Q8','CSI16_Q9','CSI16_Q10','CSI16_Q11','CSI16_Q12','CSI16_Q13','CSI16_Q14','CSI16_Q15','CSI16_Q16'],
    1.0
  FROM tests t WHERE t.slug = 'csi16'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  35, 'Distress severo',    'severe',   '#ef4444', 'Distress relacional severo. Alto riesgo de ruptura.',      'Terapia de pareja urgente.', TRUE),
  ((SELECT id FROM sr), 36, 51, 'Distress moderado',  'moderate', '#f97316', 'Por debajo del punto de corte (≤51.5). Distress presente.','Terapia de pareja indicada.', FALSE),
  ((SELECT id FROM sr), 52, 65, 'Satisfacción media', 'mild',     '#86efac', 'Satisfacción relacional media-alta.',                       'Seguimiento. Prevención de problemas.', FALSE),
  ((SELECT id FROM sr), 66, 80, 'Alta satisfacción',  'normal',   '#22c55e', 'Alta satisfacción y ajuste en la relación.',                'Sin intervención específica.', FALSE);


-- =============================================================
-- 4. CSI-4 — Couples Satisfaction Index (4 ítems)
-- Funk & Rogge (2007) | Dominio público
-- Versión ultracorta para cribado rápido
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'csi4',
    'CSI-4 — Índice de Satisfacción de Pareja (4 ítems)',
    'Versión ultracorta del CSI. 4 ítems de alta carga factorial para cribado rápido de distress relacional en sesión. Punto de corte distress: ≤ 13.',
    'relacional', 'public_domain', 1,
    'Funk JL & Rogge RD (2007)',
    18, 2, '["self"]'::jsonb,
    7, 2.0, ARRAY['clinica','pareja']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'CSI-4',
    'Por favor responde las siguientes preguntas sobre tu relación de pareja actual.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, '¿En qué medida está satisfecho/a con su relación?',                   'CSI4_Q1', 'likert', 'total', NULL),
    ((SELECT id FROM s), 1, '¿En qué medida su relación satisface sus expectativas originales?',   'CSI4_Q2', 'likert', 'total', NULL),
    ((SELECT id FROM s), 2, '¿Con qué frecuencia desearía no haberse metido en esta relación?',    'CSI4_Q3', 'likert', 'total', NULL),
    ((SELECT id FROM s), 3, '¿Con qué frecuencia piensa en terminar la relación?',                 'CSI4_Q4', 'likert', 'total', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Para nada / Nunca',                  0),
  (1, 'Poco / Raramente',                   1),
  (2, 'Algo / A veces',                     2),
  (3, 'Bastante / Con frecuencia',          3),
  (4, 'Mucho / Casi siempre',               4),
  (5, 'Completamente / Siempre',            5)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Satisfacción de Pareja', 'sum',
    ARRAY['CSI4_Q1','CSI4_Q2','CSI4_Q3','CSI4_Q4'], 1.0
  FROM tests t WHERE t.slug = 'csi4'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  9,  'Distress severo',   'severe',   '#ef4444', 'Distress relacional severo.',         'Terapia de pareja urgente.', TRUE),
  ((SELECT id FROM sr), 10, 13, 'Distress moderado', 'moderate', '#f97316', 'Distress relacional moderado.',       'Terapia de pareja indicada.', FALSE),
  ((SELECT id FROM sr), 14, 17, 'Satisfacción media','mild',     '#86efac', 'Satisfacción relacional media.',      'Seguimiento preventivo.', FALSE),
  ((SELECT id FROM sr), 18, 20, 'Alta satisfacción', 'normal',   '#22c55e', 'Alta satisfacción de pareja.',        'Sin intervención específica.', FALSE);


-- =============================================================
-- 5. FACES-IV — Family Adaptability and Cohesion Scales IV
-- Olson (2011) | Licencia comercial — uso clínico estándar
-- 62 ítems, 1-5, cohesión y flexibilidad familiar
-- Versión abreviada: 42 ítems (6 escalas × 7 ítems) + 14 comunicación/satisfacción
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'faces-iv',
    'FACES-IV — Escalas de Adaptabilidad y Cohesión Familiar IV',
    'Basado en el Modelo Circumplex de Olson. Evalúa 6 dimensiones del funcionamiento familiar: cohesión equilibrada, sobreinvolucrada y desvinculada; flexibilidad equilibrada, rígida y caótica. Incluye escalas de comunicación y satisfacción familiar.',
    'relacional', 'restricted', 4,
    'Olson DH (2011)',
    12, 15, '["self","parent"]'::jsonb,
    30, 5.0, ARRAY['clinica','pareja','infantil']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'FACES-IV',
    'A continuación hay una serie de afirmaciones sobre las familias. Lee cada afirmación y decide cuánto se aplica a TU familia. Por favor responde todos los ítems.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    -- Cohesión equilibrada (7 ítems)
    ((SELECT id FROM s), 0,  'Los miembros de la familia se sienten muy cercanos unos a otros',                 'FACES_Q1',  'likert', 'cohesion_eq',   NULL),
    ((SELECT id FROM s), 1,  'Los miembros de la familia se apoyan unos a otros',                               'FACES_Q2',  'likert', 'cohesion_eq',   NULL),
    ((SELECT id FROM s), 2,  'Se da prioridad a la unión familiar',                                             'FACES_Q3',  'likert', 'cohesion_eq',   NULL),
    ((SELECT id FROM s), 3,  'En nuestra familia las decisiones importantes se toman entre todos',              'FACES_Q4',  'likert', 'cohesion_eq',   NULL),
    ((SELECT id FROM s), 4,  'Los miembros de la familia se involucran en las actividades de los demás',        'FACES_Q5',  'likert', 'cohesion_eq',   NULL),
    ((SELECT id FROM s), 5,  'Los miembros de la familia se consultan entre sí cuando toman decisiones',       'FACES_Q6',  'likert', 'cohesion_eq',   NULL),
    ((SELECT id FROM s), 6,  'Nuestra familia pasa tiempo junto cuando los miembros lo quieren',               'FACES_Q7',  'likert', 'cohesion_eq',   NULL),
    -- Cohesión desvinculada (7 ítems) — problemática
    ((SELECT id FROM s), 7,  'Los miembros de la familia se las arreglan mejor solos que juntos',              'FACES_Q8',  'likert', 'cohesion_desv', NULL),
    ((SELECT id FROM s), 8,  'Los problemas de cada miembro son asunto suyo',                                   'FACES_Q9',  'likert', 'cohesion_desv', NULL),
    ((SELECT id FROM s), 9,  'Los miembros de la familia se sienten solos en la familia',                      'FACES_Q10', 'likert', 'cohesion_desv', NULL),
    ((SELECT id FROM s), 10, 'Los miembros de la familia tienen poco interés en las actividades de los demás', 'FACES_Q11', 'likert', 'cohesion_desv', NULL),
    ((SELECT id FROM s), 11, 'En la familia hay poca lealtad',                                                  'FACES_Q12', 'likert', 'cohesion_desv', NULL),
    ((SELECT id FROM s), 12, 'Los miembros de la familia se sienten solos aunque estén juntos',               'FACES_Q13', 'likert', 'cohesion_desv', NULL),
    ((SELECT id FROM s), 13, 'A los miembros de la familia les cuesta implicarse unos con otros',              'FACES_Q14', 'likert', 'cohesion_desv', NULL),
    -- Cohesión sobreinvolucrada (7 ítems) — problemática
    ((SELECT id FROM s), 14, 'Los miembros de la familia dependen demasiado unos de otros',                    'FACES_Q15', 'likert', 'cohesion_sobre',NULL),
    ((SELECT id FROM s), 15, 'En nuestra familia los límites entre generaciones no están claros',              'FACES_Q16', 'likert', 'cohesion_sobre',NULL),
    ((SELECT id FROM s), 16, 'Los miembros de la familia se sienten obligados a pasar tiempo juntos',          'FACES_Q17', 'likert', 'cohesion_sobre',NULL),
    ((SELECT id FROM s), 17, 'Los miembros de la familia saben demasiado de la vida de los demás',            'FACES_Q18', 'likert', 'cohesion_sobre',NULL),
    ((SELECT id FROM s), 18, 'Parece que nunca hay tiempo en la familia para actividades individuales',        'FACES_Q19', 'likert', 'cohesion_sobre',NULL),
    ((SELECT id FROM s), 19, 'Los miembros de la familia se sienten presionados para pasar tiempo juntos',    'FACES_Q20', 'likert', 'cohesion_sobre',NULL),
    ((SELECT id FROM s), 20, 'En la familia existe una sobreimplicación emocional entre sus miembros',        'FACES_Q21', 'likert', 'cohesion_sobre',NULL),
    -- Flexibilidad equilibrada (7 ítems)
    ((SELECT id FROM s), 21, 'En nuestra familia los roles son claros para cada miembro',                      'FACES_Q22', 'likert', 'flex_eq',       NULL),
    ((SELECT id FROM s), 22, 'Nuestra familia comparte el liderazgo cuando es necesario',                     'FACES_Q23', 'likert', 'flex_eq',       NULL),
    ((SELECT id FROM s), 23, 'La disciplina en nuestra familia es justa',                                     'FACES_Q24', 'likert', 'flex_eq',       NULL),
    ((SELECT id FROM s), 24, 'Los miembros de la familia son capaces de cambiar los roles si es necesario',   'FACES_Q25', 'likert', 'flex_eq',       NULL),
    ((SELECT id FROM s), 25, 'Nuestra familia busca nuevas maneras de manejar los problemas',                  'FACES_Q26', 'likert', 'flex_eq',       NULL),
    ((SELECT id FROM s), 26, 'Las normas familiares pueden cambiar cuando la familia lo necesita',             'FACES_Q27', 'likert', 'flex_eq',       NULL),
    ((SELECT id FROM s), 27, 'Nuestra familia es capaz de adaptarse a los cambios',                            'FACES_Q28', 'likert', 'flex_eq',       NULL),
    -- Flexibilidad rígida (7 ítems) — problemática
    ((SELECT id FROM s), 28, 'En nuestra familia hay un líder que siempre toma las decisiones',               'FACES_Q29', 'likert', 'flex_rig',      NULL),
    ((SELECT id FROM s), 29, 'Las normas en nuestra familia no cambian nunca',                                 'FACES_Q30', 'likert', 'flex_rig',      NULL),
    ((SELECT id FROM s), 30, 'En nuestra familia no se pueden negociar las normas',                           'FACES_Q31', 'likert', 'flex_rig',      NULL),
    ((SELECT id FROM s), 31, 'En nuestra familia los roles nunca cambian',                                    'FACES_Q32', 'likert', 'flex_rig',      NULL),
    ((SELECT id FROM s), 32, 'La disciplina en nuestra familia es muy estricta',                              'FACES_Q33', 'likert', 'flex_rig',      NULL),
    ((SELECT id FROM s), 33, 'Siempre hacemos las cosas de la misma manera en nuestra familia',              'FACES_Q34', 'likert', 'flex_rig',      NULL),
    ((SELECT id FROM s), 34, 'En nuestra familia hay que seguir siempre las mismas normas',                   'FACES_Q35', 'likert', 'flex_rig',      NULL),
    -- Flexibilidad caótica (7 ítems) — problemática
    ((SELECT id FROM s), 35, 'En nuestra familia no hay un líder claro',                                      'FACES_Q36', 'likert', 'flex_caotica',  NULL),
    ((SELECT id FROM s), 36, 'Las responsabilidades de la familia cambian constantemente',                     'FACES_Q37', 'likert', 'flex_caotica',  NULL),
    ((SELECT id FROM s), 37, 'En nuestra familia no hay ninguna norma fija',                                   'FACES_Q38', 'likert', 'flex_caotica',  NULL),
    ((SELECT id FROM s), 38, 'Los miembros de la familia no siguen reglas constantes',                        'FACES_Q39', 'likert', 'flex_caotica',  NULL),
    ((SELECT id FROM s), 39, 'En nuestra familia nunca se sabe quién manda',                                   'FACES_Q40', 'likert', 'flex_caotica',  NULL),
    ((SELECT id FROM s), 40, 'Las decisiones familiares se toman de manera impulsiva',                        'FACES_Q41', 'likert', 'flex_caotica',  NULL),
    ((SELECT id FROM s), 41, 'Los planes en nuestra familia cambian continuamente',                            'FACES_Q42', 'likert', 'flex_caotica',  NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Totalmente en desacuerdo', 1),
  (1, 'En desacuerdo',            2),
  (2, 'Ni de acuerdo ni en desacuerdo', 3),
  (3, 'De acuerdo',               4),
  (4, 'Totalmente de acuerdo',    5)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_ceq UUID; sr_cdesv UUID; sr_csob UUID;
  sr_feq UUID; sr_frig UUID; sr_fcao UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'faces-iv';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'cohesion_eq', 'Cohesión Equilibrada', 'sum', ARRAY['FACES_Q1','FACES_Q2','FACES_Q3','FACES_Q4','FACES_Q5','FACES_Q6','FACES_Q7'], 1.0) RETURNING id INTO sr_ceq;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'cohesion_desv', 'Cohesión Desvinculada', 'sum', ARRAY['FACES_Q8','FACES_Q9','FACES_Q10','FACES_Q11','FACES_Q12','FACES_Q13','FACES_Q14'], 1.0) RETURNING id INTO sr_cdesv;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'cohesion_sobre', 'Cohesión Sobreinvolucrada', 'sum', ARRAY['FACES_Q15','FACES_Q16','FACES_Q17','FACES_Q18','FACES_Q19','FACES_Q20','FACES_Q21'], 1.0) RETURNING id INTO sr_csob;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'flex_eq', 'Flexibilidad Equilibrada', 'sum', ARRAY['FACES_Q22','FACES_Q23','FACES_Q24','FACES_Q25','FACES_Q26','FACES_Q27','FACES_Q28'], 1.0) RETURNING id INTO sr_feq;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'flex_rig', 'Flexibilidad Rígida', 'sum', ARRAY['FACES_Q29','FACES_Q30','FACES_Q31','FACES_Q32','FACES_Q33','FACES_Q34','FACES_Q35'], 1.0) RETURNING id INTO sr_frig;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'flex_caotica', 'Flexibilidad Caótica', 'sum', ARRAY['FACES_Q36','FACES_Q37','FACES_Q38','FACES_Q39','FACES_Q40','FACES_Q41','FACES_Q42'], 1.0) RETURNING id INTO sr_fcao;

  -- Rangos (7-35 por escala)
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  SELECT s.id, r.score_min, r.score_max, r.severity_label, r.severity_code, r.color_hex, r.description, r.recommendation, r.is_risk
  FROM (VALUES (sr_ceq, TRUE),(sr_feq, TRUE)) AS s(id, is_balanced)
  CROSS JOIN (VALUES
    (7,  17, 'Bajo',     'moderate', '#f59e0b', 'Niveles bajos en dimensión equilibrada. Disfunción posible.','Trabajo en áreas de cohesión y flexibilidad.', FALSE),
    (18, 26, 'Medio',    'mild',     '#86efac', 'Funcionamiento familiar moderado.',                          'Psicoeducación familiar. Reforzar fortalezas.', FALSE),
    (27, 35, 'Alto',     'normal',   '#22c55e', 'Buen funcionamiento en dimensión equilibrada.',              'Sin intervención específica.', FALSE)
  ) AS r(score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk);

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  SELECT s.id, r.score_min, r.score_max, r.severity_label, r.severity_code, r.color_hex, r.description, r.recommendation, r.is_risk
  FROM (VALUES (sr_cdesv),(sr_csob),(sr_frig),(sr_fcao)) AS s(id)
  CROSS JOIN (VALUES
    (7,  17, 'Bajo',     'normal',   '#22c55e', 'Niveles bajos en dimensión problemática. Buen funcionamiento.','Sin intervención específica.', FALSE),
    (18, 26, 'Moderado', 'moderate', '#f59e0b', 'Niveles moderados de disfunción.',                            'Explorar en sesión. Psicoeducación.', FALSE),
    (27, 35, 'Alto',     'severe',   '#ef4444', 'Disfunción familiar significativa en esta dimensión.',        'Intervención familiar sistémica indicada.', TRUE)
  ) AS r(score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk);
END $$;


-- =============================================================
-- 6. FAD-GFS — Family Assessment Device — General Functioning Scale
-- Epstein, Baldwin & Bishop (1983) | Dominio público
-- 12 ítems, 1-4, funcionamiento familiar general
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'fad-gfs',
    'FAD-GFS — Escala de Funcionamiento General Familiar',
    'Subescala de Funcionamiento General del Family Assessment Device de 12 ítems. Evalúa el funcionamiento familiar global. Punto de corte de disfunción: puntuación media > 2.0.',
    'relacional', 'public_domain', 1,
    'Epstein NB, Baldwin LM, Bishop DS (1983)',
    12, 4, '["self","parent"]'::jsonb,
    14, 0.3, ARRAY['clinica','pareja','infantil']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'FAD-GFS',
    'A continuación hay una serie de afirmaciones sobre familias. Lee cada afirmación y decide qué grado de acuerdo tienes con ella en relación a tu familia. Por favor responde todos los ítems.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'En la toma de decisiones podemos llegar a un acuerdo',                          'FAD_Q1',  'likert', 'total', NULL),
    ((SELECT id FROM s), 1,  'Podemos aceptar nuestras diferencias de opinión',                               'FAD_Q2',  'likert', 'total', NULL),
    ((SELECT id FROM s), 2,  'Podemos expresar con libertad nuestros sentimientos',                           'FAD_Q3',  'likert', 'total', NULL),
    ((SELECT id FROM s), 3,  'Hay muchos sentimientos negativos en nuestra familia',                          'FAD_Q4',  'likert', 'total', NULL),
    ((SELECT id FROM s), 4,  'Nos mostramos interesados unos por otros',                                     'FAD_Q5',  'likert', 'total', NULL),
    ((SELECT id FROM s), 5,  'Podemos tomar decisiones sobre cómo solucionar los problemas',                 'FAD_Q6',  'likert', 'total', NULL),
    ((SELECT id FROM s), 6,  'Cuando alguien está mal, los demás saben que pasa algo',                       'FAD_Q7',  'likert', 'total', NULL),
    ((SELECT id FROM s), 7,  'En nuestra familia se producen situaciones de crisis',                          'FAD_Q8',  'likert', 'total', NULL),
    ((SELECT id FROM s), 8,  'No nos llevamos bien unos con otros',                                          'FAD_Q9',  'likert', 'total', NULL),
    ((SELECT id FROM s), 9,  'Nuestra familia está organizada',                                              'FAD_Q10', 'likert', 'total', NULL),
    ((SELECT id FROM s), 10, 'Después de que ocurre una crisis, hay una vuelta a la normalidad',             'FAD_Q11', 'likert', 'total', NULL),
    ((SELECT id FROM s), 11, 'Es difícil identificar quién o qué origina los problemas familiares',         'FAD_Q12', 'likert', 'total', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Totalmente de acuerdo',    1),
  (1, 'De acuerdo',               2),
  (2, 'En desacuerdo',            3),
  (3, 'Totalmente en desacuerdo', 4)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Funcionamiento Familiar General', 'average',
    ARRAY['FAD_Q1','FAD_Q2','FAD_Q3','FAD_Q4','FAD_Q5','FAD_Q6','FAD_Q7','FAD_Q8','FAD_Q9','FAD_Q10','FAD_Q11','FAD_Q12'],
    1.0
  FROM tests t WHERE t.slug = 'fad-gfs'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 1, 2, 'Funcional',    'normal',   '#22c55e', 'Funcionamiento familiar saludable (media < 2.0).',         'Sin intervención específica.', FALSE),
  ((SELECT id FROM sr), 3, 3, 'Disfuncional', 'moderate', '#f59e0b', 'Disfunción familiar moderada (media > 2.0).',               'Psicoeducación familiar. Considerar terapia familiar.', FALSE),
  ((SELECT id FROM sr), 4, 4, 'Muy disfuncional','severe', '#ef4444', 'Disfunción familiar severa.',                              'Intervención familiar sistémica urgente.', TRUE);


-- =============================================================
-- 7. CTS-2 — Revised Conflict Tactics Scale (Forma Breve)
-- Straus et al. (1996) | Versión breve de uso clínico
-- 20 ítems (10 temas × 2 versiones: yo/pareja), 0-6
-- Evalúa negociación, agresión psicológica, física, lesiones y coerción sexual
-- IMPORTANTE: Alerta automática en subescala de violencia física/lesiones
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'cts2',
    'CTS-2 Breve — Escala de Tácticas de Conflicto Revisada (Forma Breve)',
    'Versión breve del CTS-2. Evalúa tácticas utilizadas durante conflictos de pareja: negociación, agresión psicológica, violencia física, lesiones corporales y coerción sexual. Cualquier ítem de violencia física o sexual debe generar alerta prioritaria al terapeuta.',
    'relacional', 'restricted', 2,
    'Straus MA, Hamby SL, Boney-McCoy S, Sugarman DB (1996)',
    18, 8, '["self"]'::jsonb,
    30, 1.0, ARRAY['clinica','pareja']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'CTS-2',
    'Sin importar cuánto está de acuerdo o en desacuerdo con tu pareja, indica con qué frecuencia han ocurrido las siguientes cosas en el último año. Usa la escala de 0 (nunca) a 6 (más de 20 veces).'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    -- Negociación
    ((SELECT id FROM s), 0,  'Expliqué mi punto de vista en un desacuerdo (yo hacia pareja)',                'CTS2_Q1',  'likert', 'negociacion',         NULL),
    ((SELECT id FROM s), 1,  'Mi pareja explicó su punto de vista en un desacuerdo',                        'CTS2_Q2',  'likert', 'negociacion',         NULL),
    -- Agresión psicológica
    ((SELECT id FROM s), 2,  'Insulté o hice sentir mal a mi pareja con palabras',                          'CTS2_Q3',  'likert', 'agresion_psicologica', NULL),
    ((SELECT id FROM s), 3,  'Mi pareja me insultó o me hizo sentir mal con palabras',                     'CTS2_Q4',  'likert', 'agresion_psicologica', NULL),
    ((SELECT id FROM s), 4,  'Amenacé a mi pareja con golpearla o tirarle algo',                            'CTS2_Q5',  'likert', 'agresion_psicologica', NULL),
    ((SELECT id FROM s), 5,  'Mi pareja me amenazó con golpearme o tirarme algo',                           'CTS2_Q6',  'likert', 'agresion_psicologica', NULL),
    -- Violencia física
    ((SELECT id FROM s), 6,  'Empujé o sacudí a mi pareja',                                                 'CTS2_Q7',  'likert', 'violencia_fisica',     1),
    ((SELECT id FROM s), 7,  'Mi pareja me empujó o sacudió',                                               'CTS2_Q8',  'likert', 'violencia_fisica',     1),
    ((SELECT id FROM s), 8,  'Golpeé a mi pareja con la mano o con algo más',                               'CTS2_Q9',  'likert', 'violencia_fisica',     1),
    ((SELECT id FROM s), 9,  'Mi pareja me golpeó con la mano o con algo más',                              'CTS2_Q10', 'likert', 'violencia_fisica',     1),
    -- Lesiones
    ((SELECT id FROM s), 10, 'Tuve un esguince, moretón o corte pequeño por un conflicto con mi pareja',   'CTS2_Q11', 'likert', 'lesiones',             1),
    ((SELECT id FROM s), 11, 'Mi pareja tuvo un esguince, moretón o corte pequeño debido a mí',            'CTS2_Q12', 'likert', 'lesiones',             1),
    ((SELECT id FROM s), 12, 'Necesité ver a un médico por lesiones causadas por mi pareja',               'CTS2_Q13', 'likert', 'lesiones',             1),
    ((SELECT id FROM s), 13, 'Mi pareja necesitó ver a un médico por lesiones que yo le causé',            'CTS2_Q14', 'likert', 'lesiones',             1),
    -- Coerción sexual
    ((SELECT id FROM s), 14, 'Insistí en tener relaciones aunque mi pareja no quería (sin usar fuerza física)', 'CTS2_Q15', 'likert', 'coercion_sexual', 1),
    ((SELECT id FROM s), 15, 'Mi pareja insistió en tener relaciones aunque yo no quería',                   'CTS2_Q16', 'likert', 'coercion_sexual',    1),
    ((SELECT id FROM s), 16, 'Usé la fuerza para hacer que mi pareja tuviera relaciones sexuales conmigo', 'CTS2_Q17', 'likert', 'coercion_sexual',    1),
    ((SELECT id FROM s), 17, 'Mi pareja usó la fuerza para hacerme tener relaciones sexuales',              'CTS2_Q18', 'likert', 'coercion_sexual',    1),
    -- Control
    ((SELECT id FROM s), 18, 'Limité el acceso de mi pareja a dinero o recursos económicos',                'CTS2_Q19', 'likert', 'coercion_sexual',    1),
    ((SELECT id FROM s), 19, 'Mi pareja limitó mi acceso a dinero o recursos económicos',                   'CTS2_Q20', 'likert', 'coercion_sexual',    1)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nunca',               0),
  (1, 'Una vez',             1),
  (2, '2 veces',             2),
  (3, '3-5 veces',           3),
  (4, '6-10 veces',          4),
  (5, '11-20 veces',         5),
  (6, 'Más de 20 veces',     6)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_neg UUID; sr_psic UUID; sr_fis UUID; sr_les UUID; sr_sex UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'cts2';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'negociacion', 'Negociación', 'sum', ARRAY['CTS2_Q1','CTS2_Q2'], 1.0) RETURNING id INTO sr_neg;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'agresion_psicologica', 'Agresión Psicológica', 'sum', ARRAY['CTS2_Q3','CTS2_Q4','CTS2_Q5','CTS2_Q6'], 1.0) RETURNING id INTO sr_psic;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'violencia_fisica', 'Violencia Física', 'sum', ARRAY['CTS2_Q7','CTS2_Q8','CTS2_Q9','CTS2_Q10'], 1.0) RETURNING id INTO sr_fis;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'lesiones', 'Lesiones Corporales', 'sum', ARRAY['CTS2_Q11','CTS2_Q12','CTS2_Q13','CTS2_Q14'], 1.0) RETURNING id INTO sr_les;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'coercion_sexual', 'Coerción Sexual / Control', 'sum', ARRAY['CTS2_Q15','CTS2_Q16','CTS2_Q17','CTS2_Q18','CTS2_Q19','CTS2_Q20'], 1.0) RETURNING id INTO sr_sex;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_neg,  0, 3,  'Baja',     'low_risk',  '#f59e0b', 'Negociación baja en conflictos.',             'Trabajar habilidades de resolución de conflictos.', FALSE),
    (sr_neg,  4, 12, 'Adecuada', 'normal',    '#22c55e', 'Negociación presente en conflictos.',         'Sin intervención específica.', FALSE),
    (sr_psic, 0, 1,  'Mínima',   'normal',    '#22c55e', 'Agresión psicológica mínima o nula.',         'Sin intervención específica.', FALSE),
    (sr_psic, 2, 8,  'Moderada', 'moderate',  '#f59e0b', 'Agresión psicológica presente.',              'Explorar dinámica relacional. Trabajo en comunicación.', FALSE),
    (sr_psic, 9, 24, 'Severa',   'severe',    '#ef4444', 'Agresión psicológica severa o crónica.',      'Intervención urgente en violencia emocional. Evaluar seguridad.', TRUE),
    (sr_fis,  0, 0,  'Ninguna',  'normal',    '#22c55e', 'Sin violencia física reportada.',              'Sin intervención específica.', FALSE),
    (sr_fis,  1, 24, 'Presente', 'extreme',   '#7f1d1d', '⚠️ VIOLENCIA FÍSICA REPORTADA. Alerta de seguridad.', 'PROTOCOLO DE SEGURIDAD INMEDIATO. Derivación urgente. Evaluar riesgo vital.', TRUE),
    (sr_les,  0, 0,  'Ninguna',  'normal',    '#22c55e', 'Sin lesiones reportadas.',                    'Sin intervención específica.', FALSE),
    (sr_les,  1, 24, 'Presente', 'extreme',   '#7f1d1d', '⚠️ LESIONES FÍSICAS REPORTADAS. Emergencia clínica.','PROTOCOLO DE SEGURIDAD INMEDIATO. Posible situación de violencia doméstica.', TRUE),
    (sr_sex,  0, 0,  'Ninguna',  'normal',    '#22c55e', 'Sin coerción sexual reportada.',              'Sin intervención específica.', FALSE),
    (sr_sex,  1, 24, 'Presente', 'extreme',   '#7f1d1d', '⚠️ COERCIÓN SEXUAL O CONTROL ECONÓMICO. Emergencia.','PROTOCOLO DE SEGURIDAD INMEDIATO. Derivación a recursos especializados.', TRUE);
END $$;
