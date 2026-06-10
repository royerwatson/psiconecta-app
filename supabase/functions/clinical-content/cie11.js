/**
 * CIE-11 / ICD-11 — Clasificación Internacional de Enfermedades, 11.ª revisión
 * Organización Mundial de la Salud (OMS), 2022.
 * Capítulo 06: Trastornos mentales, del comportamiento o del neurodesarrollo
 * Capítulo 07: Trastornos del sueño o la vigilia (selección)
 *
 * Características esenciales parafraseadas con fines educativos/clínicos.
 * Para uso diagnóstico oficial consulta: https://icd.who.int/browse/2024-01/mms/es
 *
 * Novedades clave respecto a CIE-10:
 *  - TEPT Complejo (6B41) como diagnóstico independiente
 *  - Trastorno de la personalidad: modelo dimensional (gravedad + rasgos)
 *  - Trastorno de juego (incluye videojuegos) — 6C51
 *  - Trastorno de duelo prolongado — 6B42
 *  - Disforia de género → Incongruencia de género (cap. 17, despatologizado)
 *  - Trastorno de estrés agudo eliminado como categoría formal
 */

export const CIE11 = [
  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 1 · Trastornos del neurodesarrollo (6A00–6A0Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos del neurodesarrollo',
    chapterId: 'neurodesarrollo',
    block: '6A00–6A0Z',
    diagnoses: [
      {
        id: 'di-leve',
        code: '6A00.0',
        name: 'Trastorno del desarrollo intelectual leve',
        description: 'Déficits significativos en el funcionamiento intelectual y en la conducta adaptativa que surgieron durante el período de desarrollo.',
        features: 'El funcionamiento intelectual está significativamente por debajo del promedio (típicamente CI 50–69). Déficits en conducta adaptativa conceptual (comunicación, lectura, escritura, matemáticas), social y práctica. Inicio durante el período de desarrollo. Individuos con TDI leve suelen adquirir habilidades académicas básicas y lograr cierta independencia.',
        notes: 'La evaluación debe considerar el contexto cultural y lingüístico. El CI por sí solo no es suficiente para el diagnóstico.',
        specifiers: ['6A00.0 Leve', '6A00.1 Moderado', '6A00.2 Grave', '6A00.3 Profundo', '6A00.Z Sin especificación de gravedad'],
      },
      {
        id: 'tea-cie',
        code: '6A02',
        name: 'Trastorno del espectro autista (TEA)',
        description: 'Déficits persistentes en la capacidad de iniciar y mantener la interacción social recíproca y la comunicación social, y una gama de patrones de comportamiento e intereses restringidos, repetitivos e inflexibles.',
        features: 'Déficits en reciprocidad socioemocional: dificultad para iniciar/responder interacciones, compartir emociones o intereses. Déficits en comunicación no verbal: contacto visual, expresión facial, gestos y lenguaje corporal. Dificultades en el desarrollo y mantenimiento de relaciones. Comportamientos restringidos/repetitivos: movimientos estereotipados, insistencia en la uniformidad, intereses muy restringidos, hiper/hiporreactividad sensorial. Los síntomas están presentes desde el período temprano del desarrollo, aunque pueden no manifestarse completamente hasta que las demandas sociales superan las capacidades.',
        notes: 'CIE-11 especifica con/sin trastorno funcional intelectual y con/sin trastorno del lenguaje funcional. La gravedad no se codifica como niveles fijos sino por los apoyos requeridos.',
        specifiers: [
          '6A02.0 Sin trastorno del desarrollo intelectual, con lenguaje funcional levemente alterado o no alterado',
          '6A02.1 Con trastorno del desarrollo intelectual, con lenguaje funcional levemente alterado o no alterado',
          '6A02.2 Sin trastorno del desarrollo intelectual, con lenguaje funcional alterado',
          '6A02.3 Con trastorno del desarrollo intelectual, con lenguaje funcional alterado',
          '6A02.5 Sin trastorno del desarrollo intelectual, sin lenguaje funcional',
          '6A02.6 Con trastorno del desarrollo intelectual, sin lenguaje funcional',
        ],
      },
      {
        id: 'tdah-cie',
        code: '6A05',
        name: 'Trastorno por déficit de atención con hiperactividad (TDAH)',
        description: 'Patrón persistente de inatención y/o hiperactividad-impulsividad que interfiere directamente con el funcionamiento.',
        features: 'Inatención: dificultad para mantener la atención en tareas, parece no escuchar, no completa tareas, dificultad de organización, evita esfuerzo mental sostenido, pierde objetos, fácilmente distraído. Hiperactividad-impulsividad: mueve manos/pies, se levanta, corre en situaciones inapropiadas, incapaz de jugar silenciosamente, habla excesivamente, responde antes de terminar preguntas, dificultad para esperar, interrumpe. Los síntomas están presentes en múltiples entornos, desde antes de los 12 años, y causan deterioro funcional significativo.',
        notes: 'CIE-11 especifica la presentación predominante actual: inatenta, hiperactiva-impulsiva o combinada. En adultos los síntomas de hiperactividad suelen ser subjetivos (inquietud interna).',
        specifiers: [
          '6A05.0 Presentación predominantemente inatenta',
          '6A05.1 Presentación predominantemente hiperactiva-impulsiva',
          '6A05.2 Presentación combinada',
          '6A05.Z Sin especificación',
        ],
      },
      {
        id: 'tourette-cie',
        code: '6A90',
        name: 'Síndrome de Tourette',
        description: 'Tics motores múltiples combinados con al menos un tic vocal/fónico, con inicio en la infancia.',
        features: 'Múltiples tics motores y al menos un tic vocal presentes en algún momento de la enfermedad (no necesariamente simultáneos). Los tics pueden variar en frecuencia, tipo y gravedad. Inicio antes de los 18 años. Duración >1 año desde el primer tic. Los tics no se deben a sustancias u otras condiciones médicas.',
        notes: 'Los tics con frecuencia se suprimen voluntariamente durante períodos breves. Son típicamente precedidos por urgencias premonitorias.',
        specifiers: [],
      },
      {
        id: 'dislexia-cie',
        code: '6A03',
        name: 'Trastorno del desarrollo del aprendizaje',
        description: 'Dificultades significativas y persistentes en el aprendizaje de habilidades académicas.',
        features: 'Dificultades en lectura (precisión, velocidad, comprensión), escritura (ortografía, expresión escrita) o matemáticas (sentido numérico, cálculo, razonamiento). Las habilidades afectadas están significativamente por debajo de lo esperado para la edad cronológica. Inicio durante el período escolar. No explicado por discapacidad intelectual, déficits sensoriales, trastornos neurológicos u oportunidades educativas inadecuadas.',
        notes: '',
        specifiers: [
          '6A03.0 Con dificultad en la lectura',
          '6A03.1 Con dificultad en la expresión escrita',
          '6A03.2 Con dificultad en matemáticas',
          '6A03.3 Con dificultad en lectura y matemáticas',
          '6A03.4 Con dificultad en lectura y expresión escrita',
          '6A03.5 Con dificultad en matemáticas y expresión escrita',
          '6A03.6 Con dificultad en lectura, expresión escrita y matemáticas',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 2 · Esquizofrenia y otros trastornos psicóticos primarios (6A20–6A2Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Esquizofrenia y otros trastornos psicóticos primarios',
    chapterId: 'psicoticos',
    block: '6A20–6A2Z',
    diagnoses: [
      {
        id: 'esquizofrenia-cie',
        code: '6A20',
        name: 'Esquizofrenia',
        description: 'Trastorno psicótico caracterizado por distorsiones del pensamiento, la percepción, las emociones, el lenguaje, el sentido del yo y el comportamiento.',
        features: 'Síntomas positivos: delirios (creencias falsas fijas), alucinaciones (percepciones sin estímulo), pensamiento desorganizado (inferido por el discurso), experiencias de influencia/control. Síntomas negativos: afecto aplanado, alogia, abulia, anhedonia, asocialidad. Síntomas de desorganización: comportamiento desorganizado/imprevisible, afecto inapropiado. Síntomas psicomotores: agitación psicomotora, enlentecimiento, manierismos. Síntomas cognitivos: deterioro de atención, memoria de trabajo y funciones ejecutivas. Los síntomas están presentes durante ≥1 mes (fase activa); duración total del episodio ≥1 mes.',
        notes: 'CIE-11 elimina los subtipos de esquizofrenia (paranoide, desorganizada, catatónica) que existían en CIE-10, reemplazándolos por especificadores dimensionales.',
        specifiers: [
          'Primer episodio',
          'Episodios múltiples',
          'Continuo',
          'Con catatonía (6A20 & 6A4Z)',
          'En remisión parcial',
          'En remisión completa',
        ],
      },
      {
        id: 'trastorno-esquizofreniforme-cie',
        code: '6A21',
        name: 'Trastorno esquizofreniforme',
        description: 'Síntomas equivalentes a los de la esquizofrenia pero con una duración del episodio de 1 día a 1 mes.',
        features: 'Presencia de ≥1 síntoma psicótico positivo (delirios, alucinaciones, discurso desorganizado, comportamiento desorganizado). Duración del episodio de 1 día a menos de 1 mes. El individuo retorna al nivel de funcionamiento previo. No atribuible a sustancias u otras condiciones médicas.',
        notes: 'Equivale al trastorno psicótico breve del DSM-5 cuando dura <1 mes. Si la duración es 1-6 meses, en DSM-5 sería trastorno esquizofreniforme.',
        specifiers: ['Con buen pronóstico', 'Sin especificación de pronóstico'],
      },
      {
        id: 'trastorno-esquizoafectivo-cie',
        code: '6A22',
        name: 'Trastorno esquizoafectivo',
        description: 'Episodios en que se cumplen criterios de esquizofrenia y de trastorno del estado de ánimo de forma simultánea.',
        features: 'Episodio en que se cumplen criterios tanto de esquizofrenia como de depresión o manía concurrentemente. Los síntomas del estado de ánimo están presentes durante una parte significativa del episodio total. Fuera de los episodios de estado de ánimo, persisten síntomas psicóticos (delirios o alucinaciones) por al menos algunas semanas.',
        notes: '',
        specifiers: ['6A22.0 Tipo maníaco', '6A22.1 Tipo depresivo', '6A22.2 Tipo mixto'],
      },
      {
        id: 'trastorno-delirante-cie',
        code: '6A24',
        name: 'Trastorno delirante',
        description: 'Presencia de uno o más delirios sin otros síntomas de esquizofrenia.',
        features: 'Uno o más delirios persistentes (≥3 meses). En ausencia de otros síntomas psicóticos prominentes como alucinaciones, pensamiento desorganizado o síntomas negativos. El funcionamiento no está muy deteriorado fuera del impacto del delirio. Tipos comunes: persecutorio, de grandiosidad, erotomaníaco, celotípico, somático.',
        notes: 'Puede haber alucinaciones táctiles u olfativas relacionadas con el tema del delirio.',
        specifiers: ['Tipo persecutorio', 'Tipo de grandiosidad', 'Tipo erotomaníaco', 'Tipo celotípico', 'Tipo somático', 'Tipo mixto'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 3 · Trastornos del estado de ánimo (6A60–6A8Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos del estado de ánimo',
    chapterId: 'animo',
    block: '6A60–6A8Z',
    diagnoses: [
      {
        id: 'episodio-depresivo',
        code: '6A70',
        name: 'Episodio depresivo',
        description: 'Período de estado de ánimo deprimido o pérdida de interés durante al menos 2 semanas, con síntomas adicionales asociados.',
        features: 'Estado de ánimo deprimido (la mayor parte del día, casi todos los días) o pérdida del interés o placer en actividades. Más síntomas adicionales: cambios de peso/apetito, insomnio o hipersomnia, agitación o enlentecimiento psicomotor, fatiga o pérdida de energía, sentimientos de inutilidad o culpa excesiva, dificultad para pensar o concentrarse, pensamientos recurrentes de muerte o ideación suicida. Los síntomas causan deterioro funcional significativo. Duración mínima de 2 semanas.',
        notes: 'CIE-11 distingue el episodio depresivo único del trastorno depresivo recurrente. También especifica la presencia de síntomas psicóticos o melancólicos.',
        specifiers: [
          '6A70.0 Leve, sin síntomas somáticos',
          '6A70.1 Leve, con síntomas somáticos',
          '6A70.2 Moderado, sin síntomas psicóticos',
          '6A70.3 Moderado, con síntomas psicóticos',
          '6A70.4 Grave, sin síntomas psicóticos',
          '6A70.5 Grave, con síntomas psicóticos',
          'Con patrón melancólico',
          'Con inicio en el periparto',
          'Con patrón estacional',
        ],
      },
      {
        id: 'trastorno-depresivo-recurrente',
        code: '6A71',
        name: 'Trastorno depresivo recurrente',
        description: 'Dos o más episodios depresivos sin antecedentes de episodios maníacos, mixtos o hipomaníacos.',
        features: 'Historia de ≥2 episodios depresivos separados por al menos varios meses sin síntomas depresivos significativos. Nunca ha habido episodio maníaco, hipomaníaco o mixto. Los episodios actuales o pasados cumplen criterios de episodio depresivo.',
        notes: 'La recurrencia aumenta significativamente el riesgo de episodios futuros. El tratamiento profiláctico está indicado tras el segundo episodio.',
        specifiers: ['Actualmente en episodio leve/moderado/grave', 'Actualmente en remisión', 'Con patrón estacional'],
      },
      {
        id: 'distimia-cie',
        code: '6A72',
        name: 'Trastorno depresivo persistente (distimia)',
        description: 'Estado de ánimo deprimido persistente durante ≥2 años con síntomas adicionales.',
        features: 'Estado de ánimo deprimido persistente durante la mayor parte del día, la mayoría de los días, por ≥2 años (≥1 año en niños/adolescentes). Junto con ≥2 de: poco apetito o sobrealimentación, insomnio o hipersomnia, baja energía o fatiga, baja autoestima, dificultad para concentrarse, sensación de desesperanza. Nunca ha estado libre de síntomas >2 meses consecutivos durante el período de 2 años.',
        notes: 'Puede coexistir con episodios depresivos mayores ("doble depresión"). El inicio temprano (antes de los 21 años) se asocia con mayor gravedad y comorbilidad.',
        specifiers: ['Con inicio temprano (<21 años)', 'Con inicio tardío (≥21 años)', 'Con episodio depresivo concurrente'],
      },
      {
        id: 'bipolar-i-cie',
        code: '6A60',
        name: 'Trastorno bipolar tipo I',
        description: 'Al menos un episodio maníaco, con o sin episodios depresivos.',
        features: 'Episodio maníaco: estado de ánimo eufórico, expansivo o irritable, marcadamente anormal, con aumento de energía o actividad durante ≥1 semana (cualquier duración si requiere hospitalización). ≥3 síntomas adicionales: autoestima inflada/grandiosidad, disminución de la necesidad de sueño, más hablador de lo habitual, fuga de ideas, distractibilidad, aumento de actividad dirigida a objetivos, comportamientos de riesgo. Suficientemente grave para causar deterioro funcional marcado o requiere hospitalización para prevenir daño.',
        notes: 'El episodio maníaco puede incluir síntomas psicóticos. CIE-11 unifica los episodios mixtos como episodios con características mixtas.',
        specifiers: [
          'Episodio actual maníaco: leve, moderado, grave sin síntomas psicóticos, grave con síntomas psicóticos',
          'Episodio actual depresivo: leve, moderado, grave',
          'Episodio actual mixto',
          'Actualmente en remisión parcial o completa',
          'Con ciclos rápidos (≥4 episodios/año)',
          'Con patrón estacional',
        ],
      },
      {
        id: 'bipolar-ii-cie',
        code: '6A61',
        name: 'Trastorno bipolar tipo II',
        description: 'Al menos un episodio hipomaníaco y al menos un episodio depresivo, sin episodios maníacos completos.',
        features: 'Episodio hipomaníaco: igual que el maníaco pero de menor gravedad (duración ≥4 días) y sin causar deterioro funcional marcado ni requerir hospitalización; sin síntomas psicóticos. Historial de ≥1 episodio depresivo. Nunca ha habido un episodio maníaco completo.',
        notes: 'El diagnóstico requiere historia tanto de hipomanía como de depresión. Un solo episodio hipomaníaco sin depresión no es suficiente.',
        specifiers: ['Episodio actual hipomaníaco', 'Episodio actual depresivo: leve, moderado, grave', 'En remisión', 'Con ciclos rápidos'],
      },
      {
        id: 'ciclotimia-cie',
        code: '6A62',
        name: 'Trastorno ciclotímico',
        description: 'Inestabilidad crónica del estado de ánimo con numerosos períodos de síntomas hipomaníacos y depresivos subumbrales.',
        features: 'Inestabilidad crónica del estado de ánimo durante ≥2 años (≥1 año en niños/adolescentes) con períodos de síntomas hipomaníacos y períodos de síntomas depresivos que no cumplen criterios completos de episodio. Los síntomas están presentes durante ≥la mitad del tiempo y el individuo no ha estado libre de síntomas por >2 meses consecutivos.',
        notes: 'El 15-50% de los individuos con ciclotimia desarrolla posteriormente trastorno bipolar tipo I o II.',
        specifiers: [],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 4 · Trastornos de ansiedad o relacionados con el miedo (6B00–6B0Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos de ansiedad o relacionados con el miedo',
    chapterId: 'ansiedad',
    block: '6B00–6B0Z',
    diagnoses: [
      {
        id: 'tag-cie',
        code: '6B00',
        name: 'Trastorno de ansiedad generalizada (TAG)',
        description: 'Ansiedad y preocupación excesivas sobre múltiples eventos o actividades durante ≥varios meses.',
        features: 'Ansiedad y preocupación excesivas, persistentes y difíciles de controlar, sobre múltiples áreas (trabajo, salud, familia, finanzas, eventos cotidianos). Síntomas físicos/cognitivos asociados: tensión muscular, inquietud, fatigabilidad, dificultad para concentrarse, irritabilidad, alteraciones del sueño. Los síntomas causan deterioro funcional significativo. Duración ≥varios meses.',
        notes: 'La preocupación es percibida como difícil de controlar, a diferencia de la preocupación normal que el individuo puede gestionar.',
        specifiers: [],
      },
      {
        id: 'trastorno-panico-cie',
        code: '6B01',
        name: 'Trastorno de pánico',
        description: 'Ataques de pánico recurrentes e inesperados con preocupación persistente o cambios conductuales.',
        features: 'Ataques de pánico recurrentes e inesperados: oleadas súbitas de miedo o malestar intenso que alcanzan su máximo en minutos con síntomas físicos (palpitaciones, sudoración, temblor, disnea, sensación de ahogo, dolor torácico, náuseas, mareo, escalofríos/sofocones, parestesias) y/o cognitivos (despersonalización/desrealización, miedo a perder el control, miedo a morir). Tras los ataques: preocupación persistente por nuevos ataques o sus consecuencias, y/o cambios desadaptativos del comportamiento relacionados con los ataques.',
        notes: 'Un ataque de pánico aislado no es trastorno de pánico. Los ataques de pánico pueden ocurrir en el contexto de otros trastornos de ansiedad.',
        specifiers: [],
      },
      {
        id: 'agorafobia-cie',
        code: '6B02',
        name: 'Agorafobia',
        description: 'Miedo o ansiedad marcados ante situaciones en las que escapar podría ser difícil o donde no se dispondría de ayuda.',
        features: 'Miedo o ansiedad marcados en ≥2 situaciones: uso de transporte público, estar en espacios abiertos, estar en espacios cerrados, hacer cola o estar en multitudes, estar fuera de casa solo. Las situaciones se evitan o requieren compañía o se soportan con miedo intenso. El miedo es desproporcionado al peligro real y persiste ≥varios meses.',
        notes: 'En CIE-11 se diagnostica independientemente de si hay o no trastorno de pánico comórbido.',
        specifiers: [],
      },
      {
        id: 'fobia-especifica-cie',
        code: '6B03',
        name: 'Fobia específica',
        description: 'Miedo o ansiedad marcados y desproporcionados ante objetos o situaciones específicas.',
        features: 'Miedo o ansiedad marcados, inmediatos y consistentes ante un objeto o situación específica (animales, alturas, tormentas, agua, oscuridad, sangre-inyección-herida, vuelos, espacios cerrados, vómito). El estímulo se evita activamente o se soporta con intensa ansiedad. El miedo es desproporcionado al peligro real y persiste ≥varios meses. Causa deterioro funcional significativo.',
        notes: '',
        specifiers: ['Tipo animal', 'Tipo entorno natural', 'Tipo sangre-inyección-herida', 'Tipo situacional', 'Tipo otro'],
      },
      {
        id: 'ansiedad-social-cie',
        code: '6B04',
        name: 'Trastorno de ansiedad social',
        description: 'Miedo o ansiedad marcados en situaciones sociales donde el individuo puede ser evaluado negativamente.',
        features: 'Miedo o ansiedad marcados ante situaciones sociales donde el individuo puede ser observado o evaluado por otros (conversaciones, encuentros con personas desconocidas, ser observado mientras come/bebe, actuación en público). El individuo teme actuar de manera que resulte humillante o que otros noten su ansiedad. Las situaciones sociales casi siempre provocan miedo o ansiedad y se evitan o se soportan con malestar intenso. Dura ≥varios meses.',
        notes: 'Distinguir de la timidez normal: la ansiedad social del trastorno es desproporcionada y causa deterioro funcional.',
        specifiers: ['Solo de actuación'],
      },
      {
        id: 'ansiedad-separacion-cie',
        code: '6B05',
        name: 'Trastorno de ansiedad por separación',
        description: 'Miedo o ansiedad excesivos respecto a la separación real o anticipada de figuras de apego.',
        features: 'Miedo o ansiedad excesivos sobre la separación de figuras de apego, manifestado por: malestar intenso ante la separación o la anticipación de ésta, preocupación por el posible daño a figuras de apego, negativa a salir o a estar solo, pesadillas sobre separación, síntomas somáticos ante la separación. Los síntomas son inapropiados para el nivel de desarrollo y persisten ≥varios meses.',
        notes: 'Puede diagnosticarse en adultos; la manifestación puede diferir de la infantil (p. ej., no poder trabajar sin contacto con la pareja).',
        specifiers: [],
      },
      {
        id: 'mutismo-selectivo-cie',
        code: '6B06',
        name: 'Mutismo selectivo',
        description: 'Incapacidad consistente para hablar en situaciones sociales específicas a pesar de hacerlo en otras.',
        features: 'Fracaso consistente para hablar en situaciones sociales específicas donde hay expectativa de hablar (escuela, trabajo) a pesar de poder hacerlo en otras situaciones. El trastorno interfiere con el rendimiento educativo/laboral o la comunicación social. Duración ≥1 mes (excluyendo el primer mes escolar). No atribuible a falta de conocimiento del idioma. No explicado por TEA, trastorno psicótico u otro trastorno del lenguaje.',
        notes: '',
        specifiers: [],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 5 · Trastornos obsesivos-compulsivos y relacionados (6B20–6B2Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos obsesivos-compulsivos y relacionados',
    chapterId: 'ocd',
    block: '6B20–6B2Z',
    diagnoses: [
      {
        id: 'toc-cie',
        code: '6B20',
        name: 'Trastorno obsesivo-compulsivo (TOC)',
        description: 'Obsesiones y/o compulsiones que consumen tiempo y causan malestar significativo o deterioro funcional.',
        features: 'Obsesiones: pensamientos, imágenes o impulsos intrusivos, no deseados y recurrentes que el individuo intenta ignorar o neutralizar. Compulsiones: comportamientos repetitivos (lavarse, ordenar, comprobar) o actos mentales (contar, rezar, repetir palabras) en respuesta a obsesiones o según reglas rígidas, dirigidos a prevenir eventos temidos o reducir la ansiedad. Las obsesiones/compulsiones consumen tiempo significativo (típicamente >1 h/día) o causan deterioro funcional. El individuo tiene en algún momento del curso algún grado de reconocimiento de que las obsesiones/compulsiones son excesivas (excepto en formas con ausencia de introspección).',
        notes: 'CIE-11 incluye un especificador de grado de introspección, lo que reconoce la dimensión desde buena hasta ausente (con creencias delirantes).',
        specifiers: ['Con buena introspección', 'Con poca introspección', 'Con ausencia de introspección', 'Con tics comórbidos'],
      },
      {
        id: 'tdc-cie',
        code: '6B21',
        name: 'Trastorno dismorfofóbico (TDC)',
        description: 'Preocupación persistente por defectos percibidos en la apariencia física que no son observables o son mínimos para otros.',
        features: 'Preocupación excesiva por uno o más defectos percibidos en la apariencia física que son no observables o mínimos para otros. Como respuesta a la preocupación, el individuo realiza comportamientos repetitivos (mirarse en el espejo, acicalarse excesivamente, rascarse la piel, buscar tranquilización) o actos mentales repetitivos (compararse con otros). Los síntomas causan deterioro funcional significativo. La preocupación no se explica mejor por trastorno alimentario o dismorfofobia muscular.',
        notes: '',
        specifiers: ['Con dismorfia muscular', 'Con buena/poca/nula introspección'],
      },
      {
        id: 'olfativo-referencia',
        code: '6B22',
        name: 'Trastorno de referencia olfativa',
        description: 'Preocupación persistente por emitir un olor corporal desagradable que otros no perciben o perciben mínimamente.',
        features: 'Preocupación excesiva por la percepción de emitir un olor corporal o aliento desagradable que el individuo cree que otros perciben como ofensivo o repulsivo. Los olores preocupan al individuo pero en realidad no son perceptibles o son mínimos. Comportamientos repetitivos en respuesta: ducharse excesivamente, cambiar de ropa, buscar tranquilización, verificar el olor. Los síntomas causan deterioro funcional significativo.',
        notes: 'Es una categoría nueva en CIE-11, no presente en CIE-10.',
        specifiers: [],
      },
      {
        id: 'acumulacion-cie',
        code: '6B24',
        name: 'Trastorno de acumulación',
        description: 'Dificultad persistente para descartar posesiones independientemente de su valor real.',
        features: 'Dificultad persistente para descartar o separarse de posesiones por necesidad percibida de guardarlas y malestar al deshacerse de ellas. Acumulación de posesiones que abarrotan y obstruyen las áreas de vivienda activa al punto de comprometer su uso previsto. Los síntomas causan deterioro funcional significativo. La acumulación no se debe a una condición médica u otro trastorno mental.',
        notes: '',
        specifiers: ['Con adquisición excesiva', 'Con buena/poca/nula introspección'],
      },
      {
        id: 'tricotilomania-cie',
        code: '6B25',
        name: 'Tricotilomanía',
        description: 'Arrancarse el propio cabello o vello corporal de forma recurrente con pérdida notable.',
        features: 'Arrancarse recurrentemente el cabello u otro vello corporal resultando en pérdida notable. Intentos repetidos de disminuir o detener el comportamiento. Los síntomas causan deterioro funcional significativo. No explicado por otra condición médica ni por TOC.',
        notes: '',
        specifiers: [],
      },
      {
        id: 'excoriacion-cie',
        code: '6B26',
        name: 'Trastorno de excoriación (rascado de piel)',
        description: 'Rascado recurrente de la propia piel causando lesiones cutáneas.',
        features: 'Rascado recurrente de la propia piel resultando en lesiones cutáneas. Intentos repetidos de disminuir o detener el comportamiento. Los síntomas causan deterioro funcional significativo. No explicado por otra condición médica ni por TOC.',
        notes: 'Las lesiones pueden afectar cualquier parte del cuerpo; la cara, brazos y manos son las más comunes.',
        specifiers: [],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 6 · Trastornos específicamente asociados con el estrés (6B40–6B4Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos específicamente asociados con el estrés',
    chapterId: 'estres',
    block: '6B40–6B4Z',
    diagnoses: [
      {
        id: 'tept-cie',
        code: '6B40',
        name: 'Trastorno de estrés postraumático (TEPT)',
        description: 'Desarrollo de síntomas característicos tras la exposición a un acontecimiento extremadamente amenazante o terrorífico.',
        features: '1. Re-experimentación: recuerdos intrusivos vívidos, flashbacks, pesadillas del evento traumático con acompañamiento emocional intenso. 2. Evitación: esfuerzo deliberado por evitar pensamientos/sentimientos relacionados con el trauma, y/o personas/situaciones/conversaciones que lo recuerden. 3. Percepción persistente de amenaza actual: hipervigilancia, respuesta de sobresalto exagerada. Los síntomas duran ≥varias semanas y causan deterioro funcional significativo. Pueden tener inicio diferido (meses o años después del trauma).',
        notes: 'CIE-11 simplifica el TEPT respecto a CIE-10 y DSM-5: solo requiere 3 grupos de síntomas centrales (re-experimentación, evitación, percepción de amenaza), sin los criterios cognitivos/emocionales negativos ni la hiperactivación del DSM-5.',
        specifiers: [],
      },
      {
        id: 'tept-complejo',
        code: '6B41',
        name: 'Trastorno de estrés postraumático complejo (TEPT-C)',
        description: 'Cumple criterios de TEPT más alteraciones graves y persistentes en la autorregulación afectiva, identidad y relaciones interpersonales. Diagnóstico NUEVO en CIE-11.',
        features: 'Cumple todos los criterios del TEPT (6B40) MÁS: 1. Desregulación afectiva grave: hipersensibilidad emocional, explosiones de ira, dificultad para regular emociones. 2. Creencias negativas persistentes sobre uno mismo (sentirse destruido, sin valor, culpable de manera global). 3. Dificultades persistentes en las relaciones: distanciamiento, dificultad para sentirse cercano a otros, falta de interés en relaciones. Típicamente asociado a traumas prolongados, repetidos o interpersonales (abuso en la infancia, tortura, esclavitud, violencia doméstica prolongada).',
        notes: 'DIAGNÓSTICO NUEVO EN CIE-11, no presente en CIE-10. El DSM-5 no reconoce el TEPT-C como diagnóstico separado, aunque la investigación lo avala ampliamente.',
        specifiers: [],
      },
      {
        id: 'duelo-prolongado',
        code: '6B42',
        name: 'Trastorno de duelo prolongado',
        description: 'Respuesta de duelo persistente y generalizada que no remite después de un período de adaptación esperado. Diagnóstico NUEVO en CIE-11.',
        features: 'Añoranza intensa o persistente por el fallecido, o preocupación persistente por el fallecido (pensamientos, imágenes, recuerdos intrusivos). Acompañado de intenso malestar emocional: tristeza, culpa, enojo, negación, dificultad para aceptar la muerte, sentirse solo, vacío o sin sentido. Los síntomas persisten durante más tiempo del esperado según el contexto cultural y social del individuo (≥6 meses en adultos, ≥varios meses en niños/adolescentes). Los síntomas causan deterioro funcional significativo.',
        notes: 'DIAGNÓSTICO NUEVO EN CIE-11. El DSM-5-TR también lo incluye desde 2022 (trastorno de duelo prolongado). Se diferencia del duelo normal en la intensidad, persistencia y deterioro funcional.',
        specifiers: [],
      },
      {
        id: 'trastorno-adaptacion-cie',
        code: '6B43',
        name: 'Trastorno de adaptación',
        description: 'Respuesta de malestar desproporcionada a un factor de estrés identificable con síntomas afectivos o conductuales.',
        features: 'Dificultad para adaptarse a uno o más estresores identificables (eventos vitales, cambios de vida, divorcio, duelo, desastres). Manifestada por preocupación excesiva, pensamientos recurrentes sobre el estresor, o incapacidad para adaptarse que afecta el funcionamiento cotidiano. Los síntomas surgieron dentro del mes siguiente al estresor. No cumplen criterios de otro trastorno del estado de ánimo o ansiedad. Los síntomas suelen resolverse en 6 meses al cesar el estresor (pueden persistir más en exposición crónica).',
        notes: 'CIE-11 simplifica los subtipos de CIE-10. No requiere especificar el tipo predominante de síntoma.',
        specifiers: [],
      },
      {
        id: 'trastorno-apego-reactivo-cie',
        code: '6B44',
        name: 'Trastorno de apego reactivo',
        description: 'Patrón de comportamiento anormal en las relaciones sociales, consecuencia de cuidado insuficiente en la primera infancia.',
        features: 'Patrón consistente de inhibición emocional o comportamiento de apego inhibido hacia cuidadores adultos: raramente busca consuelo o no responde al consuelo al ser angustiado. Perturbación emocional y social persistente: poca reactividad social, afecto positivo limitado, episodios de irritabilidad/tristeza/miedo inexplicados. Experiencia de cuidado insuficiente (negligencia, cambios repetidos de cuidadores, entornos con dificultades para el apego selectivo). Inicio antes de los 5 años.',
        notes: '',
        specifiers: [],
      },
      {
        id: 'desinhibicion-social-cie',
        code: '6B45',
        name: 'Trastorno de relación social desinhibida',
        description: 'Comportamiento de acercamiento excesivo e indiscriminado hacia adultos extraños en niños con historia de cuidado insuficiente.',
        features: 'Patrón de comportamiento donde el niño se acerca activamente e interactúa con adultos extraños sin inhibición: reducción o ausencia de reticencia a acercarse, comportamiento verbal/físico excesivamente familiar, disminución de verificar la presencia del cuidador. La conducta persiste tras el reubicamiento en entornos normativos. Edad de desarrollo ≥9 meses. Historia de cuidado insuficiente como causa probable.',
        notes: '',
        specifiers: [],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 7 · Trastornos disociativos (6B60–6B6Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos disociativos',
    chapterId: 'disociativos',
    block: '6B60–6B6Z',
    diagnoses: [
      {
        id: 'tid-cie',
        code: '6B60',
        name: 'Trastorno de identidad disociativo (TID)',
        description: 'Perturbación de la identidad con dos o más estados de personalidad distintos, acompañada de amnesia disociativa.',
        features: 'Perturbación de la identidad caracterizada por la presencia de ≥2 estados de personalidad distintos, que en algunas culturas puede describirse como experiencia de posesión. Cada estado tiene su propio patrón relativamente consistente de percibir, relacionarse y pensar. Amnesia disociativa: incapacidad para recordar eventos cotidianos, información personal importante o eventos traumáticos. Los síntomas no son aceptados como práctica cultural o religiosa normal. Causan deterioro funcional significativo.',
        notes: 'Controversia diagnóstica significativa: alta prevalencia en países con mayor conciencia del diagnóstico. Fuertemente asociado a trauma infantil severo.',
        specifiers: [],
      },
      {
        id: 'amnesia-disociativa-cie',
        code: '6B61',
        name: 'Amnesia disociativa',
        description: 'Incapacidad para recordar información autobiográfica importante, generalmente de naturaleza traumática o estresante.',
        features: 'Incapacidad para recordar información autobiográfica importante (episodios de vida completos, información de identidad personal) que es incompatible con el olvido ordinario. Generalmente relacionada con eventos traumáticos o estresantes. Puede ser localizada (período específico), selectiva, generalizada o continua. No se debe a sustancias, epilepsia, u otras condiciones médicas. Puede incluir fuga disociativa: viajes aparentemente intencionales con amnesia de la identidad.',
        notes: '',
        specifiers: ['6B61.0 Sin fuga disociativa', '6B61.1 Con fuga disociativa'],
      },
      {
        id: 'despersonalizacion-cie',
        code: '6B66',
        name: 'Trastorno de despersonalización-desrealización',
        description: 'Experiencias persistentes de despersonalización y/o desrealización con juicio de realidad intacto.',
        features: 'Experiencias persistentes o recurrentes de despersonalización (sentirse separado de los propios pensamientos, sentimientos, sensaciones, cuerpo — como observar desde afuera) y/o desrealización (el entorno parece irreal, distante, artificial). El juicio de realidad permanece intacto durante los episodios. Los síntomas causan malestar significativo o deterioro funcional. No se explican por sustancias ni otra condición médica.',
        notes: 'Es normal experimentar despersonalización transitoria bajo estrés intenso; el diagnóstico requiere persistencia y deterioro.',
        specifiers: [],
      },
      {
        id: 'trance-disociativo',
        code: '6B63',
        name: 'Trance disociativo',
        description: 'Alteración aguda de la conciencia o identidad no aceptada como práctica cultural/religiosa normal, que ocurre de forma involuntaria.',
        features: 'Alteración aguda de la conciencia: reducción marcada de la reactividad a los estímulos ambientales, "congelación", movimientos estereotipados o amnesia del episodio. O alteración de la identidad: sensación de ser reemplazado por otra identidad, voz u "espíritu", con comportamientos y expresión vocal como si estuviera controlado por otra entidad. Los episodios son involuntarios y no deseados, no aceptados como práctica cultural/religiosa normal. Causan deterioro funcional.',
        notes: '',
        specifiers: ['6B63.0 Trance disociativo', '6B63.1 Trastorno de posesión en trance'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 8 · Trastornos alimentarios o de la ingestión (6B80–6B8Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos alimentarios o de la ingestión de alimentos',
    chapterId: 'alimentarios',
    block: '6B80–6B8Z',
    diagnoses: [
      {
        id: 'anorexia-cie',
        code: '6B80',
        name: 'Anorexia nerviosa',
        description: 'Restricción persistente de la ingesta energética con peso significativamente bajo y miedo intenso a ganar peso.',
        features: 'Restricción persistente de la ingesta energética relativa a las necesidades, conducente a un peso corporal significativamente bajo para la edad, sexo, trayectoria de desarrollo y salud física del individuo. Miedo intenso y persistente a ganar peso o engordar, o comportamiento persistente que interfiere con el aumento de peso. Alteración en la forma en que uno percibe su propio peso o figura, influencia indebida del peso en la autoevaluación, o falta de reconocimiento de la gravedad del bajo peso.',
        notes: 'CIE-11 no requiere amenorrea (eliminada también en DSM-5). Incluye especificadores de presentación restrictiva y con atracones/purgas.',
        specifiers: ['6B80.0 Significativamente bajo peso', '6B80.1 Con peligro para la vida', 'Tipo restrictivo', 'Tipo con atracones/purgas', 'En remisión parcial/completa'],
      },
      {
        id: 'bulimia-cie',
        code: '6B81',
        name: 'Bulimia nerviosa',
        description: 'Episodios recurrentes de atracones seguidos de comportamientos compensatorios inapropiados.',
        features: 'Episodios recurrentes de atracones: ingesta de cantidad de alimento definitivamente mayor que la que la mayoría comería en circunstancias similares, con sensación de falta de control. Comportamientos compensatorios inapropiados recurrentes para evitar el aumento de peso: vómito autoprovocado, uso indebido de laxantes/diuréticos/enemas, ayuno, ejercicio excesivo. Atracones y comportamientos compensatorios ocurren en promedio ≥1 vez/semana durante ≥1 mes. La autoevaluación está indebidamente influenciada por la figura y el peso.',
        notes: '',
        specifiers: ['En remisión parcial/completa', 'Gravedad: leve, moderada, grave, extrema'],
      },
      {
        id: 'tca-cie',
        code: '6B82',
        name: 'Trastorno por atracón',
        description: 'Episodios recurrentes de atracones sin comportamientos compensatorios inapropiados.',
        features: 'Episodios recurrentes de atracones con ≥3 de: comer mucho más rápido de lo normal, comer hasta sentirse desagradablemente lleno, comer grandes cantidades sin hambre física, comer a solas por vergüenza, sentirse muy mal después. Malestar significativo respecto a los atracones. Los atracones ocurren en promedio ≥1 vez/semana durante ≥1 mes. No hay comportamientos compensatorios inapropiados recurrentes.',
        notes: '',
        specifiers: ['En remisión parcial/completa', 'Gravedad: leve, moderada, grave, extrema'],
      },
      {
        id: 'arfid-cie',
        code: '6B83',
        name: 'Trastorno de evitación/restricción de la ingestión de alimentos (ARFID)',
        description: 'Evitación o restricción de la ingesta no relacionada con imagen corporal ni preocupación por el peso.',
        features: 'Evitación o restricción de la ingesta de alimentos manifestada como: pérdida de peso significativa o fracaso para ganar el esperado, deficiencia nutricional significativa, dependencia de suplementos o alimentación enteral, o interferencia marcada con el funcionamiento psicosocial. No explicada por razones culturales, falta de alimentos o una condición médica por sí sola. No asociada a preocupaciones por el peso o la figura corporal.',
        notes: 'Incluye aversiones sensoriales, miedo a vomitar/ahogarse o falta de interés en la comida.',
        specifiers: [],
      },
      {
        id: 'pica-cie',
        code: '6B84',
        name: 'Pica',
        description: 'Ingesta persistente de sustancias no nutritivas y no alimentarias.',
        features: 'Ingesta persistente o recurrente de sustancias no nutritivas y no alimentarias (tierra, arcilla, tiza, jabón, papel, cabello, hielo). Inapropiada para el nivel de desarrollo. No parte de práctica cultural aceptada. Suficientemente grave para merecer atención clínica.',
        notes: '',
        specifiers: [],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 9 · Trastornos por uso de sustancias y conductas adictivas (6C40–6C5Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos por uso de sustancias y conductas adictivas',
    chapterId: 'sustancias',
    block: '6C40–6C5Z',
    diagnoses: [
      {
        id: 'trastorno-uso-alcohol-cie',
        code: '6C40.2',
        name: 'Trastorno por uso de alcohol',
        description: 'Patrón de uso de alcohol con características de dependencia que causa deterioro o malestar significativo.',
        features: 'Fuerte impulso de consumir alcohol. Deterioro del control sobre el consumo (inicio, término, cantidad). Prioridad creciente al consumo sobre otras actividades. Síntomas de abstinencia al reducir o dejar el consumo. Tolerancia: necesidad de cantidades crecientes para el efecto deseado. El consumo continúa a pesar del daño evidente. Los síntomas persisten ≥12 meses (o de forma continua ≥1 mes).',
        notes: 'CIE-11 distingue entre "episódico dañino" (6C40.0), "uso dañino, continuo" (6C40.1) y "trastorno por uso de alcohol" (6C40.2). El TUA requiere características de dependencia.',
        specifiers: ['En remisión temprana', 'En remisión sostenida', 'En entorno controlado'],
      },
      {
        id: 'trastorno-uso-cannabis-cie',
        code: '6C41.2',
        name: 'Trastorno por uso de cannabis',
        description: 'Patrón de uso de cannabis con características de dependencia.',
        features: 'Fuerte impulso de consumir cannabis. Deterioro del control sobre el consumo. Prioridad creciente al cannabis. Síntomas de abstinencia (irritabilidad, ansiedad, insomnio, pérdida de apetito al cesar el uso). Tolerancia. El consumo continúa a pesar del daño evidente.',
        notes: '',
        specifiers: ['En remisión temprana', 'En remisión sostenida'],
      },
      {
        id: 'trastorno-uso-opioides-cie',
        code: '6C43.2',
        name: 'Trastorno por uso de opioides',
        description: 'Patrón de uso de opioides con características de dependencia.',
        features: 'Fuerte impulso de consumir opioides. Deterioro del control sobre el consumo. Prioridad creciente a los opioides sobre otras actividades. Síntomas de abstinencia prominentes (dolores musculares, lagrimeo, rinorrea, ansiedad, insomnio). Tolerancia marcada. El consumo continúa a pesar del daño evidente.',
        notes: '',
        specifiers: ['En remisión temprana', 'En remisión sostenida', 'En tratamiento con agonistas', 'En entorno controlado'],
      },
      {
        id: 'trastorno-uso-estimulantes-cie',
        code: '6C44.2 / 6C45.2',
        name: 'Trastorno por uso de cocaína / estimulantes',
        description: 'Patrón de uso de cocaína u otros estimulantes con características de dependencia.',
        features: 'Fuerte impulso de consumir. Deterioro del control. Prioridad creciente al consumo. Síntomas de abstinencia (disforia, fatiga, hipersomnia, hiperfagia). Tolerancia. Consumo continuado a pesar del daño.',
        notes: '',
        specifiers: ['En remisión temprana', 'En remisión sostenida'],
      },
      {
        id: 'trastorno-juego-cie',
        code: '6C50',
        name: 'Trastorno de juego (apuestas)',
        description: 'Patrón de comportamiento de juego de azar persistente o recurrente que lleva a deterioro o malestar significativo.',
        features: 'Control deteriorado sobre el juego. Prioridad creciente al juego de azar sobre otras actividades. Continuación o escalada del juego a pesar de consecuencias negativas. El patrón persiste ≥12 meses (o ≥1 mes continuo con síntomas graves). Puede manifestarse como continuo o episódico.',
        notes: '',
        specifiers: ['Predominantemente en línea', 'Predominantemente fuera de línea', 'En remisión'],
      },
      {
        id: 'trastorno-videojuegos-cie',
        code: '6C51',
        name: 'Trastorno de juego por internet/videojuegos',
        description: 'Patrón de comportamiento de juego digital persistente o recurrente. DIAGNÓSTICO NUEVO EN CIE-11.',
        features: 'Control deteriorado sobre el comportamiento de juego (inicio, frecuencia, intensidad, duración, terminación, contexto). Prioridad creciente al juego digital sobre otras actividades de la vida. Continuación o escalada del juego a pesar de la aparición de consecuencias negativas. El comportamiento es suficientemente grave para causar deterioro en el funcionamiento personal, familiar, social, educativo u ocupacional. El patrón persiste ≥12 meses.',
        notes: 'DIAGNÓSTICO NUEVO EN CIE-11. No incluido como diagnóstico oficial en DSM-5-TR (solo en sección de condiciones para más estudio).',
        specifiers: ['Predominantemente en línea', 'Predominantemente fuera de línea', 'En remisión'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 10 · Trastornos del comportamiento disruptivo o disocial (6C90–6C9Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos del comportamiento disruptivo o disocial',
    chapterId: 'disruptivos',
    block: '6C90–6C9Z',
    diagnoses: [
      {
        id: 'tnd-cie',
        code: '6C90',
        name: 'Trastorno negativista desafiante (TND)',
        description: 'Patrón marcado y persistente de humor irritable o enojado, comportamiento discutidor, desafiante o vengativo.',
        features: 'Frecuente pérdida del control del temperamento. Sensibilidad excesiva o fácilmente irritable. Enojado y resentido con frecuencia. Discute frecuentemente con figuras de autoridad. Desafía activamente o se niega a cumplir reglas. Molesta deliberadamente a otros. Culpa a otros por sus propios errores. Ha sido rencoroso o vengativo. Los síntomas generan deterioro en las relaciones sociales, educativas u otras áreas del funcionamiento. Persistencia ≥varios meses.',
        notes: '',
        specifiers: ['Leve', 'Moderado', 'Grave'],
      },
      {
        id: 'trastorno-disocial-cie',
        code: '6C91',
        name: 'Trastorno disocial',
        description: 'Patrón repetitivo y persistente de comportamiento que viola los derechos de otros o normas sociales.',
        features: 'Comportamiento repetitivo y persistente que viola derechos básicos de otros o normas sociales mayores: agresión a personas/animales, destrucción de propiedad, engaño o robo, violaciones graves de normas (escaparse de casa, faltar a la escuela). Los síntomas generan deterioro significativo y persisten ≥12 meses.',
        notes: '',
        specifiers: [
          '6C91.0 Trastorno disocial con inicio en la infancia',
          '6C91.1 Trastorno disocial con inicio en la adolescencia',
          '6C91.2 Trastorno disocial con inicio no especificado',
          'Con emociones prosociales limitadas',
        ],
      },
      {
        id: 'tei-cie',
        code: '6C92',
        name: 'Trastorno explosivo intermitente',
        description: 'Arrebatos agresivos impulsivos recurrentes y desproporcionados.',
        features: 'Arrebatos conductuales recurrentes que representan un fracaso en el control de los impulsos agresivos, manifestados como agresión verbal o física. La magnitud de los arrebatos es desproporcionada a la provocación o al estresor situacional. Los arrebatos son impulsivos (no planificados) y no dirigidos a conseguir un objetivo. Los arrebatos causan malestar significativo o deterioro funcional.',
        notes: '',
        specifiers: [],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 11 · Trastornos de la personalidad (6D10–6D1Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos de la personalidad y rasgos relacionados',
    chapterId: 'personalidad',
    block: '6D10–6D1Z',
    diagnoses: [
      {
        id: 'tp-modelo-cie',
        code: '6D10',
        name: 'Trastorno de la personalidad — Modelo dimensional CIE-11',
        description: 'NUEVO MODELO: CIE-11 reemplaza los subtipos de TP de CIE-10 por un diagnóstico de gravedad + rasgos cualitativos.',
        features: 'El diagnóstico en CIE-11 requiere: 1. Alteración persistente de la personalidad en cómo el individuo piensa, siente, se comporta y se relaciona con otros. 2. La alteración es generalizada y relativamente estable en el tiempo. 3. Causa deterioro significativo en el funcionamiento personal, familiar, social u ocupacional. 4. No se explica mejor por otro trastorno mental o condición médica. Se especifica la GRAVEDAD (leve, moderada, grave) y los RASGOS dominantes presentes.',
        notes: 'CAMBIO MAYOR RESPECTO A CIE-10: Los subtipos clásicos de CIE-10 (paranoide, esquizoide, disocial, inestable emocionalmente, histriónico, anancástico/obsesivo, ansioso, dependiente) ya no son categorías diagnósticas independientes. En su lugar se usan calificadores de rasgos.',
        specifiers: [
          'GRAVEDAD: 6D10.0 Leve (deterioro en ≥1 área del funcionamiento)',
          'GRAVEDAD: 6D10.1 Moderada (deterioro en ≥2 áreas)',
          'GRAVEDAD: 6D10.2 Grave (deterioro grave en múltiples áreas)',
          'RASGOS: Afectividad negativa (6D11.0)',
          'RASGOS: Distanciamiento (6D11.1)',
          'RASGOS: Disocialidad (6D11.2)',
          'RASGOS: Desinhibición (6D11.3)',
          'RASGOS: Anankastia/perfeccionismo compulsivo (6D11.4)',
          'CALIFICADOR: Patrón límite (6D11.5) — equivalente al TLP del DSM-5',
        ],
      },
      {
        id: 'patron-limite',
        code: '6D11.5',
        name: 'Calificador: patrón límite de personalidad',
        description: 'Equivalente al trastorno límite de la personalidad (TLP/BPD) del DSM-5. En CIE-11 es un calificador cualitativo del trastorno de personalidad.',
        features: 'Patrón generalizado de inestabilidad en las relaciones interpersonales, autoimagen y afectos, con impulsividad marcada. Características: esfuerzos por evitar abandono real/imaginado, relaciones intensas e inestables (idealización-devaluación), alteración de la identidad, impulsividad potencialmente dañina (gastos, sexo, abuso de sustancias, conducción temeraria), comportamientos suicidas/autolesivos recurrentes, inestabilidad afectiva, sensación crónica de vacío, ira intensa e inapropiada, ideación paranoide transitoria relacionada con el estrés.',
        notes: 'Se codifica como calificador sobre el diagnóstico de trastorno de la personalidad de la gravedad correspondiente.',
        specifiers: [],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 12 · Trastornos neurocognitivos (6D70–6D8Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos neurocognitivos',
    chapterId: 'neurocognitivos',
    block: '6D70–6D8Z',
    diagnoses: [
      {
        id: 'delirium-cie',
        code: '6D70',
        name: 'Delirium',
        description: 'Síndrome caracterizado por alteración de la atención, conciencia y cognición de inicio agudo y curso fluctuante.',
        features: 'Alteración de la atención (dificultad para dirigir, enfocar, mantener o cambiar la atención) y alteración de la conciencia. Instauración aguda (horas-días) y tendencia a fluctuar durante el día. Alteración cognitiva adicional (déficit de memoria, desorientación, lenguaje o percepción). No explicado por trastorno neurocognitivo preexistente. Evidencia de causa médica, sustancias u otras.',
        notes: '',
        specifiers: ['6D70.0 Por sustancias o medicamentos', '6D70.1 Por condición médica', '6D70.2 Etiología múltiple', '6D70.Z Sin especificación'],
      },
      {
        id: 'tnc-leve-cie',
        code: '6D71',
        name: 'Síndrome amnésico orgánico (trastorno neurocognitivo leve)',
        description: 'Deterioro cognitivo leve en ≥1 dominio cognitivo que no interfiere con la independencia funcional.',
        features: 'Evidencia de declive cognitivo en ≥1 dominio (memoria, atención, funciones ejecutivas, lenguaje, cognición social, habilidades visuoespaciales). El deterioro es leve y no causa dependencia. Confirmado por evaluación neuropsicológica o clínica. No ocurre exclusivamente durante delirium.',
        notes: '',
        specifiers: ['Etiología: Alzheimer, Lewy, vascular, frontotemporal, etc.'],
      },
      {
        id: 'demencia-cie',
        code: '6D80 / 6D81 / 6D82 / 6D83 / 6D84 / 6D85',
        name: 'Demencia (trastorno neurocognitivo mayor)',
        description: 'Deterioro cognitivo significativo en múltiples dominios que interfiere con la independencia en la vida cotidiana.',
        features: 'Evidencia de declive cognitivo significativo desde un nivel previo de funcionamiento en ≥1 dominio (memoria, atención, funciones ejecutivas, lenguaje, habilidades prácticas, cognición social). El deterioro interfiere con la independencia en actividades cotidianas. No ocurre exclusivamente durante delirium. No explicado mejor por otro trastorno mental.',
        notes: '',
        specifiers: [
          '6D80 Demencia por enfermedad de Alzheimer',
          '6D81 Demencia vascular',
          '6D82 Demencia por cuerpos de Lewy',
          '6D83 Demencia frontotemporal',
          '6D84 Demencia por Parkinson',
          '6D85 Demencia por Huntington',
          'Gravedad: leve, moderada, grave',
          'Con/sin alteración del comportamiento',
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 13 · Trastornos de los síntomas corporales y relacionados (6C20–6C2Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos de distrés corporal y experiencia corporal',
    chapterId: 'somaticos',
    block: '6C20–6C2Z',
    diagnoses: [
      {
        id: 'tdc-cie',
        code: '6C20',
        name: 'Trastorno de distrés corporal',
        description: 'Síntomas corporales angustiantes con preocupación excesiva y focalización en los síntomas.',
        features: 'Síntomas corporales angustiantes que provocan preocupación, focalización atencional excesiva o búsqueda de atención médica. El individuo puede tener múltiples síntomas cambiantes o uno persistente. La preocupación por los síntomas es desproporcionada a su naturaleza o gravedad. Los síntomas y la preocupación están presentes la mayoría de los días durante ≥varios meses. Los síntomas no se explican adecuadamente por otra condición médica.',
        notes: 'Reemplaza en CIE-11 a múltiples categorías de CIE-10: trastorno de somatización, hipocondría, trastorno somatomorfo indiferenciado y trastorno de dolor somatomorfo persistente.',
        specifiers: ['6C20.0 Leve', '6C20.1 Moderado', '6C20.2 Grave'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 14 · Trastornos del sueño o la vigilia — selección (7A00–7B2Z)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Trastornos del sueño o la vigilia (selección)',
    chapterId: 'sueno',
    block: '7A00–7B2Z',
    diagnoses: [
      {
        id: 'insomnio-cie',
        code: '7A00',
        name: 'Insomnio crónico',
        description: 'Dificultad persistente para iniciar o mantener el sueño o despertar temprano.',
        features: 'Dificultad para iniciar el sueño, mantenerlo (despertares nocturnos frecuentes o dificultad para volver a dormir) o despertar definitivo antes de lo deseado. La dificultad ocurre a pesar de condiciones adecuadas para dormir. Síntomas diurnos consecuentes: fatiga, dificultad cognitiva, irritabilidad, somnolencia, dificultad conductual, motivación/energía reducidas, propensión a errores. Ocurre ≥3 noches/semana durante ≥3 meses.',
        notes: '',
        specifiers: [],
      },
      {
        id: 'hipersomnia-cie',
        code: '7A20',
        name: 'Hipersomnia idiopática',
        description: 'Somnolencia diurna excesiva no explicada por sueño nocturno insuficiente u otra causa.',
        features: 'Somnolencia diurna excesiva a pesar de dormir ≥7 horas/noche. Sueño no reparador. Dificultad para despertarse (inercia del sueño marcada). Siestas largas también no reparadoras. No explicada por privación del sueño, narcolepsia, apnea del sueño ni otra condición médica/mental.',
        notes: '',
        specifiers: [],
      },
      {
        id: 'narcolepsia-cie',
        code: '7A21',
        name: 'Narcolepsia',
        description: 'Somnolencia diurna excesiva con ataques de sueño irresistibles, cataplejía y/o parálisis del sueño.',
        features: 'Somnolencia diurna excesiva y episodios de sueño irresistibles. Puede incluir cataplejía (pérdida súbita del tono muscular precipitada por emociones), alucinaciones hipnagógicas/hipnopómpicas, parálisis del sueño. Sueño nocturno con inicio rápido de fase REM. Puede confirmarse con TLMS (latencia media ≤8 min y ≥2 SOREMP).',
        notes: '',
        specifiers: ['7A21.0 Narcolepsia tipo 1 (con cataplejía o deficiencia de hipocretina-1)', '7A21.1 Narcolepsia tipo 2 (sin cataplejía)'],
      },
      {
        id: 'apnea-cie',
        code: '7A40',
        name: 'Apnea obstructiva del sueño',
        description: 'Episodios recurrentes de obstrucción de las vías aéreas superiores durante el sueño.',
        features: 'Ronquidos, resoplidos/jadeos o pausas respiratorias durante el sueño observadas por acompañante. Somnolencia diurna excesiva, cefaleas matutinas, sueño no reparador, dificultad de concentración. Confirmación polisomnográfica: IAH ≥5/h con síntomas, o IAH ≥15/h independientemente de síntomas.',
        notes: '',
        specifiers: ['Leve (IAH 5-15/h)', 'Moderada (IAH 15-30/h)', 'Grave (IAH >30/h)'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BLOQUE 15 · Incongruencia de género (cap. 17 CIE-11)
  // ─────────────────────────────────────────────────────────────────────────
  {
    chapter: 'Incongruencia de género',
    chapterId: 'genero',
    block: 'HA60–HA6Z (Capítulo 17)',
    diagnoses: [
      {
        id: 'incongruencia-genero-adolescentes',
        code: 'HA60',
        name: 'Incongruencia de género en adolescentes y adultos',
        description: 'Incongruencia marcada y persistente entre el género experimentado y el asignado al nacer. REUBICADO FUERA DE LOS TRASTORNOS MENTALES EN CIE-11.',
        features: 'Incongruencia marcada y persistente entre el género experimentado por el individuo y el género asignado, caracterizada por fuerte deseo de liberarse de características sexuales primarias/secundarias, o fuerte deseo de tener las características del género experimentado, o fuerte convicción de tener sentimientos y reacciones del género experimentado. No requiere que cause malestar clínicamente significativo (a diferencia del DSM-5).',
        notes: 'CAMBIO HISTÓRICO EN CIE-11: La incongruencia de género se mueve del capítulo de trastornos mentales a un capítulo independiente (Condiciones relacionadas con la salud sexual), reconociendo que la incongruencia por sí misma no es un trastorno mental. El acceso a atención sanitaria de afirmación de género se mantiene.',
        specifiers: [],
      },
      {
        id: 'incongruencia-genero-ninos',
        code: 'HA61',
        name: 'Incongruencia de género en la infancia',
        description: 'Incongruencia marcada entre el género experimentado y el asignado, manifestada en la infancia.',
        features: 'Incongruencia marcada entre el género experimentado por el niño/a y el género asignado, manifestada por fuerte deseo de ser del otro género o insistencia en ser del otro género, fuerte preferencia por ropa/juguetes/juegos del otro género, fuerte preferencia por compañeros de juego del otro género, rechazo marcado de características sexuales anatómicas. Los síntomas son persistentes y no transitorios.',
        notes: 'Requiere persistencia y consistencia; muchos niños con conductas de género no conformes no cumplen criterios ni desarrollan incongruencia de género en la adultez.',
        specifiers: [],
      },
    ],
  },
]

// ── Utilidades ────────────────────────────────────────────────────────────────

export const allCIE11Diagnoses = CIE11.flatMap(chapter =>
  chapter.diagnoses.map(d => ({
    ...d,
    chapter: chapter.chapter,
    chapterId: chapter.chapterId,
    block: chapter.block,
  }))
)

export const searchCIE11 = (query) => {
  if (!query?.trim()) return allCIE11Diagnoses
  const q = query.toLowerCase()
  return allCIE11Diagnoses.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.code.toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q) ||
    d.features?.toLowerCase().includes(q) ||
    d.notes?.toLowerCase().includes(q)
  )
}
