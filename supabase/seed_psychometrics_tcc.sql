-- =============================================================
-- PSICONECTA — Seed: Instrumentos TCC y Síntomas Adicionales
-- OCI-R, PHQ-15, PTGI, BIS-11, DERS, EDE-Q
-- =============================================================

-- =============================================================
-- 1. OCI-R — Obsessive Compulsive Inventory Revised
-- Foa et al. (2002) | Dominio público
-- 18 ítems, 0-4, 6 subescalas (washing, obsessing, hoarding,
-- ordering, checking, neutralizing)
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'oci-r',
    'OCI-R — Inventario Obsesivo-Compulsivo Revisado',
    'Instrumento de 18 ítems que evalúa síntomas obsesivo-compulsivos en 6 subescalas: lavado, obsesión, acumulación, orden, comprobación y neutralización. Punto de corte clínico ≥ 21.',
    'sintomas', 'public_domain', 1,
    'Foa EB, Huppert JD, Leiberg S et al. (2002)',
    12, 7, '["self"]'::jsonb,
    14, 6.0, ARRAY['clinica','tcc']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'OCI-R',
    'Las siguientes afirmaciones se refieren a experiencias que muchas personas tienen en su vida cotidiana. Indica con qué frecuencia y qué tanto malestar te ha causado cada experiencia durante el ÚLTIMO MES. Califica el malestar del 0 al 4.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Tengo que limpiar ciertos objetos de la forma "correcta"', 'OCIR_Q1',  'likert', 'washing',      NULL),
    ((SELECT id FROM s), 1,  'Tengo dificultad para controlar mis propios pensamientos', 'OCIR_Q2',  'likert', 'obsessing',    NULL),
    ((SELECT id FROM s), 2,  'Tengo que acumular cosas aunque no las necesite',           'OCIR_Q3',  'likert', 'hoarding',     NULL),
    ((SELECT id FROM s), 3,  'Tengo que ordenar las cosas de cierta manera',              'OCIR_Q4',  'likert', 'ordering',     NULL),
    ((SELECT id FROM s), 4,  'Me siento obligado/a a comprobar las cosas repetidamente', 'OCIR_Q5',  'likert', 'checking',     NULL),
    ((SELECT id FROM s), 5,  'Me resulta difícil tocar objetos cuando sé que han sido tocados por extraños', 'OCIR_Q6', 'likert', 'washing', NULL),
    ((SELECT id FROM s), 6,  'Tengo pensamientos perturbadores que vienen a mi mente aunque no quiero', 'OCIR_Q7', 'likert', 'obsessing', NULL),
    ((SELECT id FROM s), 7,  'Me preocupa guardar cosas que no necesito',                 'OCIR_Q8',  'likert', 'hoarding',     NULL),
    ((SELECT id FROM s), 8,  'Me molesto mucho si los objetos no están en el orden correcto', 'OCIR_Q9', 'likert', 'ordering',  NULL),
    ((SELECT id FROM s), 9,  'Siento que debo repetir ciertos números',                  'OCIR_Q10', 'likert', 'neutralizing', NULL),
    ((SELECT id FROM s), 10, 'A veces tengo que lavarme o limpiarme solo para sentirme bien', 'OCIR_Q11', 'likert', 'washing',  NULL),
    ((SELECT id FROM s), 11, 'A pesar de hacer algo con mucho cuidado, frecuentemente pienso que no está terminado', 'OCIR_Q12', 'likert', 'checking', NULL),
    ((SELECT id FROM s), 12, 'Tengo pensamientos perturbadores sobre hacer daño a alguien', 'OCIR_Q13', 'likert', 'obsessing', NULL),
    ((SELECT id FROM s), 13, 'Me resulta difícil desechar objetos viejos aunque no sean útiles', 'OCIR_Q14', 'likert', 'hoarding', NULL),
    ((SELECT id FROM s), 14, 'Me molesto mucho si la rutina cambia',                     'OCIR_Q15', 'likert', 'ordering',     NULL),
    ((SELECT id FROM s), 15, 'Siento que necesito repetir ciertos comportamientos un número exacto de veces', 'OCIR_Q16', 'likert', 'neutralizing', NULL),
    ((SELECT id FROM s), 16, 'Me resulta difícil no pensar en pensamientos malos o incómodos', 'OCIR_Q17', 'likert', 'obsessing', NULL),
    ((SELECT id FROM s), 17, 'Tengo que comprobar si he causado daño o no',              'OCIR_Q18', 'likert', 'checking',     NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nada',       0),
  (1, 'Un poco',    1),
  (2, 'Moderado',   2),
  (3, 'Bastante',   3),
  (4, 'Muchísimo',  4)
) AS o(order_index, label, value);

-- Scoring rules OCI-R — Total + 6 subescalas
DO $$
DECLARE
  tid UUID;
  sr_total UUID; sr_wash UUID; sr_obs UUID; sr_hoard UUID;
  sr_order UUID; sr_check UUID; sr_neut UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'oci-r';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'total', 'Puntuación Total', 'sum',
    ARRAY['OCIR_Q1','OCIR_Q2','OCIR_Q3','OCIR_Q4','OCIR_Q5','OCIR_Q6','OCIR_Q7','OCIR_Q8','OCIR_Q9','OCIR_Q10','OCIR_Q11','OCIR_Q12','OCIR_Q13','OCIR_Q14','OCIR_Q15','OCIR_Q16','OCIR_Q17','OCIR_Q18'], 1.0)
  RETURNING id INTO sr_total;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'washing', 'Lavado', 'sum', ARRAY['OCIR_Q1','OCIR_Q6','OCIR_Q11'], 1.0)
  RETURNING id INTO sr_wash;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'obsessing', 'Obsesión', 'sum', ARRAY['OCIR_Q2','OCIR_Q7','OCIR_Q13','OCIR_Q17'], 1.0)
  RETURNING id INTO sr_obs;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'hoarding', 'Acumulación', 'sum', ARRAY['OCIR_Q3','OCIR_Q8','OCIR_Q14'], 1.0)
  RETURNING id INTO sr_hoard;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'ordering', 'Orden', 'sum', ARRAY['OCIR_Q4','OCIR_Q9','OCIR_Q15'], 1.0)
  RETURNING id INTO sr_order;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'checking', 'Comprobación', 'sum', ARRAY['OCIR_Q5','OCIR_Q12','OCIR_Q18'], 1.0)
  RETURNING id INTO sr_check;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'neutralizing', 'Neutralización', 'sum', ARRAY['OCIR_Q10','OCIR_Q16'], 1.0)
  RETURNING id INTO sr_neut;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 0,  20, 'Subclínico',   'subclinical', '#22c55e', 'Síntomas OC por debajo del umbral clínico.',                                    'Monitoreo. Sin intervención específica requerida.', FALSE),
    (sr_total, 21, 40, 'Leve',         'mild',        '#86efac', 'Por encima del punto de corte clínico (≥21). Síntomas moderados de TOC.',       'Psicoeducación sobre TOC. Valorar inicio de TCC/ERP.', FALSE),
    (sr_total, 41, 54, 'Moderado',     'moderate',    '#f59e0b', 'Síntomas OC moderados con impacto funcional.',                                  'TCC con Exposición y Prevención de Respuesta indicada.', FALSE),
    (sr_total, 55, 72, 'Severo',       'severe',      '#ef4444', 'Síntomas OC severos. Alto impacto en calidad de vida.',                         'Tratamiento intensivo: TCC + evaluación farmacológica (ISRS).', TRUE);

  -- Rangos para subescalas (0-12 lavado/orden/comprobación, 0-16 obsesión)
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_wash,  0, 3,  'Bajo',     'low_risk',    '#22c55e', 'Síntomas de lavado mínimos.',  'Sin acción específica.', FALSE),
    (sr_wash,  4, 8,  'Moderado', 'moderate',    '#f59e0b', 'Síntomas de lavado presentes.','Explorar rituales de limpieza.', FALSE),
    (sr_wash,  9, 12, 'Alto',     'severe',      '#ef4444', 'Síntomas de lavado significativos.', 'Intervención ERP específica.', FALSE),
    (sr_obs,   0, 4,  'Bajo',     'low_risk',    '#22c55e', 'Obsesiones mínimas.',          'Sin acción específica.', FALSE),
    (sr_obs,   5, 10, 'Moderado', 'moderate',    '#f59e0b', 'Obsesiones presentes.',         'Técnicas de defusión cognitiva.', FALSE),
    (sr_obs,   11,16, 'Alto',     'severe',      '#ef4444', 'Obsesiones significativas.',    'TCC para TOC prioritaria.', FALSE),
    (sr_hoard, 0, 3,  'Bajo',     'low_risk',    '#22c55e', 'Acumulación mínima.',          'Sin acción específica.', FALSE),
    (sr_hoard, 4, 8,  'Moderado', 'moderate',    '#f59e0b', 'Tendencias acumuladoras.',     'Psicoeducación sobre acumulación.', FALSE),
    (sr_hoard, 9, 12, 'Alto',     'severe',      '#ef4444', 'Trastorno de acumulación probable.', 'Evaluación diagnóstica diferencial.', FALSE),
    (sr_order, 0, 3,  'Bajo',     'low_risk',    '#22c55e', 'Necesidad de orden mínima.',   'Sin acción específica.', FALSE),
    (sr_order, 4, 8,  'Moderado', 'moderate',    '#f59e0b', 'Necesidad de orden elevada.',  'Explorar rigidez cognitiva.', FALSE),
    (sr_order, 9, 12, 'Alto',     'severe',      '#ef4444', 'Perfeccionismo patológico.',   'Intervención en rigidez y perfeccionismo.', FALSE),
    (sr_check, 0, 3,  'Bajo',     'low_risk',    '#22c55e', 'Comprobación mínima.',         'Sin acción específica.', FALSE),
    (sr_check, 4, 8,  'Moderado', 'moderate',    '#f59e0b', 'Comprobación moderada.',       'Registrar rituales de comprobación.', FALSE),
    (sr_check, 9, 12, 'Alto',     'severe',      '#ef4444', 'Comprobación significativa.',  'ERP con foco en comprobación.', FALSE),
    (sr_neut,  0, 2,  'Bajo',     'low_risk',    '#22c55e', 'Neutralización mínima.',       'Sin acción específica.', FALSE),
    (sr_neut,  3, 5,  'Moderado', 'moderate',    '#f59e0b', 'Neutralización presente.',     'Identificar rituales mentales.', FALSE),
    (sr_neut,  6, 8,  'Alto',     'severe',      '#ef4444', 'Neutralización significativa.','Trabajar rituales mentales con ERP.', FALSE);
END $$;


-- =============================================================
-- 2. PHQ-15 — Patient Health Questionnaire (Síntomas Somáticos)
-- Kroenke, Spitzer & Williams (2002) | Dominio público
-- 15 ítems, 0-2, síntomas somáticos funcionales
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'phq15',
    'PHQ-15 — Cuestionario de Síntomas Somáticos',
    'Instrumento de 15 ítems que evalúa la gravedad de síntomas somáticos funcionales. Complementa al PHQ-9 para el perfil completo del paciente. Útil en medicina psicosomática.',
    'sintomas', 'public_domain', 1,
    'Kroenke K, Spitzer RL, Williams JB (2002)',
    13, 4, '["self"]'::jsonb,
    14, 4.0, ARRAY['clinica','tcc']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'PHQ-15',
    'Durante las últimas 4 semanas, ¿cuánto te han molestado los siguientes problemas?'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Dolor de estómago',                                         'PHQ15_Q1',  'likert', 'total', NULL),
    ((SELECT id FROM s), 1,  'Dolor de espalda',                                           'PHQ15_Q2',  'likert', 'total', NULL),
    ((SELECT id FROM s), 2,  'Dolor en los brazos, piernas o articulaciones',              'PHQ15_Q3',  'likert', 'total', NULL),
    ((SELECT id FROM s), 3,  'Cólicos menstruales u otros problemas relacionados (si aplica)', 'PHQ15_Q4', 'likert', 'total', NULL),
    ((SELECT id FROM s), 4,  'Dolores de cabeza',                                          'PHQ15_Q5',  'likert', 'total', NULL),
    ((SELECT id FROM s), 5,  'Dolor en el pecho',                                          'PHQ15_Q6',  'likert', 'total', NULL),
    ((SELECT id FROM s), 6,  'Mareos',                                                     'PHQ15_Q7',  'likert', 'total', NULL),
    ((SELECT id FROM s), 7,  'Desmayos',                                                   'PHQ15_Q8',  'likert', 'total', NULL),
    ((SELECT id FROM s), 8,  'Latidos acelerados o irregulares del corazón',               'PHQ15_Q9',  'likert', 'total', NULL),
    ((SELECT id FROM s), 9,  'Falta de aliento',                                           'PHQ15_Q10', 'likert', 'total', NULL),
    ((SELECT id FROM s), 10, 'Dolor o problemas durante las relaciones sexuales (si aplica)', 'PHQ15_Q11', 'likert', 'total', NULL),
    ((SELECT id FROM s), 11, 'Estreñimiento, deposiciones sueltas o diarrea',              'PHQ15_Q12', 'likert', 'total', NULL),
    ((SELECT id FROM s), 12, 'Náuseas, gases o indigestión',                               'PHQ15_Q13', 'likert', 'total', NULL),
    ((SELECT id FROM s), 13, 'Cansancio o falta de energía',                               'PHQ15_Q14', 'likert', 'total', NULL),
    ((SELECT id FROM s), 14, 'Problemas para dormir',                                      'PHQ15_Q15', 'likert', 'total', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Para nada',        0),
  (1, 'Un poco',          1),
  (2, 'Mucho',            2)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Síntomas Somáticos', 'sum',
    ARRAY['PHQ15_Q1','PHQ15_Q2','PHQ15_Q3','PHQ15_Q4','PHQ15_Q5','PHQ15_Q6','PHQ15_Q7','PHQ15_Q8','PHQ15_Q9','PHQ15_Q10','PHQ15_Q11','PHQ15_Q12','PHQ15_Q13','PHQ15_Q14','PHQ15_Q15'],
    1.0
  FROM tests t WHERE t.slug = 'phq15'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  4,  'Mínimo',   'minimal',  '#22c55e', 'Carga somática mínima. Sin somatización significativa.',                         'Monitoreo rutinario.', FALSE),
  ((SELECT id FROM sr), 5,  9,  'Leve',     'mild',     '#86efac', 'Síntomas somáticos leves. Puede haber somatización funcional.',                  'Psicoeducación sobre conexión mente-cuerpo.', FALSE),
  ((SELECT id FROM sr), 10, 14, 'Moderado', 'moderate', '#f59e0b', 'Carga somática moderada. Evaluar causas orgánicas y factor psicosomático.',     'Coordinación con médico tratante. Intervención psicosomática.', FALSE),
  ((SELECT id FROM sr), 15, 30, 'Severo',   'severe',   '#ef4444', 'Carga somática severa. Alta probabilidad de trastorno de síntomas somáticos.',  'Derivación a medicina psicosomática. Tratamiento multidisciplinar urgente.', TRUE);


-- =============================================================
-- 3. PTGI — Post-Traumatic Growth Inventory
-- Tedeschi & Calhoun (1996) | Licencia requerida (uso clínico libre)
-- 21 ítems, 0-5, 5 subescalas de crecimiento postraumático
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'ptgi',
    'PTGI — Inventario de Crecimiento Postraumático',
    'Instrumento de 21 ítems que mide el crecimiento positivo experimentado como resultado de la lucha con eventos traumáticos en 5 dimensiones. Mayor puntuación indica mayor crecimiento percibido.',
    'sintomas', 'restricted', 1,
    'Tedeschi RG & Calhoun LG (1996)',
    17, 10, '["self"]'::jsonb,
    30, 8.0, ARRAY['clinica','trauma']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'PTGI',
    'Indica en qué medida experimentaste cada uno de los siguientes cambios como resultado de tu crisis o evento difícil. Considera el grado de cambio, no si lo valoras positivamente o negativamente.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Cambié mis prioridades sobre lo que es importante en la vida',               'PTGI_Q1',  'likert', 'new_possibilities', NULL),
    ((SELECT id FROM s), 1,  'Tengo más apreciación por el valor de mi propia vida',                       'PTGI_Q2',  'likert', 'appreciation',       NULL),
    ((SELECT id FROM s), 2,  'Desarrollé nuevos intereses',                                                'PTGI_Q3',  'likert', 'new_possibilities',  NULL),
    ((SELECT id FROM s), 3,  'Me siento más autosuficiente',                                              'PTGI_Q4',  'likert', 'personal_strength',  NULL),
    ((SELECT id FROM s), 4,  'Tengo mejor comprensión de los asuntos espirituales',                       'PTGI_Q5',  'likert', 'spiritual_change',   NULL),
    ((SELECT id FROM s), 5,  'Sé que puedo contar con los demás en tiempos difíciles',                    'PTGI_Q6',  'likert', 'relating_to_others', NULL),
    ((SELECT id FROM s), 6,  'Establecí un nuevo camino para mi vida',                                    'PTGI_Q7',  'likert', 'new_possibilities',  NULL),
    ((SELECT id FROM s), 7,  'Tengo mayor sentido de cercanía con los demás',                             'PTGI_Q8',  'likert', 'relating_to_others', NULL),
    ((SELECT id FROM s), 8,  'Estoy más dispuesto/a a expresar mis emociones',                           'PTGI_Q9',  'likert', 'relating_to_others', NULL),
    ((SELECT id FROM s), 9,  'Sé que soy capaz de manejar las dificultades',                             'PTGI_Q10', 'likert', 'personal_strength',  NULL),
    ((SELECT id FROM s), 10, 'Puedo hacer mejores cosas con mi vida',                                     'PTGI_Q11', 'likert', 'new_possibilities',  NULL),
    ((SELECT id FROM s), 11, 'Acepto mejor cómo deben ser las cosas',                                    'PTGI_Q12', 'likert', 'appreciation',       NULL),
    ((SELECT id FROM s), 12, 'Aprecio más cada día',                                                     'PTGI_Q13', 'likert', 'appreciation',       NULL),
    ((SELECT id FROM s), 13, 'Surgieron oportunidades que no habrían existido de otra manera',            'PTGI_Q14', 'likert', 'new_possibilities',  NULL),
    ((SELECT id FROM s), 14, 'Tengo más compasión por los demás',                                        'PTGI_Q15', 'likert', 'relating_to_others', NULL),
    ((SELECT id FROM s), 15, 'Me esfuerzo más en mis relaciones',                                        'PTGI_Q16', 'likert', 'relating_to_others', NULL),
    ((SELECT id FROM s), 16, 'Estoy más dispuesto/a a cambiar las cosas que necesitan cambiarse',        'PTGI_Q17', 'likert', 'personal_strength',  NULL),
    ((SELECT id FROM s), 17, 'Tengo una fe religiosa más fuerte',                                        'PTGI_Q18', 'likert', 'spiritual_change',   NULL),
    ((SELECT id FROM s), 18, 'Descubrí que soy más fuerte de lo que pensaba',                            'PTGI_Q19', 'likert', 'personal_strength',  NULL),
    ((SELECT id FROM s), 19, 'Aprendí mucho sobre lo maravillosa que puede ser la gente',                'PTGI_Q20', 'likert', 'relating_to_others', NULL),
    ((SELECT id FROM s), 20, 'Acepto mejor que necesito a los demás',                                    'PTGI_Q21', 'likert', 'relating_to_others', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'No experimenté este cambio',             0),
  (1, 'Un muy pequeño grado de cambio',         1),
  (2, 'Un pequeño grado de cambio',             2),
  (3, 'Un grado moderado de cambio',            3),
  (4, 'Un gran grado de cambio',                4),
  (5, 'Un grado muy grande de cambio',          5)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_total UUID; sr_new UUID; sr_rel UUID; sr_str UUID; sr_apr UUID; sr_spi UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'ptgi';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'total', 'Crecimiento Total', 'sum',
    ARRAY['PTGI_Q1','PTGI_Q2','PTGI_Q3','PTGI_Q4','PTGI_Q5','PTGI_Q6','PTGI_Q7','PTGI_Q8','PTGI_Q9','PTGI_Q10','PTGI_Q11','PTGI_Q12','PTGI_Q13','PTGI_Q14','PTGI_Q15','PTGI_Q16','PTGI_Q17','PTGI_Q18','PTGI_Q19','PTGI_Q20','PTGI_Q21'], 1.0)
  RETURNING id INTO sr_total;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'new_possibilities', 'Nuevas Posibilidades', 'sum', ARRAY['PTGI_Q1','PTGI_Q3','PTGI_Q7','PTGI_Q11','PTGI_Q14'], 1.0)
  RETURNING id INTO sr_new;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'relating_to_others', 'Relaciones con Otros', 'sum', ARRAY['PTGI_Q6','PTGI_Q8','PTGI_Q9','PTGI_Q15','PTGI_Q16','PTGI_Q20','PTGI_Q21'], 1.0)
  RETURNING id INTO sr_rel;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'personal_strength', 'Fortaleza Personal', 'sum', ARRAY['PTGI_Q4','PTGI_Q10','PTGI_Q17','PTGI_Q19'], 1.0)
  RETURNING id INTO sr_str;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'appreciation', 'Apreciación de la Vida', 'sum', ARRAY['PTGI_Q2','PTGI_Q12','PTGI_Q13'], 1.0)
  RETURNING id INTO sr_apr;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'spiritual_change', 'Cambio Espiritual', 'sum', ARRAY['PTGI_Q5','PTGI_Q18'], 1.0)
  RETURNING id INTO sr_spi;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 0,  20,  'Mínimo',      'minimal',  '#d1d5db', 'Crecimiento postraumático no percibido aún.',        'Explorar recursos de afrontamiento. El CPT puede surgir más adelante.', FALSE),
    (sr_total, 21, 42,  'Moderado',    'moderate', '#86efac', 'Algunos indicadores de crecimiento presentes.',      'Reforzar los cambios positivos percibidos.', FALSE),
    (sr_total, 43, 63,  'Considerable','mild',     '#22c55e', 'Crecimiento postraumático considerable.',            'Consolidar narrativa de crecimiento. Trabajo de integración.', FALSE),
    (sr_total, 64, 105, 'Alto',        'normal',   '#15803d', 'Crecimiento postraumático alto. Buena resiliencia.', 'Mantener trabajo de integración y significado.', FALSE);
END $$;


-- =============================================================
-- 4. BIS-11 — Barratt Impulsiveness Scale
-- Patton, Stanford & Barratt (1995) | Dominio público
-- 30 ítems, 1-4, 3 subescalas (atencional, motora, no planeación)
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'bis11',
    'BIS-11 — Escala de Impulsividad de Barratt',
    'Instrumento de 30 ítems que mide la impulsividad en tres factores: impulsividad atencional, motora y no planeación. Ampliamente utilizado en TCC, adicciones y trastornos de personalidad.',
    'sintomas', 'public_domain', 1,
    'Patton JH, Stanford MS, Barratt ES (1995)',
    15, 8, '["self"]'::jsonb,
    14, 7.0, ARRAY['clinica','tcc','personalidad']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'BIS-11',
    'Las personas difieren en la forma en que actúan y piensan en diferentes situaciones. Lee cada afirmación y marca la respuesta que mejor te describa. No hay respuestas correctas o incorrectas.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Planifico mis tareas con cuidado',                                           'BIS11_Q1',  'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 1,  'Hago las cosas sin pensar',                                                  'BIS11_Q2',  'likert', 'motora',         NULL),
    ((SELECT id FROM s), 2,  'Tomo decisiones rápidamente',                                                'BIS11_Q3',  'likert', 'motora',         NULL),
    ((SELECT id FROM s), 3,  'Soy una persona despreocupada (sin preocupaciones)',                         'BIS11_Q4',  'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 4,  'No presto atención',                                                        'BIS11_Q5',  'likert', 'atencional',     NULL),
    ((SELECT id FROM s), 5,  'Tengo pensamientos que se suceden rápidamente',                             'BIS11_Q6',  'likert', 'atencional',     NULL),
    ((SELECT id FROM s), 6,  'Planifico mis viajes con antelación',                                        'BIS11_Q7',  'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 7,  'Tengo autocontrol',                                                          'BIS11_Q8',  'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 8,  'Me concentro fácilmente',                                                   'BIS11_Q9',  'likert', 'atencional',     NULL),
    ((SELECT id FROM s), 9,  'Ahorro regularmente',                                                       'BIS11_Q10', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 10, 'Me muevo y camino rápido',                                                  'BIS11_Q11', 'likert', 'motora',         NULL),
    ((SELECT id FROM s), 11, 'Planifico para tener trabajo fijo',                                         'BIS11_Q12', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 12, 'Digo las cosas sin pensar',                                                 'BIS11_Q13', 'likert', 'motora',         NULL),
    ((SELECT id FROM s), 13, 'Me gusta pensar en problemas complejos',                                    'BIS11_Q14', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 14, 'Cambio de trabajo frecuentemente',                                          'BIS11_Q15', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 15, 'Actúo impulsivamente',                                                      'BIS11_Q16', 'likert', 'motora',         NULL),
    ((SELECT id FROM s), 16, 'Me aburro fácilmente al pensar en cosas',                                   'BIS11_Q17', 'likert', 'atencional',     NULL),
    ((SELECT id FROM s), 17, 'Actúo en el momento según lo que siento',                                   'BIS11_Q18', 'likert', 'motora',         NULL),
    ((SELECT id FROM s), 18, 'Soy una persona que piensa las cosas',                                      'BIS11_Q19', 'likert', 'atencional',     NULL),
    ((SELECT id FROM s), 19, 'Cambio de residencia frecuentemente',                                       'BIS11_Q20', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 20, 'Compro cosas impulsivamente',                                               'BIS11_Q21', 'likert', 'motora',         NULL),
    ((SELECT id FROM s), 21, 'Solo termino lo que empiezo',                                               'BIS11_Q22', 'likert', 'motora',         NULL),
    ((SELECT id FROM s), 22, 'Sigo un horario regular',                                                   'BIS11_Q23', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 23, 'Me gusta pensar en proyectos grandes',                                      'BIS11_Q24', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 24, 'Gasto más de lo que gano',                                                  'BIS11_Q25', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 25, 'Cuando pienso en algo, otros pensamientos me distraen',                     'BIS11_Q26', 'likert', 'atencional',     NULL),
    ((SELECT id FROM s), 26, 'Estoy más interesado en el presente que en el futuro',                      'BIS11_Q27', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 27, 'Me inquieto en los museos o teatros',                                       'BIS11_Q28', 'likert', 'motora',         NULL),
    ((SELECT id FROM s), 28, 'Me gusta resolver juegos de habilidad',                                     'BIS11_Q29', 'likert', 'no_planeacion',  NULL),
    ((SELECT id FROM s), 29, 'Soy una persona orientada hacia el futuro',                                 'BIS11_Q30', 'likert', 'no_planeacion',  NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Raramente/Nunca',      1),
  (1, 'Ocasionalmente',       2),
  (2, 'A menudo',             3),
  (3, 'Siempre/Casi siempre', 4)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_total UUID; sr_aten UUID; sr_mot UUID; sr_nop UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'bis11';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'total', 'Impulsividad Total', 'sum',
    ARRAY['BIS11_Q1','BIS11_Q2','BIS11_Q3','BIS11_Q4','BIS11_Q5','BIS11_Q6','BIS11_Q7','BIS11_Q8','BIS11_Q9','BIS11_Q10','BIS11_Q11','BIS11_Q12','BIS11_Q13','BIS11_Q14','BIS11_Q15','BIS11_Q16','BIS11_Q17','BIS11_Q18','BIS11_Q19','BIS11_Q20','BIS11_Q21','BIS11_Q22','BIS11_Q23','BIS11_Q24','BIS11_Q25','BIS11_Q26','BIS11_Q27','BIS11_Q28','BIS11_Q29','BIS11_Q30'], 1.0)
  RETURNING id INTO sr_total;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'atencional', 'Impulsividad Atencional', 'sum', ARRAY['BIS11_Q5','BIS11_Q6','BIS11_Q9','BIS11_Q17','BIS11_Q19','BIS11_Q26'], 1.0)
  RETURNING id INTO sr_aten;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'motora', 'Impulsividad Motora', 'sum', ARRAY['BIS11_Q2','BIS11_Q3','BIS11_Q11','BIS11_Q13','BIS11_Q16','BIS11_Q18','BIS11_Q21','BIS11_Q22','BIS11_Q28'], 1.0)
  RETURNING id INTO sr_mot;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'no_planeacion', 'No Planeación', 'sum', ARRAY['BIS11_Q1','BIS11_Q4','BIS11_Q7','BIS11_Q8','BIS11_Q10','BIS11_Q12','BIS11_Q14','BIS11_Q15','BIS11_Q20','BIS11_Q23','BIS11_Q24','BIS11_Q25','BIS11_Q27','BIS11_Q29','BIS11_Q30'], 1.0)
  RETURNING id INTO sr_nop;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 30, 52, 'Bajo',       'low_risk',  '#22c55e', 'Impulsividad dentro del rango normal o bajo.',           'Sin intervención específica requerida.', FALSE),
    (sr_total, 53, 74, 'Moderado',   'moderate',  '#f59e0b', 'Impulsividad moderada. Posible impacto funcional.',      'Técnicas de control de impulsos. Evaluar contexto clínico.', FALSE),
    (sr_total, 75, 120,'Alto',       'severe',    '#ef4444', 'Alta impulsividad. Riesgo de conductas impulsivas.',     'Intervención TCC focalizada en regulación conductual. Evaluar TDAH o TP.', TRUE);
END $$;


-- =============================================================
-- 5. DERS — Difficulties in Emotion Regulation Scale
-- Gratz & Roemer (2004) | Dominio público
-- 36 ítems, 1-5, 6 subescalas
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'ders',
    'DERS — Escala de Dificultades en Regulación Emocional',
    'Instrumento de 36 ítems que evalúa las dificultades en regulación emocional en 6 dimensiones: no aceptación, metas, impulsos, conciencia, estrategias y claridad. Clave en DBT y trabajo con trauma.',
    'sintomas', 'public_domain', 1,
    'Gratz KL & Roemer L (2004)',
    16, 10, '["self"]'::jsonb,
    14, 8.0, ARRAY['clinica','tcc','personalidad','trauma']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'DERS',
    'Por favor indica con qué frecuencia se aplican a ti las siguientes afirmaciones. Usa la escala del 1 (casi nunca) al 5 (casi siempre).'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Tengo claridad sobre mis sentimientos',                                      'DERS_Q1',  'likert', 'claridad',    NULL),
    ((SELECT id FROM s), 1,  'Presto atención a cómo me siento',                                          'DERS_Q2',  'likert', 'conciencia',  NULL),
    ((SELECT id FROM s), 2,  'Experimento mis emociones como abrumadoras y fuera de control',             'DERS_Q3',  'likert', 'impulsos',    NULL),
    ((SELECT id FROM s), 3,  'No tengo idea de cómo me siento',                                           'DERS_Q4',  'likert', 'claridad',    NULL),
    ((SELECT id FROM s), 4,  'Me cuesta darle sentido a mis sentimientos',                                'DERS_Q5',  'likert', 'claridad',    NULL),
    ((SELECT id FROM s), 5,  'Estoy atento/a a mis sentimientos',                                         'DERS_Q6',  'likert', 'conciencia',  NULL),
    ((SELECT id FROM s), 6,  'Sé exactamente cómo me siento',                                             'DERS_Q7',  'likert', 'claridad',    NULL),
    ((SELECT id FROM s), 7,  'Me importa lo que siento',                                                  'DERS_Q8',  'likert', 'conciencia',  NULL),
    ((SELECT id FROM s), 8,  'Estoy confundido/a sobre cómo me siento',                                   'DERS_Q9',  'likert', 'claridad',    NULL),
    ((SELECT id FROM s), 9,  'Cuando estoy molesto/a, reconozco mis emociones',                          'DERS_Q10', 'likert', 'conciencia',  NULL),
    ((SELECT id FROM s), 10, 'Cuando estoy molesto/a, me enfado conmigo mismo/a por sentirme así',       'DERS_Q11', 'likert', 'no_aceptacion',NULL),
    ((SELECT id FROM s), 11, 'Cuando estoy molesto/a, me es difícil realizar tareas',                    'DERS_Q12', 'likert', 'metas',       NULL),
    ((SELECT id FROM s), 12, 'Cuando estoy molesto/a, me descontrolo',                                   'DERS_Q13', 'likert', 'impulsos',    NULL),
    ((SELECT id FROM s), 13, 'Cuando estoy molesto/a, creo que quedaré deprimido/a si no lo tomo el control', 'DERS_Q14', 'likert', 'estrategias', NULL),
    ((SELECT id FROM s), 14, 'Cuando estoy molesto/a, me es difícil concentrarme en otras cosas',        'DERS_Q15', 'likert', 'metas',       NULL),
    ((SELECT id FROM s), 15, 'Cuando estoy molesto/a, me siento fuera de control',                       'DERS_Q16', 'likert', 'impulsos',    NULL),
    ((SELECT id FROM s), 16, 'Cuando estoy molesto/a, creo que mis sentimientos son válidos e importantes', 'DERS_Q17', 'likert', 'no_aceptacion', NULL),
    ((SELECT id FROM s), 17, 'Cuando estoy molesto/a, me es difícil pensar en otra cosa',                'DERS_Q18', 'likert', 'metas',       NULL),
    ((SELECT id FROM s), 18, 'Cuando estoy molesto/a, me quedo pensando en cuán mal me siento',         'DERS_Q19', 'likert', 'estrategias', NULL),
    ((SELECT id FROM s), 19, 'Cuando estoy molesto/a, sigo siendo el dueño/a de mis acciones',          'DERS_Q20', 'likert', 'impulsos',    NULL),
    ((SELECT id FROM s), 20, 'Cuando estoy molesto/a, me avergüenzo de sentirme así',                   'DERS_Q21', 'likert', 'no_aceptacion',NULL),
    ((SELECT id FROM s), 21, 'Cuando estoy molesto/a, sé que puedo encontrar una manera de sentirme mejor', 'DERS_Q22', 'likert', 'estrategias', NULL),
    ((SELECT id FROM s), 22, 'Cuando estoy molesto/a, siento que soy débil',                             'DERS_Q23', 'likert', 'no_aceptacion',NULL),
    ((SELECT id FROM s), 23, 'Cuando estoy molesto/a, siento que puedo controlar mi comportamiento',    'DERS_Q24', 'likert', 'impulsos',    NULL),
    ((SELECT id FROM s), 24, 'Cuando estoy molesto/a, me siento culpable por sentirme así',              'DERS_Q25', 'likert', 'no_aceptacion',NULL),
    ((SELECT id FROM s), 25, 'Cuando estoy molesto/a, tengo problemas para concentrarme',               'DERS_Q26', 'likert', 'metas',       NULL),
    ((SELECT id FROM s), 26, 'Cuando estoy molesto/a, tengo dificultad para controlar mis comportamientos', 'DERS_Q27', 'likert', 'impulsos',  NULL),
    ((SELECT id FROM s), 27, 'Cuando estoy molesto/a, sé que hay cosas que puedo hacer para sentirme mejor', 'DERS_Q28', 'likert', 'estrategias', NULL),
    ((SELECT id FROM s), 28, 'Cuando estoy molesto/a, siento que no hay nada que pueda hacer para sentirme mejor', 'DERS_Q29', 'likert', 'estrategias', NULL),
    ((SELECT id FROM s), 29, 'Cuando estoy molesto/a, al final pierdo el control',                      'DERS_Q30', 'likert', 'impulsos',    NULL),
    ((SELECT id FROM s), 30, 'Cuando estoy molesto/a, creo que regodearme en ello es todo lo que puedo hacer', 'DERS_Q31', 'likert', 'estrategias', NULL),
    ((SELECT id FROM s), 31, 'Cuando estoy molesto/a, pierdo el control de mis comportamientos',        'DERS_Q32', 'likert', 'impulsos',    NULL),
    ((SELECT id FROM s), 32, 'Cuando estoy molesto/a, tengo problemas para pensar en otra cosa',        'DERS_Q33', 'likert', 'metas',       NULL),
    ((SELECT id FROM s), 33, 'Cuando estoy molesto/a, me tomo mi tiempo para averiguar qué es lo que realmente siento', 'DERS_Q34', 'likert', 'conciencia', NULL),
    ((SELECT id FROM s), 34, 'Cuando estoy molesto/a, me lleva mucho tiempo sentirme mejor',            'DERS_Q35', 'likert', 'estrategias', NULL),
    ((SELECT id FROM s), 35, 'Cuando estoy molesto/a, mis emociones me abruman',                         'DERS_Q36', 'likert', 'impulsos',    NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Casi nunca (0-10%)',          1),
  (1, 'A veces (11-35%)',            2),
  (2, 'La mitad del tiempo (36-65%)',3),
  (3, 'A menudo (66-90%)',           4),
  (4, 'Casi siempre (91-100%)',      5)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_total UUID; sr_noac UUID; sr_meta UUID; sr_impu UUID;
  sr_cons UUID; sr_estr UUID; sr_clar UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'ders';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'total', 'Dificultad Total RE', 'sum',
    ARRAY['DERS_Q1','DERS_Q2','DERS_Q3','DERS_Q4','DERS_Q5','DERS_Q6','DERS_Q7','DERS_Q8','DERS_Q9','DERS_Q10','DERS_Q11','DERS_Q12','DERS_Q13','DERS_Q14','DERS_Q15','DERS_Q16','DERS_Q17','DERS_Q18','DERS_Q19','DERS_Q20','DERS_Q21','DERS_Q22','DERS_Q23','DERS_Q24','DERS_Q25','DERS_Q26','DERS_Q27','DERS_Q28','DERS_Q29','DERS_Q30','DERS_Q31','DERS_Q32','DERS_Q33','DERS_Q34','DERS_Q35','DERS_Q36'], 1.0)
  RETURNING id INTO sr_total;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'no_aceptacion', 'No Aceptación', 'sum', ARRAY['DERS_Q11','DERS_Q17','DERS_Q21','DERS_Q23','DERS_Q25'], 1.0)
  RETURNING id INTO sr_noac;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'metas', 'Dificultad con Metas', 'sum', ARRAY['DERS_Q12','DERS_Q15','DERS_Q18','DERS_Q26','DERS_Q33'], 1.0)
  RETURNING id INTO sr_meta;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'impulsos', 'Control de Impulsos', 'sum', ARRAY['DERS_Q3','DERS_Q13','DERS_Q16','DERS_Q20','DERS_Q24','DERS_Q27','DERS_Q30','DERS_Q32','DERS_Q36'], 1.0)
  RETURNING id INTO sr_impu;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'conciencia', 'Conciencia Emocional', 'sum', ARRAY['DERS_Q2','DERS_Q6','DERS_Q8','DERS_Q10','DERS_Q34'], 1.0)
  RETURNING id INTO sr_cons;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'estrategias', 'Acceso a Estrategias', 'sum', ARRAY['DERS_Q14','DERS_Q19','DERS_Q22','DERS_Q28','DERS_Q29','DERS_Q31','DERS_Q35'], 1.0)
  RETURNING id INTO sr_estr;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'claridad', 'Claridad Emocional', 'sum', ARRAY['DERS_Q1','DERS_Q4','DERS_Q5','DERS_Q7','DERS_Q9'], 1.0)
  RETURNING id INTO sr_clar;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 36,  72,  'Bajo',      'low_risk',  '#22c55e', 'Buena regulación emocional global.',                         'Sin intervención específica necesaria.', FALSE),
    (sr_total, 73,  108, 'Moderado',  'moderate',  '#f59e0b', 'Dificultades moderadas en regulación emocional.',            'Habilidades de regulación emocional. Mindfulness y TCC.', FALSE),
    (sr_total, 109, 144, 'Alto',      'severe',    '#ef4444', 'Dificultades importantes en regulación emocional.',          'Considerar DBT o TCC con foco en RE. Riesgo conductual.', TRUE),
    (sr_total, 145, 180, 'Muy alto',  'extreme',   '#7f1d1d', 'Desregulación emocional severa. Alta disfunción.',           'DBT urgente. Evaluar riesgo de autolesión o impulsividad grave.', TRUE);
END $$;


-- =============================================================
-- 6. EDE-Q — Eating Disorder Examination Questionnaire
-- Fairburn & Beglin (1994) | Dominio público
-- 28 ítems + 6 ítems de comportamiento, 4 subescalas
-- Nota: incluimos 28 ítems actitudinales (0-6) + 6 conductuales
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'ede-q',
    'EDE-Q — Cuestionario de Examen de Trastornos Alimentarios',
    'Versión autoaplicada del EDE. Evalúa psicopatología central de los trastornos alimentarios en 4 subescalas: restricción, preocupación por la alimentación, preocupación por el peso y por la figura. Período de referencia: últimos 28 días.',
    'sintomas', 'public_domain', 1,
    'Fairburn CG & Beglin SJ (1994)',
    14, 12, '["self"]'::jsonb,
    28, 0.5, ARRAY['clinica','tcc']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'EDE-Q',
    'Las siguientes preguntas se refieren a los últimos 28 días. Lee cada pregunta cuidadosamente. Por favor, responde todas las preguntas.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    -- Subescala Restricción (R)
    ((SELECT id FROM s), 0,  '¿Has intentado restringir deliberadamente la cantidad de comida que comes para influir en tu figura o peso, incluso si no has tenido éxito?',  'EDEQ_Q1',  'likert', 'restriccion',    NULL),
    ((SELECT id FROM s), 1,  '¿Has pasado largos períodos de tiempo (8 horas o más despierto/a) sin comer para influir en tu figura o peso?',                               'EDEQ_Q2',  'likert', 'restriccion',    NULL),
    ((SELECT id FROM s), 2,  '¿Has tratado de excluir de tu dieta alimentos que te gustan para influir en tu figura o peso?',                                                'EDEQ_Q3',  'likert', 'restriccion',    NULL),
    ((SELECT id FROM s), 3,  '¿Has intentado seguir reglas estrictas sobre la dieta para influir en tu figura o peso?',                                                      'EDEQ_Q4',  'likert', 'restriccion',    NULL),
    ((SELECT id FROM s), 4,  '¿Has querido tener el estómago vacío?',                                                                                                        'EDEQ_Q5',  'likert', 'restriccion',    NULL),
    -- Subescala Preocupación por la Alimentación (PA)
    ((SELECT id FROM s), 5,  '¿Has pensado en comida, comer o en no comer de forma que te haya resultado difícil concentrarte en otras actividades?',                       'EDEQ_Q6',  'likert', 'preoc_alimentacion', NULL),
    ((SELECT id FROM s), 6,  '¿Has tenido miedo de perder el control sobre lo que comes?',                                                                                   'EDEQ_Q7',  'likert', 'preoc_alimentacion', NULL),
    ((SELECT id FROM s), 7,  '¿Han habido períodos en los que sintieras que has comido demasiado (en términos de lo que es aceptable social/culturalmente)?',                'EDEQ_Q8',  'likert', 'preoc_alimentacion', NULL),
    ((SELECT id FROM s), 8,  '¿Has comido en secreto?',                                                                                                                      'EDEQ_Q9',  'likert', 'preoc_alimentacion', NULL),
    ((SELECT id FROM s), 9,  '¿Te has sentido culpable/avergonzado/a después de comer?',                                                                                    'EDEQ_Q10', 'likert', 'preoc_alimentacion', NULL),
    -- Subescala Preocupación por el Peso (PP)
    ((SELECT id FROM s), 10, '¿Te has preocupado mucho por tu peso?',                                                                                                        'EDEQ_Q11', 'likert', 'preoc_peso',     NULL),
    ((SELECT id FROM s), 11, '¿Has querido perder peso?',                                                                                                                    'EDEQ_Q12', 'likert', 'preoc_peso',     NULL),
    ((SELECT id FROM s), 12, '¿Has pensado que eres gordo/a cuando otros dicen que estás delgado/a?',                                                                       'EDEQ_Q13', 'likert', 'preoc_peso',     NULL),
    ((SELECT id FROM s), 13, '¿Te ha preocupado tanto el peso que piensas que deberías ponerte a dieta?',                                                                   'EDEQ_Q14', 'likert', 'preoc_peso',     NULL),
    -- Subescala Preocupación por la Figura (PF)
    ((SELECT id FROM s), 14, '¿Ha tenido la importancia de tu figura un efecto importante en cómo te sientes como persona?',                                                 'EDEQ_Q15', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 15, '¿Hasta qué punto te ha disgustado tu figura?',                                                                                                 'EDEQ_Q16', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 16, '¿Has pensado en tu figura tanto que te ha resultado difícil concentrarte en otras cosas?',                                                    'EDEQ_Q17', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 17, '¿Hasta qué punto ha tenido importancia tu figura al juzgarte como persona?',                                                                   'EDEQ_Q18', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 18, '¿Te has sentido incómodo/a viendo tu cuerpo?',                                                                                                'EDEQ_Q19', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 19, '¿Has sentido que tu cuerpo no era lo suficientemente delgado?',                                                                               'EDEQ_Q20', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 20, '¿Hasta qué punto ha afectado ver tu figura (en espejo, escaparate, etc.) a cómo te sientes?',                                                 'EDEQ_Q21', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 21, '¿Hasta qué punto te ha incomodado que otros vean tu cuerpo (piscina, playa, vestuario)?',                                                    'EDEQ_Q22', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 22, '¿Has comparado tu cuerpo con el de otras personas?',                                                                                           'EDEQ_Q23', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 23, '¿Te ha preocupado que otras personas puedan verte con sobrepeso?',                                                                            'EDEQ_Q24', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 24, '¿Cuánto espacio ocupa tu figura en tus pensamientos cada día?',                                                                               'EDEQ_Q25', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 25, '¿Te has pellizacado o medido partes del cuerpo para ver si están gordas?',                                                                    'EDEQ_Q26', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 26, '¿Ha sido la forma de tu cuerpo importante al juzgarte a ti mismo/a?',                                                                         'EDEQ_Q27', 'likert', 'preoc_figura',   NULL),
    ((SELECT id FROM s), 27, '¿Te has sentido gordo/a?',                                                                                                                     'EDEQ_Q28', 'likert', 'preoc_figura',   NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Ningún día',               0),
  (1, '1-5 días',                 1),
  (2, '6-12 días',                2),
  (3, '13-15 días',               3),
  (4, '16-22 días',               4),
  (5, '23-27 días',               5),
  (6, 'Todos los días (28 días)', 6)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_global UUID; sr_res UUID; sr_pa UUID; sr_pp UUID; sr_pf UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'ede-q';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'global', 'Puntuación Global EDE-Q', 'average',
    ARRAY['EDEQ_Q1','EDEQ_Q2','EDEQ_Q3','EDEQ_Q4','EDEQ_Q5','EDEQ_Q6','EDEQ_Q7','EDEQ_Q8','EDEQ_Q9','EDEQ_Q10','EDEQ_Q11','EDEQ_Q12','EDEQ_Q13','EDEQ_Q14','EDEQ_Q15','EDEQ_Q16','EDEQ_Q17','EDEQ_Q18','EDEQ_Q19','EDEQ_Q20','EDEQ_Q21','EDEQ_Q22','EDEQ_Q23','EDEQ_Q24','EDEQ_Q25','EDEQ_Q26','EDEQ_Q27','EDEQ_Q28'], 1.0)
  RETURNING id INTO sr_global;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'restriccion', 'Restricción', 'average', ARRAY['EDEQ_Q1','EDEQ_Q2','EDEQ_Q3','EDEQ_Q4','EDEQ_Q5'], 1.0)
  RETURNING id INTO sr_res;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'preoc_alimentacion', 'Preocupación por Alimentación', 'average', ARRAY['EDEQ_Q6','EDEQ_Q7','EDEQ_Q8','EDEQ_Q9','EDEQ_Q10'], 1.0)
  RETURNING id INTO sr_pa;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'preoc_peso', 'Preocupación por el Peso', 'average', ARRAY['EDEQ_Q11','EDEQ_Q12','EDEQ_Q13','EDEQ_Q14'], 1.0)
  RETURNING id INTO sr_pp;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'preoc_figura', 'Preocupación por la Figura', 'average', ARRAY['EDEQ_Q15','EDEQ_Q16','EDEQ_Q17','EDEQ_Q18','EDEQ_Q19','EDEQ_Q20','EDEQ_Q21','EDEQ_Q22','EDEQ_Q23','EDEQ_Q24','EDEQ_Q25','EDEQ_Q26','EDEQ_Q27','EDEQ_Q28'], 1.0)
  RETURNING id INTO sr_pf;

  -- Punto de corte clínico global: 2.3 (Fairburn & Beglin, 1994) — usamos ×10 para enteros
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_global, 0, 2,  'Sin patología',   'normal',   '#22c55e', 'Sin psicopatología significativa de TCA.',             'Monitoreo. Psicoeducación preventiva.', FALSE),
    (sr_global, 3, 3,  'Limítrofe',       'mild',     '#86efac', 'Zona limítrofe. Vigilar evolución.',                   'Seguimiento en 4 semanas. Explorar historia alimentaria.', FALSE),
    (sr_global, 4, 5,  'Clínico',         'moderate', '#f59e0b', 'Por encima del punto de corte clínico (≥2.3 aprox).', 'Evaluación diagnóstica TCA. Intervención cognitivo-conductual específica.', FALSE),
    (sr_global, 6, 6,  'Severo',          'severe',   '#ef4444', 'Psicopatología alimentaria severa.',                   'Derivación urgente a especialista en TCA. Protocolo multidisciplinar.', TRUE);
END $$;
