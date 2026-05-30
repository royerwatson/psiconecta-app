-- =============================================================
-- PSICONECTA — Seed: Instrumentos de Personalidad
-- NEO-FFI, PID-5 Brief, MSI-BPD, PDQ-4
-- =============================================================

-- =============================================================
-- 1. NEO-FFI — NEO Five-Factor Inventory (Big Five)
-- Costa & McCrae (1992) | Versión abreviada 60 ítems
-- 12 ítems por factor × 5 factores, escala 0-4
-- Nota: versión de dominio educativo/investigación
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'neo-ffi',
    'NEO-FFI — Inventario de los Cinco Grandes Factores de Personalidad',
    'Instrumento de 60 ítems que mide los cinco grandes factores de personalidad: Neuroticismo, Extraversión, Apertura a la Experiencia, Amabilidad y Responsabilidad. Fundamental para conceptualización de caso y planificación terapéutica.',
    'personalidad', 'restricted', 1,
    'Costa PT & McCrae RR (1992)',
    17, 15, '["self"]'::jsonb,
    180, 5.0, ARRAY['clinica','tcc','personalidad','pareja']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'NEO-FFI',
    'A continuación encontrarás una serie de afirmaciones. Indica tu grado de acuerdo o desacuerdo con cada una usando la escala de 0 (Totalmente en desacuerdo) a 4 (Totalmente de acuerdo). No hay respuestas correctas ni incorrectas.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    -- Neuroticismo (N)
    ((SELECT id FROM s), 0,  'Con frecuencia me siento tenso/a y nervioso/a',                                  'NEO_Q1',  'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 1,  'A veces me siento completamente inútil',                                         'NEO_Q2',  'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 2,  'Rara vez me siento solo/a o triste',                                             'NEO_Q3',  'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 3,  'Me preocupo demasiado',                                                          'NEO_Q4',  'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 4,  'Con frecuencia me siento inferior a los demás',                                  'NEO_Q5',  'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 5,  'Cuando estoy bajo una gran tensión, a veces siento que me voy a derrumbar',     'NEO_Q6',  'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 6,  'Rara vez tengo miedo o ansiedad',                                                'NEO_Q7',  'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 7,  'Con frecuencia me enfado con la forma en que la gente me trata',                 'NEO_Q8',  'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 8,  'Demasiadas veces, cuando las cosas van mal, me desanimo y quiero abandonarlas', 'NEO_Q9',  'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 9,  'Con frecuencia experimento emociones fuertes como ira o enojo',                  'NEO_Q10', 'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 10, 'A veces tengo pensamientos vergonzosos o de culpa',                              'NEO_Q11', 'likert', 'neuroticismo',   NULL),
    ((SELECT id FROM s), 11, 'La forma en que tomo decisiones me resulta difícil resistir las tentaciones',   'NEO_Q12', 'likert', 'neuroticismo',   NULL),
    -- Extraversión (E)
    ((SELECT id FROM s), 12, 'Me gusta tener mucha gente a mi alrededor',                                     'NEO_Q13', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 13, 'Soy una persona alegre y animada',                                              'NEO_Q14', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 14, 'No me considero especialmente alegre',                                          'NEO_Q15', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 15, 'Prefiero hacer las cosas solo que con otras personas',                          'NEO_Q16', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 16, 'Tengo una personalidad dominante y asertiva',                                   'NEO_Q17', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 17, 'Estoy lleno/a de energía',                                                      'NEO_Q18', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 18, 'Prefiero las tareas simples y rutinarias',                                      'NEO_Q19', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 19, 'Me resulta fácil sonreír y ser espontáneo/a con desconocidos',                 'NEO_Q20', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 20, 'Generalmente necesito volver a leer las instrucciones',                         'NEO_Q21', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 21, 'Suelo tomarme las cosas con calma',                                             'NEO_Q22', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 22, 'Me siento a gusto cuando me reúno con gente',                                  'NEO_Q23', 'likert', 'extraversion',   NULL),
    ((SELECT id FROM s), 23, 'Me resulta fácil sonreír, ser espontáneo/a, divertido/a',                      'NEO_Q24', 'likert', 'extraversion',   NULL),
    -- Apertura (O)
    ((SELECT id FROM s), 24, 'Tengo mucha curiosidad intelectual',                                            'NEO_Q25', 'likert', 'apertura',       NULL),
    ((SELECT id FROM s), 25, 'Me encanta la música clásica',                                                  'NEO_Q26', 'likert', 'apertura',       NULL),
    ((SELECT id FROM s), 26, 'La poesía tiene poco o ningún efecto en mí',                                   'NEO_Q27', 'likert', 'apertura',       NULL),
    ((SELECT id FROM s), 27, 'Cuando niño/a me gustaba jugar al aire libre',                                  'NEO_Q28', 'likert', 'apertura',       NULL),
    ((SELECT id FROM s), 28, 'Me atraen los problemas filosóficos o políticos',                               'NEO_Q29', 'likert', 'apertura',       NULL),
    ((SELECT id FROM s), 29, 'Tengo una imaginación muy activa',                                              'NEO_Q30', 'likert', 'apertura',       NULL),
    ((SELECT id FROM s), 30, 'Me resulta interesante aprender y desarrollar nuevas aficiones',                'NEO_Q31', 'likert', 'apertura',       NULL),
    ((SELECT id FROM s), 31, 'A veces cuando leo poesía o contemplo una obra de arte, siento una profunda emoción', 'NEO_Q32', 'likert', 'apertura', NULL),
    ((SELECT id FROM s), 32, 'Muchas veces tiendo a explorar el mundo de nuevas formas',                     'NEO_Q33', 'likert', 'apertura',       NULL),
    ((SELECT id FROM s), 33, 'Experimento una gran variedad de emociones y sentimientos',                    'NEO_Q34', 'likert', 'apertura',       NULL),
    ((SELECT id FROM s), 34, 'Me resulta difícil comprender a las personas que tienen diferentes puntos de vista', 'NEO_Q35', 'likert', 'apertura', NULL),
    ((SELECT id FROM s), 35, 'A veces pierdo el interés cuando la gente habla de cuestiones abstractas',     'NEO_Q36', 'likert', 'apertura',       NULL),
    -- Amabilidad (A)
    ((SELECT id FROM s), 36, 'Trato de ser amable con todos los que conozco',                                 'NEO_Q37', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 37, 'Me consideran una persona fría y calculadora',                                  'NEO_Q38', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 38, 'Trato de ser cortés con todos',                                                 'NEO_Q39', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 39, 'Algunas personas piensan que soy egoísta y egocéntrico/a',                    'NEO_Q40', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 40, 'Prefiero cooperar con los demás que competir con ellos',                       'NEO_Q41', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 41, 'Si es necesario, puedo manipular a la gente para conseguir lo que quiero',     'NEO_Q42', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 42, 'Tengo una opinión elevada de mí mismo/a',                                      'NEO_Q43', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 43, 'Creo que la mayoría de las personas son básicamente bien intencionadas',       'NEO_Q44', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 44, 'No tengo inconveniente en ayudar a que un vecino se sienta bien',              'NEO_Q45', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 45, 'La mayoría de las personas con las que me relaciono son simpáticas',           'NEO_Q46', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 46, 'Algunos piensan que soy distante y reservado/a',                               'NEO_Q47', 'likert', 'amabilidad',     NULL),
    ((SELECT id FROM s), 47, 'Cuando alguien hace algo bueno por mí, me siento obligado/a a corresponder',  'NEO_Q48', 'likert', 'amabilidad',     NULL),
    -- Responsabilidad / Conciencia (C)
    ((SELECT id FROM s), 48, 'Mantengo mis pertenencias limpias y ordenadas',                                 'NEO_Q49', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 49, 'Soy una persona laboriosa que siempre termina su trabajo',                     'NEO_Q50', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 50, 'No soy tan eficiente como debería ser',                                        'NEO_Q51', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 51, 'Cuando me comprometo a hacer algo, siempre cumplo lo acordado',                'NEO_Q52', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 52, 'A veces no soy tan fiable como debería ser',                                   'NEO_Q53', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 53, 'Me esfuerzo por ser excelente en todo lo que hago',                            'NEO_Q54', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 54, 'Soy bastante capaz de organizarme para terminar las cosas a tiempo',           'NEO_Q55', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 55, 'Tengo dificultades para ordenar las cosas según prioridades',                  'NEO_Q56', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 56, 'Trabajo duro para conseguir mis objetivos',                                    'NEO_Q57', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 57, 'Cuando empiezo un proyecto, casi siempre lo termino',                          'NEO_Q58', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 58, 'Me resulta difícil empezar a hacer algo nuevo',                                'NEO_Q59', 'likert', 'responsabilidad',NULL),
    ((SELECT id FROM s), 59, 'Soy perseverante y esforzado/a en mi trabajo',                                 'NEO_Q60', 'likert', 'responsabilidad',NULL)
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
  (4, 'Totalmente de acuerdo',    4)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_n UUID; sr_e UUID; sr_o UUID; sr_a UUID; sr_c UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'neo-ffi';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'neuroticismo', 'Neuroticismo', 'sum',
    ARRAY['NEO_Q1','NEO_Q2','NEO_Q3','NEO_Q4','NEO_Q5','NEO_Q6','NEO_Q7','NEO_Q8','NEO_Q9','NEO_Q10','NEO_Q11','NEO_Q12'], 1.0)
  RETURNING id INTO sr_n;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'extraversion', 'Extraversión', 'sum',
    ARRAY['NEO_Q13','NEO_Q14','NEO_Q15','NEO_Q16','NEO_Q17','NEO_Q18','NEO_Q19','NEO_Q20','NEO_Q21','NEO_Q22','NEO_Q23','NEO_Q24'], 1.0)
  RETURNING id INTO sr_e;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'apertura', 'Apertura a la Experiencia', 'sum',
    ARRAY['NEO_Q25','NEO_Q26','NEO_Q27','NEO_Q28','NEO_Q29','NEO_Q30','NEO_Q31','NEO_Q32','NEO_Q33','NEO_Q34','NEO_Q35','NEO_Q36'], 1.0)
  RETURNING id INTO sr_o;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'amabilidad', 'Amabilidad', 'sum',
    ARRAY['NEO_Q37','NEO_Q38','NEO_Q39','NEO_Q40','NEO_Q41','NEO_Q42','NEO_Q43','NEO_Q44','NEO_Q45','NEO_Q46','NEO_Q47','NEO_Q48'], 1.0)
  RETURNING id INTO sr_a;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'responsabilidad', 'Responsabilidad', 'sum',
    ARRAY['NEO_Q49','NEO_Q50','NEO_Q51','NEO_Q52','NEO_Q53','NEO_Q54','NEO_Q55','NEO_Q56','NEO_Q57','NEO_Q58','NEO_Q59','NEO_Q60'], 1.0)
  RETURNING id INTO sr_c;

  -- Rangos T (puntuaciones directas 0-48 por factor)
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_n, 0,  16, 'Bajo',     'low_risk',  '#22c55e', 'Estabilidad emocional alta. Bajo neuroticismo.',              'Consolidar estrategias de afrontamiento actuales.', FALSE),
    (sr_n, 17, 32, 'Moderado', 'moderate',  '#f59e0b', 'Neuroticismo moderado. Cierta vulnerabilidad emocional.',     'Explorar desencadenantes de malestar emocional.', FALSE),
    (sr_n, 33, 48, 'Alto',     'severe',    '#ef4444', 'Alto neuroticismo. Tendencia a experimentar emociones negativas.', 'Trabajo en regulación emocional y tolerancia al malestar.', TRUE),
    (sr_e, 0,  16, 'Bajo',     'low_risk',  '#94a3b8', 'Introversión notable. Preferencia por actividades solitarias.',  'Respetar estilo. Explorar necesidades de conexión social.', FALSE),
    (sr_e, 17, 32, 'Moderado', 'moderate',  '#86efac', 'Ambiversión. Balance entre lo social y lo solitario.',          'Sin intervención específica requerida.', FALSE),
    (sr_e, 33, 48, 'Alto',     'normal',    '#22c55e', 'Alta extraversión. Orientado/a a lo social y estimulación.',    'Sin intervención específica requerida.', FALSE),
    (sr_o, 0,  16, 'Bajo',     'low_risk',  '#94a3b8', 'Baja apertura. Preferencias convencionales y pragmáticas.',     'Considerar al planificar estrategias terapéuticas.', FALSE),
    (sr_o, 17, 32, 'Moderado', 'moderate',  '#86efac', 'Apertura moderada a experiencias nuevas.',                      'Sin intervención específica requerida.', FALSE),
    (sr_o, 33, 48, 'Alto',     'normal',    '#22c55e', 'Alta apertura. Creatividad y curiosidad intelectual.',           'Sin intervención específica requerida.', FALSE),
    (sr_a, 0,  16, 'Bajo',     'low_risk',  '#f97316', 'Baja amabilidad. Tendencia competitiva o escéptica.',            'Explorar modelos vinculares y patrones interpersonales.', FALSE),
    (sr_a, 17, 32, 'Moderado', 'moderate',  '#86efac', 'Amabilidad moderada. Cooperación situacional.',                 'Sin intervención específica requerida.', FALSE),
    (sr_a, 33, 48, 'Alto',     'normal',    '#22c55e', 'Alta amabilidad. Cooperativo/a y empático/a.',                  'Sin intervención específica requerida.', FALSE),
    (sr_c, 0,  16, 'Bajo',     'low_risk',  '#f97316', 'Baja responsabilidad. Dificultades de organización y compromiso.','Trabajar estructura y habilidades de planificación.', FALSE),
    (sr_c, 17, 32, 'Moderado', 'moderate',  '#86efac', 'Responsabilidad moderada.',                                     'Sin intervención específica requerida.', FALSE),
    (sr_c, 33, 48, 'Alto',     'normal',    '#22c55e', 'Alta responsabilidad. Organizado/a y orientado/a a metas.',     'Sin intervención específica requerida.', FALSE);
END $$;


-- =============================================================
-- 2. PID-5 Brief — Personality Inventory for DSM-5 (Forma Breve)
-- Krueger et al. (2013) | Dominio público (APA)
-- 25 ítems, 0-3, 5 dominios DSM-5 Sección III
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'pid5-brief',
    'PID-5 Breve — Inventario de Personalidad para DSM-5 (Forma Breve)',
    'Versión breve del PID-5 de 25 ítems. Evalúa los 5 dominios de personalidad patológica del DSM-5 Sección III: afecto negativo, desapego, antagonismo, desinhibición y psicoticismo. Punto de corte sugerido ≥ 2.0 por dominio.',
    'personalidad', 'public_domain', 1,
    'Krueger RF, Derringer J, Markon KE, Watson D, Skodol AE (2013)',
    18, 8, '["self"]'::jsonb,
    30, 0.5, ARRAY['clinica','personalidad']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'PID-5 Breve',
    'A continuación hay algunas afirmaciones que podrían o no aplicarse a ti. Indica el grado en que cada afirmación te describe a ti en general.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  'Las emociones fuertes me superan fácilmente',                                  'PID5_Q1',  'likert', 'afecto_negativo',  NULL),
    ((SELECT id FROM s), 1,  'Rara vez siento emociones fuertes',                                            'PID5_Q2',  'likert', 'desapego',         NULL),
    ((SELECT id FROM s), 2,  'No me importa si hago daño a otras personas para conseguir lo que quiero',    'PID5_Q3',  'likert', 'antagonismo',      NULL),
    ((SELECT id FROM s), 3,  'Actúo impulsivamente sin pensar en las consecuencias',                         'PID5_Q4',  'likert', 'desinhibicion',    NULL),
    ((SELECT id FROM s), 4,  'Creo que hay personas que pueden controlar mi mente',                          'PID5_Q5',  'likert', 'psicoticismo',     NULL),
    ((SELECT id FROM s), 5,  'Me preocupo mucho',                                                            'PID5_Q6',  'likert', 'afecto_negativo',  NULL),
    ((SELECT id FROM s), 6,  'Raramente disfruto de las cosas',                                              'PID5_Q7',  'likert', 'desapego',         NULL),
    ((SELECT id FROM s), 7,  'Uso a las personas en mi propio beneficio',                                    'PID5_Q8',  'likert', 'antagonismo',      NULL),
    ((SELECT id FROM s), 8,  'Me resulta difícil resistir tentaciones o impulsos',                           'PID5_Q9',  'likert', 'desinhibicion',    NULL),
    ((SELECT id FROM s), 9,  'Tengo experiencias de percibir cosas que otros no perciben',                   'PID5_Q10', 'likert', 'psicoticismo',     NULL),
    ((SELECT id FROM s), 10, 'Me siento mal conmigo mismo/a con mucha facilidad',                            'PID5_Q11', 'likert', 'afecto_negativo',  NULL),
    ((SELECT id FROM s), 11, 'No me interesa mucho hacer amigos',                                            'PID5_Q12', 'likert', 'desapego',         NULL),
    ((SELECT id FROM s), 12, 'Me resulta satisfactorio humillar a los demás',                                'PID5_Q13', 'likert', 'antagonismo',      NULL),
    ((SELECT id FROM s), 13, 'Mis planes cambian constantemente porque pierdo el interés en ellos',          'PID5_Q14', 'likert', 'desinhibicion',    NULL),
    ((SELECT id FROM s), 14, 'Tengo pensamientos o ideas raras que los demás no comparten',                  'PID5_Q15', 'likert', 'psicoticismo',     NULL),
    ((SELECT id FROM s), 15, 'Me siento ansioso/a con mucha frecuencia',                                    'PID5_Q16', 'likert', 'afecto_negativo',  NULL),
    ((SELECT id FROM s), 16, 'Prefiero estar solo/a que con otras personas',                                 'PID5_Q17', 'likert', 'desapego',         NULL),
    ((SELECT id FROM s), 17, 'Tiendo a querer venganza cuando alguien me ofende',                           'PID5_Q18', 'likert', 'antagonismo',      NULL),
    ((SELECT id FROM s), 18, 'Me resulta difícil mantener un trabajo porque me aburro fácilmente',          'PID5_Q19', 'likert', 'desinhibicion',    NULL),
    ((SELECT id FROM s), 19, 'Me pregunto si las cosas que veo o escucho son reales',                       'PID5_Q20', 'likert', 'psicoticismo',     NULL),
    ((SELECT id FROM s), 20, 'Mis cambios de humor son tan intensos que a veces siento que no los controlo','PID5_Q21', 'likert', 'afecto_negativo',  NULL),
    ((SELECT id FROM s), 21, 'No valoro mucho las relaciones estrechas con los demás',                      'PID5_Q22', 'likert', 'desapego',         NULL),
    ((SELECT id FROM s), 22, 'Me siento especial y por encima de los demás',                                'PID5_Q23', 'likert', 'antagonismo',      NULL),
    ((SELECT id FROM s), 23, 'Frecuentemente hago cosas sin pensar en los riesgos que implican',            'PID5_Q24', 'likert', 'desinhibicion',    NULL),
    ((SELECT id FROM s), 24, 'A veces siento que alguien o algo externo controla mis pensamientos',         'PID5_Q25', 'likert', 'psicoticismo',     NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Muy falso o a menudo falso',   0),
  (1, 'A veces o algo falso',         1),
  (2, 'A veces o algo verdadero',     2),
  (3, 'Muy verdadero o a menudo verdadero', 3)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_an UUID; sr_des UUID; sr_anta UUID; sr_desi UUID; sr_psi UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'pid5-brief';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'afecto_negativo', 'Afecto Negativo', 'average', ARRAY['PID5_Q1','PID5_Q6','PID5_Q11','PID5_Q16','PID5_Q21'], 1.0)
  RETURNING id INTO sr_an;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'desapego', 'Desapego', 'average', ARRAY['PID5_Q2','PID5_Q7','PID5_Q12','PID5_Q17','PID5_Q22'], 1.0)
  RETURNING id INTO sr_des;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'antagonismo', 'Antagonismo', 'average', ARRAY['PID5_Q3','PID5_Q8','PID5_Q13','PID5_Q18','PID5_Q23'], 1.0)
  RETURNING id INTO sr_anta;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'desinhibicion', 'Desinhibición', 'average', ARRAY['PID5_Q4','PID5_Q9','PID5_Q14','PID5_Q19','PID5_Q24'], 1.0)
  RETURNING id INTO sr_desi;

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'psicoticismo', 'Psicoticismo', 'average', ARRAY['PID5_Q5','PID5_Q10','PID5_Q15','PID5_Q20','PID5_Q25'], 1.0)
  RETURNING id INTO sr_psi;

  -- Promedio por dominio 0-3; punto de corte clínico ≥ 2
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level) VALUES
    (sr_an,   0, 1, 'Subclinical', 'subclinical', '#22c55e', 'Afecto negativo dentro de rango normal.',            'Monitoreo.', FALSE),
    (sr_an,   2, 3, 'Elevado',     'severe',      '#ef4444', 'Afecto negativo elevado. Posible TP clúster C.',     'Evaluar trastorno de personalidad con marcador AN. DBT o TCC.', TRUE),
    (sr_des,  0, 1, 'Subclinical', 'subclinical', '#22c55e', 'Desapego dentro de rango normal.',                   'Monitoreo.', FALSE),
    (sr_des,  2, 3, 'Elevado',     'severe',      '#ef4444', 'Desapego elevado. Posible TP esquizoide/esquizotípico.','Evaluación diagnóstica diferencial.', TRUE),
    (sr_anta, 0, 1, 'Subclinical', 'subclinical', '#22c55e', 'Antagonismo dentro de rango normal.',                'Monitoreo.', FALSE),
    (sr_anta, 2, 3, 'Elevado',     'severe',      '#ef4444', 'Antagonismo elevado. Posible TP narcisista/antisocial.','Evaluación diagnóstica diferencial. Manejo de la alianza.', TRUE),
    (sr_desi, 0, 1, 'Subclinical', 'subclinical', '#22c55e', 'Desinhibición dentro de rango normal.',              'Monitoreo.', FALSE),
    (sr_desi, 2, 3, 'Elevado',     'severe',      '#ef4444', 'Desinhibición elevada. Posible TP limite/antisocial.','Intervención en impulsividad. Protocolo de seguridad.', TRUE),
    (sr_psi,  0, 1, 'Subclinical', 'subclinical', '#22c55e', 'Psicoticismo dentro de rango normal.',               'Monitoreo.', FALSE),
    (sr_psi,  2, 3, 'Elevado',     'severe',      '#ef4444', 'Psicoticismo elevado. Evaluar TP esquizotípico o espectro psicótico.','Derivación a psiquiatría para evaluación diferencial.', TRUE);
END $$;


-- =============================================================
-- 3. MSI-BPD — McLean Screening Instrument for BPD
-- Zanarini et al. (2003) | Dominio público
-- 10 ítems dicotómicos (Sí/No), punto de corte ≥ 7
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'msi-bpd',
    'MSI-BPD — Instrumento de Cribado McLean para TLP',
    'Instrumento de cribado de 10 ítems para el Trastorno Límite de Personalidad. Respuesta dicotómica (Sí/No). Punto de corte ≥ 7 con alta sensibilidad y especificidad. NO es instrumento diagnóstico, requiere evaluación clínica.',
    'personalidad', 'public_domain', 1,
    'Zanarini MC, Vujanovic AA, Parachini EA et al. (2003)',
    18, 3, '["self"]'::jsonb,
    30, 2.0, ARRAY['clinica','personalidad']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'MSI-BPD',
    'Por favor responde SÍ o NO a cada una de las siguientes preguntas sobre cómo generalmente piensas, sientes y te comportas.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    ((SELECT id FROM s), 0,  '¿Alguna de tus relaciones ha sido tan inestable que en un momento amabas a esa persona y en otro momento la odiabas?', 'MSI_Q1',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 1,  '¿Con frecuencia haces cosas impulsivas que más tarde lamentas?',                                                         'MSI_Q2',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 2,  '¿Con frecuencia tus emociones cambian rápidamente?',                                                                     'MSI_Q3',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 3,  '¿Con frecuencia te sientes enojado/a sin saber por qué o sientes que tu enojo es fuera de control?',                    'MSI_Q4',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 4,  '¿Con frecuencia te sientes vacío/a?',                                                                                   'MSI_Q5',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 5,  '¿Alguna vez te has lastimado intencionalmente (p. ej., cortarte, quemarte) o has intentado suicidarte?',                'MSI_Q6',  'multiple_choice', 'total', 1),
    ((SELECT id FROM s), 6,  '¿Con frecuencia sientes que no sabes quién eres o que no tienes identidad?',                                            'MSI_Q7',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 7,  '¿Con frecuencia haces grandes esfuerzos para evitar que la gente te abandone?',                                         'MSI_Q8',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 8,  '¿Has tenido experiencias de sentirte desconectado/a de tu mente o cuerpo, o como si las cosas no fueran reales?',       'MSI_Q9',  'multiple_choice', 'total', NULL),
    ((SELECT id FROM s), 9,  '¿Con frecuencia te sientes sospechoso/a de los demás sin razón?',                                                       'MSI_Q10', 'multiple_choice', 'total', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'No', 0),
  (1, 'Sí', 1)
) AS o(order_index, label, value);

WITH sr AS (
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  SELECT t.id, 'total', 'Cribado TLP', 'sum',
    ARRAY['MSI_Q1','MSI_Q2','MSI_Q3','MSI_Q4','MSI_Q5','MSI_Q6','MSI_Q7','MSI_Q8','MSI_Q9','MSI_Q10'],
    1.0
  FROM tests t WHERE t.slug = 'msi-bpd'
  RETURNING id
)
INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
VALUES
  ((SELECT id FROM sr), 0,  6, 'Negativo',  'low_risk',  '#22c55e', 'Cribado negativo para TLP. No alcanza el umbral diagnóstico.',              'Sin acción específica. Evaluar otros cuadros si hay clínica.', FALSE),
  ((SELECT id FROM sr), 7,  9, 'Positivo',  'severe',    '#f97316', 'Cribado positivo (≥7). Alta probabilidad de TLP. Se requiere evaluación diagnóstica formal.', 'Entrevista diagnóstica estructurada (DIPD, DIB-R). Considerar DBT.', TRUE),
  ((SELECT id FROM sr), 10, 10,'Positivo+', 'extreme',   '#ef4444', 'Cribado muy positivo. Criterios ampliamente presentes.',                     'Derivación prioritaria a especialista en TP. Protocolo de seguridad urgente.', TRUE);


-- =============================================================
-- 4. PDQ-4 — Personality Diagnostic Questionnaire-4
-- Hyler (1994) | Dominio público
-- 99 ítems Sí/No, cribado de los 10 TP del DSM-IV/5
-- Versión abreviada PDQ-4+ con ítems representativos
-- Nota: usamos 40 ítems clave para las 10 categorías (4 por TP)
-- =============================================================

WITH t AS (
  INSERT INTO tests (slug, name, description, category, license_type, version,
    author, min_age_self_report, estimated_minutes, respondent_versions,
    min_reapplication_days, rci_threshold, branches)
  VALUES (
    'pdq4',
    'PDQ-4 — Cuestionario de Diagnóstico de Personalidad (Forma Breve)',
    'Versión abreviada del PDQ-4 con 40 ítems representativos de los 10 trastornos de personalidad del DSM. Cribado dimensional: mayor puntuación en cada escala sugiere mayor número de criterios presentes. No es diagnóstico por sí solo.',
    'personalidad', 'public_domain', 1,
    'Hyler SE (1994) — Versión abreviada para uso clínico',
    18, 12, '["self"]'::jsonb,
    60, 1.0, ARRAY['clinica','personalidad']
  ) RETURNING id
),
s AS (
  INSERT INTO test_sections (test_id, order_index, title, instructions)
  SELECT t.id, 0, 'PDQ-4',
    'A continuación hay una serie de afirmaciones sobre cómo piensas, sientes y te comportas en general. Responde VERDADERO si la afirmación es verdadera para ti la mayor parte del tiempo, o FALSO si no lo es.'
  FROM t RETURNING id, test_id
),
i AS (
  INSERT INTO items (section_id, order_index, text, item_code, item_type, subscale, alert_threshold)
  VALUES
    -- Paranoide (PAR)
    ((SELECT id FROM s), 0,  'Desconfío de la mayoría de las personas, incluso si no tengo razón para hacerlo', 'PDQ_Q1', 'multiple_choice', 'paranoide', NULL),
    ((SELECT id FROM s), 1,  'La gente intenta engañarme o utilizarme',                                          'PDQ_Q2', 'multiple_choice', 'paranoide', NULL),
    ((SELECT id FROM s), 2,  'Cuando alguien me halaga, pienso que tiene algún motivo oculto',                   'PDQ_Q3', 'multiple_choice', 'paranoide', NULL),
    ((SELECT id FROM s), 3,  'No perdono fácilmente las ofensas de los demás',                                   'PDQ_Q4', 'multiple_choice', 'paranoide', NULL),
    -- Esquizoide (ESQ)
    ((SELECT id FROM s), 4,  'Prefiero hacer las cosas solo/a que con otras personas',                           'PDQ_Q5', 'multiple_choice', 'esquizoide', NULL),
    ((SELECT id FROM s), 5,  'Me importa poco tener amigos íntimos',                                             'PDQ_Q6', 'multiple_choice', 'esquizoide', NULL),
    ((SELECT id FROM s), 6,  'Las relaciones sexuales no me interesan especialmente',                            'PDQ_Q7', 'multiple_choice', 'esquizoide', NULL),
    ((SELECT id FROM s), 7,  'Pocas cosas de la vida me dan placer',                                             'PDQ_Q8', 'multiple_choice', 'esquizoide', NULL),
    -- Esquizotípico (ESQT)
    ((SELECT id FROM s), 8,  'Tengo poderes especiales para predecir lo que va a ocurrir',                       'PDQ_Q9',  'multiple_choice', 'esquizotipico', NULL),
    ((SELECT id FROM s), 9,  'A veces siento que hay mensajes dirigidos a mí en la televisión o en la radio',   'PDQ_Q10', 'multiple_choice', 'esquizotipico', NULL),
    ((SELECT id FROM s), 10, 'La gente me dice que hablo de forma extraña o que no se me entiende bien',        'PDQ_Q11', 'multiple_choice', 'esquizotipico', NULL),
    ((SELECT id FROM s), 11, 'Me siento incómodo/a y nervioso/a con otras personas',                             'PDQ_Q12', 'multiple_choice', 'esquizotipico', NULL),
    -- Antisocial (ANT)
    ((SELECT id FROM s), 12, 'Me meto en peleas con más frecuencia que la mayoría de las personas',              'PDQ_Q13', 'multiple_choice', 'antisocial', NULL),
    ((SELECT id FROM s), 13, 'Hago lo que quiero sin importarme si es ilegal',                                   'PDQ_Q14', 'multiple_choice', 'antisocial', NULL),
    ((SELECT id FROM s), 14, 'Miento sin problema para conseguir lo que quiero',                                 'PDQ_Q15', 'multiple_choice', 'antisocial', NULL),
    ((SELECT id FROM s), 15, 'Raramente me siento culpable por las cosas que hago',                              'PDQ_Q16', 'multiple_choice', 'antisocial', NULL),
    -- Límite (LIM)
    ((SELECT id FROM s), 16, 'He intentado hacerme daño o quitarme la vida',                                    'PDQ_Q17', 'multiple_choice', 'limite', 1),
    ((SELECT id FROM s), 17, 'Mis relaciones son muy intensas pero inestables',                                  'PDQ_Q18', 'multiple_choice', 'limite', NULL),
    ((SELECT id FROM s), 18, 'Cuando estoy solo/a me siento muy mal emocionalmente',                             'PDQ_Q19', 'multiple_choice', 'limite', NULL),
    ((SELECT id FROM s), 19, 'Mis emociones cambian muy rápidamente',                                            'PDQ_Q20', 'multiple_choice', 'limite', NULL),
    -- Histriónico (HIS)
    ((SELECT id FROM s), 20, 'Me gusta ser el centro de atención',                                               'PDQ_Q21', 'multiple_choice', 'histrionico', NULL),
    ((SELECT id FROM s), 21, 'Uso mi apariencia física para llamar la atención de los demás',                   'PDQ_Q22', 'multiple_choice', 'histrionico', NULL),
    ((SELECT id FROM s), 22, 'Mi vida emocional es muy dramática e intensa',                                    'PDQ_Q23', 'multiple_choice', 'histrionico', NULL),
    ((SELECT id FROM s), 23, 'Me molesta no ser el centro de las conversaciones',                                'PDQ_Q24', 'multiple_choice', 'histrionico', NULL),
    -- Narcisista (NAR)
    ((SELECT id FROM s), 24, 'Merezco más respeto del que la gente me da',                                       'PDQ_Q25', 'multiple_choice', 'narcisista', NULL),
    ((SELECT id FROM s), 25, 'Soy una persona especial y los demás deberían reconocerlo',                        'PDQ_Q26', 'multiple_choice', 'narcisista', NULL),
    ((SELECT id FROM s), 26, 'Me molesta que la gente no aprecie mis logros',                                    'PDQ_Q27', 'multiple_choice', 'narcisista', NULL),
    ((SELECT id FROM s), 27, 'Tengo derecho a esperar que los demás me hagan favores especiales',               'PDQ_Q28', 'multiple_choice', 'narcisista', NULL),
    -- Evitativo (EVI)
    ((SELECT id FROM s), 28, 'Evito el trabajo o actividades sociales porque temo ser criticado/a',             'PDQ_Q29', 'multiple_choice', 'evitativo', NULL),
    ((SELECT id FROM s), 29, 'Me preocupa mucho no gustar a los demás',                                         'PDQ_Q30', 'multiple_choice', 'evitativo', NULL),
    ((SELECT id FROM s), 30, 'Me contengo en situaciones nuevas porque temo pasar vergüenza',                   'PDQ_Q31', 'multiple_choice', 'evitativo', NULL),
    ((SELECT id FROM s), 31, 'Pienso que soy inferior a los demás',                                              'PDQ_Q32', 'multiple_choice', 'evitativo', NULL),
    -- Dependiente (DEP)
    ((SELECT id FROM s), 32, 'Me resulta difícil tomar decisiones sin el consejo de los demás',                 'PDQ_Q33', 'multiple_choice', 'dependiente', NULL),
    ((SELECT id FROM s), 33, 'Necesito que los demás me digan qué hacer',                                        'PDQ_Q34', 'multiple_choice', 'dependiente', NULL),
    ((SELECT id FROM s), 34, 'Me resulta difícil discrepar con los demás por miedo a perderlos',                'PDQ_Q35', 'multiple_choice', 'dependiente', NULL),
    ((SELECT id FROM s), 35, 'Me siento incapaz de cuidar de mí mismo/a solo/a',                                'PDQ_Q36', 'multiple_choice', 'dependiente', NULL),
    -- Obsesivo-Compulsivo (OCP)
    ((SELECT id FROM s), 36, 'Me cuesta delegar tareas a los demás porque no las harán bien',                   'PDQ_Q37', 'multiple_choice', 'obsesivo_compulsivo', NULL),
    ((SELECT id FROM s), 37, 'Soy muy perfeccionista: las cosas tienen que estar hechas exactamente como digo', 'PDQ_Q38', 'multiple_choice', 'obsesivo_compulsivo', NULL),
    ((SELECT id FROM s), 38, 'El trabajo me importa tanto que apenas tengo tiempo para la familia o amigos',    'PDQ_Q39', 'multiple_choice', 'obsesivo_compulsivo', NULL),
    ((SELECT id FROM s), 39, 'Me resulta muy difícil tirar cosas aunque ya no las necesite',                    'PDQ_Q40', 'multiple_choice', 'obsesivo_compulsivo', NULL)
  RETURNING id, order_index, item_code
)
INSERT INTO response_options (item_id, order_index, label, value)
SELECT i.id, o.order_index, o.label, o.value
FROM i
CROSS JOIN (VALUES
  (0, 'Falso', 0),
  (1, 'Verdadero', 1)
) AS o(order_index, label, value);

DO $$
DECLARE
  tid UUID;
  sr_par UUID; sr_esq UUID; sr_esqt UUID; sr_ant UUID; sr_lim UUID;
  sr_his UUID; sr_nar UUID; sr_evi UUID; sr_dep UUID; sr_ocp UUID;
BEGIN
  SELECT id INTO tid FROM tests WHERE slug = 'pdq4';

  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'paranoide', 'Paranoide', 'sum', ARRAY['PDQ_Q1','PDQ_Q2','PDQ_Q3','PDQ_Q4'], 1.0) RETURNING id INTO sr_par;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'esquizoide', 'Esquizoide', 'sum', ARRAY['PDQ_Q5','PDQ_Q6','PDQ_Q7','PDQ_Q8'], 1.0) RETURNING id INTO sr_esq;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'esquizotipico', 'Esquizotípico', 'sum', ARRAY['PDQ_Q9','PDQ_Q10','PDQ_Q11','PDQ_Q12'], 1.0) RETURNING id INTO sr_esqt;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'antisocial', 'Antisocial', 'sum', ARRAY['PDQ_Q13','PDQ_Q14','PDQ_Q15','PDQ_Q16'], 1.0) RETURNING id INTO sr_ant;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'limite', 'Límite (Borderline)', 'sum', ARRAY['PDQ_Q17','PDQ_Q18','PDQ_Q19','PDQ_Q20'], 1.0) RETURNING id INTO sr_lim;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'histrionico', 'Histriónico', 'sum', ARRAY['PDQ_Q21','PDQ_Q22','PDQ_Q23','PDQ_Q24'], 1.0) RETURNING id INTO sr_his;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'narcisista', 'Narcisista', 'sum', ARRAY['PDQ_Q25','PDQ_Q26','PDQ_Q27','PDQ_Q28'], 1.0) RETURNING id INTO sr_nar;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'evitativo', 'Evitativo', 'sum', ARRAY['PDQ_Q29','PDQ_Q30','PDQ_Q31','PDQ_Q32'], 1.0) RETURNING id INTO sr_evi;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'dependiente', 'Dependiente', 'sum', ARRAY['PDQ_Q33','PDQ_Q34','PDQ_Q35','PDQ_Q36'], 1.0) RETURNING id INTO sr_dep;
  INSERT INTO scoring_rules (test_id, subscale_name, display_name, formula, item_codes, multiply_by)
  VALUES (tid, 'obsesivo_compulsivo', 'Obsesivo-Compulsivo', 'sum', ARRAY['PDQ_Q37','PDQ_Q38','PDQ_Q39','PDQ_Q40'], 1.0) RETURNING id INTO sr_ocp;

  -- Rangos iguales para todas las escalas (0-4, punto de corte ≥3)
  INSERT INTO interpretation_ranges (scoring_rule_id, score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk_level)
  SELECT s.id, r.score_min, r.score_max, r.severity_label, r.severity_code, r.color_hex, r.description, r.recommendation, r.is_risk
  FROM (VALUES (sr_par),(sr_esq),(sr_esqt),(sr_ant),(sr_lim),(sr_his),(sr_nar),(sr_evi),(sr_dep),(sr_ocp)) AS s(id)
  CROSS JOIN (VALUES
    (0, 1, 'Bajo',      'subclinical', '#22c55e', 'Rasgos mínimos. Sin sugerencia de TP.',             'Sin acción específica.', FALSE),
    (2, 2, 'Moderado',  'moderate',    '#f59e0b', 'Rasgos presentes. Vigilar contexto clínico.',       'Explorar rasgos en evaluación clínica.', FALSE),
    (3, 4, 'Alto',      'severe',      '#ef4444', 'Alta carga de rasgos. Evaluar TP en eje diagnóstico.','Evaluación diagnóstica estructurada de TP.', TRUE)
  ) AS r(score_min, score_max, severity_label, severity_code, color_hex, description, recommendation, is_risk);
END $$;
