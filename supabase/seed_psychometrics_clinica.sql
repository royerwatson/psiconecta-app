-- =============================================================
-- PSICONECTA — Seed Psicométrico: Clínica General (Parte 2)
-- BDI-II, BAI, SPIN, CAGE, ISI
-- =============================================================

-- =============================================================
-- 1. BDI-II — Beck Depression Inventory II
-- Beck, Steer & Brown (1996) | Pearson (uso clínico libre en investigación)
-- =============================================================
DO $$
DECLARE
  v_test UUID; v_sect UUID; v_sr UUID;
  items UUID[];
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('bdiii', 'BDI-II — Inventario de Depresión de Beck II',
    'Instrumento de 21 ítems que evalúa la presencia y severidad de síntomas depresivos. Cada ítem presenta 4 afirmaciones ordenadas de menor a mayor severidad (0-3). El ítem 9 evalúa ideación suicida y activa alerta inmediata.',
    'sintomas', 'free_clinical', 2,
    'Beck AT, Steer RA, Brown GK (1996)', 13, 10, '["self"]', 7, 5.0,
    ARRAY['clinica','tcc','pareja'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'BDI-II',
    'Este cuestionario consiste en 21 grupos de afirmaciones. Por favor, lea con cuidado cada uno de ellos y, a continuación, señale cuál de las afirmaciones de cada grupo describe mejor cómo se ha sentido durante las últimas dos semanas, incluido el día de hoy.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold) VALUES
    (v_sect,0,'Tristeza: No me siento triste / Me siento triste gran parte del tiempo / Me siento triste continuamente / Me siento tan triste o soy tan infeliz que no puedo soportarlo','BDI2_Q1','likert','total',NULL),
    (v_sect,1,'Pesimismo: No estoy desanimado sobre mi futuro / Me siento más desanimado sobre mi futuro que antes / No espero que las cosas vayan a mejorar / Siento que mi futuro es desesperado y que las cosas solo empeorarán','BDI2_Q2','likert','total',NULL),
    (v_sect,2,'Fracasos pasados: No me siento como un fracasado / He fracasado más de lo que debería / Cuando miro en retrospectiva veo muchos fracasos / Siento que como persona soy un fracaso total','BDI2_Q3','likert','total',NULL),
    (v_sect,3,'Pérdida de placer: Obtengo tanto placer como siempre en las cosas que disfruto / No disfruto tanto de las cosas como antes / Obtengo muy poco placer de las cosas con las que solía disfrutar / No obtengo ningún placer de las cosas que solía disfrutar','BDI2_Q4','likert','total',NULL),
    (v_sect,4,'Sentimientos de culpa: No me siento particularmente culpable / Me siento culpable de muchas cosas que he hecho o debería haber hecho / Me siento bastante culpable la mayor parte del tiempo / Me siento culpable todo el tiempo','BDI2_Q5','likert','total',NULL),
    (v_sect,5,'Sentimientos de castigo: No siento que esté siendo castigado / Siento que quizás esté siendo castigado / Espero ser castigado / Siento que estoy siendo castigado','BDI2_Q6','likert','total',NULL),
    (v_sect,6,'Disconformidad con uno mismo: Siento lo mismo que antes sobre mí mismo / He perdido confianza en mí mismo / Estoy decepcionado conmigo mismo / No me gusto a mí mismo','BDI2_Q7','likert','total',NULL),
    (v_sect,7,'Autocrítica: No me critico ni me culpo más que antes / Soy más crítico conmigo mismo de lo que solía ser / Critico todos mis defectos / Me culpo de todo lo malo que sucede','BDI2_Q8','likert','total',NULL),
    (v_sect,8,'Pensamientos o deseos de suicidio: No tengo ningún pensamiento de hacerme daño / Tengo pensamientos de hacerme daño pero no los llevaré a cabo / Quisiera suicidarme / Me suicidaría si tuviera la oportunidad','BDI2_Q9','likert','total',1),
    (v_sect,9,'Llanto: No lloro más de lo que solía hacerlo / Lloro más de lo que solía hacerlo / Lloro por cualquier pequeñez / Tengo ganas de llorar pero no puedo','BDI2_Q10','likert','total',NULL),
    (v_sect,10,'Agitación: No estoy más inquieto o agitado que de costumbre / Me siento más inquieto o agitado de costumbre / Estoy tan inquieto o agitado que es difícil quedarme quieto / Estoy tan inquieto o agitado que tengo que seguir moviéndome o haciendo algo','BDI2_Q11','likert','total',NULL),
    (v_sect,11,'Pérdida de interés: No he perdido el interés por otras personas o actividades / Estoy menos interesado en otras personas o actividades / He perdido la mayor parte de mi interés en otras personas o actividades / Es difícil interesarme en algo','BDI2_Q12','likert','total',NULL),
    (v_sect,12,'Indecisión: Tomo mis propias decisiones igual que siempre / Me resulta más difícil tomar decisiones que de costumbre / Tengo mucha más dificultad en tomar decisiones de lo que solía tener / Tengo dificultades para tomar cualquier decisión','BDI2_Q13','likert','total',NULL),
    (v_sect,13,'Inutilidad: No siento que sea inútil / No me siento tan valioso o útil como solía sentirme / Me siento más inútil que otras personas / Me siento completamente inútil','BDI2_Q14','likert','total',NULL),
    (v_sect,14,'Pérdida de energía: Tengo tanta energía como siempre / Tengo menos energía de la que solía tener / No tengo suficiente energía para hacer muchas cosas / No tengo suficiente energía para hacer nada','BDI2_Q15','likert','total',NULL),
    (v_sect,15,'Cambios en el sueño: No he experimentado ningún cambio en mis hábitos de sueño / Duermo algo más de lo habitual / Duermo algo menos de lo habitual / Duermo mucho más de lo habitual / Duermo mucho menos de lo habitual / Duermo la mayor parte del día / Me despierto 1-2 horas antes de lo habitual y no puedo volver a dormirme','BDI2_Q16','likert','total',NULL),
    (v_sect,16,'Irritabilidad: No estoy más irritable que de costumbre / Estoy más irritable de lo habitual / Estoy mucho más irritable de lo habitual / Estoy irritable todo el tiempo','BDI2_Q17','likert','total',NULL),
    (v_sect,17,'Cambios en el apetito: No he experimentado ningún cambio en mi apetito / Mi apetito es algo menor de lo habitual / Mi apetito es algo mayor de lo habitual / Mi apetito es mucho menor de lo habitual / Mi apetito es mucho mayor de lo habitual / No tengo nada de apetito / Quiero comer todo el día','BDI2_Q18','likert','total',NULL),
    (v_sect,18,'Dificultad de concentración: Puedo concentrarme tan bien como siempre / No puedo concentrarme tan bien como habitualmente / Me es difícil concentrarme en algo durante mucho tiempo / Encuentro que no puedo concentrarme en nada','BDI2_Q19','likert','total',NULL),
    (v_sect,19,'Cansancio o fatiga: No estoy más cansado o fatigado que de costumbre / Me canso o me fatigo más fácilmente de lo habitual / Estoy demasiado cansado o fatigado para hacer muchas de las cosas que solía hacer / Estoy demasiado cansado o fatigado para hacer la mayoría de las cosas que solía hacer','BDI2_Q20','likert','total',NULL),
    (v_sect,20,'Pérdida de interés en el sexo: No he notado ningún cambio en mi interés por el sexo / Estoy menos interesado en el sexo de lo que solía estar / Ahora estoy mucho menos interesado en el sexo / He perdido completamente el interés en el sexo','BDI2_Q21','likert','total',NULL);

  -- Response options 0-3 para todos los ítems
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES (0,'0',0),(1,'1',1),(2,'2',2),(3,'3',3)) AS o(ord,lbl,val);

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test, 'total', 'Puntuación Total', 'sum',
    ARRAY['BDI2_Q1','BDI2_Q2','BDI2_Q3','BDI2_Q4','BDI2_Q5','BDI2_Q6','BDI2_Q7',
          'BDI2_Q8','BDI2_Q9','BDI2_Q10','BDI2_Q11','BDI2_Q12','BDI2_Q13','BDI2_Q14',
          'BDI2_Q15','BDI2_Q16','BDI2_Q17','BDI2_Q18','BDI2_Q19','BDI2_Q20','BDI2_Q21'], 1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,13,'Mínimo','minimal','#22c55e','Depresión mínima o ausente.','Monitoreo. Reaplicar si el cuadro clínico cambia.',FALSE),
    (v_sr,14,19,'Leve','mild','#86efac','Depresión leve. Algunos síntomas presentes.','Psicoeducación, activación conductual. Seguimiento en 2 semanas.',FALSE),
    (v_sr,20,28,'Moderado','moderate','#f59e0b','Depresión moderada. Impacto funcional significativo.','Intervención psicoterapéutica activa. Evaluar tratamiento farmacológico.',FALSE),
    (v_sr,29,63,'Severo','severe','#ef4444','Depresión severa. Requiere atención clínica inmediata.','Evaluación psiquiátrica urgente. Protocolo de seguridad si hay ideación suicida.',TRUE);
END $$;


-- =============================================================
-- 2. BAI — Beck Anxiety Inventory
-- Beck & Steer (1993) | Pearson (uso clínico libre en investigación)
-- =============================================================
DO $$
DECLARE v_test UUID; v_sect UUID; v_sr UUID;
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('bai', 'BAI — Inventario de Ansiedad de Beck',
    'Instrumento de 21 ítems que mide la severidad de la ansiedad, con énfasis en los síntomas somáticos. Diseñado para discriminar ansiedad de depresión. Complementa al BDI-II.',
    'sintomas', 'free_clinical', 1,
    'Beck AT, Steer RA (1993)', 17, 7, '["self"]', 14, 4.0,
    ARRAY['clinica','tcc'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'BAI',
    'A continuación se presenta una lista de síntomas comunes de ansiedad. Por favor, lea cuidadosamente cada uno de los ítems. Indique cuánto le ha afectado cada síntoma durante la última semana, incluyendo hoy.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale) VALUES
    (v_sect,0,'Entumecimiento u hormigueo','BAI_Q1','likert','total'),
    (v_sect,1,'Sensación de calor','BAI_Q2','likert','total'),
    (v_sect,2,'Temblor en las piernas','BAI_Q3','likert','total'),
    (v_sect,3,'Incapacidad para relajarse','BAI_Q4','likert','total'),
    (v_sect,4,'Miedo a que ocurra lo peor','BAI_Q5','likert','total'),
    (v_sect,5,'Mareo o aturdimiento','BAI_Q6','likert','total'),
    (v_sect,6,'Palpitaciones o aceleración cardíaca','BAI_Q7','likert','total'),
    (v_sect,7,'Inestabilidad o inseguridad','BAI_Q8','likert','total'),
    (v_sect,8,'Terror','BAI_Q9','likert','total'),
    (v_sect,9,'Nerviosismo','BAI_Q10','likert','total'),
    (v_sect,10,'Sensación de ahogo','BAI_Q11','likert','total'),
    (v_sect,11,'Temblores de manos','BAI_Q12','likert','total'),
    (v_sect,12,'Temblor generalizado o estremecimiento','BAI_Q13','likert','total'),
    (v_sect,13,'Miedo a perder el control','BAI_Q14','likert','total'),
    (v_sect,14,'Dificultad para respirar','BAI_Q15','likert','total'),
    (v_sect,15,'Miedo a morir','BAI_Q16','likert','total'),
    (v_sect,16,'Estar asustado/a','BAI_Q17','likert','total'),
    (v_sect,17,'Indigestión o malestar estomacal','BAI_Q18','likert','total'),
    (v_sect,18,'Debilidad','BAI_Q19','likert','total'),
    (v_sect,19,'Rubor o sofoco','BAI_Q20','likert','total'),
    (v_sect,20,'Sudoración (no relacionada con el calor)','BAI_Q21','likert','total');

  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES
    (0,'En absoluto',0),(1,'Levemente, no me molestó mucho',1),
    (2,'Moderadamente, fue muy desagradable pero podía soportarlo',2),
    (3,'Severamente, casi no podía soportarlo',3)) AS o(ord,lbl,val);

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test,'total','Puntuación Total','sum',
    ARRAY['BAI_Q1','BAI_Q2','BAI_Q3','BAI_Q4','BAI_Q5','BAI_Q6','BAI_Q7',
          'BAI_Q8','BAI_Q9','BAI_Q10','BAI_Q11','BAI_Q12','BAI_Q13','BAI_Q14',
          'BAI_Q15','BAI_Q16','BAI_Q17','BAI_Q18','BAI_Q19','BAI_Q20','BAI_Q21'],1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,7,'Mínimo','minimal','#22c55e','Ansiedad mínima o ausente.','Monitoreo rutinario.',FALSE),
    (v_sr,8,15,'Leve','mild','#86efac','Ansiedad leve.','Técnicas de relajación y psicoeducación.',FALSE),
    (v_sr,16,25,'Moderado','moderate','#f59e0b','Ansiedad moderada. Impacto funcional presente.','Intervención terapéutica activa (TCC, técnicas de exposición).',FALSE),
    (v_sr,26,63,'Severo','severe','#ef4444','Ansiedad severa. Consideración de tratamiento combinado.','Evaluación psiquiátrica. TCC intensiva. Considerar farmacoterapia.',TRUE);
END $$;


-- =============================================================
-- 3. SPIN — Social Phobia Inventory
-- Connor et al. (2000) | Dominio público
-- =============================================================
DO $$
DECLARE v_test UUID; v_sect UUID; v_sr UUID;
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('spin', 'SPIN — Inventario de Fobia Social',
    'Instrumento de 17 ítems que evalúa el miedo, la evitación y el malestar fisiológico asociados a situaciones sociales. Diseñado como herramienta de cribado y seguimiento del trastorno de ansiedad social.',
    'sintomas', 'public_domain', 1,
    'Connor KM et al. (2000)', 13, 7, '["self"]', 14, NULL,
    ARRAY['clinica','tcc'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'SPIN',
    'Por favor, ponga una X en la casilla que mejor refleje hasta qué punto los siguientes problemas le afectaron durante la última semana.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale) VALUES
    (v_sect,0,'Tengo miedo a las personas que tienen autoridad','SPIN_Q1','likert','miedo'),
    (v_sect,1,'Me molesta el ruborizarme delante de la gente','SPIN_Q2','likert','fisiologico'),
    (v_sect,2,'Las fiestas y eventos sociales me dan miedo','SPIN_Q3','likert','evitacion'),
    (v_sect,3,'Evito hablar con personas que no conozco','SPIN_Q4','likert','evitacion'),
    (v_sect,4,'Me da miedo que me critiquen','SPIN_Q5','likert','miedo'),
    (v_sect,5,'El miedo a la vergüenza hace que evite hacer cosas o hablar con personas','SPIN_Q6','likert','evitacion'),
    (v_sect,6,'Sudar delante de otras personas me produce angustia','SPIN_Q7','likert','fisiologico'),
    (v_sect,7,'Evito ir a fiestas','SPIN_Q8','likert','evitacion'),
    (v_sect,8,'Evito actividades en las que soy el centro de atención','SPIN_Q9','likert','evitacion'),
    (v_sect,9,'Hablar con desconocidos me da miedo','SPIN_Q10','likert','miedo'),
    (v_sect,10,'Evito dar discursos','SPIN_Q11','likert','evitacion'),
    (v_sect,11,'Haría cualquier cosa para evitar ser criticado/a','SPIN_Q12','likert','evitacion'),
    (v_sect,12,'Los latidos de mi corazón se aceleran cuando estoy con otras personas','SPIN_Q13','likert','fisiologico'),
    (v_sect,13,'Tengo miedo de hacer cosas cuando hay gente mirando','SPIN_Q14','likert','miedo'),
    (v_sect,14,'El mayor temor es quedar en ridículo delante de los demás','SPIN_Q15','likert','miedo'),
    (v_sect,15,'Evito hablar con cualquier figura de autoridad','SPIN_Q16','likert','evitacion'),
    (v_sect,16,'Temblar o estremecerme delante de otras personas me perturba','SPIN_Q17','likert','fisiologico');

  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES
    (0,'Nada',0),(1,'Un poco',1),(2,'Bastante',2),(3,'Mucho',3),(4,'Muchísimo',4)) AS o(ord,lbl,val);

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test,'total','Puntuación Total','sum',
    ARRAY['SPIN_Q1','SPIN_Q2','SPIN_Q3','SPIN_Q4','SPIN_Q5','SPIN_Q6','SPIN_Q7',
          'SPIN_Q8','SPIN_Q9','SPIN_Q10','SPIN_Q11','SPIN_Q12','SPIN_Q13','SPIN_Q14',
          'SPIN_Q15','SPIN_Q16','SPIN_Q17'],1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,18,'Sin fobia social','minimal','#22c55e','No se detecta fobia social significativa.','Monitoreo.',FALSE),
    (v_sr,19,29,'Leve','mild','#86efac','Fobia social leve. Algunas situaciones sociales generan malestar.','Psicoeducación sobre ansiedad social. TCC con componente de exposición gradual.',FALSE),
    (v_sr,30,39,'Moderado','moderate','#f59e0b','Fobia social moderada. Evitación funcional presente.','TCC con exposición. Habilidades sociales. Considerar grupo terapéutico.',FALSE),
    (v_sr,40,49,'Severo','severe','#f97316','Fobia social severa. Deterioro significativo en funcionamiento social.','Tratamiento intensivo. Evaluar farmacoterapia combinada.',TRUE),
    (v_sr,50,68,'Muy severo','extreme','#ef4444','Fobia social muy severa. Deterioro grave en múltiples áreas.','Evaluación psiquiátrica urgente. Tratamiento multimodal intensivo.',TRUE);
END $$;


-- =============================================================
-- 4. CAGE — Alcohol Screening
-- Ewing (1984) | Dominio público
-- =============================================================
DO $$
DECLARE v_test UUID; v_sect UUID; v_sr UUID;
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('cage', 'CAGE — Cribado de Alcohol',
    'Instrumento de 4 ítems de respuesta sí/no para el cribado rápido de problemas con el alcohol. Alta especificidad para dependencia alcohólica. ≥2 respuestas positivas requieren evaluación más exhaustiva.',
    'sintomas', 'public_domain', 1,
    'Ewing JA (1984)', 16, 3, '["self"]', 180, NULL,
    ARRAY['clinica','tcc'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'CAGE',
    'Por favor responda Sí o No a las siguientes preguntas sobre su consumo de alcohol.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold) VALUES
    (v_sect,0,'¿Ha sentido alguna vez que debería beber menos? (Cut down)','CAGE_Q1','multiple_choice','total',NULL),
    (v_sect,1,'¿Le ha molestado que la gente le critique su forma de beber? (Annoyed)','CAGE_Q2','multiple_choice','total',NULL),
    (v_sect,2,'¿Se ha sentido alguna vez mal o culpable por su forma de beber? (Guilty)','CAGE_Q3','multiple_choice','total',NULL),
    (v_sect,3,'¿Alguna vez ha bebido para aliviar el temblor matutino o para calmar los nervios al despertarse? (Eye-opener)','CAGE_Q4','multiple_choice','total',1);

  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  CROSS JOIN (VALUES (0,'No',0),(1,'Sí',1)) AS o(ord,lbl,val);

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test,'total','Puntuación Total','sum',ARRAY['CAGE_Q1','CAGE_Q2','CAGE_Q3','CAGE_Q4'],1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,1,'Sin riesgo significativo','minimal','#22c55e','Cribado negativo para dependencia alcohólica.','Educación preventiva si se considera necesario.',FALSE),
    (v_sr,2,4,'Cribado positivo','severe','#ef4444','≥2 respuestas positivas: alta probabilidad de dependencia alcohólica. Requiere evaluación diagnóstica completa (AUDIT recomendado).','Aplicar AUDIT para evaluación más detallada. Entrevista motivacional. Considerar derivación a especialista en adicciones.',TRUE);
END $$;


-- =============================================================
-- 5. ISI — Insomnia Severity Index
-- Morin (1993) | Dominio público
-- =============================================================
DO $$
DECLARE v_test UUID; v_sect UUID; v_sr UUID;
BEGIN
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES ('isi', 'ISI — Índice de Severidad del Insomnio',
    'Instrumento de 7 ítems que evalúa la naturaleza, severidad y repercusión del insomnio. Mide la dificultad para dormir, insatisfacción con el sueño, interferencia diurna, y nivel de angustia.',
    'sintomas', 'public_domain', 1,
    'Morin CM (1993)', 18, 5, '["self"]', 14, NULL,
    ARRAY['clinica','tcc'])
  RETURNING id INTO v_test;

  INSERT INTO test_sections (test_id, order_index, title, instructions)
  VALUES (v_test, 0, 'ISI',
    'Para cada pregunta, por favor rodee con un círculo el número que mejor describa su situación durante las últimas 2 semanas.')
  RETURNING id INTO v_sect;

  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale) VALUES
    (v_sect,0,'Dificultad para conciliar el sueño','ISI_Q1','likert','total'),
    (v_sect,1,'Dificultad para mantener el sueño (despertarse durante la noche)','ISI_Q2','likert','total'),
    (v_sect,2,'Despertarse demasiado temprano','ISI_Q3','likert','total'),
    (v_sect,3,'¿Cómo de satisfecho/a está con su sueño actual?','ISI_Q4','likert','total'),
    (v_sect,4,'¿En qué medida considera que su problema de sueño interfiere con su funcionamiento diurno (cansancio, concentración, memoria, humor, rendimiento laboral)?','ISI_Q5','likert','total'),
    (v_sect,5,'¿En qué medida considera que su problema de sueño es perceptible para los demás en cuanto a perjuicio de la calidad de vida?','ISI_Q6','likert','total'),
    (v_sect,6,'¿Cómo de preocupado/a está por su problema de sueño actual?','ISI_Q7','likert','total');

  -- Q1-Q3 y Q5-Q7: Ninguna→Leve→Moderada→Intensa→Muy intensa (0-4)
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  WHERE i.item_code IN ('ISI_Q1','ISI_Q2','ISI_Q3','ISI_Q5','ISI_Q6','ISI_Q7')
  CROSS JOIN (VALUES
    (0,'Ninguna',0),(1,'Leve',1),(2,'Moderada',2),(3,'Intensa',3),(4,'Muy intensa',4)) AS o(ord,lbl,val);

  -- Q4 escala inversa: Muy satisfecho→Muy insatisfecho
  INSERT INTO response_options (item_id, order_index, label, value)
  SELECT i.id, o.ord, o.lbl, o.val
  FROM items i
  JOIN test_sections s ON s.id = i.section_id AND s.test_id = v_test
  WHERE i.item_code = 'ISI_Q4'
  CROSS JOIN (VALUES
    (0,'Muy satisfecho/a',0),(1,'Satisfecho/a',1),(2,'Ni satisfecho/a ni insatisfecho/a',2),
    (3,'Insatisfecho/a',3),(4,'Muy insatisfecho/a',4)) AS o(ord,lbl,val);

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (v_test,'total','Puntuación Total','sum',
    ARRAY['ISI_Q1','ISI_Q2','ISI_Q3','ISI_Q4','ISI_Q5','ISI_Q6','ISI_Q7'],1.0)
  RETURNING id INTO v_sr;

  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  VALUES
    (v_sr,0,7,'Sin insomnio clínicamente significativo','minimal','#22c55e','Sin insomnio clínico.','Higiene del sueño preventiva.',FALSE),
    (v_sr,8,14,'Insomnio subumbral','mild','#86efac','Insomnio por debajo del umbral clínico. Puede requerir atención.','Psicoeducación sobre higiene del sueño. TCC para insomnio (TCC-I) preventiva.',FALSE),
    (v_sr,15,21,'Insomnio moderado','moderate','#f59e0b','Insomnio clínico moderado.','TCC-I estructurada. Evaluar causas subyacentes (ansiedad, depresión).',FALSE),
    (v_sr,22,28,'Insomnio severo','severe','#ef4444','Insomnio clínico severo. Deterioro significativo.','TCC-I intensiva. Evaluación médica para descartar causas orgánicas. Considerar farmacoterapia a corto plazo.',TRUE);
END $$;

-- =============================================================
-- FIN: Clínica General — BDI-II, BAI, SPIN, CAGE, ISI cargados
-- =============================================================
