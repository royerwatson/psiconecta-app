-- =============================================================
-- PSICONECTA — Seed: Instrumentos Infantiles y Adolescentes
-- SDQ, SCARED, RCADS, Vanderbilt ADHD, M-CHAT-R/F, CRAFFT, C-SSRS, PHQ-A
-- =============================================================

-- =============================================================
-- 1. SDQ — Strengths and Difficulties Questionnaire
-- Goodman (1997) | Dominio público (Youth in Mind)
-- 25 ítems, 0-2, 5 subescalas. Versión padres/docentes/autoinforme (11-17)
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'sdq',
    'SDQ — Cuestionario de Capacidades y Dificultades',
    'Instrumento de 25 ítems que evalúa 5 áreas: síntomas emocionales, problemas de conducta, hiperactividad, problemas con pares y conductas prosociales. Disponible en versión padres, docentes y autoinforme para 11-17 años.',
    'infantil', 'public_domain', 1,
    'Goodman R (1997)',
    11, 5, '["self","parent","teacher"]'::jsonb,
    14, 3.0, ARRAY['infantil','clinica']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'SDQ',
    'Por favor, da tu opinión sobre el comportamiento del niño/adolescente en los últimos 6 meses (o en el año escolar). Para cada pregunta, marca "No es cierto", "Algo cierto" o "Absolutamente cierto".'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Tiene en cuenta los sentimientos de otras personas',              'SDQ_Q1',  'likert', 'prosocial',   NULL),
    ((SELECT id FROM s), 1,  'Es inquieto/a, hiperactivo/a, no puede quedarse quieto por mucho tiempo', 'SDQ_Q2', 'likert', 'hiperactividad', NULL),
    ((SELECT id FROM s), 2,  'Se queja con frecuencia de dolores de cabeza, estómago o náuseas','SDQ_Q3',  'likert', 'emocional',   NULL),
    ((SELECT id FROM s), 3,  'Comparte con otros niños (dulces, juguetes, lápices, etc.)',      'SDQ_Q4',  'likert', 'prosocial',   NULL),
    ((SELECT id FROM s), 4,  'Tiene muchas rabietas o mal genio',                               'SDQ_Q5',  'likert', 'conducta',    NULL),
    ((SELECT id FROM s), 5,  'Es más bien solitario/a y tiende a jugar solo/a',                'SDQ_Q6',  'likert', 'pares',       NULL),
    ((SELECT id FROM s), 6,  'Generalmente obedece; hace lo que los adultos le piden',          'SDQ_Q7',  'likert', 'conducta',    NULL),
    ((SELECT id FROM s), 7,  'Tiene muchas preocupaciones, parece siempre inquieto/a',          'SDQ_Q8',  'likert', 'emocional',   NULL),
    ((SELECT id FROM s), 8,  'Ayuda si alguien está herido, afligido o enfermo',               'SDQ_Q9',  'likert', 'prosocial',   NULL),
    ((SELECT id FROM s), 9,  'Está continuamente moviéndose o haciendo cosas',                 'SDQ_Q10', 'likert', 'hiperactividad', NULL),
    ((SELECT id FROM s), 10, 'Tiene por lo menos un buen amigo/a',                             'SDQ_Q11', 'likert', 'pares',       NULL),
    ((SELECT id FROM s), 11, 'Pelea con frecuencia con otros niños o se mete con ellos',       'SDQ_Q12', 'likert', 'conducta',    NULL),
    ((SELECT id FROM s), 12, 'Con frecuencia parece infeliz, desanimado/a o lloroso/a',        'SDQ_Q13', 'likert', 'emocional',   NULL),
    ((SELECT id FROM s), 13, 'En general cae bien a otros niños/as',                           'SDQ_Q14', 'likert', 'pares',       NULL),
    ((SELECT id FROM s), 14, 'Se distrae con facilidad, su concentración tiende a dispersarse','SDQ_Q15', 'likert', 'hiperactividad', NULL),
    ((SELECT id FROM s), 15, 'Está nervioso/a o inseguro/a en nuevas situaciones',             'SDQ_Q16', 'likert', 'emocional',   NULL),
    ((SELECT id FROM s), 16, 'Es amable con los niños más pequeños',                           'SDQ_Q17', 'likert', 'prosocial',   NULL),
    ((SELECT id FROM s), 17, 'Con frecuencia miente o hace trampas',                           'SDQ_Q18', 'likert', 'conducta',    NULL),
    ((SELECT id FROM s), 18, 'Otros niños se meten con él/ella',                               'SDQ_Q19', 'likert', 'pares',       NULL),
    ((SELECT id FROM s), 19, 'Con frecuencia se ofrece para ayudar a otros',                   'SDQ_Q20', 'likert', 'prosocial',   NULL),
    ((SELECT id FROM s), 20, 'Piensa las cosas antes de hacerlas',                             'SDQ_Q21', 'likert', 'hiperactividad', NULL),
    ((SELECT id FROM s), 21, 'Roba cosas en casa, en la escuela o en otros lugares',           'SDQ_Q22', 'likert', 'conducta',    NULL),
    ((SELECT id FROM s), 22, 'Se lleva mejor con adultos que con niños de su edad',            'SDQ_Q23', 'likert', 'pares',       NULL),
    ((SELECT id FROM s), 23, 'Tiene muchos miedos, se asusta con facilidad',                   'SDQ_Q24', 'likert', 'emocional',   NULL),
    ((SELECT id FROM s), 24, 'Termina lo que empieza, tiene buena atención',                   'SDQ_Q25', 'likert', 'hiperactividad', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'No es cierto',        0),
  (1, 'Algo cierto',         1),
  (2, 'Absolutamente cierto',2)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_total UUID; sr_em UUID; sr_con UUID; sr_hip UUID; sr_par UUID; sr_pro UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'sdq';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'total_dificultades', 'Total Dificultades', 'sum',
    ARRAY['SDQ_Q2','SDQ_Q3','SDQ_Q5','SDQ_Q6','SDQ_Q8','SDQ_Q10','SDQ_Q12','SDQ_Q13','SDQ_Q15','SDQ_Q16','SDQ_Q18','SDQ_Q19','SDQ_Q21','SDQ_Q22','SDQ_Q23','SDQ_Q24','SDQ_Q25'], 1.0)
  RETURNING id INTO sr_total;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'emocional', 'Síntomas Emocionales', 'sum', ARRAY['SDQ_Q3','SDQ_Q8','SDQ_Q13','SDQ_Q16','SDQ_Q24'], 1.0) RETURNING id INTO sr_em;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'conducta', 'Problemas de Conducta', 'sum', ARRAY['SDQ_Q5','SDQ_Q7','SDQ_Q12','SDQ_Q18','SDQ_Q22'], 1.0) RETURNING id INTO sr_con;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'hiperactividad', 'Hiperactividad/Inatención', 'sum', ARRAY['SDQ_Q2','SDQ_Q10','SDQ_Q15','SDQ_Q21','SDQ_Q25'], 1.0) RETURNING id INTO sr_hip;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'pares', 'Problemas con Pares', 'sum', ARRAY['SDQ_Q6','SDQ_Q11','SDQ_Q14','SDQ_Q19','SDQ_Q23'], 1.0) RETURNING id INTO sr_par;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'prosocial', 'Conducta Prosocial', 'sum', ARRAY['SDQ_Q1','SDQ_Q4','SDQ_Q9','SDQ_Q17','SDQ_Q20'], 1.0) RETURNING id INTO sr_pro;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 0,  14, 'Normal',          'normal',   '#22c55e', 'Sin dificultades significativas.',                   'Sin intervención específica.', FALSE),
    (sr_total, 15, 17, 'Límite',          'mild',     '#f59e0b', 'Zona límite. Vigilar evolución.',                    'Seguimiento en 4-6 semanas.', FALSE),
    (sr_total, 18, 40, 'Anormal',         'severe',   '#ef4444', 'Dificultades significativas presentes.',             'Evaluación psicológica detallada. Intervención escolar y familiar.', TRUE);
END $$;


-- =============================================================
-- 2. SCARED — Screen for Child Anxiety Related Disorders
-- Birmaher et al. (1997) | Dominio público
-- 41 ítems, 0-2, 5 subescalas de ansiedad infantil
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'scared',
    'SCARED — Cribado para Trastornos de Ansiedad en Niños',
    'Instrumento de 41 ítems para evaluar ansiedad en niños y adolescentes (8-18 años). 5 subescalas: pánico/somático, ansiedad generalizada, ansiedad de separación, fobia social y fobia escolar. Punto de corte total ≥ 25.',
    'infantil', 'public_domain', 1,
    'Birmaher B, Khetarpal S, Brent D et al. (1997)',
    8, 10, '["self","parent"]'::jsonb,
    14, 7.0, ARRAY['infantil','clinica']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'SCARED',
    'A continuación hay una lista de frases que describen cómo se sienten algunas personas. Lee cada frase y decide si es "No o casi nunca cierto", "A veces cierto" o "Muy cierto o casi siempre cierto".'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Cuando me da miedo, me cuesta respirar',                                  'SC_Q1',  'likert', 'panico',    NULL),
    ((SELECT id FROM s), 1,  'Me duele la cabeza cuando estoy en la escuela',                           'SC_Q2',  'likert', 'escolar',   NULL),
    ((SELECT id FROM s), 2,  'No me gusta estar con gente que no conozco',                              'SC_Q3',  'likert', 'social',    NULL),
    ((SELECT id FROM s), 3,  'Me asusto cuando duermo fuera de casa',                                   'SC_Q4',  'likert', 'separacion',NULL),
    ((SELECT id FROM s), 4,  'Me preocupa que a la gente le caiga mal',                                 'SC_Q5',  'likert', 'generalizada',NULL),
    ((SELECT id FROM s), 5,  'Cuando me da miedo, mi corazón late muy fuerte',                          'SC_Q6',  'likert', 'panico',    NULL),
    ((SELECT id FROM s), 6,  'Estoy nervioso/a',                                                        'SC_Q7',  'likert', 'generalizada',NULL),
    ((SELECT id FROM s), 7,  'Mis padres me siguen a todas partes',                                     'SC_Q8',  'likert', 'separacion',NULL),
    ((SELECT id FROM s), 8,  'La gente dice que parezco nervioso/a',                                    'SC_Q9',  'likert', 'panico',    NULL),
    ((SELECT id FROM s), 9,  'Me pongo nervioso/a cuando estoy con personas que no son de mi familia',  'SC_Q10', 'likert', 'social',    NULL),
    ((SELECT id FROM s), 10, 'Me duele el estómago cuando voy a la escuela',                            'SC_Q11', 'likert', 'escolar',   NULL),
    ((SELECT id FROM s), 11, 'Cuando me da miedo, me vuelvo loco/a',                                   'SC_Q12', 'likert', 'panico',    NULL),
    ((SELECT id FROM s), 12, 'Me preocupa que algo malo le pueda pasar a mis padres',                  'SC_Q13', 'likert', 'separacion',NULL),
    ((SELECT id FROM s), 13, 'Me da miedo dormir solo/a',                                               'SC_Q14', 'likert', 'separacion',NULL),
    ((SELECT id FROM s), 14, 'Me preocupa no ser tan bueno/a como otros niños/as en la escuela',       'SC_Q15', 'likert', 'generalizada',NULL),
    ((SELECT id FROM s), 15, 'Cuando me da miedo, sudo mucho',                                         'SC_Q16', 'likert', 'panico',    NULL),
    ((SELECT id FROM s), 16, 'Soy de los que se preocupan',                                             'SC_Q17', 'likert', 'generalizada',NULL),
    ((SELECT id FROM s), 17, 'Me da mucho miedo estar solo/a en casa',                                 'SC_Q18', 'likert', 'separacion',NULL),
    ((SELECT id FROM s), 18, 'Me da miedo hablar con personas que no conozco',                         'SC_Q19', 'likert', 'social',    NULL),
    ((SELECT id FROM s), 19, 'Cuando me da miedo, me tiemblan las manos',                              'SC_Q20', 'likert', 'panico',    NULL),
    ((SELECT id FROM s), 20, 'Siento que tengo que ser perfecto/a',                                    'SC_Q21', 'likert', 'generalizada',NULL),
    ((SELECT id FROM s), 21, 'Me da miedo ir a la escuela',                                            'SC_Q22', 'likert', 'escolar',   NULL),
    ((SELECT id FROM s), 22, 'Me preocupa antes de hacer algo que pueda avergonzarme',                 'SC_Q23', 'likert', 'social',    NULL),
    ((SELECT id FROM s), 23, 'Cuando me da miedo, me noto que voy a vomitar',                          'SC_Q24', 'likert', 'panico',    NULL),
    ((SELECT id FROM s), 24, 'Me preocupa si voy a hacer bien las cosas tan bien como otros niños/as', 'SC_Q25', 'likert', 'generalizada',NULL),
    ((SELECT id FROM s), 25, 'Me cuesta hablar con la gente que no conozco bien',                      'SC_Q26', 'likert', 'social',    NULL),
    ((SELECT id FROM s), 26, 'Cuando me da miedo, me bloqueo',                                         'SC_Q27', 'likert', 'panico',    NULL),
    ((SELECT id FROM s), 27, 'Me preocupa que algo malo me pueda pasar a mí',                          'SC_Q28', 'likert', 'generalizada',NULL),
    ((SELECT id FROM s), 28, 'Me da miedo si tengo que quedarme a dormir en casa de alguien',          'SC_Q29', 'likert', 'separacion',NULL),
    ((SELECT id FROM s), 29, 'Me cuesta el estómago cuando estoy preocupado/a',                        'SC_Q30', 'likert', 'panico',    NULL),
    ((SELECT id FROM s), 30, 'Me da miedo que mis padres me vayan a dejar con alguien',                'SC_Q31', 'likert', 'separacion',NULL),
    ((SELECT id FROM s), 31, 'Me da miedo hacer el ridículo delante de los demás',                    'SC_Q32', 'likert', 'social',    NULL),
    ((SELECT id FROM s), 32, 'Me preocupa mucho el futuro',                                            'SC_Q33', 'likert', 'generalizada',NULL),
    ((SELECT id FROM s), 33, 'Me cuesta hacer amigos',                                                 'SC_Q34', 'likert', 'social',    NULL),
    ((SELECT id FROM s), 34, 'Cuando me da miedo, siento que voy a desmayarme',                       'SC_Q35', 'likert', 'panico',    NULL),
    ((SELECT id FROM s), 35, 'Me preocupo por lo que va a pasar',                                     'SC_Q36', 'likert', 'generalizada',NULL),
    ((SELECT id FROM s), 36, 'Cuando me da miedo, siento mareos',                                     'SC_Q37', 'likert', 'panico',    NULL),
    ((SELECT id FROM s), 37, 'Me preocupa cuando tengo que hacer presentaciones en clase',             'SC_Q38', 'likert', 'social',    NULL),
    ((SELECT id FROM s), 38, 'Mi corazón late muy rápido',                                             'SC_Q39', 'likert', 'panico',    NULL),
    ((SELECT id FROM s), 39, 'Me tiembla el cuerpo cuando tengo que hacer algo delante de otros',     'SC_Q40', 'likert', 'social',    NULL),
    ((SELECT id FROM s), 40, 'No me gusta ir a la escuela',                                            'SC_Q41', 'likert', 'escolar',   NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'No o casi nunca',              0),
  (1, 'A veces',                      1),
  (2, 'Muy cierto o casi siempre',    2)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_total UUID; sr_pan UUID; sr_gen UUID; sr_sep UUID; sr_soc UUID; sr_esc UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'scared';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'total', 'Ansiedad Total', 'sum',
    ARRAY['SC_Q1','SC_Q2','SC_Q3','SC_Q4','SC_Q5','SC_Q6','SC_Q7','SC_Q8','SC_Q9','SC_Q10','SC_Q11','SC_Q12','SC_Q13','SC_Q14','SC_Q15','SC_Q16','SC_Q17','SC_Q18','SC_Q19','SC_Q20','SC_Q21','SC_Q22','SC_Q23','SC_Q24','SC_Q25','SC_Q26','SC_Q27','SC_Q28','SC_Q29','SC_Q30','SC_Q31','SC_Q32','SC_Q33','SC_Q34','SC_Q35','SC_Q36','SC_Q37','SC_Q38','SC_Q39','SC_Q40','SC_Q41'], 1.0)
  RETURNING id INTO sr_total;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'panico', 'Pánico/Somático', 'sum', ARRAY['SC_Q1','SC_Q6','SC_Q9','SC_Q12','SC_Q15','SC_Q16','SC_Q20','SC_Q24','SC_Q27','SC_Q30','SC_Q34','SC_Q35','SC_Q37','SC_Q39'], 1.0) RETURNING id INTO sr_pan;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'generalizada', 'Ansiedad Generalizada', 'sum', ARRAY['SC_Q5','SC_Q7','SC_Q14','SC_Q21','SC_Q23','SC_Q28','SC_Q33','SC_Q35','SC_Q36'], 1.0) RETURNING id INTO sr_gen;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'separacion', 'Ansiedad de Separación', 'sum', ARRAY['SC_Q4','SC_Q8','SC_Q13','SC_Q18','SC_Q29','SC_Q31'], 1.0) RETURNING id INTO sr_sep;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'social', 'Fobia Social', 'sum', ARRAY['SC_Q3','SC_Q10','SC_Q19','SC_Q26','SC_Q32','SC_Q34','SC_Q38','SC_Q40'], 1.0) RETURNING id INTO sr_soc;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'escolar', 'Fobia Escolar', 'sum', ARRAY['SC_Q2','SC_Q11','SC_Q22','SC_Q41'], 1.0) RETURNING id INTO sr_esc;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_total, 0,  24, 'Sin cribado positivo', 'normal',   '#22c55e', 'Por debajo del umbral de cribado (< 25).',             'Sin intervención específica. Reevaluar si hay cambios.', FALSE),
    (sr_total, 25, 40, 'Cribado positivo',     'moderate', '#f59e0b', 'Por encima del punto de corte (≥ 25). Ansiedad probable.','Evaluación clínica detallada. Intervención TCC infantil.', FALSE),
    (sr_total, 41, 82, 'Ansiedad significativa','severe',  '#ef4444', 'Ansiedad significativa. Alta carga sintomática.',       'Tratamiento urgente. Coordinación con pediatra/psiquiatra infantil.', TRUE);
END $$;


-- =============================================================
-- 3. CRAFFT — Substance Use Screening (Adolescentes)
-- Knight et al. (1999) | Dominio público
-- 6 ítems dicotómicos, punto de corte ≥ 2
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'crafft',
    'CRAFFT — Cribado de Uso de Sustancias en Adolescentes',
    'Instrumento de cribado de 6 ítems para uso problemático de alcohol y otras drogas en adolescentes (12-21 años). CRAFFT es un acrónimo de las palabras clave de cada ítem. Punto de corte ≥ 2.',
    'infantil', 'public_domain', 2,
    'Knight JR, Sherritt L, Shrier LA, Harris SK, Chang G (1999)',
    12, 3, '["self"]'::jsonb,
    30, 1.0, ARRAY['infantil','clinica']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'CRAFFT',
    'Durante los últimos 12 meses, ¿has consumido alcohol (más de unos sorbos), marihuana u otras drogas? Si la respuesta es sí para alguna, por favor responde las preguntas a continuación.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0, '¿Alguna vez has viajado en un AUTO conducido por alguien (incluido tú mismo) que estaba drogado o había consumido alcohol?',        'CRAFFT_C', 'multiple_choice', 'total', 1),
    ((SELECT id FROM s), 1, '¿Alguna vez has usado alcohol o drogas para RELAJARTE, sentirte mejor contigo mismo o encajar?',                                   'CRAFFT_R', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 2, '¿Alguna vez has usado alcohol o drogas cuando estabas SOLO?',                                                                        'CRAFFT_A', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 3, '¿Alguna vez te has OLVIDADO de cosas que hiciste mientras usabas alcohol o drogas?',                                                'CRAFFT_F', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 4, '¿Tu FAMILIA o amigos te han dicho que deberías reducir tu consumo de alcohol o drogas?',                                            'CRAFFT_F2','multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 5, '¿Alguna vez has tenido PROBLEMAS mientras estabas bajo los efectos del alcohol o las drogas?',                                      'CRAFFT_T', 'multiple_choice', 'total', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES (0, 'No', 0), (1, 'Sí', 1)) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'CRAFFT Total', 'sum',
    ARRAY['CRAFFT_C','CRAFFT_R','CRAFFT_A','CRAFFT_F','CRAFFT_F2','CRAFFT_T'], 1.0
  FROM tests t WHERE t.slug = 'crafft'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0, 1, 'Bajo riesgo',    'low_risk',  '#22c55e', 'Cribado negativo. Bajo riesgo de uso problemático.',     'Psicoeducación preventiva.', FALSE),
  ((SELECT id FROM sr), 2, 3, 'Riesgo moderado','moderate',  '#f59e0b', 'Cribado positivo (≥ 2). Uso problemático probable.',     'Evaluación clínica de sustancias. Intervención breve motivacional.', FALSE),
  ((SELECT id FROM sr), 4, 6, 'Riesgo alto',    'severe',    '#ef4444', 'Alta puntuación. Probable dependencia.',                 'Derivación a especialista en adicciones adolescentes. Coordinación familiar urgente.', TRUE);


-- =============================================================
-- 4. PHQ-A — Patient Health Questionnaire for Adolescents
-- Johnson et al. (2002) | Dominio público
-- 9 ítems + 2 adicionales, 0-3, depresión adolescente
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'phq-a',
    'PHQ-A — Cuestionario de Salud del Paciente para Adolescentes',
    'Adaptación del PHQ-9 para adolescentes (12-17 años). 9 ítems estándar más 2 adicionales sobre desempeño escolar y autolesión. El ítem de ideación suicida requiere alerta inmediata. Punto de corte ≥ 11 para depresión moderada-severa.',
    'infantil', 'public_domain', 1,
    'Johnson JG, Harris ES, Spitzer RL, Williams JBW (2002)',
    12, 5, '["self"]'::jsonb,
    7, 5.0, ARRAY['infantil','clinica']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'PHQ-A',
    'Durante las últimas 2 semanas, ¿con qué frecuencia te han molestado los siguientes problemas?'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Poco interés o placer en hacer cosas',                                          'PHQA_Q1',  'likert', 'total', NULL),
    ((SELECT id FROM s), 1,  'Sentirse desanimado/a, deprimido/a o sin esperanza',                            'PHQA_Q2',  'likert', 'total', NULL),
    ((SELECT id FROM s), 2,  'Problemas para dormir, para permanecer dormido/a, o dormir demasiado',          'PHQA_Q3',  'likert', 'total', NULL),
    ((SELECT id FROM s), 3,  'Sentirse cansado/a o con poca energía',                                         'PHQA_Q4',  'likert', 'total', NULL),
    ((SELECT id FROM s), 4,  'Poco apetito o comer en exceso',                                                'PHQA_Q5',  'likert', 'total', NULL),
    ((SELECT id FROM s), 5,  'Sentirse mal consigo mismo/a, pensar que es un fracaso',                       'PHQA_Q6',  'likert', 'total', NULL),
    ((SELECT id FROM s), 6,  'Problemas para concentrarse (leer, estudiar, ver televisión)',                  'PHQA_Q7',  'likert', 'total', NULL),
    ((SELECT id FROM s), 7,  'Moverse o hablar tan despacio que otros lo notan, o lo contrario: muy agitado','PHQA_Q8',  'likert', 'total', NULL),
    ((SELECT id FROM s), 8,  'Pensamientos de que estarías mejor muerto/a o de hacerte daño de alguna manera','PHQA_Q9',  'likert', 'total', 1),
    ((SELECT id FROM s), 9,  'Tener problemas en la escuela, con los trabajos o tareas escolares',           'PHQA_Q10', 'likert', 'escolar', NULL),
    ((SELECT id FROM s), 10, 'Hacerte daño a ti mismo/a a propósito (como cortarte o golpearte)',            'PHQA_Q11', 'likert', 'autolesion', 1)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nunca',                       0),
  (1, 'Varios días',                 1),
  (2, 'Más de la mitad de los días', 2),
  (3, 'Casi todos los días',         3)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Depresión (PHQ-A)', 'sum',
    ARRAY['PHQA_Q1','PHQA_Q2','PHQA_Q3','PHQA_Q4','PHQA_Q5','PHQA_Q6','PHQA_Q7','PHQA_Q8','PHQA_Q9'],
    1.0
  FROM tests t WHERE t.slug = 'phq-a'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  4,  'Mínimo',               'minimal',           '#22c55e', 'Sin depresión significativa.',                           'Monitoreo rutinario.', FALSE),
  ((SELECT id FROM sr), 5,  9,  'Leve',                 'mild',              '#86efac', 'Depresión leve.',                                         'Psicoeducación y técnicas de autoayuda. Seguimiento.', FALSE),
  ((SELECT id FROM sr), 10, 14, 'Moderado',             'moderate',          '#f59e0b', 'Depresión moderada. Impacto funcional.',                  'Intervención psicológica activa. Coordinación familiar.', FALSE),
  ((SELECT id FROM sr), 15, 19, 'Moderadamente severo', 'moderately_severe', '#f97316', 'Depresión moderadamente severa.',                         'Tratamiento urgente. Evaluar psiquiatría infantil.', FALSE),
  ((SELECT id FROM sr), 20, 27, 'Severo',               'severe',            '#ef4444', 'Depresión severa. Riesgo alto.',                          'Evaluación psiquiátrica urgente. Protocolo de seguridad.', TRUE);


-- =============================================================
-- 5. M-CHAT-R/F — Modified Checklist for Autism in Toddlers (Revisada)
-- Robins et al. (2014) | Dominio público
-- 20 ítems Sí/No, cribado autismo 16-30 meses
-- Respondente: padre/madre/cuidador principal
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'mchat-rf',
    'M-CHAT-R/F — Lista de Verificación Modificada para Autismo (Revisada)',
    'Instrumento de cribado para Trastorno del Espectro Autista en niños de 16 a 30 meses. 20 ítems respondidos por padres/cuidadores. En caso de 3-7 ítems fallidos, se aplica la entrevista de seguimiento (F). NO es diagnóstico.',
    'infantil', 'public_domain', 1,
    'Robins DL, Casagrande K, Barton M et al. (2014)',
    99, 5, '["parent"]'::jsonb,
    90, 2.0, ARRAY['infantil']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'M-CHAT-R/F',
    'Por favor responde estas preguntas sobre tu hijo/a. Piensa en cómo se comporta normalmente. Responde SÍ si el niño/a hace esto regularmente, NO si no lo hace o raramente.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  '¿Si señalas algo al otro lado del cuarto, tu hijo/a lo mira?',                 'MCHAT_Q1',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 1,  '¿Alguna vez has pensado que tu hijo/a podría ser sordo?',                      'MCHAT_Q2',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 2,  '¿Tu hijo/a juega a hacer como si fuera otra cosa? (simula tomar un teléfono)', 'MCHAT_Q3',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 3,  '¿A tu hijo/a le gusta subirse a las cosas?',                                   'MCHAT_Q4',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 4,  '¿Tu hijo/a hace movimientos inusuales con los dedos cerca de sus ojos?',      'MCHAT_Q5',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 5,  '¿Tu hijo/a señala con el dedo para pedir algo?',                               'MCHAT_Q6',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 6,  '¿Tu hijo/a señala con el dedo para mostrarte algo interesante?',              'MCHAT_Q7',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 7,  '¿Tu hijo/a está interesado en otros niños?',                                  'MCHAT_Q8',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 8,  '¿Tu hijo/a te muestra cosas trayéndotelas o levantándolas?',                  'MCHAT_Q9',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 9,  '¿Tu hijo/a te responde cuando lo llamas por su nombre?',                       'MCHAT_Q10', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 10, '¿Cuando sonríes a tu hijo/a, él/ella te sonríe de vuelta?',                   'MCHAT_Q11', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 11, '¿Tu hijo/a te imita? (le haces una expresión y él/ella la copia)',            'MCHAT_Q12', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 12, '¿Tu hijo/a responde cuando escucha su nombre?',                               'MCHAT_Q13', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 13, '¿Cuando le señalas un juguete al otro lado de la habitación, tu hijo lo mira?','MCHAT_Q14','multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 14, '¿Tu hijo/a camina?',                                                           'MCHAT_Q15', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 15, '¿Tu hijo/a mira lo que estás mirando tú?',                                    'MCHAT_Q16', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 16, '¿Tu hijo/a intenta llamar tu atención?',                                      'MCHAT_Q17', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 17, '¿Alguna vez te ha parecido que tu hijo/a no sabe cómo jugar con juguetes?',  'MCHAT_Q18', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 18, '¿Tu hijo/a mira a tu cara para ver cómo reaccionas?',                         'MCHAT_Q19', 'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 19, '¿A tu hijo/a le gustan las actividades que involucran movimiento?',            'MCHAT_Q20', 'multiple_choice', 'total', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES (0, 'No', 0), (1, 'Sí', 1)) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Ítems de Riesgo', 'sum',
    ARRAY['MCHAT_Q1','MCHAT_Q2','MCHAT_Q3','MCHAT_Q4','MCHAT_Q5','MCHAT_Q6','MCHAT_Q7','MCHAT_Q8','MCHAT_Q9','MCHAT_Q10','MCHAT_Q11','MCHAT_Q12','MCHAT_Q13','MCHAT_Q14','MCHAT_Q15','MCHAT_Q16','MCHAT_Q17','MCHAT_Q18','MCHAT_Q19','MCHAT_Q20'],
    1.0
  FROM tests t WHERE t.slug = 'mchat-rf'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  2,  'Bajo riesgo',     'low_risk',  '#22c55e', 'Bajo riesgo de TEA. Reevaluar a los 24 meses si hay preocupación.', 'Reevaluar en 24 meses. Sin derivación urgente.', FALSE),
  ((SELECT id FROM sr), 3,  7,  'Riesgo moderado', 'moderate',  '#f59e0b', 'Riesgo moderado. Aplicar entrevista de seguimiento (M-CHAT-R/F).', 'Aplicar parte F del instrumento. Derivar si sigue positivo.', FALSE),
  ((SELECT id FROM sr), 8,  20, 'Riesgo alto',     'severe',    '#ef4444', 'Riesgo alto de TEA. Derivación inmediata sin necesitar la Parte F.', 'Derivación urgente a evaluación diagnóstica de TEA multidisciplinar.', TRUE);


-- =============================================================
-- 6. Vanderbilt ADHD — Vanderbilt Assessment Scale
-- Wolraich et al. (1998) | Dominio público (NICHQ)
-- 55 ítems padres / 43 ítems docentes. Versión de 18 ítems TDAH + síntomas comórbidos
-- Usamos la versión de 18+7 items (sintomas TDAH + comorbilidades)
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'vanderbilt',
    'Vanderbilt ADHD — Escala de Evaluación Vanderbilt (Forma Padres)',
    'Escala de evaluación de TDAH para padres de niños de 6-12 años. Evalúa síntomas de inatención, hiperactividad/impulsividad y comorbilidades frecuentes (síntomas de ansiedad/depresión, oposicionismo). Subtipos: predominantemente inatento, hiperactivo-impulsivo y combinado.',
    'infantil', 'public_domain', 1,
    'Wolraich ML, Feurer ID, Hannah JN, Baumgaertel A, Pinnock TY (1998)',
    99, 10, '["parent","teacher"]'::jsonb,
    30, 3.0, ARRAY['infantil','clinica']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'Vanderbilt ADHD',
    'Cada pregunta se refiere a la conducta de su hijo/a en los últimos 6 meses. Seleccione la frecuencia con que cada conducta ha ocurrido: Nunca (0), Ocasionalmente (1), A menudo (2), Muy a menudo (3).'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    -- Inatención (9 ítems)
    ((SELECT id FROM s), 0,  'No presta atención a los detalles o comete errores por descuido en las tareas escolares',  'VAN_Q1',  'likert', 'inatento',    NULL),
    ((SELECT id FROM s), 1,  'Tiene dificultad para mantener la atención en tareas o actividades lúdicas',               'VAN_Q2',  'likert', 'inatento',    NULL),
    ((SELECT id FROM s), 2,  'Parece no escuchar cuando se le habla directamente',                                        'VAN_Q3',  'likert', 'inatento',    NULL),
    ((SELECT id FROM s), 3,  'No sigue instrucciones y no termina las tareas o deberes',                                  'VAN_Q4',  'likert', 'inatento',    NULL),
    ((SELECT id FROM s), 4,  'Tiene dificultad para organizar tareas y actividades',                                      'VAN_Q5',  'likert', 'inatento',    NULL),
    ((SELECT id FROM s), 5,  'Evita, no le gusta, o no quiere hacer tareas que requieren un esfuerzo mental sostenido',  'VAN_Q6',  'likert', 'inatento',    NULL),
    ((SELECT id FROM s), 6,  'Pierde cosas necesarias para tareas o actividades',                                         'VAN_Q7',  'likert', 'inatento',    NULL),
    ((SELECT id FROM s), 7,  'Se distrae fácilmente por estímulos externos',                                              'VAN_Q8',  'likert', 'inatento',    NULL),
    ((SELECT id FROM s), 8,  'Es olvidadizo en las actividades diarias',                                                  'VAN_Q9',  'likert', 'inatento',    NULL),
    -- Hiperactividad/Impulsividad (9 ítems)
    ((SELECT id FROM s), 9,  'Mueve manos o pies constantemente o se retuerce en el asiento',                            'VAN_Q10', 'likert', 'hiperactivo', NULL),
    ((SELECT id FROM s), 10, 'Abandona el asiento en clase o en situaciones donde debe permanecer sentado',              'VAN_Q11', 'likert', 'hiperactivo', NULL),
    ((SELECT id FROM s), 11, 'Corre o trepa en situaciones donde no es apropiado',                                        'VAN_Q12', 'likert', 'hiperactivo', NULL),
    ((SELECT id FROM s), 12, 'Tiene dificultad para jugar o participar en actividades de forma tranquila',               'VAN_Q13', 'likert', 'hiperactivo', NULL),
    ((SELECT id FROM s), 13, 'Está "en marcha" o actúa como si tuviera un motor',                                         'VAN_Q14', 'likert', 'hiperactivo', NULL),
    ((SELECT id FROM s), 14, 'Habla en exceso',                                                                           'VAN_Q15', 'likert', 'hiperactivo', NULL),
    ((SELECT id FROM s), 15, 'Responde antes de que se hayan terminado de hacer las preguntas',                          'VAN_Q16', 'likert', 'hiperactivo', NULL),
    ((SELECT id FROM s), 16, 'Tiene dificultad para esperar su turno',                                                   'VAN_Q17', 'likert', 'hiperactivo', NULL),
    ((SELECT id FROM s), 17, 'Interrumpe o se entromete con otros',                                                       'VAN_Q18', 'likert', 'hiperactivo', NULL),
    -- Comorbilidades: Ansiedad/Depresión
    ((SELECT id FROM s), 18, 'Se queja de que le duele la cabeza, el estómago u otras partes del cuerpo',               'VAN_Q19', 'likert', 'ansiedad_dep', NULL),
    ((SELECT id FROM s), 19, 'Parece triste, desdichado o deprimido',                                                    'VAN_Q20', 'likert', 'ansiedad_dep', NULL),
    ((SELECT id FROM s), 20, 'Parece temible, asustado o ansioso',                                                       'VAN_Q21', 'likert', 'ansiedad_dep', NULL),
    -- Comorbilidades: Oposicionismo
    ((SELECT id FROM s), 21, 'Discute con los adultos',                                                                   'VAN_Q22', 'likert', 'oposicionismo',NULL),
    ((SELECT id FROM s), 22, 'Pierde el control',                                                                         'VAN_Q23', 'likert', 'oposicionismo',NULL),
    ((SELECT id FROM s), 23, 'Activamente desafía o rechaza cumplir con las peticiones de los adultos',                  'VAN_Q24', 'likert', 'oposicionismo',NULL),
    ((SELECT id FROM s), 24, 'Es rencoroso/a o vengativo/a',                                                             'VAN_Q25', 'likert', 'oposicionismo',NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nunca',          0),
  (1, 'Ocasionalmente', 1),
  (2, 'A menudo',       2),
  (3, 'Muy a menudo',   3)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_in UUID; sr_hip UUID; sr_anx UUID; sr_opo UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'vanderbilt';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'inatento', 'Inatención', 'sum',
    ARRAY['VAN_Q1','VAN_Q2','VAN_Q3','VAN_Q4','VAN_Q5','VAN_Q6','VAN_Q7','VAN_Q8','VAN_Q9'], 1.0)
  RETURNING id INTO sr_in;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'hiperactivo', 'Hiperactividad/Impulsividad', 'sum',
    ARRAY['VAN_Q10','VAN_Q11','VAN_Q12','VAN_Q13','VAN_Q14','VAN_Q15','VAN_Q16','VAN_Q17','VAN_Q18'], 1.0)
  RETURNING id INTO sr_hip;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'ansiedad_dep', 'Ansiedad/Depresión comórbida', 'sum', ARRAY['VAN_Q19','VAN_Q20','VAN_Q21'], 1.0) RETURNING id INTO sr_anx;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'oposicionismo', 'Oposicionismo', 'sum', ARRAY['VAN_Q22','VAN_Q23','VAN_Q24','VAN_Q25'], 1.0) RETURNING id INTO sr_opo;

  -- Criterio: ≥6 ítems con puntuación ≥2 (A menudo/Muy a menudo) en inatención o hiperactividad
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_in,  0,  11, 'Sin criterio',  'normal',   '#22c55e', 'Inatención por debajo del umbral clínico.',            'Sin intervención específica por TDAH inatento.', FALSE),
    (sr_in,  12, 18, 'Con criterio',  'moderate', '#f59e0b', 'Inatención elevada. ≥6 ítems probablemente ≥2.',       'Evaluación diagnóstica TDAH. Coordinación escolar.', FALSE),
    (sr_in,  19, 27, 'Severo',        'severe',   '#ef4444', 'Inatención severa. Impacto funcional marcado.',        'Derivación a neuropediatría. Plan de apoyo escolar.', TRUE),
    (sr_hip, 0,  11, 'Sin criterio',  'normal',   '#22c55e', 'Hiperactividad por debajo del umbral clínico.',        'Sin intervención específica por TDAH hiperactivo.', FALSE),
    (sr_hip, 12, 18, 'Con criterio',  'moderate', '#f59e0b', 'Hiperactividad/impulsividad elevada.',                 'Evaluación diagnóstica TDAH. Coordinación familiar y escolar.', FALSE),
    (sr_hip, 19, 27, 'Severo',        'severe',   '#ef4444', 'Hiperactividad severa. Impacto funcional marcado.',    'Derivación a neuropediatría urgente.', TRUE);
END $$;


-- =============================================================
-- 7. RCADS — Revised Children's Anxiety and Depression Scale (Forma breve)
-- Chorpita et al. (2000) | Dominio público
-- 25 ítems, 0-3, ansiedad y depresión en 6 subescalas
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'rcads',
    'RCADS — Escala Revisada de Ansiedad y Depresión Infantil (Forma Breve)',
    'Instrumento de 25 ítems para evaluar ansiedad y depresión en niños y adolescentes (8-18 años). 6 subescalas DSM-IV: trastorno de ansiedad por separación, fobia social, TOC, pánico, TAG y depresión mayor. Con normas por edad y sexo.',
    'infantil', 'public_domain', 1,
    'Chorpita BF, Yim L, Moffitt C, Umemoto LA, Francis SE (2000)',
    8, 7, '["self","parent"]'::jsonb,
    14, 5.0, ARRAY['infantil','clinica']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'RCADS',
    'A continuación hay algunas frases sobre cómo se sienten los niños. Lee cada frase y selecciona con qué frecuencia te sientes así: Nunca, A veces, A menudo, o Siempre.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Me preocupo mucho',                                                              'RCADS_Q1',  'likert', 'tag',        NULL),
    ((SELECT id FROM s), 1,  'Cuando tengo un problema, me duele la cabeza',                                   'RCADS_Q2',  'likert', 'panico',     NULL),
    ((SELECT id FROM s), 2,  'No me gusta estar lejos de mi familia',                                          'RCADS_Q3',  'likert', 'separacion', NULL),
    ((SELECT id FROM s), 3,  'Tengo miedo de parecer tonto/a delante de los demás',                           'RCADS_Q4',  'likert', 'social',     NULL),
    ((SELECT id FROM s), 4,  'Nada me parece divertido',                                                       'RCADS_Q5',  'likert', 'depresion',  NULL),
    ((SELECT id FROM s), 5,  'Tengo miedo de que algo malo me vaya a pasar a mí o a mi familia',              'RCADS_Q6',  'likert', 'separacion', NULL),
    ((SELECT id FROM s), 6,  'Pienso en cosas malas que no puedo parar de pensar',                            'RCADS_Q7',  'likert', 'toc',        NULL),
    ((SELECT id FROM s), 7,  'Me preocupa hacer las cosas mal',                                               'RCADS_Q8',  'likert', 'tag',        NULL),
    ((SELECT id FROM s), 8,  'Tengo miedo de desmayarme',                                                     'RCADS_Q9',  'likert', 'panico',     NULL),
    ((SELECT id FROM s), 9,  'Me siento triste o vacío/a',                                                    'RCADS_Q10', 'likert', 'depresion',  NULL),
    ((SELECT id FROM s), 10, 'Me pongo nervioso/a cuando estoy con personas que no conozco bien',             'RCADS_Q11', 'likert', 'social',     NULL),
    ((SELECT id FROM s), 11, 'Me preocupa que a mi familia le pase algo malo',                                'RCADS_Q12', 'likert', 'separacion', NULL),
    ((SELECT id FROM s), 12, 'Repito cosas muchas veces para asegurarme de que estén bien',                  'RCADS_Q13', 'likert', 'toc',        NULL),
    ((SELECT id FROM s), 13, 'Me siento cansado/a aunque duermo bien',                                        'RCADS_Q14', 'likert', 'depresion',  NULL),
    ((SELECT id FROM s), 14, 'Me late el corazón muy fuerte o muy rápido de repente',                        'RCADS_Q15', 'likert', 'panico',     NULL),
    ((SELECT id FROM s), 15, 'Me siento nervioso/a',                                                          'RCADS_Q16', 'likert', 'tag',        NULL),
    ((SELECT id FROM s), 16, 'Siento que soy una mala persona',                                              'RCADS_Q17', 'likert', 'depresion',  NULL),
    ((SELECT id FROM s), 17, 'Me preocupo por la escuela',                                                    'RCADS_Q18', 'likert', 'tag',        NULL),
    ((SELECT id FROM s), 18, 'No tengo ganas de nada',                                                        'RCADS_Q19', 'likert', 'depresion',  NULL),
    ((SELECT id FROM s), 19, 'Me da miedo hacer el ridículo',                                                 'RCADS_Q20', 'likert', 'social',     NULL),
    ((SELECT id FROM s), 20, 'Me cuesta dormir bien',                                                         'RCADS_Q21', 'likert', 'depresion',  NULL),
    ((SELECT id FROM s), 21, 'Tengo pensamientos raros que no quiero tener',                                  'RCADS_Q22', 'likert', 'toc',        NULL),
    ((SELECT id FROM s), 22, 'Me siento mareado/a o como si me fuera a desmayar',                            'RCADS_Q23', 'likert', 'panico',     NULL),
    ((SELECT id FROM s), 23, 'No me junto con otros niños porque tengo miedo de avergonzarme',               'RCADS_Q24', 'likert', 'social',     NULL),
    ((SELECT id FROM s), 24, 'No tengo ganas de hablar con nadie',                                            'RCADS_Q25', 'likert', 'depresion',  NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Nunca',    0),
  (1, 'A veces',  1),
  (2, 'A menudo', 2),
  (3, 'Siempre',  3)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_tag UUID; sr_pan UUID; sr_sep UUID; sr_soc UUID; sr_toc UUID; sr_dep UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'rcads';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'tag', 'Ansiedad Generalizada', 'sum', ARRAY['RCADS_Q1','RCADS_Q8','RCADS_Q16','RCADS_Q18'], 1.0) RETURNING id INTO sr_tag;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'panico', 'Trastorno de Pánico', 'sum', ARRAY['RCADS_Q2','RCADS_Q9','RCADS_Q15','RCADS_Q23'], 1.0) RETURNING id INTO sr_pan;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'separacion', 'Ansiedad por Separación', 'sum', ARRAY['RCADS_Q3','RCADS_Q6','RCADS_Q12'], 1.0) RETURNING id INTO sr_sep;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'social', 'Fobia Social', 'sum', ARRAY['RCADS_Q4','RCADS_Q11','RCADS_Q20','RCADS_Q24'], 1.0) RETURNING id INTO sr_soc;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'toc', 'TOC', 'sum', ARRAY['RCADS_Q7','RCADS_Q13','RCADS_Q22'], 1.0) RETURNING id INTO sr_toc;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'depresion', 'Depresión Mayor', 'sum', ARRAY['RCADS_Q5','RCADS_Q10','RCADS_Q14','RCADS_Q17','RCADS_Q19','RCADS_Q21','RCADS_Q25'], 1.0) RETURNING id INTO sr_dep;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  SELECT s.id, r.score_min, r.score_max, r.severity_label, r.severity_code, r.color_hex, r.description, r.recommendation, r.is_risk
  FROM (VALUES (sr_tag),(sr_pan),(sr_sep),(sr_soc),(sr_toc),(sr_dep)) AS s(id)
  CROSS JOIN (VALUES
    (0,  5,  'Normal',   'normal',   '#22c55e', 'Subescala dentro de rango normal.',                        'Sin intervención específica.', FALSE),
    (6,  9,  'Elevado',  'moderate', '#f59e0b', 'Puntuación elevada. Posible clínica ansiosa/depresiva.',   'Evaluación clínica y seguimiento.', FALSE),
    (10, 21, 'Clínico',  'severe',   '#ef4444', 'Puntuación en rango clínico. Requiere evaluación formal.', 'Intervención psicológica infantil indicada.', TRUE)
  ) AS r(score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk);
END $$;
