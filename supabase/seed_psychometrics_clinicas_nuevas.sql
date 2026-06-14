-- =============================================================
-- PSICONECTA — Seed: Escalas clínicas nuevas
-- ISI · PSS-10 · SPIN · DAST-10 · C-SSRS
-- (DASS-21 ya está en seed_psychometrics.sql)
--
-- Los registros en `tests` ya existen (creados en MIGRAR_AHORA.sql).
-- Este archivo agrega: test_sections, items, response_options,
-- scoring_rules e interpretation_ranges.
--
-- 100% idempotente: usa IF NOT EXISTS / ON CONFLICT DO NOTHING.
-- =============================================================


-- =============================================================
-- 1. ISI — Índice de Severidad del Insomnio
-- Morin (1993) | Validación española: Fernández-Mendoza et al. (2012)
-- 7 ítems · escala 0-4 (etiquetas varían por ítem) · max 28
-- =============================================================
DO $$
DECLARE
  v_test_id UUID; v_sec_id UUID;
  ids UUID[];
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'isi';
  IF v_test_id IS NULL THEN RAISE EXCEPTION 'Test isi no encontrado'; END IF;

  -- Actualizar campos faltantes del INSERT mínimo de MIGRAR_AHORA
  UPDATE tests SET
    respondent_versions    = '["self"]'::jsonb,
    min_reapplication_days = 14,
    rci_threshold          = 3.0,
    branches               = ARRAY['clinica','tcc']
  WHERE slug = 'isi';

  -- Sección
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test_id, 0, 'ISI',
    'Por favor, responda las siguientes preguntas sobre sus problemas de sueño ACTUALES (últimas 2 semanas).')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_sec_id;

  IF v_sec_id IS NULL THEN
    SELECT id INTO v_sec_id FROM test_sections WHERE test_id = v_test_id AND order_index = 0;
  END IF;

  -- Ítems
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
  VALUES
    (v_sec_id, 0, 'Dificultad para conciliar el sueño (quedarse dormido/a)',                          'ISI_Q1', 'likert', 'total'),
    (v_sec_id, 1, 'Dificultad para mantener el sueño (despertarse durante la noche)',                 'ISI_Q2', 'likert', 'total'),
    (v_sec_id, 2, 'Problemas para despertarse demasiado temprano',                                    'ISI_Q3', 'likert', 'total'),
    (v_sec_id, 3, '¿En qué medida está SATISFECHO/A con su patrón de sueño actual?',                 'ISI_Q4', 'likert', 'total'),
    (v_sec_id, 4, '¿En qué medida considera que su problema de sueño es VISIBLE para los demás (cansancio, concentración, memoria, estado de ánimo)?', 'ISI_Q5', 'likert', 'total'),
    (v_sec_id, 5, '¿En qué medida está PREOCUPADO/A por su problema de sueño actual?',               'ISI_Q6', 'likert', 'total'),
    (v_sec_id, 6, '¿En qué medida considera que su problema de sueño INTERFIERE con su funcionamiento diario?', 'ISI_Q7', 'likert', 'total')
  ON CONFLICT DO NOTHING;

  -- Response options (cada ítem tiene sus propias etiquetas)
  -- Q1-Q3: severidad del problema
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  CROSS JOIN (VALUES (0,'Ninguna',0),(1,'Leve',1),(2,'Moderada',2),(3,'Grave',3),(4,'Muy grave',4)) AS o(ord,lbl,val)
  WHERE i.section_id = v_sec_id AND i.item_code IN ('ISI_Q1','ISI_Q2','ISI_Q3')
  ON CONFLICT DO NOTHING;

  -- Q4: satisfacción (etiquetas invertidas — 0=muy satisfecho, mayor=insatisfecho)
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  CROSS JOIN (VALUES (0,'Muy satisfecho/a',0),(1,'Satisfecho/a',1),(2,'Moderadamente insatisfecho/a',2),(3,'Insatisfecho/a',3),(4,'Muy insatisfecho/a',4)) AS o(ord,lbl,val)
  WHERE i.section_id = v_sec_id AND i.item_code = 'ISI_Q4'
  ON CONFLICT DO NOTHING;

  -- Q5-Q7: impacto / interferencia / preocupación
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  CROSS JOIN (VALUES (0,'Nada',0),(1,'Un poco',1),(2,'Algo',2),(3,'Mucho',3),(4,'Extremadamente',4)) AS o(ord,lbl,val)
  WHERE i.section_id = v_sec_id AND i.item_code IN ('ISI_Q5','ISI_Q6','ISI_Q7')
  ON CONFLICT DO NOTHING;

  -- Scoring rules
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test_id, 'total', 'Puntuación Total', 'sum',
    ARRAY['ISI_Q1','ISI_Q2','ISI_Q3','ISI_Q4','ISI_Q5','ISI_Q6','ISI_Q7'], 1.0)
  ON CONFLICT DO NOTHING;

  -- Interpretation ranges
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  SELECT sr.id, rng.smin, rng.smax, rng.slabel, rng.scode, rng.chex, rng.desc_, rng.rec_, rng.risk_
  FROM scoring_rules sr
  CROSS JOIN (VALUES
    (0,  7,  'Sin insomnio clínico',      'none',     '#22c55e', 'Sin insomnio clínico significativo.',                          'Monitorear. Psicoeducación sobre higiene del sueño si hay malestar subjetivo.',                                      FALSE),
    (8,  14, 'Insomnio subumbral',         'subthresh','#86efac', 'Insomnio leve. Algunos síntomas sin impacto clínico pleno.',   'Higiene del sueño estructurada y restricción de cama. Seguimiento.',                                               FALSE),
    (15, 21, 'Insomnio clínico moderado',  'moderate', '#f59e0b', 'Insomnio moderado con impacto en funcionamiento diario.',      'Terapia Cognitivo-Conductual para el Insomnio (TCC-I). Evaluar comorbilidades.',                                    FALSE),
    (22, 28, 'Insomnio clínico grave',     'severe',   '#ef4444', 'Insomnio grave. Deterioro significativo del funcionamiento.',   'TCC-I intensiva. Consultar con médico para descartar causas orgánicas y evaluar farmacoterapia temporal.',          TRUE)
  ) AS rng(smin,smax,slabel,scode,chex,desc_,rec_,risk_)
  WHERE sr.test_id = v_test_id AND sr.subscale_name = 'total'
  ON CONFLICT DO NOTHING;

END $$;


-- =============================================================
-- 2. PSS-10 — Escala de Estrés Percibido (Cohen, 1983)
-- Validación española: Remor (2006)
-- 10 ítems · escala 0-4 · ítems 4,5,7,8 invertidos · max 40
-- =============================================================
DO $$
DECLARE
  v_test_id UUID; v_sec_id UUID; v_sr_id UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'pss10';
  IF v_test_id IS NULL THEN RAISE EXCEPTION 'Test pss10 no encontrado'; END IF;

  UPDATE tests SET
    respondent_versions    = '["self"]'::jsonb,
    min_reapplication_days = 30,
    rci_threshold          = 4.0,
    branches               = ARRAY['clinica','tcc']
  WHERE slug = 'pss10';

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test_id, 0, 'PSS-10',
    'Las preguntas le piden sobre sus sentimientos y pensamientos durante el ÚLTIMO MES. En cada caso, indique con qué frecuencia se sintió o pensó de una determinada manera.')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_sec_id;

  IF v_sec_id IS NULL THEN
    SELECT id INTO v_sec_id FROM test_sections WHERE test_id = v_test_id AND order_index = 0;
  END IF;

  -- Ítems — todos con subscale 'total'.
  -- El reverso se maneja en response_options (valor = 4 - posición mostrada).
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
  VALUES
    (v_sec_id, 0, 'En el último mes, ¿con qué frecuencia ha estado afectado/a por algo que ha ocurrido inesperadamente?',                             'PSS10_Q1',  'likert', 'total'),
    (v_sec_id, 1, 'En el último mes, ¿con qué frecuencia se ha sentido incapaz de controlar las cosas importantes de su vida?',                       'PSS10_Q2',  'likert', 'total'),
    (v_sec_id, 2, 'En el último mes, ¿con qué frecuencia se ha sentido nervioso/a o estresado/a?',                                                    'PSS10_Q3',  'likert', 'total'),
    (v_sec_id, 3, 'En el último mes, ¿con qué frecuencia ha manejado con éxito los pequeños problemas irritantes de la vida?',                        'PSS10_Q4',  'likert', 'total'),
    (v_sec_id, 4, 'En el último mes, ¿con qué frecuencia ha sentido que ha afrontado efectivamente los cambios importantes de su vida?',              'PSS10_Q5',  'likert', 'total'),
    (v_sec_id, 5, 'En el último mes, ¿con qué frecuencia ha estado seguro/a sobre su capacidad para manejar sus problemas personales?',              'PSS10_Q6',  'likert', 'total'),
    (v_sec_id, 6, 'En el último mes, ¿con qué frecuencia ha sentido que las cosas le van bien?',                                                      'PSS10_Q7',  'likert', 'total'),
    (v_sec_id, 7, 'En el último mes, ¿con qué frecuencia ha sentido que no podía afrontar todas las cosas que tenía que hacer?',                      'PSS10_Q8',  'likert', 'total'),
    (v_sec_id, 8, 'En el último mes, ¿con qué frecuencia ha podido controlar las dificultades de su vida?',                                           'PSS10_Q9',  'likert', 'total'),
    (v_sec_id, 9, 'En el último mes, ¿con qué frecuencia ha sentido que tenía todo bajo control?',                                                    'PSS10_Q10', 'likert', 'total')
  ON CONFLICT DO NOTHING;

  -- Response options para ítems DIRECTOS (Q1, Q2, Q3, Q8) — más frecuencia = más estrés
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  CROSS JOIN (VALUES
    (0,'Nunca',0),(1,'Casi nunca',1),(2,'De vez en cuando',2),(3,'A menudo',3),(4,'Muy a menudo',4)
  ) AS o(ord,lbl,val)
  WHERE i.section_id = v_sec_id
    AND i.item_code IN ('PSS10_Q1','PSS10_Q2','PSS10_Q3','PSS10_Q8')
  ON CONFLICT DO NOTHING;

  -- Response options para ítems INVERTIDOS (Q4,Q5,Q6,Q7,Q9,Q10)
  -- La etiqueta mostrada mantiene el orden natural, pero el VALUE ya está invertido (4-x).
  -- Así el engine hace simple SUM y el reverso queda embebido en los datos.
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  CROSS JOIN (VALUES
    (0,'Nunca',4),(1,'Casi nunca',3),(2,'De vez en cuando',2),(3,'A menudo',1),(4,'Muy a menudo',0)
  ) AS o(ord,lbl,val)
  WHERE i.section_id = v_sec_id
    AND i.item_code IN ('PSS10_Q4','PSS10_Q5','PSS10_Q6','PSS10_Q7','PSS10_Q9','PSS10_Q10')
  ON CONFLICT DO NOTHING;

  -- Un solo scoring rule sum con todos los ítems (reverso ya embebido en options)
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES
    (v_test_id, 'total', 'Puntuación Total', 'sum',
      ARRAY['PSS10_Q1','PSS10_Q2','PSS10_Q3','PSS10_Q4','PSS10_Q5',
            'PSS10_Q6','PSS10_Q7','PSS10_Q8','PSS10_Q9','PSS10_Q10'], 1.0)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_sr_id FROM scoring_rules WHERE test_id = v_test_id AND subscale_name = 'total';

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr_id, 0,  13, 'Estrés bajo',     'low',      '#22c55e', 'Nivel de estrés percibido dentro del rango bajo.',      'Mantenimiento de recursos de afrontamiento. Sin intervención específica indicada.',                           FALSE),
    (v_sr_id, 14, 26, 'Estrés moderado', 'moderate', '#f59e0b', 'Nivel de estrés percibido moderado.',                   'Técnicas de manejo del estrés, mindfulness y activación conductual. Evaluar fuentes de estrés.',            FALSE),
    (v_sr_id, 27, 40, 'Estrés alto',     'high',     '#ef4444', 'Nivel de estrés percibido alto. Impacto en salud.',     'Intervención psicoterapéutica activa. Evaluar comorbilidades de ansiedad y depresión.',                      TRUE)
  ON CONFLICT DO NOTHING;

END $$;


-- =============================================================
-- 3. SPIN — Inventario de Fobia Social (Connor et al., 2000)
-- Validación española: García-López et al. (2010)
-- 17 ítems · escala 0-4 · punto de corte ≥19 · max 68
-- =============================================================
DO $$
DECLARE
  v_test_id UUID; v_sec_id UUID; v_sr_id UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'spin';
  IF v_test_id IS NULL THEN RAISE EXCEPTION 'Test spin no encontrado'; END IF;

  UPDATE tests SET
    respondent_versions    = '["self"]'::jsonb,
    min_reapplication_days = 14,
    rci_threshold          = 5.0,
    branches               = ARRAY['clinica','tcc']
  WHERE slug = 'spin';

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test_id, 0, 'SPIN',
    'Por favor, indique en qué medida le MOLESTÓ cada uno de los siguientes problemas durante la ÚLTIMA SEMANA.')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_sec_id;

  IF v_sec_id IS NULL THEN
    SELECT id INTO v_sec_id FROM test_sections WHERE test_id = v_test_id AND order_index = 0;
  END IF;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale)
  VALUES
    (v_sec_id,  0, 'Temo a las personas que tienen autoridad',                                                           'SPIN_Q1',  'likert', 'miedo'),
    (v_sec_id,  1, 'Me molesta el rubor en presencia de personas',                                                       'SPIN_Q2',  'likert', 'fisiologico'),
    (v_sec_id,  2, 'Las fiestas y eventos sociales me asustan',                                                          'SPIN_Q3',  'likert', 'evitacion'),
    (v_sec_id,  3, 'Evito hablar con personas que no conozco',                                                           'SPIN_Q4',  'likert', 'evitacion'),
    (v_sec_id,  4, 'Ser criticado/a me asusta mucho',                                                                    'SPIN_Q5',  'likert', 'miedo'),
    (v_sec_id,  5, 'El miedo a la vergüenza hace que evite hacer cosas o hablar con la gente',                          'SPIN_Q6',  'likert', 'fisiologico'),
    (v_sec_id,  6, 'Sudar delante de la gente me causa angustia',                                                        'SPIN_Q7',  'likert', 'fisiologico'),
    (v_sec_id,  7, 'Evito acudir a fiestas',                                                                             'SPIN_Q8',  'likert', 'evitacion'),
    (v_sec_id,  8, 'Evito actividades en las que soy el/la centro de atención',                                         'SPIN_Q9',  'likert', 'evitacion'),
    (v_sec_id,  9, 'Hablar con extraños me da miedo',                                                                    'SPIN_Q10', 'likert', 'miedo'),
    (v_sec_id, 10, 'Evito pronunciar discursos',                                                                         'SPIN_Q11', 'likert', 'evitacion'),
    (v_sec_id, 11, 'Haría cualquier cosa para evitar ser criticado/a',                                                  'SPIN_Q12', 'likert', 'fisiologico'),
    (v_sec_id, 12, 'Los palpitaciones me molestan cuando estoy con gente',                                              'SPIN_Q13', 'likert', 'fisiologico'),
    (v_sec_id, 13, 'Tengo miedo de hacer cosas cuando la gente me puede estar mirando',                                 'SPIN_Q14', 'likert', 'evitacion'),
    (v_sec_id, 14, 'El mayor miedo es el ridículo',                                                                     'SPIN_Q15', 'likert', 'miedo'),
    (v_sec_id, 15, 'Evito hablar con cualquier persona que tenga autoridad',                                            'SPIN_Q16', 'likert', 'evitacion'),
    (v_sec_id, 16, 'Temblar o sacudirse delante de otros me resulta angustioso',                                        'SPIN_Q17', 'likert', 'fisiologico')
  ON CONFLICT DO NOTHING;

  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  CROSS JOIN (VALUES
    (0,'Nada',0),(1,'Un poco',1),(2,'Bastante',2),(3,'Mucho',3),(4,'Muchísimo',4)
  ) AS o(ord,lbl,val)
  WHERE i.section_id = v_sec_id
  ON CONFLICT DO NOTHING;

  -- Scoring rules: total + 3 subescalas
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES
    (v_test_id, 'total',       'Puntuación Total',       'sum',
      ARRAY['SPIN_Q1','SPIN_Q2','SPIN_Q3','SPIN_Q4','SPIN_Q5','SPIN_Q6','SPIN_Q7','SPIN_Q8','SPIN_Q9',
            'SPIN_Q10','SPIN_Q11','SPIN_Q12','SPIN_Q13','SPIN_Q14','SPIN_Q15','SPIN_Q16','SPIN_Q17'], 1.0),
    (v_test_id, 'miedo',       'Miedo',                  'sum',
      ARRAY['SPIN_Q1','SPIN_Q5','SPIN_Q10','SPIN_Q15'], 1.0),
    (v_test_id, 'evitacion',   'Evitación',              'sum',
      ARRAY['SPIN_Q3','SPIN_Q4','SPIN_Q8','SPIN_Q9','SPIN_Q11','SPIN_Q14','SPIN_Q16'], 1.0),
    (v_test_id, 'fisiologico', 'Malestar fisiológico',   'sum',
      ARRAY['SPIN_Q2','SPIN_Q6','SPIN_Q7','SPIN_Q12','SPIN_Q13','SPIN_Q17'], 1.0)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_sr_id FROM scoring_rules WHERE test_id = v_test_id AND subscale_name = 'total';

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr_id,  0, 20, 'Sin fobia social',        'none',     '#22c55e', 'Sin fobia social significativa.',                           'Sin intervención específica indicada. Monitorear si hay malestar subjetivo.',                                FALSE),
    (v_sr_id, 21, 30, 'Fobia social leve',        'mild',     '#86efac', 'Fobia social leve. Malestar presente pero manejable.',      'Psicoeducación, técnicas de exposición gradual y habilidades sociales básicas.',                              FALSE),
    (v_sr_id, 31, 40, 'Fobia social moderada',    'moderate', '#f59e0b', 'Fobia social moderada. Interferencia en funcionamiento.',   'TCC para ansiedad social (protocolo Heimberg). Grupo de habilidades sociales.',                               FALSE),
    (v_sr_id, 41, 68, 'Fobia social grave',        'severe',   '#ef4444', 'Fobia social grave. Deterioro significativo.',              'TCC intensiva ± evaluación psiquiátrica (ISRS son primera línea farmacológica).',                             TRUE)
  ON CONFLICT DO NOTHING;

END $$;


-- =============================================================
-- 4. DAST-10 — Drug Abuse Screening Test (Skinner, 1982)
-- Adaptación breve OMS · 10 ítems Sí/No · max 10
-- =============================================================
DO $$
DECLARE
  v_test_id UUID; v_sec_id UUID; v_sr_id UUID;
  v_q3_id UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'dast10';
  IF v_test_id IS NULL THEN RAISE EXCEPTION 'Test dast10 no encontrado'; END IF;

  UPDATE tests SET
    respondent_versions    = '["self"]'::jsonb,
    min_reapplication_days = 90,
    rci_threshold          = 2.0,
    branches               = ARRAY['clinica']
  WHERE slug = 'dast10';

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test_id, 0, 'DAST-10',
    'Las siguientes preguntas son sobre el posible uso de drogas. NO incluya bebidas alcohólicas ni tabaco. Responda SÍ o NO según lo que le haya ocurrido en los ÚLTIMOS 12 MESES.')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_sec_id;

  IF v_sec_id IS NULL THEN
    SELECT id INTO v_sec_id FROM test_sections WHERE test_id = v_test_id AND order_index = 0;
  END IF;

  -- Ítems (Q3 es inverso: "¿Puede dejar de usar drogas?" — No=1, Sí=0)
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    (v_sec_id, 0, '¿Ha utilizado drogas que no sean las recetadas por un médico?',                                                              'DAST10_Q1',  'multiple_choice', 'total',   NULL),
    (v_sec_id, 1, '¿Abusa de más de una droga a la vez?',                                                                                       'DAST10_Q2',  'multiple_choice', 'total',   NULL),
    (v_sec_id, 2, '¿Puede dejar de usar drogas cuando quiere? (Si nunca las usa, responda Sí)',                                                  'DAST10_Q3',  'multiple_choice', 'total_r', NULL),
    (v_sec_id, 3, '¿Ha tenido alguna vez "alucinaciones" o "lagunas" como resultado del uso de drogas?',                                        'DAST10_Q4',  'multiple_choice', 'total',   NULL),
    (v_sec_id, 4, '¿Se siente alguna vez mal (culpable) por su uso de drogas?',                                                                 'DAST10_Q5',  'multiple_choice', 'total',   NULL),
    (v_sec_id, 5, '¿Su familia o pareja se queja alguna vez de su uso de drogas?',                                                              'DAST10_Q6',  'multiple_choice', 'total',   NULL),
    (v_sec_id, 6, '¿Ha descuidado a su familia por el uso de drogas?',                                                                          'DAST10_Q7',  'multiple_choice', 'total',   NULL),
    (v_sec_id, 7, '¿Ha participado en actividades ilegales para obtener drogas?',                                                               'DAST10_Q8',  'multiple_choice', 'total',   NULL),
    (v_sec_id, 8, '¿Ha experimentado síntomas de abstinencia (se ha sentido enfermo/a) cuando ha dejado de usar drogas?',                       'DAST10_Q9',  'multiple_choice', 'total',   NULL),
    (v_sec_id, 9, '¿Ha tenido problemas médicos como resultado del uso de drogas (p. ej., pérdida de memoria, hepatitis, convulsiones)?',       'DAST10_Q10', 'multiple_choice', 'total',   1)
  ON CONFLICT DO NOTHING;

  -- Response options para ítems directos (No=0, Sí=1)
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  CROSS JOIN (VALUES (0,'No',0),(1,'Sí',1)) AS o(ord,lbl,val)
  WHERE i.section_id = v_sec_id AND i.subscale = 'total'
  ON CONFLICT DO NOTHING;

  -- Response options para Q3 inverso (Sí=0, No=1)
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  CROSS JOIN (VALUES (0,'Sí (puede dejar)',0),(1,'No (no puede dejar)',1)) AS o(ord,lbl,val)
  WHERE i.section_id = v_sec_id AND i.item_code = 'DAST10_Q3'
  ON CONFLICT DO NOTHING;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test_id, 'total', 'Puntuación Total', 'sum',
    ARRAY['DAST10_Q1','DAST10_Q2','DAST10_Q3','DAST10_Q4','DAST10_Q5',
          'DAST10_Q6','DAST10_Q7','DAST10_Q8','DAST10_Q9','DAST10_Q10'], 1.0)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_sr_id FROM scoring_rules WHERE test_id = v_test_id AND subscale_name = 'total';

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr_id, 0,  0, 'Sin problema aparente',            'none',         '#22c55e', 'Sin uso problemático de drogas reportado.',                  'Sin intervención específica. Educación preventiva si hay contexto de riesgo.',                              FALSE),
    (v_sr_id, 1,  2, 'Riesgo bajo',                       'low',          '#86efac', 'Uso de bajo nivel o riesgo.',                                'Consejo breve sobre riesgos. Psicoeducación y seguimiento.',                                               FALSE),
    (v_sr_id, 3,  5, 'Nivel moderado de problemas',       'moderate',     '#f59e0b', 'Uso con problemas moderados.',                               'Intervención breve motivacional. Evaluar criterios TUS (DSM-5).',                                          FALSE),
    (v_sr_id, 6,  8, 'Nivel sustancial de problemas',     'substantial',  '#f97316', 'Uso con problemas sustanciales.',                            'Derivación a programa de tratamiento de adicciones. Entrevista motivacional.',                             FALSE),
    (v_sr_id, 9, 10, 'Nivel grave de problemas',          'severe',       '#ef4444', 'Uso con problemas graves. Probable dependencia.',            'Derivación urgente a especialista en adicciones. Evaluar riesgo de abstinencia grave.',                     TRUE)
  ON CONFLICT DO NOTHING;

END $$;


-- =============================================================
-- 5. C-SSRS — Columbia Suicide Severity Rating Scale (cribado)
-- Posner et al. (2011) | Columbia University · Dominio público clínico
-- 6 ítems Sí/No secuenciales · alerta desde ítem 3
-- =============================================================
DO $$
DECLARE
  v_test_id UUID; v_sec_id UUID; v_sr_id UUID;
BEGIN
  SELECT id INTO v_test_id FROM tests WHERE slug = 'cssrs';
  IF v_test_id IS NULL THEN RAISE EXCEPTION 'Test cssrs no encontrado'; END IF;

  UPDATE tests SET
    respondent_versions    = '["self","clinician"]'::jsonb,
    min_reapplication_days = 7,
    rci_threshold          = 1.0,
    branches               = ARRAY['clinica','tcc']
  WHERE slug = 'cssrs';

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test_id, 0, 'C-SSRS',
    'Responda estas preguntas sobre pensamientos o conductas relacionadas con hacerse daño o quitarse la vida durante el ÚLTIMO MES (salvo que se indique otra cosa). Cualquier respuesta "Sí" en los ítems 3-6 requiere evaluación inmediata.')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_sec_id;

  IF v_sec_id IS NULL THEN
    SELECT id INTO v_sec_id FROM test_sections WHERE test_id = v_test_id AND order_index = 0;
  END IF;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    (v_sec_id, 0, '¿Ha deseado estar muerto/a o desear que pudiera dormir para siempre?',                                                                                                               'CSSRS_Q1', 'multiple_choice', 'ideacion', NULL),
    (v_sec_id, 1, '¿Ha tenido pensamientos de hacerse daño o de suicidarse?',                                                                                                                          'CSSRS_Q2', 'multiple_choice', 'ideacion', NULL),
    (v_sec_id, 2, '¿Ha pensado en cómo haría para suicidarse?',                                                                                                                                        'CSSRS_Q3', 'multiple_choice', 'plan',     1),
    (v_sec_id, 3, '¿Ha tenido la intención de actuar según estos pensamientos?',                                                                                                                       'CSSRS_Q4', 'multiple_choice', 'plan',     1),
    (v_sec_id, 4, '¿Ha empezado a prepararse para suicidarse o ha hecho algo para preparar su suicidio (p. ej., conseguir pastillas, armas, escribir una nota de suicidio)?',                        'CSSRS_Q5', 'multiple_choice', 'conducta', 1),
    (v_sec_id, 5, '¿Ha realizado algún intento de suicidio o ha hecho algo con la intención de quitarse la vida? (En cualquier momento de su vida)',                                                  'CSSRS_Q6', 'multiple_choice', 'conducta', 1)
  ON CONFLICT DO NOTHING;

  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  CROSS JOIN (VALUES (0,'No',0),(1,'Sí',1)) AS o(ord,lbl,val)
  WHERE i.section_id = v_sec_id
  ON CONFLICT DO NOTHING;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES
    (v_test_id, 'total',    'Nivel de ideación (suma)',        'sum',
      ARRAY['CSSRS_Q1','CSSRS_Q2','CSSRS_Q3','CSSRS_Q4','CSSRS_Q5','CSSRS_Q6'], 1.0),
    (v_test_id, 'ideacion', 'Ideación pasiva',                 'sum',
      ARRAY['CSSRS_Q1','CSSRS_Q2'], 1.0),
    (v_test_id, 'plan',     'Ideación activa con plan',        'sum',
      ARRAY['CSSRS_Q3','CSSRS_Q4'], 1.0),
    (v_test_id, 'conducta', 'Conducta suicida / intento previo','sum',
      ARRAY['CSSRS_Q5','CSSRS_Q6'], 1.0)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_sr_id FROM scoring_rules WHERE test_id = v_test_id AND subscale_name = 'total';

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr_id, 0, 0, 'Sin ideación activa',              'none',     '#22c55e', 'Sin ideación suicida activa reportada.',                      'Sin riesgo aparente. Mantener monitoreo en sesiones periódicas.',                                          FALSE),
    (v_sr_id, 1, 1, 'Deseos pasivos de muerte',          'passive',  '#86efac', 'Deseos pasivos de muerte sin intención activa.',              'Riesgo bajo. Plan de seguridad básico y seguimiento cercano.',                                             FALSE),
    (v_sr_id, 2, 2, 'Ideación suicida sin plan',         'ideation', '#f59e0b', 'Ideación suicida presente sin plan concreto.',               'Riesgo moderado. Plan de seguridad detallado. Aumentar frecuencia de sesiones.',                           FALSE),
    (v_sr_id, 3, 4, 'Ideación con plan o intención',     'plan',     '#f97316', 'Ideación con plan y/o intención de actuar.',                 'Riesgo alto. Coordinación con psiquiatría. Involucrar red de apoyo. Evaluar hospitalización.',             TRUE),
    (v_sr_id, 5, 6, 'Preparación o intento previo',      'attempt',  '#ef4444', 'Preparación activa o intento de suicidio previo.',           'Riesgo muy alto. Acción INMEDIATA. Evaluar hospitalización de urgencia. Activar protocolo de crisis.',      TRUE)
  ON CONFLICT DO NOTHING;

END $$;


-- =============================================================
-- VERIFICACIÓN
-- Todas las secciones deben tener ítems y opciones de respuesta.
-- =============================================================
SELECT
  t.slug,
  t.name,
  COUNT(DISTINCT s.id)   AS secciones,
  COUNT(DISTINCT i.id)   AS items,
  COUNT(DISTINCT ro.id)  AS opciones,
  COUNT(DISTINCT sr.id)  AS scoring_rules,
  COUNT(DISTINCT ir.id)  AS interpretation_ranges
FROM tests t
LEFT JOIN test_sections s  ON s.test_id = t.id
LEFT JOIN items i          ON i.section_id = s.id
LEFT JOIN response_options ro ON ro.item_id = i.id
LEFT JOIN scoring_rules sr ON sr.test_id = t.id
LEFT JOIN interpretation_ranges ir ON ir.scoring_rule_id = sr.id
WHERE t.slug IN ('isi','pss10','spin','dast10','cssrs')
GROUP BY t.slug, t.name
ORDER BY t.slug;
