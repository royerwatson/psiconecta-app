/**
 * DSM-5-TR (2022) — Referencia clínica resumida para uso en Psiconecta.
 * Criterios parafraseados con fines educativos/clínicos. No reproducción literal.
 * Fuente: American Psychiatric Association, DSM-5-TR, 2022.
 */

export const DSM5TR = [
  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 1 · Trastornos del neurodesarrollo
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos del neurodesarrollo',
    chapterId: 'neurodesarrollo',
    diagnoses: [
      {
        id: 'discapacidad-intelectual',
        name: 'Discapacidad intelectual',
        icd10: 'F70–F79',
        dsm: '319',
        description: 'Déficits en el funcionamiento intelectual y en la conducta adaptativa que se manifiestan durante el período de desarrollo.',
        criteria: {
          A: 'Déficits en funciones intelectuales (razonamiento, resolución de problemas, planificación, pensamiento abstracto, juicio, aprendizaje académico, aprendizaje por experiencia) confirmados mediante evaluación clínica y pruebas de inteligencia estandarizadas individualizadas.',
          B: 'Déficits en el funcionamiento adaptativo que impiden el cumplimiento de los estándares de desarrollo y socioculturales para la autonomía personal y la responsabilidad social. Sin apoyo continuo, los déficits adaptativos limitan el funcionamiento en una o más actividades de la vida cotidiana (comunicación, participación social, vida independiente) en múltiples entornos (hogar, escuela, trabajo, comunidad).',
          C: 'Inicio de los déficits intelectuales y adaptativos durante el período de desarrollo.',
        },
        specifiers: ['Leve (F70)', 'Moderado (F71)', 'Grave (F72)', 'Profundo (F73)', 'Sin especificar (F79)'],
        notes: 'La gravedad se determina por el funcionamiento adaptativo, no solo por la puntuación de CI.',
      },
      {
        id: 'tea',
        name: 'Trastorno del espectro autista (TEA)',
        icd10: 'F84.0',
        dsm: '299.00',
        description: 'Deficiencias persistentes en la comunicación e interacción social, patrones restrictivos y repetitivos de conducta.',
        criteria: {
          A: 'Deficiencias persistentes en la comunicación e interacción social en múltiples contextos: (1) deficiencias en reciprocidad socioemocional; (2) deficiencias en conductas comunicativas no verbales; (3) deficiencias en el desarrollo, mantenimiento y comprensión de relaciones.',
          B: 'Patrones restrictivos y repetitivos de comportamiento, intereses o actividades (≥2 de 4): (1) movimientos, uso de objetos o habla estereotipados; (2) insistencia en la invariabilidad, adherencia inflexible a rutinas; (3) intereses muy restringidos y fijos; (4) hiper/hiporeactividad a estímulos sensoriales.',
          C: 'Los síntomas deben estar presentes en las primeras fases del período de desarrollo.',
          D: 'Los síntomas causan deterioro clínicamente significativo.',
          E: 'No se explica mejor por discapacidad intelectual o retraso global del desarrollo.',
        },
        specifiers: [
          'Con/sin déficit intelectual acompañante',
          'Con/sin deterioro del lenguaje',
          'Asociado a condición médica/genética',
          'Asociado a otro trastorno del neurodesarrollo, mental o del comportamiento',
          'Con catatonía',
          'Nivel de apoyo: 1 (requiere apoyo), 2 (apoyo sustancial), 3 (apoyo muy sustancial)',
        ],
        notes: 'El DSM-5-TR incluye el diagnóstico diferencial con síndrome de Rett, trastorno de comunicación social pragmática y TDAH.',
      },
      {
        id: 'tdah',
        name: 'Trastorno por déficit de atención con hiperactividad (TDAH)',
        icd10: 'F90.0 / F90.1 / F90.2',
        dsm: '314.01 / 314.00',
        description: 'Patrón persistente de inatención y/o hiperactividad-impulsividad que interfiere con el funcionamiento o el desarrollo.',
        criteria: {
          A: 'Inatención: ≥6 síntomas (niños) o ≥5 (adultos ≥17 años) durante ≥6 meses: comete errores por descuido, dificultad para mantener la atención, no escucha cuando se le habla, no sigue instrucciones, dificultad para organizar, evita tareas de esfuerzo sostenido, pierde objetos, se distrae fácilmente, es olvidadizo. Y/o Hiperactividad-impulsividad: ≥6 síntomas (niños) o ≥5 (adultos): mueve manos/pies, se levanta cuando debe permanecer sentado, corretea en situaciones inadecuadas, incapaz de jugar en silencio, "siempre en marcha", habla en exceso, responde antes de que terminen la pregunta, dificultad para esperar turno, interrumpe.',
          B: 'Varios síntomas de inatención o hiperactividad-impulsividad presentes antes de los 12 años.',
          C: 'Síntomas presentes en ≥2 contextos.',
          D: 'Evidencia de deterioro en funcionamiento social, académico o laboral.',
          E: 'No ocurre exclusivamente durante esquizofrenia u otro trastorno psicótico; no se explica mejor por otro trastorno mental.',
        },
        specifiers: [
          'Presentación combinada (F90.2)',
          'Presentación predominante con inatención (F90.0)',
          'Presentación predominante hiperactiva/impulsiva (F90.1)',
          'En remisión parcial',
          'Gravedad: leve, moderada, grave',
        ],
        notes: 'En adultos los síntomas de hiperactividad suelen manifestarse como inquietud subjetiva más que motora.',
      },
      {
        id: 'dislexia',
        name: 'Trastorno específico del aprendizaje',
        icd10: 'F81.0 / F81.2 / F81.81',
        dsm: '315.00 / 315.1 / 315.2',
        description: 'Dificultades en el aprendizaje y uso de aptitudes académicas (lectura, escritura, matemáticas).',
        criteria: {
          A: 'Dificultades en el aprendizaje y uso de aptitudes académicas, evidenciadas por ≥1 de los síntomas durante ≥6 meses a pesar de intervenciones: lectura de palabras imprecisa o lenta, dificultad para comprender el significado, dificultades ortográficas, dificultades con la expresión escrita, dificultades con el sentido numérico, dificultades con el razonamiento matemático.',
          B: 'Las aptitudes académicas están por debajo de lo esperado para la edad cronológica, causando interferencia significativa.',
          C: 'Inicio en años escolares.',
          D: 'No se explica mejor por discapacidad intelectual, trastornos visuales/auditivos, trastornos neurológicos, adversidad psicosocial, desconocimiento del idioma.',
        },
        specifiers: [
          'Con dificultad en la lectura (dislexia)',
          'Con dificultad en la expresión escrita (disortografía)',
          'Con dificultad matemática (discalculia)',
          'Gravedad: leve, moderada, grave',
        ],
        notes: '',
      },
      {
        id: 'trastorno-motor',
        name: 'Trastorno del desarrollo de la coordinación',
        icd10: 'F82',
        dsm: '315.4',
        description: 'Adquisición y ejecución de habilidades motoras coordinadas sustancialmente por debajo de lo esperado.',
        criteria: {
          A: 'La adquisición y ejecución de habilidades motoras coordinadas está sustancialmente por debajo de lo esperado para la edad cronológica.',
          B: 'El déficit interfiere significativamente con actividades de la vida cotidiana.',
          C: 'Inicio en las primeras fases del desarrollo.',
          D: 'No se explica mejor por discapacidad intelectual, deterioro visual u otra condición neurológica.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'tourette',
        name: 'Síndrome de Tourette',
        icd10: 'F95.2',
        dsm: '307.23',
        description: 'Múltiples tics motores y al menos un tic vocal durante más de un año.',
        criteria: {
          A: 'Tics motores múltiples y uno o más tics vocales, presentes en algún momento de la enfermedad (no necesariamente simultáneos).',
          B: 'Los tics pueden variar en frecuencia pero han persistido >1 año desde la aparición del primer tic.',
          C: 'Inicio antes de los 18 años.',
          D: 'No atribuible a sustancias u otra condición médica.',
        },
        specifiers: [],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 2 · Espectro de la esquizofrenia y otros trastornos psicóticos
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Espectro de la esquizofrenia y otros trastornos psicóticos',
    chapterId: 'psicoticos',
    diagnoses: [
      {
        id: 'esquizofrenia',
        name: 'Esquizofrenia',
        icd10: 'F20.9',
        dsm: '295.90',
        description: 'Trastorno caracterizado por síntomas positivos (alucinaciones, delirios), negativos y desorganización.',
        criteria: {
          A: '≥2 de los siguientes síntomas durante ≥1 mes (≥1 debe ser 1, 2 o 3): (1) delirios, (2) alucinaciones, (3) discurso desorganizado, (4) comportamiento muy desorganizado o catatónico, (5) síntomas negativos.',
          B: 'Deterioro significativo del nivel de funcionamiento en trabajo, relaciones o autocuidado desde el inicio.',
          C: 'Duración total ≥6 meses (incluyendo fases prodrómica y residual).',
          D: 'Descartados trastorno esquizoafectivo y trastorno bipolar/depresivo con síntomas psicóticos.',
          E: 'No atribuible a sustancias u otra condición médica.',
          F: 'Si hay antecedentes de TEA o trastorno de la comunicación, el diagnóstico adicional de esquizofrenia se hace solo si hay alucinaciones o delirios prominentes ≥1 mes.',
        },
        specifiers: [
          'Primer episodio, actualmente en episodio agudo',
          'Primer episodio, en remisión parcial/total',
          'Episodios múltiples, actualmente en episodio agudo',
          'Episodios múltiples, en remisión parcial/total',
          'Continuo',
          'Con catatonía',
          'Gravedad: leve, moderada, grave',
        ],
        notes: 'Los síntomas negativos incluyen expresión emotiva disminuida, alogia, abulia, anhedonia, asocialidad.',
      },
      {
        id: 'trastorno-esquizofreniforme',
        name: 'Trastorno esquizofreniforme',
        icd10: 'F20.81',
        dsm: '295.40',
        description: 'Igual que esquizofrenia pero con duración de 1-6 meses.',
        criteria: {
          A: 'Igual al criterio A de esquizofrenia.',
          B: 'Episodio dura ≥1 mes y <6 meses.',
          C: 'Descartado trastorno esquizoafectivo y trastorno bipolar/depresivo con síntomas psicóticos.',
          D: 'No atribuible a sustancias u otra condición médica.',
        },
        specifiers: ['Con/sin características de buen pronóstico', 'Con catatonía'],
        notes: 'Buen pronóstico: inicio de síntomas prominentes en 4 semanas, confusión/perplejidad, buen funcionamiento premórbido, ausencia de afecto embotado.',
      },
      {
        id: 'trastorno-esquizoafectivo',
        name: 'Trastorno esquizoafectivo',
        icd10: 'F25.0 / F25.1',
        dsm: '295.70',
        description: 'Episodio mayor del estado de ánimo concurrente con síntomas de esquizofrenia.',
        criteria: {
          A: 'Período interrumpido de enfermedad con episodio mayor del estado de ánimo (depresivo o maníaco) concurrente con síntomas del criterio A de esquizofrenia.',
          B: 'Delirios o alucinaciones durante ≥2 semanas en ausencia de episodio mayor del estado de ánimo.',
          C: 'Síntomas del episodio mayor del estado de ánimo presentes la mayor parte de la duración total.',
          D: 'No atribuible a sustancias u otra condición médica.',
        },
        specifiers: ['Tipo bipolar (F25.0)', 'Tipo depresivo (F25.1)', 'Con catatonía'],
        notes: '',
      },
      {
        id: 'trastorno-delirante',
        name: 'Trastorno delirante',
        icd10: 'F22',
        dsm: '297.1',
        description: 'Presencia de uno o más delirios durante ≥1 mes sin otros síntomas de esquizofrenia.',
        criteria: {
          A: 'Presencia de uno o más delirios durante ≥1 mes.',
          B: 'Nunca se ha cumplido el criterio A de esquizofrenia.',
          C: 'Aparte del impacto del delirio, el funcionamiento no está muy deteriorado.',
          D: 'Si han ocurrido episodios maníacos/depresivos, son breves respecto a la duración del delirio.',
          E: 'No atribuible a sustancias u otra condición médica.',
        },
        specifiers: ['Tipo erotomaníaco', 'Tipo de grandiosidad', 'Tipo celotípico', 'Tipo persecutorio', 'Tipo somático', 'Tipo mixto', 'Tipo no especificado', 'Con contenido bizarro'],
        notes: '',
      },
      {
        id: 'psicosis-breve',
        name: 'Trastorno psicótico breve',
        icd10: 'F23',
        dsm: '298.8',
        description: 'Presencia de ≥1 síntoma positivo por ≥1 día y <1 mes con retorno al nivel premórbido.',
        criteria: {
          A: '≥1 de: delirios, alucinaciones, discurso desorganizado, comportamiento muy desorganizado/catatónico. Al menos uno de los 3 primeros.',
          B: 'Duración ≥1 día y <1 mes, con retorno al nivel premórbido.',
          C: 'No se explica mejor por trastorno depresivo/bipolar con síntomas psicóticos, esquizofrenia, ni se atribuye a sustancias u otra condición médica.',
        },
        specifiers: ['Con factor de estrés notable (psicosis reactiva breve)', 'Sin factor de estrés notable', 'Con inicio en el periparto', 'Con catatonía'],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 3 · Trastorno bipolar y trastornos relacionados
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastorno bipolar y trastornos relacionados',
    chapterId: 'bipolar',
    diagnoses: [
      {
        id: 'bipolar-i',
        name: 'Trastorno bipolar I',
        icd10: 'F31.x',
        dsm: '296.xx',
        description: 'Episodio maníaco de ≥7 días (o cualquier duración si requiere hospitalización).',
        criteria: {
          A: 'Se han cumplido criterios para al menos un episodio maníaco.',
          EpisodioManiaco: 'Estado de ánimo anormal y persistentemente elevado, expansivo o irritable, y aumento de actividad o energía, durante ≥7 días (o cualquier duración si requiere hospitalización). ≥3 síntomas (≥4 si el estado de ánimo es solo irritable): autoestima inflada/grandiosidad, disminución necesidad de sueño, más hablador, fuga de ideas, distractibilidad, aumento de actividad dirigida a metas o agitación psicomotora, conductas de riesgo.',
          B: 'El episodio maníaco no se explica mejor por trastorno esquizoafectivo ni se superpone a esquizofrenia u otro trastorno psicótico.',
        },
        specifiers: [
          'Episodio actual/más reciente maníaco/hipomaníaco/depresivo',
          'Con características ansiosas',
          'Con características mixtas',
          'Con ciclos rápidos',
          'Con características melancólicas',
          'Con características atípicas',
          'Con características psicóticas congruentes/no congruentes con el estado de ánimo',
          'Con catatonía',
          'Con inicio en el periparto',
          'Con patrón estacional',
        ],
        notes: '',
      },
      {
        id: 'bipolar-ii',
        name: 'Trastorno bipolar II',
        icd10: 'F31.81',
        dsm: '296.89',
        description: 'Al menos un episodio hipomaníaco y un episodio depresivo mayor, sin episodio maníaco completo.',
        criteria: {
          A: 'Se han cumplido criterios para al menos un episodio hipomaníaco y al menos un episodio depresivo mayor.',
          B: 'No ha habido episodio maníaco.',
          C: 'Los síntomas del episodio hipomaníaco y depresivo mayor no se explican mejor por esquizofrenia, trastorno esquizofreniforme, trastorno delirante u otros.',
          D: 'Los síntomas de depresión o impredecibilidad causan deterioro clínicamente significativo.',
          EpisodioHipomaniaco: 'Igual que episodio maníaco pero duración ≥4 días y el episodio no es suficientemente grave para causar deterioro social o laboral marcado, no requiere hospitalización y no hay síntomas psicóticos.',
        },
        specifiers: ['(Mismos que Bipolar I)'],
        notes: 'El bipolar II no es "más leve" que el bipolar I; puede asociarse con más tiempo en depresión.',
      },
      {
        id: 'ciclotimia',
        name: 'Trastorno ciclotímico',
        icd10: 'F34.0',
        dsm: '301.13',
        description: 'Numerosos períodos con síntomas hipomaníacos y depresivos sin alcanzar criterios completos durante ≥2 años.',
        criteria: {
          A: 'Durante ≥2 años (≥1 año en niños/adolescentes) numerosos períodos con síntomas hipomaníacos que no cumplen criterios de episodio hipomaníaco y numerosos períodos con síntomas depresivos que no cumplen criterios de episodio depresivo mayor.',
          B: 'Durante el período de ≥2 años, los síntomas han estado presentes durante al menos la mitad del tiempo y el individuo no ha estado libre de síntomas >2 meses seguidos.',
          C: 'Nunca se han cumplido criterios de episodio depresivo mayor, maníaco o hipomaníaco.',
          D: 'No se explica mejor por otro trastorno.',
          E: 'No atribuible a sustancias u otra condición médica.',
          F: 'Los síntomas causan deterioro clínicamente significativo.',
        },
        specifiers: ['Con características ansiosas'],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 4 · Trastornos depresivos
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos depresivos',
    chapterId: 'depresivos',
    diagnoses: [
      {
        id: 'tdm',
        name: 'Trastorno depresivo mayor (TDM)',
        icd10: 'F32.x / F33.x',
        dsm: '296.xx',
        description: 'Episodio(s) de ≥2 semanas con ánimo deprimido o pérdida de interés/placer más síntomas asociados.',
        criteria: {
          A: '≥5 síntomas durante el mismo período de ≥2 semanas; ≥1 debe ser (1) o (2): (1) estado de ánimo deprimido casi todo el día; (2) disminución del interés o placer; (3) pérdida/ganancia significativa de peso o apetito; (4) insomnio o hipersomnia; (5) agitación o enlentecimiento psicomotor; (6) fatiga o pérdida de energía; (7) sentimientos de inutilidad o culpa excesiva; (8) dificultad para concentrarse o tomar decisiones; (9) pensamientos recurrentes de muerte o ideación suicida.',
          B: 'Los síntomas causan deterioro clínicamente significativo.',
          C: 'No atribuible a sustancias u otra condición médica.',
          D: 'No se explica mejor por esquizofrenia u otro trastorno psicótico.',
          E: 'Nunca ha habido episodio maníaco o hipomaníaco.',
        },
        specifiers: [
          'Episodio único / Recurrente',
          'Con características ansiosas',
          'Con características mixtas',
          'Con características melancólicas',
          'Con características atípicas',
          'Con características psicóticas congruentes/no congruentes',
          'Con catatonía',
          'Con inicio en el periparto',
          'Con patrón estacional (solo en recurrente)',
          'Gravedad: leve (F32.0), moderado (F32.1), grave (F32.2), con síntomas psicóticos (F32.3), en remisión parcial/total',
        ],
        notes: 'En niños/adolescentes el estado de ánimo puede ser irritable en lugar de deprimido.',
      },
      {
        id: 'distimia',
        name: 'Trastorno depresivo persistente (distimia)',
        icd10: 'F34.1',
        dsm: '300.4',
        description: 'Estado de ánimo deprimido durante la mayor parte del día, la mayoría de los días, por ≥2 años.',
        criteria: {
          A: 'Estado de ánimo deprimido durante la mayor parte del día, la mayoría de los días, por ≥2 años (≥1 año en niños/adolescentes).',
          B: '≥2 de: poco apetito o sobrealimentación, insomnio o hipersomnia, poca energía o fatiga, baja autoestima, dificultad para concentrarse o tomar decisiones, sentimientos de desesperanza.',
          C: 'Durante el período de ≥2 años nunca ha estado sin síntomas durante >2 meses seguidos.',
          D: 'Pueden haber cumplido criterios de episodio depresivo mayor durante ese período.',
          E: 'Nunca episodio maníaco o hipomaníaco; no se explica por ciclotimia.',
          F: 'No se explica mejor por esquizofrenia u otro trastorno psicótico.',
          G: 'No atribuible a sustancias u otra condición médica.',
          H: 'Los síntomas causan deterioro clínicamente significativo.',
        },
        specifiers: [
          'Con estado de ánimo depresivo puro',
          'Con síndrome distímico persistente',
          'Con episodio depresivo mayor persistente',
          'Con episodios de depresión mayor intermitentes, con episodio actual',
          'Con inicio temprano (<21 años) / tardío (≥21 años)',
          'Con características ansiosas',
          'Gravedad: leve, moderado, grave',
        ],
        notes: '',
      },
      {
        id: 'pmdd',
        name: 'Trastorno disfórico premenstrual (TDPM)',
        icd10: 'N94.3',
        dsm: '625.4',
        description: 'Síntomas afectivos y somáticos marcados en la semana premenstrual que remiten tras la menstruación.',
        criteria: {
          A: 'En la mayoría de los ciclos menstruales, ≥5 síntomas en la semana final antes del inicio de la menstruación, comenzando a mejorar en pocos días tras su inicio y haciéndose mínimos o ausentes en la semana postmenstrual.',
          B: '≥1 de: labilidad emocional marcada, irritabilidad/enojo/conflictos interpersonales marcados, humor deprimido/desesperanza/autocrítica, ansiedad/tensión/sensación de estar "al límite".',
          C: '≥1 de (en combinación con B para un total de 5): disminución del interés en actividades habituales, dificultad para concentrarse, letargo/fatiga fácil, cambio marcado en apetito/atracones, hipersomnia o insomnio, sensación de estar abrumada/fuera de control, síntomas físicos (hipersensibilidad/inflamación mamaria, dolor articular/muscular, sensación de hinchazón, aumento de peso).',
          D: 'Los síntomas causan deterioro clínicamente significativo.',
          E: 'Confirmado por registros prospectivos diarios durante ≥2 ciclos.',
          F: 'No es exacerbación de otro trastorno.',
          G: 'No atribuible a sustancias u otra condición médica.',
        },
        specifiers: [],
        notes: 'Requiere confirmación prospectiva; no diagnosticar retrospectivamente.',
      },
      {
        id: 'trastorno-disruptivo-desregulacion',
        name: 'Trastorno de desregulación disruptiva del estado de ánimo',
        icd10: 'F34.81',
        dsm: '296.99',
        description: 'Berrinches graves y recurrentes con irritabilidad persistente entre los episodios, en niños ≤18 años.',
        criteria: {
          A: 'Berrinches graves y recurrentes manifestados verbalmente o conductualmente que son muy desproporcionados en intensidad o duración al contexto.',
          B: 'Los berrinches son inconsistentes con el nivel de desarrollo.',
          C: 'Promedio de ≥3 berrinches/semana.',
          D: 'Estado de ánimo entre berrinches persistentemente irritable o enojado, observable por otros, casi todo el día, casi todos los días.',
          E: 'Los criterios A-D han estado presentes durante ≥12 meses.',
          F: 'Al menos en ≥2 de 3 contextos (hogar, escuela, con compañeros).',
          G: 'Diagnóstico no se hace antes de 6 años ni después de 18 años.',
          H: 'Inicio de criterios A-E antes de 10 años.',
          I: 'Nunca un período >1 día que cumpliera todos los criterios de episodio maníaco/hipomaníaco.',
          J: 'No ocurren exclusivamente durante episodio depresivo mayor.',
          K: 'No se explica mejor por otro trastorno.',
        },
        specifiers: [],
        notes: 'Diagnóstico exclusivo para 6-18 años. No diagnosticar si se cumplen criterios de bipolar.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 5 · Trastornos de ansiedad
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos de ansiedad',
    chapterId: 'ansiedad',
    diagnoses: [
      {
        id: 'tag',
        name: 'Trastorno de ansiedad generalizada (TAG)',
        icd10: 'F41.1',
        dsm: '300.02',
        description: 'Ansiedad y preocupación excesiva durante ≥6 meses sobre diversas actividades o eventos.',
        criteria: {
          A: 'Ansiedad y preocupación excesiva (anticipación aprensiva) sobre diversas actividades o eventos, presente la mayoría de los días durante ≥6 meses.',
          B: 'Al individuo le resulta difícil controlar la preocupación.',
          C: '≥3 de los siguientes (≥1 en niños): inquietud o sensación de estar al límite, fatigabilidad fácil, dificultad para concentrarse, irritabilidad, tensión muscular, problemas de sueño.',
          D: 'Los síntomas causan deterioro clínicamente significativo.',
          E: 'No atribuible a sustancias u otra condición médica.',
          F: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: [],
        notes: 'La preocupación debe ser desproporcionada e involucrar múltiples áreas.',
      },
      {
        id: 'trastorno-de-panico',
        name: 'Trastorno de pánico',
        icd10: 'F41.0',
        dsm: '300.01',
        description: 'Ataques de pánico imprevistos recurrentes con preocupación persistente o cambios conductuales.',
        criteria: {
          A: 'Ataques de pánico imprevistos recurrentes: oleada súbita de miedo intenso o malestar intenso que alcanza el máximo en minutos, con ≥4 síntomas: palpitaciones, sudoración, temblores, disnea, sofocación, dolor torácico, náuseas, mareo, escalofríos/sofocones, parestesias, desrealización/despersonalización, miedo a perder el control, miedo a morir.',
          B: 'Al menos un ataque seguido por ≥1 mes de: preocupación persistente por nuevos ataques o sus consecuencias, cambio significativo desadaptativo en el comportamiento.',
          C: 'No atribuible a sustancias u otra condición médica.',
          D: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: [],
        notes: 'Los ataques de pánico pueden ocurrir en el contexto de cualquier trastorno de ansiedad. El trastorno de pánico requiere ataques inesperados recurrentes.',
      },
      {
        id: 'agorafobia',
        name: 'Agorafobia',
        icd10: 'F40.00',
        dsm: '300.22',
        description: 'Miedo o ansiedad intensa en ≥2 situaciones agorafóbicas típicas.',
        criteria: {
          A: 'Miedo o ansiedad intensa en ≥2 de: usar transporte público, estar en espacios abiertos, estar en lugares cerrados, hacer cola o estar en una multitud, estar fuera de casa solo.',
          B: 'El individuo teme estas situaciones porque piensa que escapar podría ser difícil o que no dispondrá de ayuda si desarrolla síntomas de pánico.',
          C: 'Las situaciones agorafóbicas casi siempre provocan miedo o ansiedad.',
          D: 'Las situaciones se evitan, requieren compañía o se soportan con miedo intenso.',
          E: 'El miedo/ansiedad es desproporcionado al peligro real.',
          F: 'Dura ≥6 meses.',
          G: 'Causa deterioro clínicamente significativo.',
          H: 'Si hay condición médica, el miedo/ansiedad es claramente excesivo.',
          I: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: [],
        notes: 'Se diagnostica independientemente del trastorno de pánico.',
      },
      {
        id: 'fobia-especifica',
        name: 'Fobia específica',
        icd10: 'F40.2xx',
        dsm: '300.29',
        description: 'Miedo o ansiedad intensa y circunscrita a un objeto o situación específica.',
        criteria: {
          A: 'Miedo o ansiedad intensa sobre un objeto o situación específica.',
          B: 'El objeto/situación fóbica casi siempre provoca miedo o ansiedad inmediata.',
          C: 'El objeto/situación fóbica se evita activamente o se soporta con miedo/ansiedad intensa.',
          D: 'El miedo/ansiedad es desproporcionado al peligro real.',
          E: 'Dura ≥6 meses.',
          F: 'Causa deterioro clínicamente significativo.',
          G: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: ['Animal (F40.218)', 'Entorno natural (F40.228)', 'Sangre-inyección-herida (F40.23x)', 'Situacional (F40.248)', 'Otro (F40.298)'],
        notes: '',
      },
      {
        id: 'fobia-social',
        name: 'Trastorno de ansiedad social (fobia social)',
        icd10: 'F40.10',
        dsm: '300.23',
        description: 'Miedo o ansiedad intensa en situaciones sociales donde el individuo puede ser observado o juzgado.',
        criteria: {
          A: 'Miedo o ansiedad intensa sobre una o más situaciones sociales en las que el individuo está expuesto al posible escrutinio de otros.',
          B: 'El individuo teme actuar de cierta manera o mostrar síntomas de ansiedad que resulten humillantes o vergonzosos.',
          C: 'Las situaciones sociales casi siempre provocan miedo o ansiedad.',
          D: 'Las situaciones sociales se evitan o se soportan con miedo/ansiedad intensa.',
          E: 'El miedo/ansiedad es desproporcionado al peligro real.',
          F: 'Dura ≥6 meses.',
          G: 'Causa deterioro clínicamente significativo.',
          H: 'No atribuible a sustancias u otra condición médica.',
          I: 'No se explica mejor por otro trastorno mental.',
          J: 'Si hay otra condición médica, el miedo/ansiedad es claramente excesivo.',
        },
        specifiers: ['Solo de actuación (F40.11)'],
        notes: '',
      },
      {
        id: 'ansiedad-separacion',
        name: 'Trastorno de ansiedad por separación',
        icd10: 'F93.0',
        dsm: '309.21',
        description: 'Miedo o ansiedad excesivos sobre la separación de las figuras de apego.',
        criteria: {
          A: 'Miedo o ansiedad excesivos sobre la separación de las figuras de apego, con ≥3 de: malestar excesivo al separarse, preocupación por posible daño a figuras de apego, preocupación por evento adverso que lleve a separación, negativa a salir solo, miedo a estar solo, negativa a dormir fuera, pesadillas de separación, quejas somáticas al separarse.',
          B: 'Dura ≥4 semanas en niños/adolescentes o ≥6 meses en adultos.',
          C: 'Causa deterioro clínicamente significativo.',
          D: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: [],
        notes: 'Puede diagnosticarse en adultos; la expresión puede ser distinta a la infantil.',
      },
      {
        id: 'mutismo-selectivo',
        name: 'Mutismo selectivo',
        icd10: 'F94.0',
        dsm: '312.23',
        description: 'Incapacidad persistente para hablar en situaciones sociales específicas a pesar de hablar en otras.',
        criteria: {
          A: 'Fracaso constante para hablar en situaciones sociales específicas en las que existe expectativa de hablar (escuela) a pesar de hacerlo en otras.',
          B: 'Interfiere con el rendimiento educativo/laboral o la comunicación social.',
          C: 'Dura ≥1 mes (no primer mes escolar).',
          D: 'No atribuible a falta de conocimiento del idioma.',
          E: 'No se explica mejor por TEA, esquizofrenia u otro trastorno psicótico.',
        },
        specifiers: [],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 6 · Trastorno obsesivo-compulsivo y trastornos relacionados
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastorno obsesivo-compulsivo y trastornos relacionados',
    chapterId: 'ocd',
    diagnoses: [
      {
        id: 'toc',
        name: 'Trastorno obsesivo-compulsivo (TOC)',
        icd10: 'F42.2',
        dsm: '300.3',
        description: 'Presencia de obsesiones y/o compulsiones que consumen tiempo o causan deterioro significativo.',
        criteria: {
          A: 'Presencia de obsesiones, compulsiones, o ambas. Obsesiones: pensamientos, impulsos o imágenes recurrentes y persistentes, vividos como intrusos e inapropiados, que causan ansiedad o malestar marcados; el individuo intenta ignorarlos o neutralizarlos. Compulsiones: comportamientos repetitivos (lavarse, ordenar, comprobar) o actos mentales (rezar, contar, repetir palabras) que el individuo se siente impulsado a realizar en respuesta a la obsesión o según reglas rígidas; con el objetivo de prevenir ansiedad o suceso temido.',
          B: 'Las obsesiones/compulsiones consumen tiempo (>1 h/día) o causan deterioro clínicamente significativo.',
          C: 'No atribuible a sustancias u otra condición médica.',
          D: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: [
          'Con introspección buena o aceptable (F42.2)',
          'Con poca introspección (F42.2)',
          'Con ausencia de introspección/con creencias delirantes (F42.2)',
          'Con tics presentes (F42.2)',
        ],
        notes: '',
      },
      {
        id: 'trastorno-dismorfofobico',
        name: 'Trastorno dismorfofóbico (TDC)',
        icd10: 'F45.22',
        dsm: '300.7',
        description: 'Preocupación por uno o más defectos percibidos en el aspecto físico que no son observables o son insignificantes.',
        criteria: {
          A: 'Preocupación por uno o más defectos percibidos en el aspecto físico que no son observables o son insignificantes para otros.',
          B: 'En algún momento del curso ha realizado comportamientos repetitivos (mirarse en el espejo, asearse excesivamente, rascarse la piel, comprobarse) o actos mentales (compararse con otros) en respuesta a la preocupación.',
          C: 'Causa deterioro clínicamente significativo.',
          D: 'No se explica mejor por trastorno de la conducta alimentaria.',
        },
        specifiers: ['Con dismorfia muscular', 'Con buena/poca/nula introspección'],
        notes: '',
      },
      {
        id: 'acumulacion',
        name: 'Trastorno de acumulación',
        icd10: 'F42.3',
        dsm: '300.3',
        description: 'Dificultad persistente para deshacerse de posesiones independientemente de su valor.',
        criteria: {
          A: 'Dificultad persistente para deshacerse o separarse de las posesiones, independientemente de su valor real.',
          B: 'La dificultad se debe a la necesidad percibida de guardar los objetos y al malestar que produce deshacerse de ellos.',
          C: 'Acumulación de posesiones que abarrotan y obstruyen las zonas de vivienda activa.',
          D: 'Causa deterioro clínicamente significativo.',
          E: 'No se atribuye a otra condición médica.',
          F: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: ['Con adquisición excesiva', 'Con buena/poca/nula introspección'],
        notes: '',
      },
      {
        id: 'tricotilomania',
        name: 'Tricotilomanía (trastorno de arrancarse el cabello)',
        icd10: 'F63.3',
        dsm: '312.39',
        description: 'Arrancarse el propio cabello de forma recurrente con pérdida capilar.',
        criteria: {
          A: 'Arrancarse el propio cabello de forma recurrente, dando lugar a pérdida capilar.',
          B: 'Intentos repetidos de disminuir o detener el comportamiento.',
          C: 'Causa deterioro clínicamente significativo.',
          D: 'No se atribuye a otra condición médica.',
          E: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'excoriacion',
        name: 'Trastorno de excoriación (rascado de piel)',
        icd10: 'L98.1',
        dsm: '698.4',
        description: 'Rascado recurrente de la propia piel que causa lesiones cutáneas.',
        criteria: {
          A: 'Rascado recurrente de la propia piel que causa lesiones cutáneas.',
          B: 'Intentos repetidos de disminuir o detener el comportamiento.',
          C: 'Causa deterioro clínicamente significativo.',
          D: 'No se atribuye a sustancias u otra condición médica.',
          E: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: [],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 7 · Trastornos relacionados con traumas y factores de estrés
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos relacionados con traumas y factores de estrés',
    chapterId: 'trauma',
    diagnoses: [
      {
        id: 'tept',
        name: 'Trastorno de estrés postraumático (TEPT)',
        icd10: 'F43.10',
        dsm: '309.81',
        description: 'Exposición a muerte o amenaza de muerte, lesión grave o violencia sexual con síntomas intrusivos, evitativos, negativos y de hiperactivación.',
        criteria: {
          A: 'Exposición a muerte real o amenaza, lesión grave o violencia sexual por: experiencia directa, ser testigo, conocer que ocurrió a un familiar/amigo cercano, exposición repetida o extrema a detalles del acontecimiento (no aplica a medios de comunicación).',
          B: 'Síntomas intrusivos (≥1): recuerdos intrusivos angustiosos, sueños angustiosos, reacciones disociativas (flashbacks), malestar psicológico intenso a claves internas/externas, reacciones fisiológicas marcadas.',
          C: 'Evitación persistente (≥1): evitación de recuerdos/pensamientos/sentimientos, evitación de recordatorios externos.',
          D: 'Alteraciones cognitivas y del estado de ánimo (≥2): incapacidad para recordar aspectos importantes del trauma, creencias negativas persistentes, cogniciones distorsionadas sobre la causa/consecuencias, estado emocional negativo persistente, disminución del interés, sensación de alejamiento, incapacidad persistente de experimentar emociones positivas.',
          E: 'Alteraciones en la reactividad (≥2): comportamiento irritable y arrebatos de ira, comportamiento imprudente o autodestructivo, hipervigilancia, respuesta de sobresalto exagerada, problemas de concentración, alteraciones del sueño.',
          F: 'Duración >1 mes.',
          G: 'Causa deterioro clínicamente significativo.',
          H: 'No atribuible a sustancias u otra condición médica.',
        },
        specifiers: ['Con síntomas disociativos: despersonalización (F43.12) / desrealización', 'Con inicio demorado (>6 meses)'],
        notes: 'Existen especificadores para niños ≤6 años con criterios modificados.',
      },
      {
        id: 'tea-agudo',
        name: 'Trastorno de estrés agudo',
        icd10: 'F43.0',
        dsm: '308.3',
        description: 'Síntomas similares al TEPT pero de duración de 3 días a 1 mes tras la exposición al trauma.',
        criteria: {
          A: 'Exposición a trauma (igual que TEPT criterio A).',
          B: '≥9 de 14 síntomas de 5 categorías: intrusión, estado de ánimo negativo, disociación, evitación, hiperactivación.',
          C: 'Duración 3 días–1 mes tras la exposición.',
          D: 'Causa deterioro clínicamente significativo.',
          E: 'No atribuible a sustancias u otra condición médica; no se explica mejor por trastorno psicótico breve.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'trastorno-adaptacion',
        name: 'Trastorno de adaptación',
        icd10: 'F43.2x',
        dsm: '309.xx',
        description: 'Síntomas emocionales o conductuales en respuesta a un factor de estrés identificable.',
        criteria: {
          A: 'Síntomas emocionales o conductuales en respuesta a un factor de estrés identificable, dentro de los 3 meses siguientes.',
          B: 'Al menos uno: malestar intenso desproporcionado a la gravedad del factor estresante, deterioro clínicamente significativo.',
          C: 'No cumple criterios de otro trastorno mental y no es exacerbación de uno preexistente.',
          D: 'Los síntomas no representan duelo normal.',
          E: 'Los síntomas no duran >6 meses tras cesar el factor estresante.',
        },
        specifiers: [
          'Con estado de ánimo depresivo (F43.21)',
          'Con ansiedad (F43.22)',
          'Con ansiedad mixta y estado de ánimo depresivo (F43.23)',
          'Con alteración de la conducta (F43.24)',
          'Con alteración mixta de las emociones y la conducta (F43.25)',
          'Sin especificar (F43.20)',
        ],
        notes: '',
      },
      {
        id: 'trastorno-apego-reactivo',
        name: 'Trastorno de apego reactivo',
        icd10: 'F94.1',
        dsm: '313.89',
        description: 'Patrón de comportamiento inhibido y emocionalmente retraído hacia los cuidadores adultos, en contexto de cuidado insuficiente.',
        criteria: {
          A: 'Patrón consistente de inhibición y retraimiento emocional hacia los cuidadores adultos (≥2): el niño raramente busca consuelo, raramente responde al consuelo.',
          B: 'Perturbación social y emocional persistente (≥2): poca respuesta social/emocional a otros, afecto positivo limitado, episodios de irritabilidad/tristeza/miedo inexplicados.',
          C: 'Cuidado insuficiente (≥1): negligencia social, cambios repetidos de cuidadores, entornos con dificultades para establecer apego selectivo.',
          D: 'El criterio C es la causa presumible de la conducta.',
          E: 'No cumple criterios de TEA.',
          F: 'Inicio antes de 5 años.',
          G: 'El niño tiene edad de desarrollo ≥9 meses.',
        },
        specifiers: ['Persistente (>12 meses)', 'Grave'],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 8 · Trastornos disociativos
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos disociativos',
    chapterId: 'disociativos',
    diagnoses: [
      {
        id: 'tid',
        name: 'Trastorno de identidad disociativo (TID)',
        icd10: 'F44.81',
        dsm: '300.14',
        description: 'Perturbación de la identidad caracterizada por dos o más estados de personalidad distintos.',
        criteria: {
          A: 'Perturbación de la identidad caracterizada por dos o más estados de personalidad distintos, que en algunas culturas puede describirse como una experiencia de posesión.',
          B: 'Amnesia disociativa recurrente (incapacidad para recordar eventos cotidianos, información personal importante o eventos traumáticos incompatible con el olvido ordinario).',
          C: 'Los síntomas causan deterioro clínicamente significativo.',
          D: 'La alteración no es parte de una práctica cultural o religiosa ampliamente aceptada.',
          E: 'No atribuible a sustancias u otra condición médica.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'amnesia-disociativa',
        name: 'Amnesia disociativa',
        icd10: 'F44.0',
        dsm: '300.12',
        description: 'Incapacidad para recordar información autobiográfica importante, generalmente de naturaleza traumática.',
        criteria: {
          A: 'Incapacidad para recordar información autobiográfica importante, generalmente de naturaleza traumática o estresante, que es incompatible con el olvido ordinario.',
          B: 'Los síntomas causan deterioro clínicamente significativo.',
          C: 'No atribuible a sustancias u otra condición médica.',
          D: 'No se explica mejor por TID, TEPT, TEA, fuga disociativa, trastorno conversivo u otro.',
        },
        specifiers: ['Con fuga disociativa (F44.1): viaje o deambulación aparentemente con propósito junto con amnesia del pasado o de la identidad'],
        notes: '',
      },
      {
        id: 'despersonalizacion',
        name: 'Trastorno de despersonalización/desrealización',
        icd10: 'F48.1',
        dsm: '300.6',
        description: 'Experiencias persistentes de despersonalización y/o desrealización con juicio de realidad intacto.',
        criteria: {
          A: 'Experiencias persistentes o recurrentes de despersonalización (sentirse separado de los propios pensamientos, sentimientos, sensaciones, cuerpo) y/o desrealización (experiencias de irrealidad, distanciamiento del entorno).',
          B: 'Durante las experiencias de despersonalización/desrealización el juicio de realidad permanece intacto.',
          C: 'Los síntomas causan deterioro clínicamente significativo.',
          D: 'No atribuible a sustancias u otra condición médica.',
          E: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: [],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 9 · Síntomas somáticos y trastornos relacionados
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Síntomas somáticos y trastornos relacionados',
    chapterId: 'somaticos',
    diagnoses: [
      {
        id: 'trastorno-sintomas-somaticos',
        name: 'Trastorno de síntomas somáticos',
        icd10: 'F45.1',
        dsm: '300.82',
        description: 'Síntomas somáticos angustiantes con pensamientos, sentimientos o comportamientos excesivos relacionados.',
        criteria: {
          A: 'Uno o más síntomas somáticos angustiantes o que dan lugar a una alteración significativa de la vida diaria.',
          B: 'Pensamientos, sentimientos o comportamientos excesivos relacionados con los síntomas con ≥1: pensamientos desproporcionados y persistentes sobre la gravedad de los síntomas, grado persistentemente elevado de ansiedad sobre la salud o síntomas, tiempo y energía excesivos dedicados a síntomas o preocupaciones de salud.',
          C: 'El estado sintomático somático es persistente (>6 meses).',
        },
        specifiers: ['Con dolor predominante (F45.41)', 'Persistente', 'Gravedad: leve, moderado, grave'],
        notes: '',
      },
      {
        id: 'trastorno-ansiedad-enfermedad',
        name: 'Trastorno de ansiedad por enfermedad',
        icd10: 'F45.21',
        dsm: '300.7',
        description: 'Preocupación por tener o contraer una enfermedad grave, con síntomas somáticos ausentes o leves.',
        criteria: {
          A: 'Preocupación por tener o contraer una enfermedad grave.',
          B: 'Los síntomas somáticos no están presentes o son de intensidad leve.',
          C: 'Existe un grado elevado de ansiedad sobre la salud, y el individuo se alarma fácilmente por su estado de salud.',
          D: 'El individuo realiza comportamientos excesivos relacionados con la salud o muestra evitación desadaptativa.',
          E: 'La preocupación dura ≥6 meses.',
          F: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: ['Tipo con búsqueda de asistencia', 'Tipo con evitación de asistencia'],
        notes: 'Anteriormente llamado hipocondría.',
      },
      {
        id: 'trastorno-conversion',
        name: 'Trastorno de conversión (trastorno de síntomas neurológicos funcionales)',
        icd10: 'F44.x',
        dsm: '300.11',
        description: 'Síntomas de alteración de la función motora o sensorial incompatibles con enfermedades neurológicas.',
        criteria: {
          A: 'Uno o más síntomas de alteración de la función motora o sensorial voluntaria.',
          B: 'Los hallazgos clínicos proporcionan evidencia de incompatibilidad con enfermedades neurológicas reconocidas.',
          C: 'No se explica mejor por otro trastorno médico o mental.',
          D: 'Los síntomas causan deterioro clínicamente significativo.',
        },
        specifiers: ['Con debilidad/parálisis', 'Con movimiento anormal', 'Con síntomas de deglución', 'Con síntoma del habla', 'Con ataques/convulsiones', 'Con anestesia/pérdida sensorial', 'Con síntoma sensorial especial', 'Con síntomas mixtos', 'Episodio agudo (<6 meses) / Persistente (≥6 meses)', 'Con/sin factor de estrés psicológico'],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 10 · Trastornos alimentarios y de la ingestión de alimentos
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos alimentarios y de la ingestión de alimentos',
    chapterId: 'alimentarios',
    diagnoses: [
      {
        id: 'anorexia',
        name: 'Anorexia nerviosa',
        icd10: 'F50.0x',
        dsm: '307.1',
        description: 'Restricción de la ingesta, miedo intenso a ganar peso y alteración de la percepción corporal.',
        criteria: {
          A: 'Restricción de la ingesta energética en relación con las necesidades, que conduce a un peso corporal significativamente bajo.',
          B: 'Miedo intenso a ganar peso o engordar, o comportamiento persistente que interfiere con el aumento de peso.',
          C: 'Alteración en la forma en que uno mismo percibe su propio peso o constitución; influencia indebida del peso en la autoevaluación; o falta de reconocimiento de la gravedad del bajo peso corporal actual.',
        },
        specifiers: [
          'Tipo restrictivo (F50.01): sin atracones ni purgas recurrentes',
          'Tipo con atracones/purgas (F50.02)',
          'En remisión parcial / total',
          'Gravedad según IMC: leve (≥17), moderado (16–16.99), grave (15–15.99), extremo (<15)',
        ],
        notes: 'La amenorrea ya no es criterio en DSM-5 para incluir a hombres, posmenopáusicas y quienes usan anticonceptivos.',
      },
      {
        id: 'bulimia',
        name: 'Bulimia nerviosa',
        icd10: 'F50.2',
        dsm: '307.51',
        description: 'Episodios recurrentes de atracones seguidos de comportamientos compensatorios inapropiados.',
        criteria: {
          A: 'Episodios recurrentes de atracones: ingesta en un período limitado de tiempo de una cantidad mayor que la que la mayoría ingeriría; sensación de falta de control.',
          B: 'Comportamientos compensatorios inapropiados recurrentes para evitar el aumento de peso: vómito autoprovocado, uso de laxantes/diuréticos, ayuno, ejercicio excesivo.',
          C: 'Atracones y comportamientos compensatorios ≥1 vez/semana durante ≥3 meses.',
          D: 'La autoevaluación se ve indebidamente influenciada por la constitución y el peso corporal.',
          E: 'La alteración no se produce exclusivamente durante la anorexia nerviosa.',
        },
        specifiers: ['En remisión parcial / total', 'Gravedad: leve (1-3 episodios/semana), moderada (4-7), grave (8-13), extrema (≥14)'],
        notes: '',
      },
      {
        id: 'tca',
        name: 'Trastorno por atracón',
        icd10: 'F50.81',
        dsm: '307.51',
        description: 'Episodios recurrentes de atracones sin comportamientos compensatorios inapropiados.',
        criteria: {
          A: 'Episodios recurrentes de atracones con ≥3: comer más rápido de lo normal, comer hasta sentirse desagradablemente lleno, comer grandes cantidades sin hambre, comer a solas por vergüenza, sentirse a disgusto/deprimido/culpable después.',
          B: 'Malestar significativo respecto al atracón.',
          C: '≥1 vez/semana durante ≥3 meses.',
          D: 'No asociado a comportamientos compensatorios inapropiados recurrentes.',
          E: 'No se produce exclusivamente durante bulimia o anorexia.',
        },
        specifiers: ['En remisión parcial / total', 'Gravedad: leve (1-3/semana), moderada (4-7), grave (8-13), extrema (≥14)'],
        notes: '',
      },
      {
        id: 'pica',
        name: 'Pica',
        icd10: 'F98.3',
        dsm: '307.52',
        description: 'Ingesta persistente de sustancias no nutritivas y no alimentarias.',
        criteria: {
          A: 'Ingesta persistente de sustancias no nutritivas y no alimentarias durante ≥1 mes.',
          B: 'La conducta es inapropiada para el nivel de desarrollo.',
          C: 'No es parte de una práctica culturalmente aceptada.',
          D: 'Si ocurre en el contexto de otro trastorno, es suficientemente grave para merecer atención clínica adicional.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'arfid',
        name: 'Trastorno de evitación/restricción de la ingestión de alimentos (ARFID)',
        icd10: 'F50.82',
        dsm: '307.59',
        description: 'Evitación o restricción de la ingesta sin preocupación por el peso corporal.',
        criteria: {
          A: 'Trastorno alimentario o de la ingestión de alimentos (evitación o restricción en el consumo) manifestado por: pérdida de peso significativa, deficiencia nutricional significativa, dependencia de suplementos o alimentación por sonda, interferencia significativa en el funcionamiento psicosocial.',
          B: 'No se explica por falta de alimentos o práctica cultural.',
          C: 'No se produce exclusivamente durante anorexia o bulimia.',
          D: 'No atribuible a otra condición médica ni a otro trastorno mental.',
        },
        specifiers: [],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 11 · Trastornos del sueño-vigilia
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos del sueño-vigilia',
    chapterId: 'sueno',
    diagnoses: [
      {
        id: 'insomnio',
        name: 'Trastorno de insomnio',
        icd10: 'F51.01',
        dsm: '780.52',
        description: 'Insatisfacción con la cantidad o calidad del sueño con dificultad para conciliar/mantener el sueño.',
        criteria: {
          A: 'Insatisfacción predominante con la cantidad o calidad del sueño con ≥1 síntoma: dificultad para iniciar el sueño, dificultad para mantenerlo (despertares frecuentes o dificultad para volver a dormir), despertar pronto sin poder volver a dormirse.',
          B: 'La alteración del sueño causa deterioro clínicamente significativo.',
          C: 'Al menos 3 noches/semana.',
          D: 'Presente ≥3 meses.',
          E: 'A pesar de condiciones adecuadas para dormir.',
          F: 'No se explica mejor por otra alteración del sueño-vigilia.',
          G: 'No atribuible a sustancias u otra condición médica.',
          H: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: ['Con comorbilidad no mental', 'Con otra comorbilidad del sueño', 'Episódico (<3 meses) / Persistente (≥3 meses) / Recurrente (≥2 episodios en 1 año)'],
        notes: '',
      },
      {
        id: 'hipersomnia',
        name: 'Trastorno de hipersomnia',
        icd10: 'F51.11',
        dsm: '780.54',
        description: 'Somnolencia excesiva a pesar de dormir ≥7 horas.',
        criteria: {
          A: 'Somnolencia excesiva (hipersomnia) a pesar de haber dormido al menos 7 horas con ≥1: períodos recurrentes de sueño o caída en el sueño en el mismo día, episodio principal de sueño prolongado >9 horas y aun así no restaurador, dificultad para estar totalmente despierto después del despertar brusco.',
          B: 'La hipersomnia ocurre ≥3 veces/semana durante ≥3 meses.',
          C: 'Causa deterioro clínicamente significativo.',
          D: 'No se explica mejor por otra alteración del sueño-vigilia.',
          E: 'No atribuible a sustancias u otra condición médica.',
          F: 'No se explica mejor por otro trastorno mental.',
        },
        specifiers: ['Con trastorno mental, médico u otro trastorno del sueño', 'Episódico / Persistente / Recurrente', 'Gravedad: leve, moderado, grave'],
        notes: '',
      },
      {
        id: 'narcolepsia',
        name: 'Narcolepsia',
        icd10: 'G47.4x',
        dsm: '347.xx',
        description: 'Ataques recurrentes de necesidad irreprimible de dormir, cataplejía y/o deficiencia de orexina.',
        criteria: {
          A: 'Períodos recurrentes de necesidad irreprimible de dormir, de quedarse dormido o de tomar siestas en el mismo día, ≥3 veces/semana durante ≥3 meses.',
          B: 'Al menos uno de: episodios de cataplejía (breve pérdida bilateral del tono muscular, con conciencia conservada, precipitados por la risa o el chiste); deficiencia de hipocretina-1 en LCR; latencia media del sueño REM ≤8 min y ≥2 SOREMPs en TLMS.',
        },
        specifiers: ['Sin cataplejía pero con deficiencia de hipocretina-1 (G47.419)', 'Con cataplejía pero sin deficiencia de hipocretina-1 (G47.411)', 'Ataxia cerebelosa autosómica dominante, sordera y narcolepsia', 'Obesidad y diabetes tipo 2', 'Secundaria a otra condición médica'],
        notes: '',
      },
      {
        id: 'apnea-sueno',
        name: 'Apnea e hipopnea obstructiva del sueño',
        icd10: 'G47.33',
        dsm: '327.23',
        description: 'Episodios recurrentes de apnea/hipopnea durante el sueño.',
        criteria: {
          A: '≥5 apneas/hipopneas obstructivas/hora de sueño (en estudio polisomnográfico) con ≥1 síntoma nocturno: ronquidos, resoplidos/jadeos o pausas respiratorias durante el sueño. O ≥15 apneas/hipopneas obstructivas/hora de sueño independientemente de síntomas.',
        },
        specifiers: ['Leve (<15/h)', 'Moderado (15-30/h)', 'Grave (>30/h)'],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 12 · Disfunciones sexuales
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Disfunciones sexuales',
    chapterId: 'sexual',
    diagnoses: [
      {
        id: 'disfuncion-erectil',
        name: 'Trastorno eréctil',
        icd10: 'F52.21',
        dsm: '302.72',
        description: 'Dificultad marcada para obtener/mantener erección o disminución marcada de la rigidez eréctil.',
        criteria: {
          A: '≥1 de los 3 síntomas siguientes presente ≥75% del tiempo durante actividades sexuales: dificultad marcada para obtener erección, dificultad marcada para mantenerla hasta completar la actividad, disminución marcada de la rigidez eréctil.',
          B: 'Los síntomas persisten ≥6 meses.',
          C: 'Causa deterioro clínicamente significativo.',
          D: 'No se explica mejor por otro trastorno mental, efectos de sustancias o condición médica.',
        },
        specifiers: ['De por vida / Adquirido', 'Generalizado / Situacional', 'Gravedad: leve, moderado, grave'],
        notes: '',
      },
      {
        id: 'eyaculacion-precoz',
        name: 'Eyaculación prematura (precoz)',
        icd10: 'F52.4',
        dsm: '302.75',
        description: 'Eyaculación que ocurre antes de lo deseado, aproximadamente dentro del primer minuto.',
        criteria: {
          A: 'Patrón persistente o recurrente de eyaculación que ocurre durante la actividad sexual en pareja dentro del primer minuto de la penetración y antes de que el individuo lo desee.',
          B: 'El síntoma persiste ≥6 meses.',
          C: 'Causa deterioro clínicamente significativo.',
          D: 'No se explica mejor por otro trastorno mental, efectos de sustancias o condición médica.',
        },
        specifiers: ['De por vida / Adquirido', 'Generalizado / Situacional', 'Gravedad: leve, moderado, grave'],
        notes: '',
      },
      {
        id: 'deseo-sexual-hipoactivo',
        name: 'Trastorno de deseo sexual hipoactivo en el varón',
        icd10: 'F52.0',
        dsm: '302.71',
        description: 'Fantasías/pensamientos sexuales y deseo de actividad sexual deficientes o ausentes de forma persistente.',
        criteria: {
          A: 'Fantasías/pensamientos sexuales y deseo de actividad sexual persistentemente deficientes o ausentes.',
          B: '≥6 meses.',
          C: 'Deterioro clínicamente significativo.',
          D: 'No atribuible a otro trastorno mental, sustancias o condición médica.',
        },
        specifiers: ['De por vida / Adquirido', 'Generalizado / Situacional', 'Gravedad: leve, moderado, grave'],
        notes: '',
      },
      {
        id: 'vaginismo',
        name: 'Trastorno de penetración genito-pélvica/dolor (vaginismo/dispareunia)',
        icd10: 'F52.6',
        dsm: '302.76',
        description: 'Dificultades persistentes con la penetración vaginal, dolor, miedo o tensión muscular.',
        criteria: {
          A: '≥1 de forma persistente o recurrente: dificultad marcada durante la penetración vaginal, dolor vulvovaginal/pélvico marcado durante la penetración o intento de penetración, miedo marcado o ansiedad anticipatoria sobre el dolor vulvovaginal/pélvico antes o durante la penetración, tensión marcada de los músculos del suelo pélvico.',
          B: '≥6 meses.',
          C: 'Deterioro clínicamente significativo.',
          D: 'No atribuible a otro trastorno mental, sustancias o condición médica.',
        },
        specifiers: ['De por vida / Adquirido', 'Generalizado / Situacional', 'Gravedad: leve, moderado, grave'],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 13 · Trastornos disruptivos, del control de impulsos y de la conducta
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos disruptivos, del control de impulsos y de la conducta',
    chapterId: 'disruptivos',
    diagnoses: [
      {
        id: 'tnd',
        name: 'Trastorno negativista desafiante (TND)',
        icd10: 'F91.3',
        dsm: '313.81',
        description: 'Patrón de humor enfadado/irritable, comportamiento discutidor/desafiante o actitud vengativa.',
        criteria: {
          A: 'Patrón de humor enfadado/irritable, comportamiento discutidor/desafiante o actitud vengativa de ≥6 meses con ≥4 síntomas de cualquier categoría, exhibidos durante interacción con al menos un individuo que no sea hermano: Humor enojado/irritable: rabietas frecuentes, susceptible o fácilmente enfadado, enojado y resentido. Comportamiento discutidor/desafiante: discute con figuras de autoridad, desafía activamente reglas, molesta deliberadamente a otros, culpa a otros de sus errores. Actitud vengativa: rencoroso o vengativo ≥2 veces en últimos 6 meses.',
          B: 'El comportamiento causa deterioro clínicamente significativo.',
          C: 'No se produce exclusivamente durante un trastorno psicótico, del estado de ánimo o de uso de sustancias.',
          D: 'No se cumplen criterios de trastorno disocial.',
        },
        specifiers: ['Leve (solo en un contexto)', 'Moderado (en ≥2 contextos)', 'Grave (en ≥3 contextos)'],
        notes: '',
      },
      {
        id: 'trastorno-disocial',
        name: 'Trastorno disocial',
        icd10: 'F91.x',
        dsm: '312.xx',
        description: 'Patrón repetitivo y persistente de comportamiento que viola los derechos básicos de otros.',
        criteria: {
          A: 'Patrón repetitivo y persistente de comportamiento que viola los derechos básicos de otros o normas sociales importantes con ≥3 síntomas en 12 meses y ≥1 en últimos 6 meses, de las categorías: agresión a personas/animales, destrucción de la propiedad, engaño/robo, incumplimiento grave de normas.',
          B: 'El comportamiento causa deterioro clínicamente significativo.',
          C: 'Si el individuo tiene ≥18 años, no se cumplen criterios de trastorno antisocial de la personalidad.',
        },
        specifiers: ['Inicio en la infancia (F91.1)', 'Inicio en la adolescencia (F91.2)', 'Inicio no especificado (F91.9)', 'Con emociones prosociales limitadas: carencia de remordimiento/culpa, insensibilidad/falta de empatía, indiferencia por el rendimiento, afecto superficial/deficiente', 'Gravedad: leve, moderado, grave'],
        notes: '',
      },
      {
        id: 'trastorno-explosivo-intermitente',
        name: 'Trastorno explosivo intermitente',
        icd10: 'F63.81',
        dsm: '312.34',
        description: 'Arrebatos recurrentes de agresividad impulsiva desproporcionados al provocador.',
        criteria: {
          A: 'Arrebatos conductuales recurrentes que representan un fracaso en el control de los impulsos agresivos, manifestados por: agresión verbal o física no destructiva/no dañina ≥2 veces/semana (media) durante 3 meses; o 3 episodios con daño o destrucción en 12 meses.',
          B: 'La magnitud de la agresividad es muy desproporcionada.',
          C: 'Los arrebatos no son premeditados.',
          D: 'Los arrebatos causan deterioro clínicamente significativo.',
          E: 'Edad cronológica ≥6 años.',
          F: 'No se explica mejor por otro trastorno mental ni atribuible a sustancias/condición médica.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'piromanía',
        name: 'Piromanía',
        icd10: 'F63.1',
        dsm: '312.33',
        description: 'Provocación deliberada y placentera de incendios de forma múltiple.',
        criteria: {
          A: 'Provocación de incendios de forma deliberada e intencionada en más de una ocasión.',
          B: 'Tensión o activación emocional antes del acto.',
          C: 'Fascinación, interés, curiosidad o atracción por el fuego.',
          D: 'Bienestar, gratificación o alivio al provocar incendios o al presenciarlos/participar en sus consecuencias.',
          E: 'No se provoca el incendio por razones económicas, ideológicas, para ocultar actividad criminal, por ira/venganza, para mejorar las condiciones de vida, ni en respuesta a delirios/alucinaciones.',
          F: 'No se explica mejor por trastorno disocial, episodio maníaco o trastorno antisocial de la personalidad.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'cleptomanía',
        name: 'Cleptomanía',
        icd10: 'F63.2',
        dsm: '312.32',
        description: 'Fracaso recurrente en resistir el impulso de robar objetos que no son necesarios.',
        criteria: {
          A: 'Fracaso recurrente en resistir el impulso de robar objetos que no son necesarios para uso personal ni por su valor económico.',
          B: 'Sensación creciente de tensión inmediatamente antes de cometer el robo.',
          C: 'Placer, gratificación o alivio en el momento de cometer el robo.',
          D: 'El robo no se comete para expresar ira o venganza, ni en respuesta a alucinaciones/delirios.',
          E: 'No se explica mejor por trastorno disocial, episodio maníaco o trastorno antisocial de la personalidad.',
        },
        specifiers: [],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 14 · Trastornos relacionados con sustancias y trastornos adictivos
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos relacionados con sustancias y trastornos adictivos',
    chapterId: 'sustancias',
    diagnoses: [
      {
        id: 'tud-alcohol',
        name: 'Trastorno por uso de alcohol',
        icd10: 'F10.xx',
        dsm: '303.90 / 305.00',
        description: 'Patrón problemático de consumo de alcohol con deterioro o malestar clínicamente significativo.',
        criteria: {
          A: 'Patrón problemático de consumo de alcohol con ≥2 síntomas en 12 meses: (1) consumo mayor/más prolongado de lo previsto, (2) deseos persistentes o esfuerzos fallidos de controlar el consumo, (3) mucho tiempo en obtener/consumir/recuperarse, (4) ansias o deseos intensos de consumir (craving), (5) incumplimiento de obligaciones, (6) consumo continuado a pesar de problemas sociales/interpersonales, (7) reducción de actividades sociales/laborales/recreativas, (8) consumo en situaciones físicamente peligrosas, (9) consumo continuado a pesar de saber que causa problemas físicos/psicológicos, (10) tolerancia, (11) síndrome de abstinencia.',
        },
        specifiers: ['En remisión temprana (3-12 meses)', 'En remisión sostenida (≥12 meses)', 'En entorno controlado', 'Leve (2-3 síntomas) / Moderado (4-5) / Grave (≥6)'],
        notes: 'El craving (criterio 4) es nuevo en DSM-5 vs DSM-IV.',
      },
      {
        id: 'tud-cannabis',
        name: 'Trastorno por uso de cannabis',
        icd10: 'F12.xx',
        dsm: '304.30 / 305.20',
        description: 'Patrón problemático de consumo de cannabis con ≥2 síntomas en 12 meses.',
        criteria: {
          A: 'Igual estructura que alcohol (mismos 11 síntomas) aplicados al cannabis.',
        },
        specifiers: ['En remisión temprana / sostenida', 'En entorno controlado', 'Leve / Moderado / Grave'],
        notes: '',
      },
      {
        id: 'tud-estimulantes',
        name: 'Trastorno por uso de estimulantes (cocaína/anfetaminas)',
        icd10: 'F14.xx / F15.xx',
        dsm: '304.20 / 304.40',
        description: 'Patrón problemático de uso de cocaína, anfetaminas u otros estimulantes.',
        criteria: {
          A: 'Igual estructura que alcohol (mismos 11 síntomas) aplicados al estimulante específico.',
        },
        specifiers: ['Sustancia específica', 'En remisión temprana / sostenida', 'Leve / Moderado / Grave'],
        notes: '',
      },
      {
        id: 'tud-opioides',
        name: 'Trastorno por uso de opioides',
        icd10: 'F11.xx',
        dsm: '304.00 / 305.50',
        description: 'Patrón problemático de uso de opioides.',
        criteria: {
          A: 'Igual estructura que alcohol (mismos 11 síntomas) aplicados a opioides.',
        },
        specifiers: ['En terapia de mantenimiento con agonistas', 'En entorno controlado', 'En remisión', 'Leve / Moderado / Grave'],
        notes: '',
      },
      {
        id: 'juego-patologico',
        name: 'Trastorno de juego (juego patológico)',
        icd10: 'F63.0',
        dsm: '312.31',
        description: 'Comportamiento de juego persistente y recurrente que causa deterioro o malestar.',
        criteria: {
          A: 'Comportamiento de juego problemático persistente y recurrente con ≥4 en 12 meses: (1) necesidad de jugar cantidades crecientes de dinero (tolerancia), (2) irritabilidad al intentar reducir el juego (abstinencia), (3) esfuerzos fallidos de controlar el juego, (4) preocupación por el juego, (5) juega para escapar de problemas o disforia, (6) después de perder dinero vuelve a jugar para recuperar, (7) miente para ocultar su afición al juego, (8) ha perdido relaciones/trabajo/oportunidades, (9) depende de otros para conseguir dinero.',
          B: 'El comportamiento no se explica mejor por un episodio maníaco.',
        },
        specifiers: ['Episódico / Persistente', 'En remisión temprana (3-12 meses) / sostenida (≥12 meses)', 'Leve (4-5) / Moderado (6-7) / Grave (8-9)'],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 15 · Trastornos neurocognitivos
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos neurocognitivos',
    chapterId: 'neurocognitivos',
    diagnoses: [
      {
        id: 'tncm',
        name: 'Trastorno neurocognitivo mayor (demencia)',
        icd10: 'F0x.xx / G3x.xx',
        dsm: '294.xx',
        description: 'Declive cognitivo significativo en ≥1 dominio cognitivo con interferencia en la independencia.',
        criteria: {
          A: 'Evidencia de declive cognitivo significativo desde nivel previo de rendimiento en ≥1 dominio cognitivo (atención compleja, función ejecutiva, aprendizaje/memoria, lenguaje, percepción-motora, cognición social), basada en: preocupación del individuo/informante y deterioro documentado por evaluación.',
          B: 'Los déficits cognitivos interfieren con la independencia en las actividades cotidianas.',
          C: 'Los déficits no ocurren exclusivamente en el contexto de un delirium.',
          D: 'Los déficits no se explican mejor por otro trastorno mental.',
        },
        specifiers: ['Debida a EA Alzheimer', 'Por degeneración lobular frontotemporal', 'Con cuerpos de Lewy', 'Vascular', 'Por traumatismo cerebral', 'Inducida por sustancias/medicamentos', 'Por VIH', 'Por enfermedad por priones', 'Por Parkinson', 'Por Huntington', 'Etiología múltiple', 'Sin especificar', 'Con/sin alteración del comportamiento', 'Gravedad: leve, moderado, grave'],
        notes: '',
      },
      {
        id: 'tncleve',
        name: 'Trastorno neurocognitivo leve',
        icd10: 'G31.84',
        dsm: '331.83',
        description: 'Declive cognitivo moderado sin interferencia en la independencia.',
        criteria: {
          A: 'Evidencia de declive cognitivo moderado desde nivel previo en ≥1 dominio cognitivo.',
          B: 'Los déficits cognitivos no interfieren con la independencia.',
          C: 'Los déficits no ocurren exclusivamente en el contexto de un delirium.',
          D: 'No se explican mejor por otro trastorno mental.',
        },
        specifiers: ['(Mismos subtipos etiológicos que TNC mayor)'],
        notes: 'Antes llamado "deterioro cognitivo leve" (DCL/MCI).',
      },
      {
        id: 'delirium',
        name: 'Delirium',
        icd10: 'F05',
        dsm: '293.0',
        description: 'Alteración de la conciencia, cognición y atención con instauración aguda y curso fluctuante.',
        criteria: {
          A: 'Alteración de la atención (capacidad disminuida para dirigir, enfocar, sostener o desviar la atención) y de la conciencia.',
          B: 'Instauración en poco tiempo (horas-días) y tendencia a fluctuar durante el día.',
          C: 'Alteración cognitiva adicional (déficit de memoria, desorientación, lenguaje, percepción).',
          D: 'No se explica mejor por otro trastorno neurocognitivo preexistente.',
          E: 'Hay evidencia de causa médica, intoxicación/abstinencia de sustancias u otras.',
        },
        specifiers: ['Por intoxicación por sustancias', 'Por abstinencia de sustancias', 'Inducido por medicamentos', 'Debido a otra condición médica', 'Debido a etiologías múltiples', 'Hiperactivo / Hipoactivo / Nivel de actividad mixto', 'Agudo (<1 mes) / Persistente (≥1 mes)'],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 16 · Trastornos de la personalidad
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos de la personalidad',
    chapterId: 'personalidad',
    diagnoses: [
      {
        id: 'tpa',
        name: 'Trastorno de la personalidad antisocial',
        icd10: 'F60.2',
        dsm: '301.7',
        description: 'Patrón penetrante de inatención y violación de los derechos de los demás desde los 15 años.',
        criteria: {
          A: 'Patrón penetrante de inatención y violación de los derechos de los demás desde los 15 años con ≥3: (1) incumplimiento de normas sociales, (2) engaño, (3) impulsividad, (4) irritabilidad y agresividad, (5) descuido temerario de sí mismo y de los demás, (6) irresponsabilidad, (7) ausencia de remordimiento.',
          B: 'Edad ≥18 años.',
          C: 'Evidencia de trastorno disocial de inicio antes de 15 años.',
          D: 'No ocurre exclusivamente durante esquizofrenia o trastorno bipolar.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'tpb',
        name: 'Trastorno de la personalidad límite (TPL/BPD)',
        icd10: 'F60.3',
        dsm: '301.83',
        description: 'Inestabilidad de las relaciones interpersonales, autoimagen y afectos, e impulsividad marcada.',
        criteria: {
          A: '≥5 de: (1) esfuerzos frenéticos para evitar abandono real o imaginado, (2) patrón de relaciones interpersonales inestables e intensas, (3) alteración de la identidad, (4) impulsividad ≥2 áreas potencialmente dañinas, (5) comportamientos/amenazas/gestos suicidas o conductas autolesivas recurrentes, (6) inestabilidad afectiva, (7) sensación crónica de vacío, (8) ira inapropiada intensa o dificultad para controlarla, (9) ideación paranoide transitoria o síntomas disociativos graves relacionados con el estrés.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'tp-narcisista',
        name: 'Trastorno de la personalidad narcisista',
        icd10: 'F60.81',
        dsm: '301.81',
        description: 'Patrón penetrante de grandiosidad, necesidad de admiración y falta de empatía.',
        criteria: {
          A: '≥5 de: (1) sentido grandioso de autoimportancia, (2) fantasías de éxito/poder/brillantez ilimitados, (3) creencia de ser especial y único, (4) necesidad de admiración excesiva, (5) sentido de privilegio, (6) explotación interpersonal, (7) falta de empatía, (8) envidia de los demás o creencia de que los demás le envidian, (9) arrogancia.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'tp-histrionico',
        name: 'Trastorno de la personalidad histriónica',
        icd10: 'F60.4',
        dsm: '301.50',
        description: 'Patrón penetrante de emotividad excesiva y búsqueda de atención.',
        criteria: {
          A: '≥5 de: (1) incomodidad cuando no es el centro de atención, (2) interacción sexual inapropiadamente seductora o provocadora, (3) expresión emocional superficial/cambiante, (4) usa aspecto físico para llamar la atención, (5) habla impresionista con pocos detalles, (6) autodramatización y teatralidad, (7) sugestionabilidad, (8) considera relaciones más íntimas de lo que realmente son.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'tp-esquizoide',
        name: 'Trastorno de la personalidad esquizoide',
        icd10: 'F60.1',
        dsm: '301.20',
        description: 'Patrón penetrante de desapego de las relaciones sociales y restricción de la expresión emocional.',
        criteria: {
          A: '≥4 de: (1) no desea ni disfruta relaciones íntimas, (2) casi siempre elige actividades solitarias, (3) poco o ningún interés en experiencias sexuales, (4) pocas actividades le producen placer, (5) carece de amigos íntimos salvo familiares de primer grado, (6) indiferente a elogios o críticas, (7) frialdad emocional/distanciamiento/afectividad aplanada.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'tp-esquizotipico',
        name: 'Trastorno de la personalidad esquizotípica',
        icd10: 'F21',
        dsm: '301.22',
        description: 'Patrón penetrante de déficits sociales/interpersonales con distorsiones cognitivas/perceptivas y excentricidades conductuales.',
        criteria: {
          A: '≥5 de: (1) ideas de referencia, (2) creencias extrañas/pensamiento mágico, (3) experiencias perceptivas inusuales, (4) pensamiento y lenguaje extraño, (5) suspicacia/ideación paranoide, (6) afecto inapropiado o restringido, (7) comportamiento/apariencia extraña/excéntrica, (8) ausencia de amigos íntimos salvo familiares, (9) ansiedad social excesiva.',
          B: 'No ocurre exclusivamente durante esquizofrenia, trastorno bipolar con síntomas psicóticos, TEA u otro trastorno psicótico.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'tp-paranoide',
        name: 'Trastorno de la personalidad paranoide',
        icd10: 'F60.0',
        dsm: '301.0',
        description: 'Patrón penetrante de desconfianza y suspicacia hacia los demás.',
        criteria: {
          A: '≥4 de: (1) sospecha sin fundamento de ser explotado/engañado/perjudicado, (2) preocupación por dudas sobre lealtad/confianza de amigos/socios, (3) reticencia a confiar por miedo a que la información sea usada maliciosamente, (4) lee significados ocultos en comentarios benignos, (5) rencor persistente, (6) percibe ataques a su persona y reacciona con ira, (7) sospecha recurrente e injustificada de infidelidad del cónyuge/pareja.',
          B: 'No ocurre exclusivamente durante esquizofrenia, trastorno bipolar con síntomas psicóticos, TEA u otro trastorno psicótico.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'tp-obsesivo',
        name: 'Trastorno de la personalidad obsesivo-compulsiva (TPOC)',
        icd10: 'F60.5',
        dsm: '301.4',
        description: 'Patrón penetrante de preocupación por el orden, perfeccionismo y control.',
        criteria: {
          A: '≥4 de: (1) preocupación por detalles/normas/listas/orden, (2) perfeccionismo que interfiere con tareas, (3) dedicación excesiva al trabajo, (4) escrupulosidad e inflexibilidad en ética/valores/moral, (5) incapacidad para tirar objetos gastados, (6) reticencia a delegar, (7) mezquindad con el dinero, (8) rigidez y obstinación.',
        },
        specifiers: [],
        notes: 'Distinto del TOC: el TPOC es egosintónico y no presenta obsesiones/compulsiones formales.',
      },
      {
        id: 'tp-evitacion',
        name: 'Trastorno de la personalidad por evitación',
        icd10: 'F60.6',
        dsm: '301.82',
        description: 'Patrón penetrante de inhibición social, sentimientos de incompetencia e hipersensibilidad a la evaluación negativa.',
        criteria: {
          A: '≥4 de: (1) evita actividades laborales con contacto social, (2) reticente a relacionarse salvo que esté seguro de ser aceptado, (3) muestra contención en relaciones íntimas por miedo a humillación, (4) preocupado por ser criticado/rechazado en situaciones sociales, (5) inhibido en situaciones interpersonales nuevas, (6) se ve a sí mismo como socialmente torpe, (7) reticente a asumir riesgos personales o actividades nuevas.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'tp-dependiente',
        name: 'Trastorno de la personalidad dependiente',
        icd10: 'F60.7',
        dsm: '301.6',
        description: 'Necesidad excesiva de ser cuidado que produce comportamiento sumiso y apego.',
        criteria: {
          A: '≥5 de: (1) dificultad para tomar decisiones cotidianas sin consejo excesivo, (2) necesita que otros asuman responsabilidades importantes, (3) dificultad para expresar desacuerdo por miedo a perder apoyo, (4) dificultad para iniciar proyectos solos, (5) va demasiado lejos para obtener apoyo/cuidado, (6) incomodidad/indefensión cuando está solo, (7) busca urgentemente otra relación cuando termina una, (8) preocupación desproporcionada por miedo a ser abandonado.',
        },
        specifiers: [],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 17 · Trastornos parafílicos
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos parafílicos',
    chapterId: 'parafilicos',
    diagnoses: [
      {
        id: 'voyeurismo',
        name: 'Trastorno de voyeurismo',
        icd10: 'F65.3',
        dsm: '302.82',
        description: 'Excitación intensa y recurrente ante la observación de personas desnudas o en actividad sexual sin su consentimiento.',
        criteria: {
          A: 'Durante ≥6 meses, fantasías sexuales intensas y recurrentes, impulsos sexuales o comportamientos que implican observar a una persona desprevenida que está desnuda, desvistiéndose o en actividad sexual.',
          B: 'El individuo ha actuado según estos impulsos con una persona sin su consentimiento, o los impulsos/fantasías causan malestar clínicamente significativo o deterioro.',
          C: 'Edad ≥18 años.',
        },
        specifiers: ['En entorno controlado', 'En remisión total'],
        notes: '',
      },
      {
        id: 'exhibicionismo',
        name: 'Trastorno de exhibicionismo',
        icd10: 'F65.2',
        dsm: '302.4',
        description: 'Excitación intensa y recurrente por la exposición de los propios genitales a personas sin su consentimiento.',
        criteria: {
          A: 'Durante ≥6 meses, fantasías sexuales intensas y recurrentes, impulsos o comportamientos que implican la exposición de los propios genitales a una persona desprevenida.',
          B: 'Ha actuado según estos impulsos sin consentimiento de la otra persona, o los impulsos/fantasías causan malestar significativo.',
        },
        specifiers: ['Atraído sexualmente hacia individuos prepuberales', 'Atraído hacia individuos maduros físicamente', 'Atraído hacia ambos', 'En entorno controlado', 'En remisión total'],
        notes: '',
      },
      {
        id: 'pedofilia',
        name: 'Trastorno pedofílico',
        icd10: 'F65.4',
        dsm: '302.2',
        description: 'Excitación sexual intensa y recurrente hacia niños prepuberales.',
        criteria: {
          A: 'Durante ≥6 meses, fantasías sexuales intensas y recurrentes, impulsos sexuales o comportamientos que implican actividad sexual con niños prepuberales (generalmente ≤13 años).',
          B: 'Ha actuado según estos impulsos sexuales, o los impulsos o fantasías sexuales causan malestar acusado o dificultades interpersonales.',
          C: 'Edad ≥16 años y ≥5 años mayor que los niños del criterio A.',
        },
        specifiers: ['Tipo exclusivo / No exclusivo', 'Atraído solo hacia varones / Mujeres / Ambos sexos', 'Limitado al incesto'],
        notes: '',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CAPÍTULO 18 · Otros trastornos mentales y condiciones de atención clínica
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Otros trastornos relevantes',
    chapterId: 'otros',
    diagnoses: [
      {
        id: 'disforia-genero',
        name: 'Disforia de género',
        icd10: 'F64.0 / F64.8',
        dsm: '302.85 / 302.6',
        description: 'Incongruencia marcada entre el género experimentado y el género asignado.',
        criteria: {
          A: 'Incongruencia marcada entre el género que uno experimenta/expresa y el género asignado, de ≥6 meses de duración, manifestada por ≥2: incongruencia marcada entre el género experimentado y las características sexuales primarias/secundarias, fuerte deseo de deshacerse de las características sexuales, fuerte deseo por las características del otro género, fuerte deseo de ser del otro género, fuerte deseo de ser tratado como del otro género, convicción firme de tener sentimientos/reacciones del otro género.',
          B: 'La condición se asocia con malestar clínicamente significativo o deterioro.',
        },
        specifiers: ['Con trastorno de desarrollo sexual', 'Posttransición'],
        notes: 'Diagnóstico separado para niños (F64.8) y adolescentes/adultos (F64.0).',
      },
      {
        id: 'trastorno-comunicacion-social',
        name: 'Trastorno de la comunicación social (pragmática)',
        icd10: 'F80.89',
        dsm: '315.39',
        description: 'Dificultades persistentes en el uso social de la comunicación verbal y no verbal.',
        criteria: {
          A: 'Dificultades persistentes en el uso social de la comunicación verbal y no verbal con ≥1: déficits en el uso de la comunicación para propósitos sociales, deterioro en la capacidad de cambiar la comunicación para adaptarse al contexto, dificultad para seguir reglas de conversación, dificultad para comprender lo implícito.',
          B: 'Los déficits dan lugar a limitaciones funcionales en comunicación efectiva/participación social/relaciones/logros académicos/laborales.',
          C: 'Inicio en las primeras fases del período de desarrollo.',
          D: 'No se atribuye a baja capacidad en los dominios de la estructura del lenguaje.',
          E: 'No se explica mejor por TEA, discapacidad intelectual, retraso global del desarrollo u otro trastorno.',
        },
        specifiers: [],
        notes: '',
      },
      {
        id: 'trastorno-reactivo-apego-desinhibido',
        name: 'Trastorno de relación social desinhibida',
        icd10: 'F94.2',
        dsm: '313.89',
        description: 'Patrón de comportamiento en el que el niño se aproxima e interactúa activamente con adultos extraños.',
        criteria: {
          A: 'Patrón en que el niño se aproxima activamente e interactúa con adultos extraños con ≥2: reducción/ausencia de reticencia a acercarse a extraños, comportamiento verbal/físico excesivamente familiar, disminución/ausencia de comprobación con el cuidador en excursiones a lugares desconocidos, voluntad de marcharse con un adulto extraño.',
          B: 'El criterio A no se limita a impulsividad sino que incluye comportamiento socialmente desinhibido.',
          C: 'El niño ha experimentado un patrón extremo de cuidado insuficiente.',
          D: 'El criterio C es la causa presumible del comportamiento.',
          E: 'Edad de desarrollo ≥9 meses.',
        },
        specifiers: ['Persistente (>12 meses)', 'Grave'],
        notes: '',
      },
    ],
  },
]

// ── Utilidades de búsqueda ────────────────────────────────────────────────────

/** Aplanar todos los diagnósticos con su capítulo */
export const allDiagnoses = DSM5TR.flatMap(chapter =>
  chapter.diagnoses.map(d => ({ ...d, chapter: chapter.chapter, chapterId: chapter.chapterId }))
)

/** Buscar diagnósticos por texto */
export const searchDSM = (query) => {
  if (!query?.trim()) return allDiagnoses
  const q = query.toLowerCase()
  return allDiagnoses.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.icd10.toLowerCase().includes(q) ||
    d.dsm.includes(q) ||
    d.description.toLowerCase().includes(q) ||
    Object.values(d.criteria).some(v => v.toLowerCase().includes(q))
  )
}
