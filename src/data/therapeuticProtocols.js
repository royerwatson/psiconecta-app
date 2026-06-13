/**
 * Protocolos y técnicas terapéuticas basadas en evidencia — guía clínica
 * TCC · DBT · ACT · EMDR · MBCT · CFT
 *
 * Contenido parafraseado con fines educativos/clínicos.
 * Para práctica formal consulta fuentes originales y realiza la formación
 * específica de cada modalidad (especialmente EMDR).
 */

// ── Modalidades ───────────────────────────────────────────────────────────────
export const MODALITIES = [
  {
    id: 'tcc',
    name: 'TCC',
    fullName: 'Terapia Cognitivo-Conductual',
    icon: 'Brain',
    color: 'blue',
    tagline: 'Basada en evidencia · Estructurada · Orientada al problema',
    description:
      'Modelo terapéutico que identifica y modifica pensamientos distorsionados y conductas desadaptativas que mantienen el malestar psicológico. Eficacia establecida para depresión, ansiedad, TOC, fobias y TEPT.',
  },
  {
    id: 'dbt',
    name: 'DBT',
    fullName: 'Terapia Dialéctico-Conductual',
    icon: 'Waves',
    color: 'teal',
    tagline: 'Linehan · Biosocial · Habilidades + Validación',
    description:
      'Desarrollada por Marsha Linehan para TLP. Integra estrategias de aceptación (mindfulness, validación) y cambio (TCC). Cuatro módulos de habilidades: mindfulness, tolerancia al malestar, regulación emocional y efectividad interpersonal.',
  },
  {
    id: 'act',
    name: 'ACT',
    fullName: 'Terapia de Aceptación y Compromiso',
    icon: 'Leaf',
    color: 'green',
    tagline: 'Hayes · Hexaflex · Flexibilidad psicológica',
    description:
      'Terapia de tercera generación basada en la teoría del marco relacional. Promueve la flexibilidad psicológica a través de seis procesos nucleares: defusión, aceptación, contacto presente, yo como contexto, valores y acción comprometida.',
  },
  {
    id: 'emdr',
    name: 'EMDR',
    fullName: 'Desensibilización y Reprocesamiento por Movimientos Oculares',
    icon: 'Eye',
    color: 'purple',
    tagline: 'Shapiro · 8 fases · Requiere certificación',
    description:
      'Protocolo estructurado de 8 fases para procesar memorias traumáticas mediante estimulación bilateral (movimientos oculares, tapping o tonos). Reconocido por OMS y APA para TEPT. Requiere formación y certificación específica (EMDR Europe/EMDRIA).',
  },
  {
    id: 'mbct',
    name: 'MBCT',
    fullName: 'Terapia Cognitiva Basada en Mindfulness',
    icon: 'Sparkles',
    color: 'indigo',
    tagline: 'Segal · Williams · Teasdale · 8 semanas',
    description:
      'Programa estructurado de 8 semanas que integra prácticas de mindfulness con elementos de TCC. Primera línea para la prevención de recaídas en depresión mayor recurrente (≥3 episodios). Indicado también para ansiedad crónica y estrés. Reconocido por NICE (Reino Unido) y APA.',
  },
  {
    id: 'cft',
    name: 'CFT',
    fullName: 'Terapia Centrada en la Compasión',
    icon: 'Heart',
    color: 'rose',
    tagline: 'Paul Gilbert · Tres sistemas · Yo compasivo',
    description:
      'Desarrollada por Paul Gilbert para personas con alta autocrítica y vergüenza. Integra neurociencia evolutiva, psicología budista y TCC. Trabaja el sistema de amenaza, impulso y afiliación/soothing para cultivar el yo compasivo. Evidencia creciente en depresión, trauma, trastornos alimentarios y personalidad.',
  },
]

export const MODALITY_MAP = Object.fromEntries(MODALITIES.map(m => [m.id, m]))

// ── Colores de modalidad ──────────────────────────────────────────────────────
export const MOD_COLOR = {
  blue:   { tab: 'bg-blue-600 text-white',   pill: 'bg-blue-100 text-blue-700 border-blue-200',   step: 'bg-blue-50 border-blue-200',   num: 'bg-blue-600 text-white'   },
  teal:   { tab: 'bg-teal-600 text-white',   pill: 'bg-teal-100 text-teal-700 border-teal-200',   step: 'bg-teal-50 border-teal-200',   num: 'bg-teal-600 text-white'   },
  green:  { tab: 'bg-green-600 text-white',  pill: 'bg-green-100 text-green-700 border-green-200', step: 'bg-green-50 border-green-200', num: 'bg-green-600 text-white'  },
  purple: { tab: 'bg-purple-600 text-white', pill: 'bg-purple-100 text-purple-700 border-purple-200', step: 'bg-purple-50 border-purple-200', num: 'bg-purple-600 text-white' },
  indigo: { tab: 'bg-indigo-600 text-white', pill: 'bg-indigo-100 text-indigo-700 border-indigo-200', step: 'bg-indigo-50 border-indigo-200', num: 'bg-indigo-600 text-white' },
  rose:   { tab: 'bg-rose-600 text-white',   pill: 'bg-rose-100 text-rose-700 border-rose-200',     step: 'bg-rose-50 border-rose-200',     num: 'bg-rose-600 text-white'   },
}

// ── Protocolos ────────────────────────────────────────────────────────────────
export const PROTOCOLS = [

  // ═══════════════════════════════════════════════════════════════════════════
  // TCC — Terapia Cognitivo-Conductual
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tcc-formulacion',
    modality: 'tcc',
    name: 'Formulación de caso cognitiva',
    indication: 'Base de todo tratamiento TCC',
    sessions: '1–3 sesiones',
    difficulty: 'Fundamental',
    overview:
      'La formulación de caso es el mapa conceptual que guía el tratamiento. Explica cómo la historia del paciente, sus creencias nucleares, supuestos y pensamientos automáticos interactúan con su conducta y sus emociones para mantener el problema actual.',
    indications: [
      'Todo inicio de tratamiento TCC',
      'Casos complejos con múltiples problemas',
      'Cuando el paciente no responde al tratamiento estándar',
    ],
    steps: [
      {
        title: 'Recoger datos biográficos relevantes',
        body: 'Explora la historia de aprendizaje: crianza, relaciones tempranas, experiencias traumáticas, mensajes recibidos de cuidadores. Pregunta: "¿Qué aprendiste de niño/a sobre ti mismo/a, los demás y el mundo?"',
      },
      {
        title: 'Identificar el problema actual y desencadenantes',
        body: 'Define claramente la situación problemática actual. ¿Cuándo comenzó? ¿Qué lo desencadena? ¿Qué lo mantiene? Usa el modelo A-B-C para mapear situación → pensamiento → emoción/conducta.',
      },
      {
        title: 'Identificar pensamientos automáticos y distorsiones',
        body: 'Recoge pensamientos automáticos negativos (PANs) con técnica de la flecha descendente: "¿Qué significa eso para ti? ¿Y si fuera cierto, qué significaría?" Clasifica distorsiones: catastrofismo, personalización, lectura mental, pensamiento todo-o-nada, etc.',
      },
      {
        title: 'Identificar supuestos intermedios',
        body: 'Reglas y actitudes que conectan creencias nucleares con pensamientos automáticos. Formato: "Si… entonces…" o "Debería…". Ejemplo: "Si no soy perfecto/a, entonces fracasé."',
      },
      {
        title: 'Identificar creencias nucleares',
        body: 'Creencias globales, rígidas e incondicionales sobre uno mismo (indefensión, desamor, inutilidad), los demás (desconfianza) o el mundo (peligro). Ejemplo: "Soy un fracasado/a", "No soy querible."',
      },
      {
        title: 'Elaborar el diagrama de formulación',
        body: 'Une todos los elementos en un diagrama visual que el paciente pueda comprender. Empieza por experiencias tempranas → creencias nucleares → supuestos → situación actual → PANs → emociones/conductas → consecuencias que mantienen el problema.',
      },
      {
        title: 'Compartir y validar con el paciente',
        body: 'Presenta la formulación como una hipótesis colaborativa, no como un diagnóstico. Pregunta: "¿Esto tiene sentido para ti? ¿Hay algo que cambiarías o añadirías?" La formulación es un documento vivo que se actualiza durante el tratamiento.',
      },
    ],
    tips: [
      'Usa metáforas sencillas para explicar la relación pensamiento-emoción-conducta.',
      'La formulación debe ser empática, no solo técnica: el paciente debe sentirse comprendido.',
      'Una buena formulación predice qué técnicas funcionarán y cuáles no.',
      'Revísala cuando el tratamiento se estanque — puede revelar una creencia nuclear no identificada.',
    ],
    reference: 'Beck, J. S. (2021). Cognitive Behavior Therapy: Basics and Beyond (3.ª ed.). Guilford.',
  },

  {
    id: 'tcc-activacion',
    modality: 'tcc',
    name: 'Activación Conductual (AC)',
    indication: 'Depresión mayor · Anhedonia · Evitación',
    sessions: '8–20 sesiones',
    difficulty: 'Básico-Intermedio',
    overview:
      'La AC interviene directamente en el ciclo depresión-inactividad-refuerzo negativo. En lugar de esperar a sentirse mejor para actuar, el paciente actúa para sentirse mejor. Énfasis en aumentar el contacto con refuerzo positivo y romper conductas de evitación.',
    indications: [
      'Depresión mayor (primera línea)',
      'Distimia y depresión persistente',
      'Depresión con fuerte componente de evitación',
      'Anhedonia marcada',
    ],
    contraindications: [
      'Episodio maníaco activo',
      'Ideación suicida activa sin estabilización previa',
    ],
    steps: [
      {
        title: 'Psicoeducación: el ciclo depresivo',
        body: 'Explica el modelo: la depresión reduce la actividad → la inactividad reduce el refuerzo positivo → aumenta la depresión. Dibuja el ciclo con el paciente. Introduce la metáfora: "Actuar primero, sentirse bien después." Diferencia entre actividad de placer (mastery) y actividad de logro.',
      },
      {
        title: 'Registro de actividades y estado de ánimo',
        body: 'Durante 1–2 semanas el paciente registra hora por hora qué hace y su estado de ánimo (0–10). Objetivo: detectar qué actividades mejoran el ánimo y cuáles no (patrones de evitación). Analizar juntos en sesión.',
      },
      {
        title: 'Identificar conductas de evitación',
        body: 'Mapea qué evita el paciente y qué obtiene con la evitación (alivio a corto plazo). Explica que la evitación mantiene la depresión a largo plazo. Distingue: evitación situacional, cognitiva (rumiación) y de conducta.',
      },
      {
        title: 'Lista de actividades reforzantes',
        body: 'Con el paciente, construye un listado de actividades potencialmente placenteras o de logro, priorizadas de menor a mayor dificultad. Incluir actividades que antes disfrutaba y nuevas que podría explorar.',
      },
      {
        title: 'Programación de actividades (agenda conductual)',
        body: 'Programa en la agenda semanal al menos 1–2 actividades de placer y 1–2 de logro por día. Empieza con las de menor dificultad. El paciente comprometido realiza la actividad independientemente del estado de ánimo.',
      },
      {
        title: 'Revisión y análisis de resultados',
        body: 'En cada sesión: ¿qué actividades hizo? ¿Cómo fue el estado de ánimo antes y después? Refuerza los intentos, no solo los éxitos. Si no realizó la actividad, explora los obstáculos sin juzgar y ajusta la dificultad.',
      },
      {
        title: 'Graduar la dificultad y consolidar',
        body: 'A medida que mejora el ánimo, introduce actividades de mayor dificultad o significado (metas de vida). Trabaja la evitación de situaciones más complejas. Planifica la prevención de recaídas.',
      },
    ],
    tips: [
      'La frase clave: "El movimiento precede a la motivación." Repetirla ayuda al paciente.',
      'Para depresiones graves, empieza por actividades que duren solo 5 minutos.',
      'Valida el esfuerzo antes de señalar que "no lo hizo" — la depresión es física además de mental.',
      'Conecta las actividades con los valores del paciente para aumentar la adherencia.',
      'Diferencia la AC de la "programación de actividades" superficial — el análisis funcional es clave.',
    ],
    reference: 'Martell, C. R., Dimidjian, S. & Herman-Dunn, R. (2022). Behavioral Activation for Depression. Guilford.',
  },

  {
    id: 'tcc-reestructuracion',
    modality: 'tcc',
    name: 'Reestructuración cognitiva',
    indication: 'Depresión · Ansiedad · Baja autoestima · Rumiación',
    sessions: '4–8 sesiones (técnica)',
    difficulty: 'Intermedio',
    overview:
      'Proceso sistemático para identificar, evaluar y modificar pensamientos automáticos negativos y creencias disfuncionales. No niega la realidad, sino que construye perspectivas más flexibles, precisas y útiles.',
    indications: [
      'Depresión con cogniciones negativas prominentes',
      'Ansiedad generalizada y rumiación',
      'Baja autoestima y autocrítica intensa',
      'Cualquier problema donde los pensamientos mantengan el malestar',
    ],
    steps: [
      {
        title: 'Identificar el pensamiento automático',
        body: 'Usa el registro A-B-C o pregunta directamente: "¿Qué pasó por tu mente en ese momento?" / "¿Qué pensaste justo antes de sentirte así?" Ayuda al paciente a distinguir pensamientos de emociones ("me sentí como un fracasado" vs "pensé que soy un fracasado").',
      },
      {
        title: 'Evaluar la emoción y su intensidad',
        body: 'Identifica la emoción asociada (tristeza, ansiedad, vergüenza…) y su intensidad (0–100). Este valor será la referencia para medir el cambio tras la reestructuración.',
      },
      {
        title: 'Evaluar la credibilidad del pensamiento',
        body: '¿Cuánto crees este pensamiento? (0–100%). Distinguir entre credibilidad intelectual y emocional — a veces el paciente "sabe" que el pensamiento es irracional pero "lo siente" real.',
      },
      {
        title: 'Explorar la evidencia a favor y en contra',
        body: 'Sócrates, no debate: "¿Qué evidencias tienes de que eso es cierto?" / "¿Qué hechos concretos contradicen ese pensamiento?" El terapeuta no contraargumenta — guía al paciente a descubrir por sí mismo.',
      },
      {
        title: 'Identificar la distorsión cognitiva',
        body: 'Nombra la distorsión: catastrofismo, lectura mental, todo-o-nada, minimización/magnificación, personalización, generalización excesiva, debería/tendría, razonamiento emocional, filtro mental, descalificación de lo positivo.',
      },
      {
        title: 'Generar pensamientos alternativos',
        body: 'Preguntas clave: "¿Cómo lo vería un buen amigo en tu lugar?" / "¿Qué le dirías a alguien que piensa esto?" / "¿Existe otra explicación posible?" El pensamiento alternativo debe ser creíble — no un pensamiento positivo forzado.',
      },
      {
        title: 'Evaluar el resultado',
        body: 'Después de generar el pensamiento alternativo: ¿Cuánto crees ahora el pensamiento original? (0–100%) / ¿Cómo ha cambiado la intensidad de la emoción? (0–100). Si no cambia, puede haber una creencia nuclear más profunda sin tocar.',
      },
    ],
    tips: [
      'El estilo socrático es la clave — preguntas, no argumentos. El terapeuta que "convence" no está haciendo reestructuración.',
      'Si el pensamiento alternativo no produce alivio, busca una creencia nuclear subyacente con la técnica de la flecha descendente.',
      'Diferencia reestructuración de distracción o minimización — el objetivo es una perspectiva más precisa, no más positiva.',
      'Las creencias nucleares ("Soy inútil") son más resistentes — trabájalas con técnicas de creencias núcleo específicas.',
      'El registro de pensamientos en papel o app aumenta la generalización fuera de consulta.',
    ],
    reference: 'Beck, A. T. & Haigh, E. A. P. (2014). Advances in cognitive theory and therapy. Annual Review of Clinical Psychology.',
  },

  {
    id: 'tcc-epr',
    modality: 'tcc',
    name: 'Exposición con Prevención de Respuesta (EPR)',
    indication: 'TOC · Fobias específicas · Ansiedad social · BDD',
    sessions: '12–20 sesiones',
    difficulty: 'Avanzado',
    overview:
      'Técnica de primera línea para TOC y trastornos de ansiedad. El paciente se expone a los estímulos temidos (pensamientos, imágenes, situaciones) sin realizar las conductas de seguridad/rituales habituales, permitiendo que la ansiedad se extinga de forma natural.',
    indications: [
      'Trastorno obsesivo-compulsivo (primera línea)',
      'Fobias específicas',
      'Ansiedad social (exposición social)',
      'Hipocondría / trastorno de ansiedad por enfermedad',
      'Trastorno dismórfico corporal',
    ],
    contraindications: [
      'Paciente en crisis aguda o con ideación suicida activa',
      'Disociación severa sin estabilización previa',
      'Motivación muy baja — el paciente debe dar consentimiento informado a la incomodidad',
    ],
    steps: [
      {
        title: 'Psicoeducación sobre el modelo de ansiedad y EPR',
        body: 'Explica: 1) La ansiedad sube pero siempre baja si no huyes. 2) Los rituales alivian a corto plazo pero refuerzan el miedo a largo. 3) La EPR rompe ese ciclo. Usa la metáfora del "detector de humos sensibilizado" — necesita aprender que la alarma es falsa.',
      },
      {
        title: 'Evaluación y jerarquía de estímulos',
        body: 'Lista exhaustiva de situaciones, objetos, pensamientos o imágenes temidas, ordenados de menor a mayor ansiedad con SUDS (0–100). Identifica también todos los rituales, compulsiones y conductas de seguridad asociadas a cada ítem.',
      },
      {
        title: 'Identificar y acordar la prevención de respuesta',
        body: 'Por cada exposición, acuerda explícitamente qué conductas de seguridad se eliminarán. Incluye rituales mentales (neutralización, repetir mentalmente, rezar). Sin prevención de respuesta la exposición pierde eficacia.',
      },
      {
        title: 'Comenzar por el ítem de menor ansiedad (SUDS ≤ 40)',
        body: 'El paciente se expone al estímulo y permanece en contacto con él sin realizar rituales. Registra el SUDS cada 5 minutos. La sesión termina cuando el SUDS ha bajado al menos un 50% o a ≤20, o tras un mínimo de 45 minutos.',
      },
      {
        title: 'Manejo de la ansiedad durante la exposición',
        body: 'Valida la incomodidad: "La ansiedad es incómoda, no peligrosa. Puedes tolerarla." No uses técnicas de relajación durante la exposición — reducen la habituación. Sí puedes usar breathing pacing suave entre exposiciones, no durante.',
      },
      {
        title: 'Exposición repetida hasta habituación',
        body: 'Repite la misma exposición entre sesiones (tarea para casa) hasta que el ítem genere SUDS ≤ 20 consistentemente. Luego pasa al siguiente ítem de la jerarquía. El avance debe ser gradual pero sostenido.',
      },
      {
        title: 'Exposición interoceptiva (si aplica)',
        body: 'Para TOC con rituales de comprobación o ansiedad por enfermedad: añade exposición a sensaciones físicas (hiperventilación, rotación) para desensibilizar la respuesta al arousal fisiológico.',
      },
      {
        title: 'Prevención de recaídas',
        body: 'Anticipa que los síntomas pueden reaparecer en momentos de estrés. Elabora un plan escrito: señales de alarma, primeras acciones (re-exposición inmediata), cómo pedir ayuda. Programa sesiones de seguimiento a 1, 3 y 6 meses.',
      },
    ],
    tips: [
      'La prevención de respuesta es tan importante como la exposición — sin ella es solo exposición ordinaria.',
      'Los rituales mentales son los más difíciles de identificar y prevenir — pregunta explícitamente.',
      'La exposición imaginaria (para obsesiones de daño, etc.) es tan eficaz como la in vivo cuando la in vivo no es posible.',
      'Aumenta la dificultad más rápido de lo que el paciente pediría — la progresión lenta mantiene la ansiedad.',
      'El terapeuta puede modelar la exposición (tocar el objeto "contaminado") para reducir la vergüenza.',
    ],
    reference: 'Foa, E. B. & Kozak, M. J. (1996). Psychological treatment for OCD. OCD: Theory, Research and Treatment. Guilford.',
  },

  {
    id: 'tcc-ep',
    modality: 'tcc',
    name: 'Exposición Prolongada (EP) para TEPT',
    indication: 'TEPT · Trauma simple · Trauma complejo (con adaptación)',
    sessions: '8–15 sesiones (90 min)',
    difficulty: 'Avanzado',
    overview:
      'Protocolo de Foa & Rothbaum (1998), reconocido como tratamiento de primera línea para TEPT por APA y OMS. Combina exposición imaginaria (relato del trauma) y exposición in vivo (situaciones evitadas relacionadas con el trauma).',
    indications: [
      'TEPT por trauma único (agresión, accidente, desastre)',
      'TEPT con evitación prominente',
      'Trauma complejo (con modificaciones — STAIR-PE)',
    ],
    contraindications: [
      'Riesgo suicida activo o autolesiones no estabilizadas',
      'Disociación severa (primero estabilización)',
      'Abuso activo de sustancias',
      'Psicosis activa',
    ],
    steps: [
      {
        title: 'Sesiones 1–2: Psicoeducación y construcción de la alianza',
        body: 'Explica el modelo de procesamiento emocional: el trauma no procesado queda "atascado". La evitación mantiene el TEPT. La activación de la memoria traumática + ausencia de consecuencias negativas = corrección del aprendizaje. Enseña respiración diafragmática como herramienta de control.',
      },
      {
        title: 'Sesiones 1–2: Jerarquía de situaciones evitadas (in vivo)',
        body: 'Lista de situaciones, lugares, actividades o personas que el paciente evita por su relación con el trauma. SUDS de 0 a 100. Estas situaciones objetivamente seguras se abordarán en las tareas para casa.',
      },
      {
        title: 'Sesiones 3–10: Exposición in vivo (tareas para casa)',
        body: 'El paciente se expone entre sesiones a situaciones de la jerarquía (menor a mayor). Registra SUDS al inicio, a los 10 min y al final. La exposición dura hasta que la ansiedad baja al 50%. Se revisa en sesión.',
      },
      {
        title: 'Sesiones 3–10: Exposición imaginaria en sesión',
        body: 'El paciente narra el evento traumático en presente, con detalle (imágenes, pensamientos, emociones, sensaciones físicas). El terapeuta escucha activamente y ocasionalmente pregunta por detalles. La narración se graba y el paciente la escucha como tarea. Repetir hasta reducción del SUDS.',
      },
      {
        title: 'Identificar "puntos calientes" (hot spots)',
        body: 'Momentos del relato donde la ansiedad sube más. Explorar el significado: "¿Qué significa para ti ese momento?" A menudo contienen cogniciones nucleares sobre culpa, vergüenza o amenaza futura.',
      },
      {
        title: 'Procesar cogniciones traumáticas',
        body: 'Aborda cogniciones como "Fue mi culpa", "El mundo es completamente peligroso", "Estoy dañado/a para siempre." Usa Socrates para generar perspectivas más equilibradas, especialmente en puntos calientes.',
      },
      {
        title: 'Sesión final: revisión del progreso y prevención de recaídas',
        body: 'Compara la primera narración con la última — el contraste suele ser muy elocuente para el paciente. Planifica cómo manejar el regreso de síntomas. Formaliza los logros y refuerza la autoeficacia del paciente.',
      },
    ],
    tips: [
      'La alianza terapéutica sólida es el predictor más potente del éxito — no apresures la exposición.',
      'Algunos pacientes se disocian durante la narración — usa el grounding para volver al presente antes de continuar.',
      'La exposición prolongada "no hace daño" — la ansiedad temporal es parte del proceso de sanación.',
      'La exposición imaginaria no es una sola narración estática; se va enriqueciendo con cada repetición.',
      'Para trauma complejo o con alta disociación, considera STAIR (Cloitre) antes de la fase de exposición.',
    ],
    reference: 'Foa, E. B., Hembree, E. A. & Rothbaum, B. O. (2007). Prolonged Exposure Therapy for PTSD. Oxford University Press.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DBT — Terapia Dialéctico-Conductual
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'dbt-estructura',
    modality: 'dbt',
    name: 'Estructura general del tratamiento DBT',
    indication: 'TLP · Desregulación emocional severa · Conductas de riesgo',
    sessions: '12 meses (estándar)',
    difficulty: 'Avanzado',
    overview:
      'DBT completo incluye 4 componentes: terapia individual semanal, grupo de habilidades semanal, coaching telefónico entre sesiones y equipo de consulta del terapeuta. Cada uno cumple una función específica e insustituible.',
    indications: [
      'Trastorno límite de personalidad (TLP) — primera línea',
      'Desregulación emocional severa con conductas de riesgo',
      'Autolesiones, intentos de suicidio recurrentes',
      'Trastornos alimentarios con desregulación emocional',
      'Abuso de sustancias con comorbilidad emocional',
    ],
    steps: [
      {
        title: 'Componente 1 — Terapia individual semanal (50–60 min)',
        body: 'Objetivos en orden de prioridad: 1) Conductas que amenazan la vida (suicidio, autolesión). 2) Conductas que interfieren con la terapia (no asistencia, no hacer tareas). 3) Conductas que interfieren con la calidad de vida. 4) Adquisición de habilidades DBT. Usa el diario de registro semanal (diary card) como hilo conductor de la sesión.',
      },
      {
        title: 'Componente 2 — Grupo de habilidades (2–2.5 h semanales)',
        body: 'Formato psicoeducativo/taller. Enseña los 4 módulos en ciclo: Mindfulness (base) → Tolerancia al malestar → Regulación emocional → Efectividad interpersonal. Un ciclo completo dura 6 meses; se repite dos veces en el año estándar. El terapeuta individual NO es el líder del grupo.',
      },
      {
        title: 'Componente 3 — Coaching telefónico',
        body: 'El paciente puede llamar al terapeuta antes de una crisis (no después de autolesionarse). Objetivo: generalizar habilidades a situaciones de crisis en tiempo real. Duración: 5–15 min. Regla: 24 h sin contacto después de una autolesión (consecuencia natural, no castigo).',
      },
      {
        title: 'Componente 4 — Equipo de consulta del terapeuta',
        body: 'Reunión semanal del equipo de terapeutas DBT. Función: prevenir el burnout, supervisar el cumplimiento del protocolo, validar al terapeuta (DBT trata también al terapeuta). Esencial para la fidelidad al modelo.',
      },
      {
        title: 'Diary card (tarjeta de registro diario)',
        body: 'El paciente registra diariamente: emociones (intensidad 0–5), pensamientos suicidas/autolesiones, conductas problemáticas, uso de habilidades DBT, calidad del sueño y otras variables. La diary card informa el inicio de cada sesión individual.',
      },
      {
        title: 'Análisis en cadena conductual',
        body: 'Para cada conducta problemática: mapea la cadena completa desde el evento vulnerabilizador → desencadenante → eslabones (pensamientos, emociones, acciones) → conducta problema → consecuencias. Identifica puntos de intervención en cada eslabón. Concluye con plan de solución.',
      },
    ],
    tips: [
      'La dialéctica central: aceptación + cambio. Nunca solo uno — sin aceptación el paciente no cambia; sin cambio la terapia no avanza.',
      'La validación (6 niveles de Linehan) es la estrategia más importante de DBT — más que cualquier técnica.',
      'DBT sin grupo de habilidades es DBT incompleto — el grupo no es opcional.',
      'El orden de prioridades (vida → terapia → calidad de vida) es riguroso y no negociable.',
      'El burnout del terapeuta es un problema real con pacientes límite — el equipo de consulta es protector esencial.',
    ],
    reference: 'Linehan, M. M. (2015). DBT Skills Training Manual (2.ª ed.). Guilford Press.',
  },

  {
    id: 'dbt-habilidades',
    modality: 'dbt',
    name: 'Módulos de habilidades DBT',
    indication: 'Desregulación emocional · Impulsividad · Relaciones caóticas',
    sessions: '24 semanas (ciclo completo)',
    difficulty: 'Intermedio',
    overview:
      'Los 4 módulos de habilidades son el núcleo del grupo DBT pero también pueden enseñarse individualmente. Mindfulness es la habilidad "core" que subyace a todos los demás módulos.',
    indications: ['Cualquier paciente con desregulación emocional', 'Como complemento a cualquier terapia principal'],
    steps: [
      {
        title: 'Módulo 1 — Mindfulness (habilidades "Qué" y "Cómo")',
        body: 'Qué hacer: Observar (notar sin etiquetas), Describir (poner palabras sin juzgar), Participar (implicarse plenamente). Cómo hacerlo: Sin juzgar (solo hechos), Una cosa a la vez (no multitarea), Efectivamente (hacer lo que funciona, no lo que es "justo"). Práctica: 5–10 min diarios de mindfulness formal.',
      },
      {
        title: 'Módulo 2 — Tolerancia al malestar',
        body: 'TIPP: Temperatura (agua fría), Ejercicio Intenso, Respiración Pausada, Relajación Progresiva. ACCEPTS: Actividades, Contribución, Comparaciones, Emociones opuestas, Pensar en otras cosas, Sensaciones. IMPROVE: Imagery, Meaning, Prayer, Relaxation, One thing, Vacation, Encouragement. Pros y contras de tolerar vs no tolerar la crisis.',
      },
      {
        title: 'Módulo 3 — Regulación emocional',
        body: 'PLEASE: cuidado físico básico. ABC PLEASE: Acumular positivos, Build mastery, Cope ahead, PLEASE. Reducir vulnerabilidad emocional. Acción opuesta (opposite action). Resolución de problemas. Check the facts (¿la emoción encaja con los hechos?). Olas de emoción (mindfulness de emociones).',
      },
      {
        title: 'Módulo 4 — Efectividad interpersonal',
        body: 'DEAR MAN: Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate. GIVE: Gentle, Interested, Validate, Easy manner (mantener la relación). FAST: Fair, no Apologies, Stick to values, Truthful (mantener la autoestima). Factores que interfieren en la efectividad interpersonal.',
      },
    ],
    tips: [
      'Mindfulness se practica en cada sesión de grupo — es la base, no un módulo que se termina.',
      'Las habilidades se aprenden mejor practicándolas, no solo discutiéndolas.',
      'Conecta cada habilidad con una situación real del paciente — la generalización es el objetivo.',
      'El handout visual de cada habilidad (tarjetas, fichas) ayuda a su uso en situaciones de crisis.',
    ],
    reference: 'Linehan, M. M. (2015). DBT Skills Training Handouts and Worksheets (2.ª ed.). Guilford.',
  },

  {
    id: 'dbt-cadena',
    modality: 'dbt',
    name: 'Análisis en cadena conductual',
    indication: 'Conductas problema recurrentes · Autolesión · Impulsividad',
    sessions: 'Técnica de uso recurrente',
    difficulty: 'Intermedio',
    overview:
      'Evaluación funcional exhaustiva de una conducta problema específica. Identifica la cadena causal completa para encontrar puntos de intervención. Concluye siempre con un plan de solución alternativa.',
    indications: ['Autolesiones', 'Intentos de suicidio', 'Conductas que interfieren con la terapia', 'Cualquier conducta problemática recurrente'],
    steps: [
      {
        title: 'Definir la conducta problema con precisión',
        body: '¿Qué hizo exactamente? ¿Cuándo? ¿Dónde? ¿Con qué intensidad/duración? Ser específico evita la vaguedad que impide el análisis.',
      },
      {
        title: 'Identificar el factor de vulnerabilidad',
        body: '¿Cómo estaba el paciente ANTES del desencadenante? ¿Dormía mal? ¿Estaba enfermo? ¿Había consumido? ¿Estaba en conflicto? El PLEASE semanal predice la vulnerabilidad emocional.',
      },
      {
        title: 'Identificar el evento desencadenante',
        body: 'El evento ambiental o interno que inició la cadena. Puede ser sutil: un mensaje de texto, un recuerdo, una imagen. Pregunta: "¿Qué pasó justo antes de que empezaras a sentirte mal?"',
      },
      {
        title: 'Mapear los eslabones de la cadena',
        body: 'Para cada eslabón: pensamiento → emoción → sensación física → acción. "¿Qué pensaste cuando ocurrió eso?" → "¿Qué sentiste en el cuerpo?" → "¿Qué hiciste a continuación?" Sé muy minucioso — los eslabones más breves son los más importantes.',
      },
      {
        title: 'Identificar la conducta problema',
        body: 'El eslabón final de la cadena: la conducta que se quiere cambiar. ¿Qué hizo exactamente?',
      },
      {
        title: 'Mapear las consecuencias',
        body: 'Consecuencias a corto plazo (lo que refuerza la conducta: alivio, atención, evitación). Consecuencias a largo plazo (lo que la castiga: vergüenza, daño, problemas relacionales). Este análisis explica POR QUÉ la conducta se mantiene.',
      },
      {
        title: 'Elaborar el plan de solución',
        body: 'Para cada eslabón identificado, ¿qué habilidad DBT podría interrumpir la cadena? ¿Dónde hubiera sido más fácil intervenir? Escribe el plan alternativo paso a paso. Este plan se practica (role-play si es posible).',
      },
    ],
    tips: [
      'El tono durante el análisis debe ser curioso, no inquisidor. Es un análisis, no un interrogatorio.',
      'La cadena siempre termina con el plan de solución — sin él no es una intervención DBT completa.',
      'Algunos pacientes se sienten culpables al hacer el análisis — valida la vergüenza ANTES de comenzar.',
      'El análisis revela qué habilidades el paciente sabe pero no usa (problema de motivación) vs cuáles no conoce (problema de déficit).',
    ],
    reference: 'Linehan, M. M. (1993). Cognitive-Behavioral Treatment of Borderline Personality Disorder. Guilford.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACT — Aceptación y Compromiso
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'act-hexaflex',
    modality: 'act',
    name: 'Modelo Hexaflex y evaluación ACT',
    indication: 'Base de todo tratamiento ACT',
    sessions: '2–3 sesiones (evaluación)',
    difficulty: 'Fundamental',
    overview:
      'El Hexaflex describe los 6 procesos de inflexibilidad psicológica (lado patológico) y sus 6 contrapartes de flexibilidad (lado terapéutico). La formulación ACT identifica qué procesos están más comprometidos en el paciente.',
    indications: ['Todo tratamiento ACT', 'Evaluación inicial de flexibilidad psicológica', 'Planificación del tratamiento'],
    steps: [
      {
        title: 'Proceso 1 — Fusión vs. Defusión cognitiva',
        body: 'Fusión: los pensamientos se toman literalmente ("Soy un fracasado" = verdad absoluta). El pensamiento controla la conducta. Evalúa: "¿El paciente actúa como si sus pensamientos fueran órdenes?" Defusión terapéutica: "Noto que tengo el pensamiento de que soy un fracasado."',
      },
      {
        title: 'Proceso 2 — Evitación experiencial vs. Aceptación',
        body: 'Evitación: esfuerzos por controlar o eliminar experiencias privadas (emociones, pensamientos, recuerdos). Pregunta: "¿Qué hace cuando se siente ansioso/a?" Aceptación: apertura activa a experiencias difíciles sin luchar contra ellas.',
      },
      {
        title: 'Proceso 3 — Dominancia del pasado/futuro vs. Presente',
        body: 'Rumiación (pasado) o preocupación (futuro) vs. contacto flexible con el momento presente. Evalúa: ¿La mayor parte del tiempo mental del paciente está en el aquí y ahora o en "y si hubiera…" / "y si…"?',
      },
      {
        title: 'Proceso 4 — Self conceptualizado vs. Yo como contexto',
        body: 'Self conceptualizado: "Soy ansioso/a", "Soy depresivo/a" — identidad fundida con el contenido mental. Yo como contexto: el self observador, constante, que contiene pero no es las experiencias. Evalúa: ¿El paciente se define por sus síntomas?',
      },
      {
        title: 'Proceso 5 — Falta de claridad de valores vs. Valores',
        body: 'Valores: direcciones vitales elegidas libremente, no metas. Evalúa si el paciente vive según sus valores o según el control del malestar. Pregunta: "¿Qué te importa profundamente en la vida? ¿Tu vida actual refleja eso?"',
      },
      {
        title: 'Proceso 6 — Inacción vs. Acción comprometida',
        body: 'Inacción: evitación de conductas valiosas por miedo al malestar. Acción comprometida: pasos concretos en dirección a valores incluso con malestar. Evalúa: ¿Qué ha dejado de hacer el paciente que antes valoraba?',
      },
      {
        title: 'Formulación de caso ACT: el diagrama Hexaflex',
        body: 'Con la evaluación, identifica los 2–3 procesos más comprometidos en este paciente específico. Orienta el tratamiento hacia esos procesos prioritarios. La formulación es siempre idiográfica — no hay un orden único universal de trabajo.',
      },
    ],
    tips: [
      'ACT no tiene un protocolo lineal fijo — el terapeuta navega los 6 procesos según lo que emerge en sesión.',
      'La metáfora es el lenguaje de ACT — aprende 5–6 metáforas centrales y úsalas consistentemente.',
      'El terapeuta ACT también practica los procesos en sí mismo — la autenticidad es esencial.',
      'La relación terapéutica en ACT es igualitaria: el terapeuta comparte sus propias luchas con los procesos.',
    ],
    reference: 'Hayes, S. C., Strosahl, K. D. & Wilson, K. G. (2012). Acceptance and Commitment Therapy (2.ª ed.). Guilford.',
  },

  {
    id: 'act-defusion',
    modality: 'act',
    name: 'Defusión cognitiva — técnicas clínicas',
    indication: 'Fusión cognitiva · Rumiación · Pensamiento inflexible',
    sessions: '2–4 sesiones (técnica)',
    difficulty: 'Intermedio',
    overview:
      'La defusión reduce el impacto y la credibilidad funcional de los pensamientos sin intentar cambiarlos, suprimirlos o discutirlos. El objetivo no es creerlos menos, sino que dominen menos la conducta.',
    indications: ['Rumiación intensa', 'Pensamientos intrusivos', 'Fusión con la autocrítica', 'Creencias rígidas que bloquean la acción'],
    steps: [
      {
        title: 'Psicoeducación: la mente narrativa',
        body: 'Explica que la mente genera pensamientos constantemente — es su trabajo. Los pensamientos no son hechos, órdenes ni amenazas. La pregunta no es si el pensamiento es verdadero, sino si seguirlo te lleva hacia o lejos de lo que valoras.',
      },
      {
        title: 'Técnica: "Noto que tengo el pensamiento de que…"',
        body: 'El paciente practica añadir esta frase delante de cualquier pensamiento difícil. "Soy un inútil" → "Noto que tengo el pensamiento de que soy un inútil." El añadido crea distancia. Practica en sesión con los pensamientos más fusionados del paciente.',
      },
      {
        title: 'Técnica: Hojas en el río / nubes en el cielo',
        body: 'Visualización: el paciente observa sus pensamientos pasar sobre hojas en un río o nubes en el cielo. Sin aferrarse ni alejarlos — solo observar. Ideal para mindfulness de pensamientos.',
      },
      {
        title: 'Técnica: El yo observador (observing self)',
        body: 'Guía al paciente a tomar perspectiva del "yo que observa": "¿Quién está notando ese pensamiento?" Esta pregunta apunta al yo como contexto, no al contenido. Ejercicio de los ojos de Dios / cámara sobre el hombro.',
      },
      {
        title: 'Técnica: Cantar el pensamiento',
        body: 'El paciente dice el pensamiento problemático con la melodía de "Cumpleaños feliz" o cualquier canción conocida. Reduce el impacto emocional mediante la descontextualización. Especialmente útil con pensamientos autocríticos repetitivos.',
      },
      {
        title: 'Técnica: Dar las gracias a la mente',
        body: '"Gracias, mente" — cuando aparece un pensamiento ansioso o limitante, el paciente lo reconoce con: "Gracias, mente, por intentar protegerme." Valida la función protectora sin obedecer el contenido.',
      },
      {
        title: 'Generalización fuera de sesión',
        body: 'Elige 1–2 técnicas que resuenen más con el paciente. Define cuándo y cómo las practicará. Establece un "pensamiento centinela" — el pensamiento más frecuente con el que practicar. Revisa en la próxima sesión.',
      },
    ],
    tips: [
      'La defusión no busca hacer el pensamiento "más positivo" — eso sería reestructuración TCC, no defusión.',
      'Si el paciente dice "pero es verdad que soy un inútil", responde: "Puede que sea verdad o no — la pregunta es: ¿te ayuda a vivir bien creerlo de esta manera?"',
      'Adapta la metáfora al paciente: para alguien muy deportista, "jugadores en el banquillo" puede funcionar mejor que "hojas en el río".',
      'La defusión tiene un riesgo: puede usarse como evitación ("dejo pasar el pensamiento"). Monitorea que el paciente actúe desde valores mientras defusiona.',
    ],
    reference: 'Harris, R. (2019). ACT Made Simple (2.ª ed.). New Harbinger.',
  },

  {
    id: 'act-valores',
    modality: 'act',
    name: 'Clarificación de valores y acción comprometida',
    indication: 'Depresión · Ansiedad · Pérdida de sentido · Procrastinación',
    sessions: '3–6 sesiones',
    difficulty: 'Básico-Intermedio',
    overview:
      'Los valores son direcciones vitales elegidas libremente, no metas que se alcanzan. Actuar en su dirección da sentido y motivación incluso cuando hay malestar. La acción comprometida traduce valores en conductas concretas.',
    indications: ['Sensación de vacío o falta de propósito', 'Depresión con pérdida de dirección', 'Procrastinación crónica basada en miedos', 'Tras trauma: reconstrucción de vida significativa'],
    steps: [
      {
        title: 'Distinguir valores de metas y reglas',
        body: 'Valores: "Quiero ser un padre presente" — es una dirección continua, nunca terminada. Meta: "Llevar a mi hijo al fútbol este sábado" — se alcanza y termina. Regla: "Debo ser un buen padre" — proviene del miedo al juicio. Los valores son elegidos, no impuestos.',
      },
      {
        title: 'Ejercicio del obituario / carta de despedida',
        body: 'Pide al paciente que imagine su funeral dentro de 30 años. ¿Qué querría que dijeran de él/ella las personas que más le importan? ¿Qué tipo de persona fue? ¿Cómo afectó a los demás? Los valores surgen de forma natural con esta visualización.',
      },
      {
        title: 'Rueda de valores (16 áreas)',
        body: 'Evalúa la importancia (1–10) y la vivencia actual (1–10) de áreas como: familia, pareja, amistades, trabajo, salud, educación, ocio, espiritualidad, comunidad, naturaleza, creatividad, ciudadanía. La brecha entre importancia y vivencia señala dónde intervenir.',
      },
      {
        title: 'Clarificación con la "matriz" (Matrix ACT)',
        body: 'Cuatro cuadrantes: Qué/quién importa (valores) | Qué bloquea moverse hacia allí (experiencias internas difíciles) | Conductas de alejamiento (evitación) | Conductas de acercamiento (valores en acción). Mapa visual muy potente para clarificar el patrón completo.',
      },
      {
        title: 'Definir la acción comprometida',
        body: 'Para cada valor: "¿Qué acción concreta y pequeña podrías hacer esta semana en la dirección de ese valor?" La acción debe ser específica (qué, cuándo, cómo), posible aunque haya malestar, y elegida por el paciente. Un compromiso de 8/10 o más en motivación.',
      },
      {
        title: 'Manejar obstáculos y recaídas',
        body: 'Anticipa con el paciente: "¿Qué podría impedir esta acción?" Los obstáculos suelen ser internos (pensamientos, emociones, sensaciones). Usa defusión y aceptación para hacer espacio a esas experiencias mientras se actúa. "Puedo sentir ansiedad Y hacer la llamada."',
      },
    ],
    tips: [
      'Los valores deben ser del paciente, no del terapeuta. Cuidado con imponer "valores saludables" (ejercicio, familia…).',
      'La acción comprometida no significa ausencia de malestar — significa actuar con malestar incluido.',
      'Para pacientes con trauma o depresión severa, empezar por valores de autocuidado antes de valores más complejos.',
      'La consistencia es más importante que la perfección. Una acción pequeña cada día pesa más que una grande esporádica.',
    ],
    reference: 'Hayes, S. C. & Smith, S. (2005). Get Out of Your Mind and Into Your Life. New Harbinger.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EMDR — Desensibilización y Reprocesamiento por Movimientos Oculares
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'emdr-ocho-fases',
    modality: 'emdr',
    name: 'Protocolo estándar EMDR — 8 fases',
    indication: 'TEPT · Trauma simple · Trauma complejo (con adaptación)',
    sessions: '8–16 sesiones (trauma simple) · 1–2 años (trauma complejo)',
    difficulty: 'Avanzado — Requiere certificación',
    overview:
      'Protocolo desarrollado por Francine Shapiro (1987). La estimulación bilateral (EB) — movimientos oculares, tapping o tonos alternantes — facilita el reprocesamiento adaptativo de memorias traumáticas almacenadas de forma disfuncional. Reconocido como tratamiento de primera línea por OMS y APA.',
    indications: ['TEPT', 'Fobias', 'Duelo complicado', 'Ansiedad con origen traumático', 'Depresión con traumas nucleares'],
    contraindications: [
      'Disociación severa sin estabilización previa',
      'Psicosis activa',
      'Epilepsia fotosensible (para movimientos oculares)',
      'Paciente sin red de apoyo para contener entre sesiones',
    ],
    steps: [
      {
        title: 'Fase 1 — Historia clínica y planificación del tratamiento',
        body: 'Evalúa la historia traumática completa. Identifica memorias diana (targets) organizadas en redes de memoria. Evalúa capacidad de regulación emocional, recursos y ventana de tolerancia. Planifica el orden de abordaje: pasado → presente → futuro (instalación de plantilla).',
      },
      {
        title: 'Fase 2 — Preparación',
        body: 'Establece la alianza terapéutica y psicoeducación sobre el procesamiento EMDR. Enseña y refuerza recursos: Lugar seguro (visualización), Contenedor (para guardar material entre sesiones), Equipo de apoyo (figuras de apego internas). Evalúa la capacidad dual de atención (observar + recordar simultáneamente).',
      },
      {
        title: 'Fase 3 — Evaluación de la memoria diana',
        body: 'Imagen representativa del peor momento. Cognición Negativa (CN): "Lo que esto me hace creer sobre mí mismo/a en presente" (ej. "Soy impotente"). Cognición Positiva (CP): lo que querría creer. VoC (Validity of Cognition): cuánto cree la CP ahora (1–7). Emoción: qué emoción siente al pensar en la imagen + CN. SUD (Subjective Units of Disturbance, 0–10). Localización corporal del malestar.',
      },
      {
        title: 'Fase 4 — Desensibilización',
        body: 'Activa la memoria diana (imagen + CN + emoción + SUD + cuerpo) y aplica EB (series de 20–30 movimientos oculares o equivalente). Después de cada serie: "¿Qué notas ahora?" Sin guiar ni interpretar — el sistema procesa espontáneamente. Repite hasta SUD = 0 (o 1 ecológico). Maneja canales bloqueados (loops, intrusión somática, disociación).',
      },
      {
        title: 'Fase 5 — Instalación de la cognición positiva',
        body: 'Cuando SUD = 0–1: vincula la imagen original con la CP. "Al pensar en la imagen y en las palabras [CP], ¿cuánto las sientes verdaderas de 1 a 7?" (VoC). Aplica EB hasta VoC = 7 o el máximo ecológico. No instales una CP que el paciente no crea genuinamente.',
      },
      {
        title: 'Fase 6 — Escaneo corporal',
        body: 'Con la imagen y la CP, el paciente recorre mentalmente el cuerpo de cabeza a pies. Cualquier tensión o sensación residual es un canal no procesado. Aplica EB sobre esas sensaciones hasta que el cuerpo quede neutro o con sensaciones positivas.',
      },
      {
        title: 'Fase 7 — Cierre',
        body: 'Al final de la sesión (aunque el procesamiento esté incompleto): técnica del Contenedor para guardar el material no procesado. Lugar seguro si hay activación residual. Informa al paciente que el procesamiento puede continuar entre sesiones (sueños, imágenes). Diary card de seguimiento.',
      },
      {
        title: 'Fase 8 — Reevaluación',
        body: 'Al inicio de la siguiente sesión: SUD de la memoria diana procesada. ¿Ha mantenido el avance? ¿Han emergido nuevas memorias? Revisa el mapa de redes de memoria y selecciona el siguiente target.',
      },
    ],
    tips: [
      'EMDR requiere formación certificada (EMDR Europe / EMDRIA) — este protocolo es una guía de referencia, no un sustituto de la formación.',
      'La fase 2 (preparación) es la más importante en trauma complejo — no apresures el procesamiento.',
      'Si el paciente se bloquea (loop): cambia el estímulo de EB, la dirección de los movimientos, o usa la técnica del entretejido cognitivo.',
      'El procesamiento entre sesiones puede generar material inesperado — informa siempre al paciente y dale recursos de estabilización.',
      'En trauma complejo (TEPT-C): considera el protocolo EMDR + IASB de Shapiro o el modelo AIP expandido de Korn & Leeds.',
    ],
    reference: 'Shapiro, F. (2018). Eye Movement Desensitization and Reprocessing (EMDR) Therapy: Basic Principles, Protocols, and Procedures (3.ª ed.). Guilford.',
  },

  {
    id: 'emdr-fase1',
    modality: 'emdr',
    name: 'Fase 1 EMDR — Historia clínica y planificación',
    indication: 'TEPT · Todo paciente EMDR antes de iniciar',
    sessions: '1–3 sesiones',
    difficulty: 'Avanzado — Requiere certificación',
    overview:
      'Primera fase del protocolo estándar EMDR. Consiste en la evaluación exhaustiva de la historia traumática y la planificación del tratamiento. Incluye la identificación de memorias diana organizadas en redes de memoria, la evaluación de la capacidad de regulación emocional y la definición del orden de abordaje: pasado → presente → futuro.',
    indications: ['Todo inicio de tratamiento EMDR', 'Evaluación de la historia traumática completa', 'Planificación del orden de targets'],
    steps: [
      {
        title: 'Recogida de historia traumática completa',
        body: 'Identifica todos los eventos potencialmente traumáticos utilizando una línea de tiempo. Incluye traumas de shock (eventos únicos) y traumas de desarrollo (negligencia, abuso crónico, pérdidas tempranas). Usa el cuestionario de vida adversa o el LEC-5 como guía sistemática.',
      },
      {
        title: 'Identificación de redes de memoria',
        body: 'Agrupa los eventos traumáticos en redes de memoria que comparten cogniciones negativas nucleares similares (ej. "No soy valioso/a", "El mundo es peligroso"). Una red bien identificada permite un tratamiento más eficiente — procesar el nodo más antiguo puede generalizar a recuerdos posteriores.',
      },
      {
        title: 'Selección y priorización de memorias diana (targets)',
        body: 'Establece el orden de procesamiento. Regla general: trabajar primero el evento más antiguo de la red (el que "instaló" la CN). Para casos con riesgo activo, priorizar el evento más perturbador. Usa el protocolo de tres vías: pasado (memorias) → presente (disparadores actuales) → futuro (plantilla de recursos).',
      },
      {
        title: 'Evaluación de la ventana de tolerancia y recursos de regulación',
        body: 'Evalúa la capacidad del paciente para activarse emocionalmente sin disociarse ni hiperactivarse. Determina si necesita trabajo de estabilización previo (Fase 2 extendida). Identifica qué recursos internos y externos tiene disponibles.',
      },
      {
        title: 'Evaluación de factores contraindicados y adaptaciones necesarias',
        body: 'Descarta o adapta el protocolo ante: disociación severa (usa protocolo bifásico), epilepsia fotosensible (sustituye movimientos oculares por tapping o tonos alternantes), embarazo, o ausencia de red de apoyo para contener entre sesiones. Documenta las adaptaciones en el plan de tratamiento.',
      },
      {
        title: 'Presentación del plan de tratamiento al paciente',
        body: 'Explica al paciente la estructura del tratamiento EMDR, el número estimado de sesiones y el orden de abordaje de las memorias. El consentimiento informado debe incluir que el procesamiento puede continuar entre sesiones. Inicia la psicoeducación básica sobre el modelo AIP (preparar para Fase 2).',
      },
    ],
    tips: [
      'Una historia clínica incompleta lleva a un tratamiento incompleto — dedica el tiempo que haga falta a esta fase.',
      'El mapa de redes de memoria es un documento vivo que se actualiza durante todo el tratamiento.',
      'En trauma complejo, esta fase puede durar varias sesiones — es una inversión que protege al paciente.',
      'Documenta los targets identificados y el SUD estimado de cada uno para monitorizar el progreso.',
    ],
    reference: 'Shapiro, F. (2018). Eye Movement Desensitization and Reprocessing (EMDR) Therapy (3.ª ed.). Guilford.',
  },

  {
    id: 'emdr-preparacion',
    modality: 'emdr',
    name: 'Fase 2 EMDR — Preparación y estabilización',
    indication: 'Trauma complejo · Alta disociación · Recursos insuficientes',
    sessions: '2–10 sesiones (variable)',
    difficulty: 'Intermedio-Avanzado',
    overview:
      'La preparación en EMDR no es solo psicoeducación — es el desarrollo activo de recursos de regulación emocional. En trauma complejo puede durar semanas o meses. Invertir aquí reduce el riesgo de desestabilización durante el procesamiento.',
    indications: ['Todo paciente EMDR antes de desensibilización', 'Mayor extensión en trauma complejo o alta disociación'],
    steps: [
      {
        title: 'Psicoeducación sobre el modelo AIP',
        body: 'El trauma queda almacenado en redes de memoria de forma disfuncional (con emociones, creencias y sensaciones del momento original). EMDR facilita la conexión con redes de memoria adaptativa para que el cerebro complete el procesamiento natural. Los movimientos oculares imitan el REM del sueño.',
      },
      {
        title: 'Instalación del Lugar seguro',
        body: 'El paciente visualiza un lugar (real o imaginario) donde se siente completamente seguro. Se desarrolla con todos los sentidos: qué ve, oye, huele, siente en el cuerpo. Se instala con EB breve (6–8 movimientos). Se refuerza con una palabra clave de acceso. Práctica diaria en casa.',
      },
      {
        title: 'Instalación del Contenedor',
        body: 'Imagen de un contenedor (caja fuerte, cofre, reactor nuclear) donde el paciente puede "guardar" material difícil entre sesiones. Debe ser lo suficientemente sólido como para contener. El material puede sacarse voluntariamente en sesión, pero no sale solo. Práctica: meter algo difícil ahora.',
      },
      {
        title: 'Instalación del Equipo de apoyo (figuras nutricias)',
        body: 'Identificar 3–4 figuras (personas reales, históricas, espirituales, imaginarias) que encarnen sabiduría, protección, cuidado y apoyo interno. Instalar cada figura con EB. El paciente puede invocarlas durante el procesamiento si hay activación excesiva.',
      },
      {
        title: 'Evaluar la ventana de tolerancia',
        body: 'Enseña el concepto de ventana de tolerancia (Siegel). Evalúa si el paciente puede activarse moderadamente sin disociarse ni hiperactivarse. La EB solo funciona dentro de la ventana. Si el paciente sale de la ventana, usar recursos antes de continuar.',
      },
      {
        title: 'Práctica de la atención dual',
        body: 'Ejercicios de atención dual: "Piensa en algo ligeramente molesto mientras sigues mi dedo." El objetivo es que el paciente pueda observar el pasado DESDE el presente simultáneamente — sin ser absorbido por el recuerdo. Esta habilidad es esencial para el procesamiento.',
      },
    ],
    tips: [
      'El criterio para avanzar a desensibilización: el paciente puede activarse en consulta y regularse dentro de la sesión.',
      'No hay tiempo mínimo en Fase 2 — hay pacientes que están listos en 2 sesiones y otros que necesitan 3 meses.',
      'La instalación del Lugar seguro no debe usarse como evitación durante el procesamiento, solo para estabilizar al cierre.',
      'En trauma de apego, el Lugar seguro puede ser difícil porque el paciente nunca tuvo uno real — usa el Lugar tranquilo en su lugar.',
    ],
    reference: 'Korn, D. L. & Leeds, A. M. (2002). Preliminary evidence of efficacy for EMDR resource development and installation. Journal of Clinical Psychology.',
  },

  {
    id: 'emdr-fase3',
    modality: 'emdr',
    name: 'Fase 3 EMDR — Evaluación de la memoria diana',
    indication: 'TEPT · Evaluación previa a cada sesión de desensibilización',
    sessions: '20–30 minutos (dentro de la sesión)',
    difficulty: 'Avanzado — Requiere certificación',
    overview:
      'Tercera fase del protocolo EMDR. Antes de iniciar la estimulación bilateral, el terapeuta estructura la memoria diana activando todos sus componentes: imagen representativa, cognición negativa, cognición positiva deseada, emoción, SUD y localización corporal. Esta activación estructurada es lo que permite al sistema nervioso comenzar el reprocesamiento.',
    indications: ['Inicio de cada sesión de desensibilización EMDR', 'Evaluación del target seleccionado en Fase 1'],
    steps: [
      {
        title: 'Identificar la imagen representativa',
        body: '"Cuando piensas en [el evento traumático], ¿qué imagen representa el peor momento?" La imagen debe ser específica — no toda la escena, sino el fotograma más perturbador. Si no hay imagen visual, usa el peor pensamiento, sensación o emoción del momento.',
      },
      {
        title: 'Elicitar la Cognición Negativa (CN)',
        body: '"Cuando traes esa imagen a la mente ahora, ¿qué palabras que comiencen con «Yo soy / Yo no soy / Yo no puedo / Yo debería / Yo no debería» encajan mejor?" La CN debe ser en primera persona, en tiempo presente, y capturar la creencia disfuncional sobre uno mismo. Ejemplos: "Soy impotente", "Estoy en peligro", "Soy responsable".',
      },
      {
        title: 'Elicitar la Cognición Positiva (CP)',
        body: '"¿Qué te gustaría creer sobre ti mismo/a cuando piensas en esa imagen?" La CP debe ser lo opuesto funcional de la CN, en primera persona, presente y afirmativa. Ejemplos de CN→CP: "Soy impotente" → "Tengo control"; "Estoy en peligro" → "Estoy a salvo ahora". La CP no necesita sentirse verdadera aún.',
      },
      {
        title: 'Medir la Validez de la Cognición (VoC)',
        body: '"Con esa imagen en mente, ¿cuánto te parecen verdaderas ahora esas palabras [CP] de 1 (completamente falso) a 7 (completamente verdadero)?" El VoC típico al inicio suele ser 1–3. No corrijas una VoC baja — es la línea base para medir el progreso al instalar la CP en Fase 5.',
      },
      {
        title: 'Identificar y medir la emoción',
        body: '"Cuando traes esa imagen y piensas [CN], ¿qué emoción o emociones sientes AHORA?" Nombra la emoción principal (miedo, vergüenza, asco, tristeza, rabia…). Si el paciente describe un pensamiento en lugar de una emoción, orienta: "¿Y eso qué emoción te provoca?"',
      },
      {
        title: 'Medir el SUD (Unidades Subjetivas de Perturbación)',
        body: '"En una escala del 0 al 10, donde 0 es neutro y 10 es la perturbación más intensa que puedas imaginar, ¿cuánto te perturba AHORA esa imagen?" El SUD mide la intensidad emocional en el momento presente, no en el pasado. Algunos pacientes reportan SUD muy alto (8–10) — es una indicación de lo que hay que procesar.',
      },
      {
        title: 'Localizar la sensación corporal',
        body: '"¿Dónde lo sientes en tu cuerpo?" Señala o describe la zona física donde el paciente siente la perturbación (nudo en el estómago, presión en el pecho, tensión en los hombros…). Esta información se usará en la Fase 6 (escaneo corporal) y ayuda a identificar canales somáticos durante el procesamiento.',
      },
    ],
    tips: [
      'La Fase 3 no es una entrevista — es una activación estructurada. Usa exactamente el guion para no contaminar el procesamiento.',
      'Si el paciente no puede identificar una CN, usa la técnica de la flecha descendente: "¿Qué significa ese evento para ti como persona?"',
      'Una CP que el paciente no pueda imaginar creer nunca (VoC = 1) a veces indica una creencia nuclear muy arraigada — trabaja el recurso de CP en preparación antes de desensibilizar.',
      'Si el SUD es 0 espontáneamente, verifica si hay disociación — el paciente puede haber "desconectado" del material.',
    ],
    reference: 'Shapiro, F. (2018). Eye Movement Desensitization and Reprocessing (EMDR) Therapy (3.ª ed.). Guilford.',
  },

  {
    id: 'emdr-fase4',
    modality: 'emdr',
    name: 'Fase 4 EMDR — Desensibilización',
    indication: 'TEPT · Núcleo del reprocesamiento traumático',
    sessions: '45–90 minutos (variable)',
    difficulty: 'Avanzado — Requiere certificación',
    overview:
      'Fase central del protocolo EMDR. El terapeuta aplica estimulación bilateral (EB) — movimientos oculares, tapping bilateral o tonos alternantes — mientras el paciente mantiene la atención dual sobre la memoria diana y el presente. El objetivo es reducir el SUD a 0 (o 1 si es ecológico) permitiendo que la memoria se integre adaptativamente.',
    indications: ['Memorias traumáticas activas (SUD ≥ 1)', 'Fobias con origen traumático', 'Tras completar Fase 2 y 3 correctamente'],
    contraindications: [
      'Disociación severa en la sesión — estabilizar primero con Lugar seguro',
      'SUD = 0 sin correlato corporal (posible disociación)',
    ],
    steps: [
      {
        title: 'Activar la memoria diana y comenzar la EB',
        body: 'Pide al paciente que traiga a la mente la imagen, la CN, la emoción y la sensación corporal identificadas en Fase 3. Inicia la EB: "Sigue el movimiento de mis dedos" (o tapping en rodillas/manos, o auriculares con tonos alternantes). Series de 20–30 movimientos (o 30–45 segundos de tapping/tonos). Velocidad: aproximadamente 1 movimiento por segundo.',
      },
      {
        title: 'Instrucción al paciente durante la EB',
        body: 'Antes de empezar: "Voy a pedirte que notes lo que venga — pensamientos, imágenes, sensaciones, emociones. Solo observa sin juzgar. No hay respuestas correctas o incorrectas. Al terminar cada serie, te diré «Respira» y me dices brevemente qué notaste." NO guíes el contenido del procesamiento.',
      },
      {
        title: 'Procesamiento: seguir los canales',
        body: 'Después de cada serie: "Respira. ¿Qué notas ahora?" El terapeuta escucha sin interpretar y aplica una nueva serie sobre lo que emerge. Si el material evoluciona (cambia la imagen, emoción o cognición), es señal de procesamiento activo — continúa sin intervenir. Registra mentalmente la dirección del canal.',
      },
      {
        title: 'Manejo de canales bloqueados (loops)',
        body: 'Si el paciente reporta exactamente lo mismo durante 3+ series consecutivas, está en un loop. Intervenciones: (a) Cambiar la dirección de los movimientos oculares o el tipo de EB; (b) Cambiar el foco: "¿Qué parte del cuerpo sientes más ahora?"; (c) Entretejido cognitivo: una pregunta socrática que abre el procesamiento ("¿Qué le dirías a un amigo en esa situación?"); (d) Retarget: volver a la imagen original.',
      },
      {
        title: 'Manejo de activación elevada o disociación',
        body: 'Si el paciente sale de la ventana de tolerancia (hiperactivación: llanto intenso, temblor, flashback; o hipoactivación: voz monótona, mirada perdida, respuesta lenta): Para la EB. Usa técnica de grounding: "Mírame. Estás aquí. Siente los pies en el suelo. Respira conmigo." Regresa al procesamiento solo cuando el paciente esté dentro de la ventana.',
      },
      {
        title: 'Verificar el SUD al final de la sesión',
        body: '"Cuando vuelves a la imagen original (el [evento]) y traes CN, ¿cuánto te perturba ahora del 0 al 10?" Si SUD = 0 o 1, pasa a Fase 5. Si SUD > 1 y la sesión termina, usa el Contenedor (Fase 2) para guardar el material y procede al cierre (Fase 7). NO cierres una sesión con material activo sin estabilizar.',
      },
    ],
    tips: [
      'El terapeuta es el "contenedor" — tu presencia tranquila y regulada permite que el paciente se active sin desbordarse.',
      'No interpretes ni valides el contenido emergente — cualquier intervención verbal puede desviar el procesamiento natural.',
      'Las series largas (60+ movimientos) no son necesariamente mejores — ajusta la longitud a lo que indica el procesamiento.',
      'Si el paciente no recuerda bien la imagen original al volver a verificar el SUD, puede ser señal de integración (buen signo).',
    ],
    reference: 'Shapiro, F. (2018). Eye Movement Desensitization and Reprocessing (EMDR) Therapy (3.ª ed.). Guilford.',
  },

  {
    id: 'emdr-fase5',
    modality: 'emdr',
    name: 'Fase 5 EMDR — Instalación de la cognición positiva',
    indication: 'TEPT · Tras desensibilización completada (SUD = 0–1)',
    sessions: '10–20 minutos (dentro de la sesión)',
    difficulty: 'Avanzado — Requiere certificación',
    overview:
      'Quinta fase del protocolo EMDR. Una vez que el SUD ha llegado a 0 o 1, se vincula la cognición positiva (CP) a la imagen original para fortalecer la integración adaptativa. Se usa estimulación bilateral para instalar la CP hasta alcanzar un VoC de 7 (o el máximo ecológico posible).',
    indications: ['SUD = 0–1 tras la desensibilización (Fase 4)', 'Fortalecimiento de la creencia adaptativa'],
    steps: [
      {
        title: 'Verificar o ajustar la cognición positiva',
        body: '"Cuando piensas en el evento original, ¿aún te parecen adecuadas las palabras [CP]? ¿O hay algo más apropiado que quieras creer?" Es normal que la CP evolucione durante el procesamiento — a veces emerge una CP más matizada y profunda. Si el paciente sugiere una nueva CP más apropiada, úsala.',
      },
      {
        title: 'Vincular imagen y CP',
        body: '"Trae la imagen original a la mente y repite mentalmente [CP]. ¿Cuánto te parecen verdaderas esas palabras ahora, de 1 a 7 (VoC)?" Si el VoC está entre 5 y 7, procede a instalar. Si es menor, puede haber material residual — considera retarget o nuevo procesamiento antes de instalar.',
      },
      {
        title: 'Aplicar EB para instalar la CP',
        body: '"Piensa en el evento y en las palabras [CP] a la vez, y sigue mi dedo." Aplica EB. Después de cada serie: "¿Cuánto te parecen verdaderas ahora?" Continúa hasta VoC = 7 o el máximo ecológico. Típicamente requiere 2–4 series de EB.',
      },
      {
        title: 'Gestionar si VoC no llega a 7',
        body: 'Si el VoC se estanca por debajo de 7 (ej. se queda en 5–6), pregunta: "¿Qué impide que llegue a un 7?" Si hay una razón ecológica ("No siempre tengo control — la vida tiene imprevistos"), acepta el VoC ecológico. Si hay material bloqueador, vuelve a desensibilizar ese material antes de continuar con la instalación.',
      },
      {
        title: 'No instalar una CP con VoC ≤ 3',
        body: 'Si el VoC sigue muy bajo después de que el SUD llegó a 0, hay material no procesado. No fuerces la instalación — la EB sobre una CP que el paciente no puede creer puede crear confusión. Vuelve a Fase 4 con el material bloqueador identificado.',
      },
    ],
    tips: [
      'La instalación no es "pensar positivo" — es la consolidación de un cambio cognitivo real que ya ocurrió en el procesamiento.',
      'Un VoC de 6 ecológico es exitoso en muchos casos — el objetivo es la creencia funcional, no la perfección.',
      'Si la CP evoluciona durante la instalación hacia algo más profundo, sigue esa dirección — es señal de integración genuina.',
      'En trauma complejo, el VoC puede tardar varias sesiones en llegar a 7 — es normal y esperable.',
    ],
    reference: 'Shapiro, F. (2018). Eye Movement Desensitization and Reprocessing (EMDR) Therapy (3.ª ed.). Guilford.',
  },

  {
    id: 'emdr-fase6',
    modality: 'emdr',
    name: 'Fase 6 EMDR — Escaneo corporal',
    indication: 'TEPT · Verificación de canales somáticos residuales',
    sessions: '5–15 minutos (dentro de la sesión)',
    difficulty: 'Avanzado — Requiere certificación',
    overview:
      'Sexta fase del protocolo EMDR. Tras instalar la CP (Fase 5), el paciente hace un recorrido mental de todo el cuerpo mientras mantiene en mente la imagen original y la CP. Cualquier tensión, incomodidad o sensación residual indica un canal somático no procesado que requiere EB adicional.',
    indications: ['Tras instalación exitosa de la CP (Fase 5)', 'Verificación de resolución somática completa'],
    steps: [
      {
        title: 'Activar imagen original + CP antes del escaneo',
        body: '"Cierra los ojos. Trae a la mente la imagen del evento [target] y repite mentalmente [CP]. Ahora vas a hacer un recorrido por tu cuerpo, de la cabeza hasta los pies. Dime si notas alguna tensión, incomodidad, sensación inusual, o también si sientes algo positivo."',
      },
      {
        title: 'Guiar el escaneo sistemático',
        body: 'Guía lentamente: cabeza → cuello y hombros → pecho → brazos y manos → estómago y abdomen → espalda → caderas y pelvis → piernas y pies. Permite suficiente tiempo en cada zona para que el paciente reporte honestamente.',
      },
      {
        title: 'Procesar sensaciones residuales con EB',
        body: 'Si el paciente reporta cualquier tensión, presión, dolor, hormigueo o incomodidad: "Nótalo." Aplica EB sobre esa sensación corporal hasta que desaparezca o se convierta en neutra. Repite el escaneo hasta que el cuerpo quede limpio.',
      },
      {
        title: 'Registrar sensaciones positivas con EB',
        body: 'Si el paciente reporta sensaciones positivas (ligereza, calidez, expansión, relajación): "Nótalo." Aplica una serie de EB corta para reforzar y consolidar esa experiencia positiva.',
      },
      {
        title: 'Escaneo limpio: criterio de completitud',
        body: 'El escaneo corporal se considera completo cuando el recorrido completo produce solo sensaciones neutras o positivas, sin incomodidad residual. Este es el criterio de "sesión completa" junto con SUD = 0 y VoC = 7. Documenta el resultado.',
      },
    ],
    tips: [
      'El escaneo corporal a veces revela material que la mente "había resuelto" pero el cuerpo sigue reteniendo — tómalo en serio.',
      'Las sensaciones físicas persistentes (dolor, tensión crónica) pueden ser canales somáticos de memorias no procesadas.',
      'Si el escaneo revela mucho material, puede ser necesaria otra sesión completa de desensibilización antes de cerrar.',
      'Algunas tradiciones somáticas (Somatic Experiencing, sensorimotor) complementan muy bien la Fase 6 del EMDR.',
    ],
    reference: 'Shapiro, F. (2018). Eye Movement Desensitization and Reprocessing (EMDR) Therapy (3.ª ed.). Guilford.',
  },

  {
    id: 'emdr-fase7',
    modality: 'emdr',
    name: 'Fase 7 EMDR — Cierre de sesión',
    indication: 'TEPT · Al final de cada sesión EMDR (completa o incompleta)',
    sessions: '5–10 minutos (al final de cada sesión)',
    difficulty: 'Intermedio-Avanzado',
    overview:
      'Séptima fase del protocolo EMDR. Se aplica al final de TODA sesión de procesamiento, tanto si se completó (SUD = 0, VoC = 7, escaneo limpio) como si quedó incompleta. El objetivo es que el paciente salga de la sesión estabilizado, con recursos para manejar el material que puede emerger entre sesiones.',
    indications: ['Final de toda sesión EMDR', 'Sesión incompleta (SUD > 1 al cierre)', 'Sesión completa (como consolidación)'],
    steps: [
      {
        title: 'Técnica del Contenedor (sesiones incompletas)',
        body: 'Cuando la sesión termina con material activo (SUD > 1): "Imagina que tomas todo el material que hemos trabajado hoy — imágenes, pensamientos, emociones — y lo colocas en tu Contenedor [descripción del Contenedor del paciente]. Ciérralo con llave. Estará ahí cuando volvamos, pero contenido y seguro." Aplica EB breve para reforzar el Contenedor.',
      },
      {
        title: 'Lugar seguro o Lugar tranquilo (si hay activación residual)',
        body: 'Si el paciente sigue activado tras el Contenedor: "Lleva tu atención a tu Lugar [seguro/tranquilo]. Nota las imágenes, sonidos, sensaciones de ese lugar. Respira." Aplica EB breve de instalación del recurso. El objetivo es que el paciente salga de la sesión dentro de la ventana de tolerancia.',
      },
      {
        title: 'Psicoeducación sobre procesamiento entre sesiones',
        body: 'SIEMPRE al finalizar: "El procesamiento puede continuar entre sesiones — pueden aparecer recuerdos, sueños vívidos, emociones o sensaciones inesperadas. Esto es normal y señal de que tu sistema nervioso sigue trabajando. Si ocurre, observa sin juzgar y anota lo que surja para traerlo a la próxima sesión."',
      },
      {
        title: 'Diary card o registro de seguimiento',
        body: 'Proporciona al paciente una hoja de registro para anotar: qué material emerge entre sesiones (imágenes, pensamientos, sueños, emociones, sensaciones), el SUD aproximado, y cuándo ocurre. Este registro informa la Fase 8 (reevaluación) de la siguiente sesión.',
      },
      {
        title: 'Verificar estado antes de que el paciente se vaya',
        body: 'Antes de terminar: "¿Cómo te encuentras ahora? ¿Estás listo/a para irte?" El paciente debe salir orientado, regulado y no disociado. Si hay activación significativa, extiende la estabilización. NUNCA permitas que un paciente disociado o muy activado abandone la consulta.',
      },
    ],
    tips: [
      'Un cierre incompleto bien ejecutado es más valioso que un procesamiento incompleto mal cerrado — la estabilización protege al paciente.',
      'La psicoeducación sobre procesamiento entre sesiones reduce la alarma del paciente si emergen síntomas inesperados.',
      'El Contenedor no es represión — es organización temporal del material para procesarlo con seguridad en la siguiente sesión.',
      'Considera la disponibilidad del terapeuta para contacto breve entre sesiones si el material es muy intenso (similar al coaching DBT).',
    ],
    reference: 'Shapiro, F. (2018). Eye Movement Desensitization and Reprocessing (EMDR) Therapy (3.ª ed.). Guilford.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TCC — Protocolos adicionales
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tcc-ansiedad-social',
    modality: 'tcc',
    name: 'Protocolo Heimberg para Ansiedad Social',
    indication: 'Fobia social · Ansiedad social · Timidez severa · Evitación social',
    sessions: '12–16 sesiones',
    difficulty: 'Intermedio-Avanzado',
    overview:
      'Protocolo de primera línea para el trastorno de ansiedad social (TAS). Combina reestructuración cognitiva de creencias sobre evaluación negativa con exposición situacional gradual (en vivo y en role-play). Desarrollado por Richard Heimberg y su equipo en la Universidad de Temple.',
    indications: [
      'Trastorno de ansiedad social generalizado',
      'Fobia social circunscrita (hablar en público, citas, etc.)',
      'Timidez severa con deterioro funcional',
      'Ansiedad de rendimiento (exámenes, entrevistas)',
    ],
    contraindications: [
      'Abuso activo de sustancias',
      'Depresión severa no tratada como problema primario',
      'Ideación suicida activa',
    ],
    steps: [
      {
        title: 'Psicoeducación y modelo cognitivo de la ansiedad social',
        body: 'Explica el modelo: la persona con TAS sobreestima la probabilidad de actuar de forma inadecuada Y la consecuencia catastrófica de esa actuación. Introduce el ciclo: anticipación ansiosa → conductas de seguridad/evitación → alivio a corto plazo → mantenimiento del miedo. El tratamiento tiene dos patas: cambiar la cognición + eliminar la evitación.',
      },
      {
        title: 'Identificar pensamientos automáticos en situaciones sociales',
        body: 'Trabaja el registro A-B-C en situaciones sociales específicas. Pensamientos típicos: "Me voy a quedar en blanco", "Van a notar que estoy nervioso/a", "Pensarán que soy estúpido/a", "Me rechazarán." Identifica las distorsiones más frecuentes: lectura mental, catastrofismo, estándar doble.',
      },
      {
        title: 'Reestructuración cognitiva de creencias de evaluación negativa',
        body: 'Trabaja las dos estimaciones distorsionadas: (1) Probabilidad: ¿Qué tan probable es que actúes de forma inadecuada? Evalúa la evidencia. (2) Consecuencia: Si actuaras de forma inadecuada, ¿qué pasaría realmente? ¿Lo resistirías? ¿Les importaría tanto a los demás como piensas? Usa el cuestionamiento socrático y el "test de la encuesta" (preguntar a otros sobre sus experiencias).',
      },
      {
        title: 'Construcción de la jerarquía de situaciones sociales',
        body: 'Lista de 8–12 situaciones sociales temidas, ordenadas de menor a mayor ansiedad (SUDS 0–100). Incluir situaciones de actuación (hablar en público, comer delante de otros) y de interacción (conversaciones, citas, reuniones). Identificar en cada situación las conductas de seguridad que el paciente usa (evitar contacto visual, hablar poco, preparar en exceso, etc.).',
      },
      {
        title: 'Role-play con reestructuración cognitiva previa',
        body: 'Para cada exposición: (1) Reestructuración ANTES: identifica el pensamiento automático, evalúa su credibilidad (0–100%), genera alternativa. (2) Role-play en sesión (exposición simulada a la situación temida). (3) Reestructuración DESPUÉS: ¿Se cumplió la predicción? ¿Qué aprendiste? Este ciclo es el núcleo diferencial del protocolo Heimberg.',
      },
      {
        title: 'Exposición in vivo con eliminación de conductas de seguridad',
        body: 'Gradúa la exposición en vivo entre sesiones empezando por ítems de SUDS 30–40. La condición esencial: eliminar todas las conductas de seguridad durante la exposición. Registra el SUDS antes, a los 10 min y al final. Debriefing en sesión: ¿Qué ocurrió? ¿Se cumplió la predicción? ¿Qué harías diferente?',
      },
      {
        title: 'Modificación del sesgo atencional y de memoria post-evento',
        body: 'Trabaja dos procesos específicos del TAS: (1) Sesgo atencional: la persona centra la atención en sí misma (automonitoreo excesivo) en lugar de en la situación/conversación. Practica "atención externa" durante exposiciones. (2) Rumiación post-evento: revisión negativa de la actuación después de situaciones sociales. Identifica y reestructura estas revisiones.',
      },
      {
        title: 'Prevención de recaídas y generali­zación',
        body: 'Revisa los avances logrados y los cambios cognitivos consolidados. Identifica situaciones futuras de alto riesgo. Elabora un plan de exposición autónoma para las situaciones que quedan por trabajar. Distingue nerviosismo normal (adaptativo) de ansiedad clínica. Programe sesiones de seguimiento a 1 y 3 meses.',
      },
    ],
    tips: [
      'El role-play dentro de sesión es esencial — sin él el paciente puede hacer "exposición sin procesamiento cognitivo".',
      'Las conductas de seguridad son tan importantes como la evitación — identifícalas todas antes de la primera exposición.',
      'El sesgo atencional autofocalizado es central en el TAS — trabajarlo explícitamente mejora los resultados.',
      'La rumiación post-evento puede durar días — incluirla en el tratamiento es clave para la generalización.',
      'Para ansiedad a hablar en público, el role-play grupal es especialmente potente — considera derivación a grupo de habilidades sociales.',
    ],
    reference: 'Heimberg, R. G. & Becker, R. E. (2002). Cognitive-Behavioral Group Therapy for Social Phobia. Guilford.',
  },

  {
    id: 'tcc-tag',
    modality: 'tcc',
    name: 'Protocolo Dugas para TAG — Intolerancia a la incertidumbre',
    indication: 'Trastorno de Ansiedad Generalizada · Preocupación crónica · Rumiación',
    sessions: '12–16 sesiones',
    difficulty: 'Intermedio',
    overview:
      'Modelo de Michel Dugas (Concordia University) que conceptualiza el TAG como una respuesta a la intolerancia a la incertidumbre. A diferencia del protocolo de Borkovec (que trabaja la preocupación directamente), este modelo trata la intolerancia a la incertidumbre como el mecanismo central. Evidencia robusta en ensayos clínicos controlados.',
    indications: [
      'Trastorno de ansiedad generalizada (TAG)',
      'Preocupación crónica que interfiere con el funcionamiento',
      'Perfeccionismo con ansiedad anticipatoria',
      'Dificultad para tomar decisiones por miedo a equivocarse',
    ],
    steps: [
      {
        title: 'Psicoeducación: el modelo de intolerancia a la incertidumbre',
        body: 'El TAG no es preocupación por cosas reales — es intolerancia a la posibilidad de que algo malo ocurra. La persona tiene baja tolerancia a lo incierto y usa la preocupación como "solución" (ilusión de control). Introduce la metáfora del "detector de incertidumbre hipersensible". Distingue preocupaciones Tipo 1 (problemas actuales resolubles) y Tipo 2 (situaciones inciertas hipotéticas).',
      },
      {
        title: 'Registro de preocupaciones y clasificación',
        body: 'Durante 2 semanas el paciente registra todas sus preocupaciones y las clasifica: ¿Es un problema actual que puedo resolver? (Tipo 1) ¿O es una situación incierta que no puedo controlar? (Tipo 2). El 90% suelen ser Tipo 2. Este registro es revelador — el paciente se da cuenta de que la mayoría de sus preocupaciones son sobre incertidumbre, no sobre problemas reales.',
      },
      {
        title: 'Resolución de problemas (para preocupaciones Tipo 1)',
        body: 'Para problemas actuales y resolubles: aplica el protocolo de resolución de problemas en 5 pasos. El objetivo es que el paciente actúe en lugar de preocuparse. La acción concreta es el antídoto a la preocupación tipo 1. Si el problema es irresoluble en este momento, clasifícalo como Tipo 2.',
      },
      {
        title: 'Exposición cognitiva a la incertidumbre (para preocupaciones Tipo 2)',
        body: 'Para situaciones inciertas hipotéticas: construye una jerarquía de situaciones inciertas (SUDS 0–100). Exposición imaginaria: el paciente visualiza la situación incierta temida y permanece en contacto con la incertidumbre sin buscar certeza. Elimina conductas de búsqueda de seguridad (pedir reaseguramiento, comprobar repetidamente, sobreprepararse).',
      },
      {
        title: 'Identificar y modificar creencias positivas sobre la preocupación',
        body: 'Muchos pacientes con TAG tienen creencias metacognitivas positivas sobre la preocupación: "Si me preocupo, estaré preparado", "Preocuparme es ser responsable", "Si no me preocupo, algo malo pasará." Estas creencias mantienen el TAG. Evalúa su evidencia y genera alternativas más flexibles.',
      },
      {
        title: 'Exposición conductual a situaciones de incertidumbre real',
        body: 'Diseña experimentos conductuales donde el paciente actúa sin buscar certeza: no comprobar el correo dos veces, enviar un mensaje sin revisarlo diez veces, tomar una decisión sin pedir cuatro opiniones. Registra qué ocurrió y qué aprendió. La exposición conductual a la incertidumbre es el componente más potente.',
      },
      {
        title: 'Consolidación y prevención de recaídas',
        body: 'Resume el modelo aprendido: intolerancia a la incertidumbre → preocupación → alivio temporal → más intolerancia. Identifica qué estrategias aprendidas fueron más útiles. Plan para afrontar episodios futuros de mayor preocupación. Define el "plan de acción" cuando note que la preocupación vuelve.',
      },
    ],
    tips: [
      'La distinción Tipo 1 / Tipo 2 es el corazón del modelo — dedica tiempo suficiente a que el paciente la internalice.',
      'La búsqueda de seguridad (reaseguramiento) es el equivalente a los rituales en el TOC — eliminarla es esencial.',
      'Las creencias positivas sobre la preocupación son muy resistentes — explora con cuidado y sin debate apresurado.',
      'Combina este modelo con técnicas de mindfulness para el componente de "estar presente con la incertidumbre".',
      'Para casos mixtos TAG + depresión, trabaja primero la activación conductual antes de este protocolo.',
    ],
    reference: 'Dugas, M. J. & Robichaud, M. (2007). Cognitive-Behavioral Treatment for Generalized Anxiety Disorder. Routledge.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DBT — Protocolos adicionales
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'dbt-validacion',
    modality: 'dbt',
    name: 'Los 6 niveles de validación de Linehan',
    indication: 'TLP · Desregulación emocional · Ruptura de alianza · Alta autocrítica',
    sessions: 'Técnica de uso continuo',
    difficulty: 'Intermedio-Avanzado',
    overview:
      'La validación es la estrategia terapéutica más central de DBT — más que ninguna técnica específica. Marsha Linehan describe 6 niveles de validación en orden creciente de profundidad y potencia. Comunicar validación reduce la desregulación emocional, fortalece la alianza y modela la auto-validación que el paciente necesita desarrollar.',
    indications: [
      'Toda sesión con pacientes de alta desregulación emocional',
      'Momentos de ruptura o tensión en la alianza terapéutica',
      'Pacientes con alta autocrítica o vergüenza',
      'Antes y después de intervenciones de cambio (para equilibrar la dialéctica)',
    ],
    steps: [
      {
        title: 'Nivel 1 — Presencia plena (estar despierto)',
        body: 'El terapeuta está totalmente presente: escucha sin interrumpir, mantiene contacto visual apropiado, su lenguaje corporal comunica atención genuina. No mira el reloj, no revisa notas, no piensa en la respuesta mientras el paciente habla. Es el nivel más básico y más frecuentemente ignorado. Comunicación implícita: "Lo que dices importa."',
      },
      {
        title: 'Nivel 2 — Reflexión exacta (reflejo preciso)',
        body: 'El terapeuta refleja con precisión lo que el paciente ha dicho, sin añadir ni quitar. No parafrasea en exceso ni interpreta. "Lo que escucho es que te sientes completamente sola en esto." Valida que el terapeuta ha escuchado correctamente antes de responder. Este nivel por sí solo reduce la activación emocional en pacientes con TLP.',
      },
      {
        title: 'Nivel 3 — Articular lo no dicho (leer la mente)',
        body: 'El terapeuta verbaliza pensamientos, emociones o significados que el paciente no ha expresado pero que se desprenden del contexto. "No lo has dicho, pero me pregunto si también sientes vergüenza por eso." Requiere observación cuidadosa y cultura de verificación. Frase clave: "¿Me equivoco?" Nunca se usa como interpretación diagnóstica — es tentativa y verificable.',
      },
      {
        title: 'Nivel 4 — Validar en términos de historia o biología (tiene sentido dado tu historia)',
        body: 'La respuesta del paciente es comprensible dado su aprendizaje pasado, su biología o las circunstancias que vivió. "Tiene sentido que reacciones así — aprendiste desde pequeño/a que expresar emociones era peligroso." No se valida porque sea "correcto" ahora, sino porque es comprensible dado el origen. Diferencia validación de aprobación.',
      },
      {
        title: 'Nivel 5 — Validar en términos del presente (lo razonable ahora)',
        body: 'La respuesta del paciente es comprensible y razonable dado el contexto ACTUAL, no solo el pasado. Es el nivel más potente de validación para adultos. "Cualquiera en tu situación se sentiría así." "Eso es exactamente lo que cabría esperar." Requiere que la emoción o conducta sea genuinamente razonable — no se usa para validar lo que no lo es.',
      },
      {
        title: 'Nivel 6 — Tratamiento radical como igual (autenticidad)',
        body: 'El terapeuta trata al paciente como un ser capaz, no como un "caso." Responde desde la autenticidad, no desde el rol de experto. Puede compartir reacciones honestas ("Eso me parece muy difícil") sin sobreimplicarse. Cree en las capacidades del paciente incluso cuando el paciente no las ve. Es la forma más profunda de validación y la que más impacta en la autoeficacia.',
      },
      {
        title: 'Equilibrar validación y cambio (la dialéctica central)',
        body: 'DBT equilibra aceptación (validación) y cambio (TCC). Demasiada validación sin cambio: el paciente se siente escuchado pero no avanza. Demasiado cambio sin validación: el paciente siente que no le entienden y se activa. La regla práctica: cuando el paciente se active emocionalmente, aumenta la validación antes de cualquier intervención de cambio.',
      },
    ],
    tips: [
      'Validar no es estar de acuerdo — se puede validar la emoción mientras se trabaja para cambiar la conducta.',
      'Los niveles 4 y 5 son los más terapéuticos pero también los que más pueden invalidar si se usan incorrectamente ("cualquiera lo haría" puede sentirse minimizador).',
      'La auto-validación del paciente es el objetivo final — el terapeuta modela lo que el paciente necesita aprender a darse a sí mismo.',
      'En momentos de ruptura, comienza siempre por el Nivel 1–2 antes de intentar reparar o explicar.',
      'El Nivel 6 requiere que el terapeuta crea genuinamente en el paciente — la validación falsa se detecta.',
    ],
    reference: 'Linehan, M. M. (1997). Validation and psychotherapy. In A. Bohart & L. Greenberg (Eds.), Empathy Reconsidered. APA.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACT — Protocolos adicionales
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'act-matriz',
    modality: 'act',
    name: 'La Matriz ACT (Polk & Schoendorff)',
    indication: 'Evitación experiencial · Pérdida de dirección · Casos complejos',
    sessions: '3–6 sesiones (herramienta de uso continuo)',
    difficulty: 'Básico-Intermedio',
    overview:
      'Herramienta visual desarrollada por Kevin Polk y Benji Schoendorff que simplifica los 6 procesos del Hexaflex en un diagrama de dos ejes. Permite al paciente ver de un vistazo qué lo aleja de lo que valora y qué lo acerca. Especialmente útil al inicio del tratamiento y con pacientes que se benefician de representaciones visuales.',
    indications: [
      'Primera herramienta de formulación en ACT',
      'Pacientes que se pierden en los detalles — necesitan perspectiva visual',
      'Casos donde hay mucha evitación y poca acción comprometida',
      'Supervisión y seguimiento del progreso en ACT',
    ],
    steps: [
      {
        title: 'Dibujar los dos ejes de la Matriz',
        body: 'Dibuja una cruz que crea cuatro cuadrantes:\n\nEje vertical: Mundo externo (arriba) / Mundo interno (abajo)\nEje horizontal: Alejarse del malestar (izquierda) / Acercarse a lo que importa (derecha)\n\nExplica brevemente: el eje vertical distingue lo observable por otros (conductas, acciones) de lo que solo tú experimentas (pensamientos, emociones, sensaciones). El eje horizontal distingue moverse HACIA tus valores de moverse LEJOS del malestar.',
      },
      {
        title: 'Cuadrante inferior derecho — ¿Quién y qué importa?',
        body: 'Empieza aquí. Pregunta: "¿Quiénes son las personas más importantes en tu vida? ¿Qué es lo que más valoras?" Escribe respuestas en el cuadrante inferior derecho (mundo interno + acercarse). Esto ancla toda la conversación en valores, no en síntomas. Es el "por qué" de todo el trabajo.',
      },
      {
        title: 'Cuadrante inferior izquierdo — ¿Qué aparece que te aleja?',
        body: 'Pregunta: "Cuando intentas acercarte a lo que importa, ¿qué experiencias internas aparecen y te frenan? ¿Pensamientos, emociones, sensaciones, recuerdos, impulsos?" Escribe en el cuadrante inferior izquierdo (mundo interno + alejarse). Estos son los "ganchos" — el material que genera evitación experiencial.',
      },
      {
        title: 'Cuadrante superior izquierdo — ¿Qué haces para alejarte?',
        body: 'Pregunta: "Cuando aparece todo eso [señala cuadrante inferior izquierdo], ¿qué haces para no sentirlo o para que pare? ¿Qué conductas usas para alejarte del malestar?" Escribe en el cuadrante superior izquierdo (mundo externo + alejarse). Estas son las conductas de evitación: aislarse, procrastinar, consumir, distraerse, atacar, someterse.',
      },
      {
        title: 'Cuadrante superior derecho — ¿Qué harías si pudieras acercarte?',
        body: 'Pregunta: "Si pudieras moverte hacia lo que importa aunque esas experiencias internas estuvieran presentes, ¿qué harías diferente? ¿Qué acciones verían los demás?" Escribe en el cuadrante superior derecho (mundo externo + acercarse). Estas son las acciones comprometidas — las conductas alineadas con valores que el tratamiento buscará aumentar.',
      },
      {
        title: 'El gancho — el momento de la elección',
        body: 'Añade una flecha en el centro que indica: "Cuando el gancho (cuadrante inferior izquierdo) aparece, ¿notas que estás enganchado/a y puedes elegir hacia dónde ir?" El trabajo terapéutico no es eliminar el gancho (eso es control experiencial) sino ampliar la capacidad de notar que está ahí y elegir la dirección. La flexibilidad psicológica es la amplitud de ese momento de elección.',
      },
      {
        title: 'Uso continuo de la Matriz durante el tratamiento',
        body: 'La Matriz no es solo una herramienta de evaluación — se usa en cada sesión. "¿Dónde estuviste más esta semana: en el lado derecho o en el izquierdo?" / "Eso que describes, ¿en qué cuadrante lo pondríamos?" Se puede pegar en la nevera, guardar en el celular o usarse como tarjeta de registro. Es un lenguaje compartido terapeuta-paciente.',
      },
    ],
    tips: [
      'Empieza siempre por el cuadrante inferior derecho (valores) — comenzar por el malestar activa la evitación.',
      'La Matriz no juzga ningún cuadrante — el lado izquierdo no es "malo", es comprensible. El problema es cuando ese lado domina completamente.',
      'Con pacientes muy cognitivos, la representación visual puede ser más poderosa que horas de conceptualización verbal.',
      'La Matriz se adapta a casi cualquier problema: adicciones, relaciones, trabajo, salud — siempre tiene los mismos cuatro cuadrantes.',
      'Polk usa la pregunta "¿Eres tú o es el gancho?" para entrenar el momento de notar — intégrala como recordatorio entre sesiones.',
    ],
    reference: 'Polk, K. L. & Schoendorff, B. (2014). The ACT Matrix: A New Approach to Building Psychological Flexibility. New Harbinger.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MBCT — Terapia Cognitiva Basada en Mindfulness
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'mbct-programa',
    modality: 'mbct',
    name: 'Programa MBCT de 8 semanas',
    indication: 'Depresión recurrente (≥3 episodios) · Prevención de recaídas · Ansiedad crónica',
    sessions: '8 sesiones grupales (2h/semana) + práctica diaria 45 min',
    difficulty: 'Intermedio',
    overview:
      'Programa estructurado de 8 semanas desarrollado por Segal, Williams y Teasdale integrando el protocolo MBSR de Kabat-Zinn con elementos de TCC. Primera línea según NICE para prevención de recaídas en depresión mayor con ≥3 episodios. Reduce el riesgo de recaída en un 43–50% en esa población. Actualmente se evalúa su eficacia en ansiedad generalizada, bipolaridad en remisión y dolor crónico.',
    indications: [
      'Depresión mayor recurrente (≥3 episodios) en remisión — primera línea NICE',
      'Prevención de recaídas en depresión bipolar (en estudio)',
      'Ansiedad crónica con componente ruminativo',
      'Estrés crónico con alto impacto en calidad de vida',
    ],
    contraindications: [
      'Episodio depresivo mayor activo severo (esperar remisión)',
      'Ideación suicida activa',
      'TEPT con síntomas disociativos activos (primero estabilización)',
      'Problemas graves de concentración que impidan la práctica formal',
    ],
    steps: [
      {
        title: 'Semana 1 — Conciencia y piloto automático',
        body: 'Introducción al piloto automático: cómo funcionamos en "modo automático" la mayor parte del tiempo. Práctica central: meditación de la pasa (uva) — comer una pasa con plena atención como experiencia radical de estar presente. Body scan como práctica formal diaria (45 min). Tarea: realizar una actividad rutinaria con plena atención cada día.',
      },
      {
        title: 'Semana 2 — Vivir en la cabeza',
        body: 'Explorar cómo la mente vaga y se pierde en pensamientos sobre el pasado y el futuro. Práctica: meditación sentada de respiración consciente. Introducción al concepto de "modo hacer" (driven-doing mode, orientado a resolver problemas) vs "modo ser" (being mode, presencia sin agenda). El modo hacer aplicado a estados emocionales genera rumiación.',
      },
      {
        title: 'Semana 3 — Reunir la mente dispersa',
        body: 'La práctica de notar que la mente se fue y volver amablemente es EL ejercicio central del mindfulness — no la ausencia de pensamientos. Añade: movimiento consciente (yoga suave o movimiento mindful). Practica el espacio de respiración de 3 minutos (3-minute breathing space): observar → enfocar en la respiración → expandir la conciencia al cuerpo.',
      },
      {
        title: 'Semana 4 — Reconocer la aversión',
        body: 'Explora cómo la mente rechaza experiencias desagradables (aversión) y cómo ese rechazo amplifica el sufrimiento. Trabaja la diferencia entre dolor (inevitable) y sufrimiento (añadido por la resistencia). Práctica: meditación de dificultades — traer intencionalmente a la mente una dificultad y observar sin rechazarla. La ecuanimidad no es indiferencia.',
      },
      {
        title: 'Semana 5 — Permitir y dejar ser',
        body: 'Contrapunto a la semana anterior: si la semana 4 fue "observar sin rechazar", esta semana es "abrirse activamente a la experiencia." Diferencia entre tolerancia (aguantar) y aceptación (permitir). Practica dejar que las experiencias difíciles estén sin tratar de cambiarlas. La aceptación no es resignación — es el punto de partida para la acción sabia.',
      },
      {
        title: 'Semana 6 — Los pensamientos no son hechos',
        body: 'Núcleo cognitivo de MBCT: los pensamientos son eventos mentales, no verdades. Especialmente importante para el pensamiento depresivo ("Soy un fracasado" = pensamiento, no hecho). Integra elementos de defusión cognitiva (ACT). Práctica: observar pensamientos sin identificarse con ellos, etiquetarlos ("Noto el pensamiento de que…"). Introduce el concepto de "modo de pensar depresivo" como señal de alarma.',
      },
      {
        title: 'Semana 7 — Cómo me cuido mejor a mí mismo/a',
        body: 'Identifica actividades que nutren vs. las que drenan energía. Diseña un plan personalizado de "señales de alarma + respuesta temprana": ¿Cómo reconozco que la depresión se acerca? ¿Qué haré en cuanto la detecte? El espacio de respiración de 3 minutos como herramienta de respuesta rápida ante los primeros síntomas. Atención a los patrones de sueño, ejercicio y relaciones.',
      },
      {
        title: 'Semana 8 — Usar lo que se ha aprendido para afrontar el futuro',
        body: 'Consolidación del aprendizaje. Plan de práctica post-programa: ¿Qué prácticas continuarás? ¿Con qué frecuencia? ¿Cómo integrar mindfulness en la vida diaria sin bloques de 45 min? Carta a uno mismo/a para leer si nota que la depresión se acerca. Cierre del grupo y revisión del camino recorrido. El fin del programa es el inicio de una práctica de vida.',
      },
    ],
    tips: [
      'MBCT es más eficaz cuanto más episodios previos de depresión ha tenido el paciente — el mecanismo es la detección temprana de espirales.',
      'La práctica formal diaria (45 min) es el predictor más potente de beneficio — sin ella el programa pierde eficacia.',
      'El componente grupal es importante: reduce la vergüenza, normaliza las dificultades y crea comunidad de práctica.',
      'MBCT puede ofrecerse individualmente cuando el grupo no es posible, aunque la evidencia es algo menor.',
      'No es adecuado para pacientes en episodio agudo severo — esperar estabilización antes de iniciar.',
      'El terapeuta MBCT debe tener práctica personal de mindfulness — la autenticidad es esencial.',
    ],
    reference: 'Segal, Z. V., Williams, J. M. G. & Teasdale, J. D. (2013). Mindfulness-Based Cognitive Therapy for Depression (2.ª ed.). Guilford.',
  },

  {
    id: 'mbct-espacio-respiracion',
    modality: 'mbct',
    name: 'Espacio de respiración de 3 minutos',
    indication: 'Prevención de recaídas · Estrés agudo · Señales de alarma depresivas',
    sessions: 'Técnica de uso diario y según necesidad',
    difficulty: 'Básico',
    overview:
      'Herramienta central del programa MBCT. Micro-práctica de 3 minutos con estructura de reloj de arena: de lo amplio a lo específico (respiración) y de vuelta a lo amplio (cuerpo y vida). Se usa de forma rutinaria (3 veces al día como práctica) y de forma reactiva (ante las primeras señales de un estado depresivo o ansioso). Es el puente entre la práctica formal y la vida cotidiana.',
    indications: [
      'Señales tempranas de espiral depresiva',
      'Momentos de estrés o ansiedad aguda',
      'Práctica de mantenimiento post-MBCT (3 veces al día)',
      'Cualquier momento de piloto automático que se quiera interrumpir',
    ],
    steps: [
      {
        title: 'Paso 1 — Reconocer (1 minuto): ¿Qué está pasando ahora?',
        body: 'Adopta una postura consciente — espalda erguida, pies en el suelo. Hazte esta pregunta: "¿Cuál es mi experiencia en este momento?" Observa sin juzgar:\n• Pensamientos: ¿Qué pensamientos están presentes? No los analices, solo nótalos.\n• Emociones: ¿Qué emociones están aquí? Nómbralas si puedes.\n• Sensaciones corporales: ¿Dónde hay tensión, incomodidad, movimiento?\nSolo reconoce. No intentes cambiar nada todavía.',
      },
      {
        title: 'Paso 2 — Reunir (1 minuto): enfocar en la respiración',
        body: 'Lleva toda la atención a la respiración. Elige un punto de anclaje: el abdomen, el pecho, las fosas nasales. Observa la sensación física de cada inhalación y exhalación. Cuando la mente se vaya (pensamientos, planes, preocupaciones), regresa suavemente a la próxima respiración. Este paso es el "cuello del reloj de arena": estrecha la conciencia al momento más presente.',
      },
      {
        title: 'Paso 3 — Expandir (1 minuto): ampliar al cuerpo y al entorno',
        body: 'Desde la respiración, expande la conciencia: primero a todo el cuerpo (¿qué sensaciones hay ahora en el cuerpo completo?), luego al entorno (sonidos, temperatura, espacio a tu alrededor). Lleva esta conciencia ampliada al siguiente momento de tu día. La pregunta al terminar: "¿Cómo quiero responder desde este lugar?"',
      },
      {
        title: 'Uso rutinario: 3 veces al día',
        body: 'Establece 3 momentos fijos del día para practicar el espacio de respiración: por ejemplo, al despertarte, antes de comer y antes de dormir. El objetivo del uso rutinario es mantener el "músculo" del mindfulness activo y desarrollar el hábito de hacer pausas conscientes antes de necesitarlas. No esperes a estar en crisis.',
      },
      {
        title: 'Uso reactivo: ante las primeras señales de alarma',
        body: 'El espacio de respiración reactivo se usa en cuanto el paciente nota señales tempranas del modo depresivo o ansioso: irritabilidad, pensamiento negativo, cansancio inusual, ganas de aislarse. Al detectar la señal: PARA → practica el espacio de 3 minutos → decide conscientemente qué hacer a continuación. Este es el mecanismo de interrupción del espiral.',
      },
    ],
    tips: [
      'El espacio de respiración NO es una técnica de relajación — es una práctica de conciencia. No busca calmar; busca ver con claridad.',
      'Con pacientes que tienden a usar el mindfulness como evitación, enfatiza el Paso 3: el objetivo es volver a la vida, no escapar de ella.',
      'La regularidad (3 veces al día) es más importante que la duración — 3 minutos consistentes valen más que 45 min ocasionales.',
      'Puede integrarse en cualquier terapia, no solo MBCT — es útil en TCC, ACT, DBT y tratamiento del dolor crónico.',
    ],
    reference: 'Segal, Z. V., Williams, J. M. G. & Teasdale, J. D. (2013). Mindfulness-Based Cognitive Therapy for Depression (2.ª ed.). Guilford.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CFT — Terapia Centrada en la Compasión
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'cft-tres-sistemas',
    modality: 'cft',
    name: 'El modelo de los tres sistemas de regulación emocional',
    indication: 'Alta autocrítica · Vergüenza · Depresión · Trauma de apego',
    sessions: '2–4 sesiones (psicoeducación y evaluación)',
    difficulty: 'Básico-Intermedio',
    overview:
      'Marco conceptual central de la CFT. Paul Gilbert propone que el ser humano tiene tres sistemas de regulación emocional con bases neurobiológicas diferenciadas: el sistema de amenaza (protección), el sistema de impulso/logro (búsqueda de recursos) y el sistema de afiliación/soothing (calma y seguridad). El sufrimiento psicológico suele asociarse a un desequilibrio entre estos tres sistemas.',
    indications: [
      'Pacientes con alta autocrítica y vergüenza tóxica',
      'Historial de trauma de apego o crianza invalidante',
      'Depresión con componente de inutilidad/autoodio',
      'Ansiedad crónica con activación del sistema de amenaza permanente',
      'Como psicoeducación de base para cualquier trabajo de CFT',
    ],
    steps: [
      {
        title: 'Sistema 1 — Sistema de amenaza y protección',
        body: 'Base evolutiva: detectar y responder rápidamente a amenazas para la supervivencia. Emociones asociadas: miedo, ansiedad, enojo, disgusto. Respuestas: lucha, huida, congelación, sumisión. Característica clave: es el sistema más rápido, más antiguo evolutivamente y más fácil de activar. Problema clínico: en personas con trauma o alta autocrítica, este sistema está hiperactivo de forma crónica — el "crítico interno" lo mantiene encendido constantemente.',
      },
      {
        title: 'Sistema 2 — Sistema de impulso, búsqueda y logro',
        body: 'Base evolutiva: motivar la búsqueda de recursos, logros y metas. Emociones asociadas: excitación, anticipación, deseo, ambición. Característica clave: orientado al futuro y a la consecución. Problema clínico: cuando se convierte en el único sistema activo, lleva al perfeccionismo, la búsqueda compulsiva de logros y la incapacidad de descansar. La autocrítica a menudo usa este sistema: "No has logrado suficiente, tienes que esforzarte más."',
      },
      {
        title: 'Sistema 3 — Sistema de afiliación, calma y soothing',
        body: 'Base evolutiva: el bienestar que viene del cuidado, la conexión y la seguridad en el vínculo. Emociones asociadas: calma, ternura, satisfacción, gratitud, amor. Activado por: contacto físico seguro, la presencia de figuras de apego, la autocompasión. Característica clave: es el único sistema que calma el sistema de amenaza de forma sostenida. Problema clínico: en personas con trauma de apego o crítica crónica, este sistema está subdesarrollado — la calma y la autocompasión se sienten peligrosas o inmerecidas.',
      },
      {
        title: 'Evaluación del equilibrio de sistemas en el paciente',
        body: 'Explora con el paciente qué sistema domina su vida: ¿Vive principalmente en el sistema de amenaza? (rumiación, ansiedad, autocrítica) ¿En el sistema de impulso? (hiperproductividad, incapacidad de descansar) ¿Tiene acceso al sistema de afiliación? (¿Puede sentir calma? ¿Puede recibir cuidado?). Usa el diagrama de los tres círculos — dibuja el tamaño de cada sistema en la vida actual del paciente.',
      },
      {
        title: 'Psicoeducación: "Tu cerebro no es tu culpa"',
        body: 'Uno de los mensajes más transformadores de CFT: el ser humano heredó un cerebro "nuevo" (corteza prefrontal — pensamiento, imaginación) sobre un cerebro "viejo" (sistema límbico — emociones, amenaza). El cerebro nuevo puede activar el sistema de amenaza con solo imaginar o recordar algo peligroso. "No elegiste sentir lo que sientes — tienes ese cerebro por evolución, no por debilidad." Esto reduce la vergüenza y la autocrítica sobre tener emociones difíciles.',
      },
      {
        title: 'El objetivo terapéutico: fortalecer el sistema de afiliación',
        body: 'El objetivo de CFT es activar y fortalecer el sistema de afiliación/soothing que el paciente ha tenido poco acceso. Esto se logra mediante: práctica de autocompasión, el yo compasivo, las prácticas de bondad amorosa, el trabajo con la figura compasiva, y la exploración de la memoria de figuras nutricias. La autocompasión no es autoindulgencia — es la base desde la que el cambio genuino se sostiene.',
      },
    ],
    tips: [
      '"Tu cerebro no es tu culpa" es una frase que puede cambiar la relación del paciente con sus síntomas — úsala temprano.',
      'El diagrama de los tres círculos (dibujado en sesión) es más potente que la explicación verbal — el tamaño de cada círculo revela mucho.',
      'Muchos pacientes con trauma de apego tienen el sistema de soothing asociado al peligro — la calma les genera ansiedad. Normaliza esto.',
      'CFT no es solo para depresión — es especialmente poderosa en trastornos de personalidad, trastornos alimentarios y autocrítica en cualquier diagnóstico.',
      'El terapeuta CFT modela la compasión en la propia relación terapéutica — la forma de responder al sufrimiento del paciente enseña más que cualquier técnica.',
    ],
    reference: 'Gilbert, P. (2010). The Compassionate Mind. Constable & Robinson.',
  },

  {
    id: 'cft-yo-compasivo',
    modality: 'cft',
    name: 'El yo compasivo — Compassionate Self',
    indication: 'Alta autocrítica · Vergüenza · Trauma · Baja autoestima crónica',
    sessions: '4–8 sesiones (práctica central de CFT)',
    difficulty: 'Intermedio',
    overview:
      'Técnica central de la CFT. El paciente desarrolla y accede a una parte de sí mismo que encarna las cualidades compasivas: sabiduría, fortaleza, calidez y no-juicio. A diferencia de la autocompasión de Neff (que trabaja más el mindfulness), el yo compasivo es una práctica experiencial de identificación con una identidad alternativa que el paciente cultiva progresivamente.',
    indications: [
      'Autocrítica severa y vergüenza tóxica',
      'Trauma con dificultad para el auto-cuidado',
      'Baja autoestima arraigada en el carácter ("soy así")',
      'Trabajo con la voz del crítico interno',
      'Como herramienta de regulación emocional en crisis',
    ],
    steps: [
      {
        title: 'Introducir las cualidades del yo compasivo',
        body: 'El yo compasivo tiene cuatro características esenciales:\n1. Sabiduría: comprende el sufrimiento humano, la impermanencia y las causas del malestar.\n2. Fortaleza: puede tolerar el dolor sin huir de él. No es frágil — es firme.\n3. Calidez: genuino interés en el bienestar del otro (y de uno mismo).\n4. No-juicio: observa sin condenar, con curiosidad en lugar de crítica.\n\nEstas cualidades existen en el paciente — el objetivo es acceder a ellas, no crearlas desde cero.',
      },
      {
        title: 'Práctica de expresión corporal y postura compasiva',
        body: 'La postura activa el estado interno. Pide al paciente que:\n• Se siente erguido/a, con una ligera apertura del pecho.\n• Relaje el rostro — suavice la mandíbula y el ceño.\n• Adopte una expresión facial ligeramente cálida (como la que tendrías al ver a alguien querido).\n• Respire lentamente desde el abdomen.\n\nObserva: ¿Cómo se siente diferente este cuerpo de cuando está en modo crítico o en modo amenaza?',
      },
      {
        title: 'Visualización: acceder al yo compasivo',
        body: 'Con los ojos cerrados y la postura compasiva activada:\n"Imagina la versión de ti mismo/a que encarna toda la sabiduría, la fortaleza y la calidez que has desarrollado. Esta versión ha vivido mucho, entiende el sufrimiento, y nada de lo que le cuentes le asustará ni le dará la razón al crítico interno. Tómate un momento para visualizarla — ¿cómo es? ¿Qué postura tiene? ¿Qué expresión?"\nNo es un personaje perfecto — es tú en tu mejor versión.',
      },
      {
        title: 'Diálogo entre el yo compasivo y el crítico interno',
        body: 'Una vez activo el yo compasivo, trabaja el crítico interno mediante silla vacía o escritura:\n\n1. El crítico habla: ¿Qué dice el crítico interno sobre este problema/situación?\n2. El yo compasivo responde: ¿Qué diría el yo compasivo? No argumenta ni ataca al crítico — lo comprende y lo cuida. El crítico intentaba proteger, aunque de forma dañina.\n\nEjemplo:\nCrítico: "Eres un fracasado, nunca lo conseguirás."\nYo compasivo: "Veo que estás muy asustado/a de que no salga bien. Eso tiene sentido dado lo que has vivido. Y sin embargo, hemos superado cosas difíciles antes..."',
      },
      {
        title: 'Carta desde el yo compasivo',
        body: 'Tarea entre sesiones: escribir una carta a uno mismo/a desde el yo compasivo sobre la situación que más malestar genera actualmente.\n\nLa carta debe:\n• Reconocer el dolor sin minimizarlo.\n• Entender las causas (historia, biología, circunstancias) sin culpar.\n• Ofrecer calidez, no consejos.\n• Recordar fortalezas y recursos reales.\n• Terminar con una intención compasiva para los próximos días.\n\nLeer la carta en voz alta y notar qué resuena y qué genera resistencia.',
      },
      {
        title: 'Generalización: acceder al yo compasivo en situaciones difíciles',
        body: 'Con práctica, el paciente puede acceder al yo compasivo en momentos de activación emocional:\n• La postura compasiva como señal de acceso rápido.\n• La pregunta "¿Qué diría mi yo compasivo ahora?" como interrupción del crítico.\n• El espacio de respiración seguido de la visualización breve (30 segundos).\n\nEl objetivo final: que el yo compasivo se convierta en el "narrador" interno habitual, desplazando progresivamente al crítico como voz dominante.',
      },
    ],
    tips: [
      'Muchos pacientes con alta vergüenza tienen miedo de la compasión — "No me la merezco" o "Si me cuido, me volveré débil." Normaliza este miedo y explora su origen antes de continuar.',
      'El crítico interno intentaba proteger — no es el enemigo. Validar su función facilita que el paciente no lo rechace (lo cual lo fortalece) sino que lo transforme.',
      'La práctica corporal (postura, respiración) es tan importante como la cognitiva — empieza por ahí en cada sesión.',
      'Para pacientes con trauma de apego severo, el yo compasivo puede activar el sistema de amenaza al principio — ir muy despacio y con mucha validación.',
      'El terapeuta encarna el yo compasivo en la relación terapéutica — la forma de responder modela lo que el paciente necesita internalizarse.',
    ],
    reference: 'Gilbert, P. (2014). The origins and nature of compassion focused therapy. British Journal of Clinical Psychology, 53(1), 6–41.',
  },

  {
    id: 'emdr-fase8',
    modality: 'emdr',
    name: 'Fase 8 EMDR — Reevaluación',
    indication: 'TEPT · Inicio de cada nueva sesión de procesamiento',
    sessions: '5–15 minutos (inicio de cada sesión)',
    difficulty: 'Avanzado — Requiere certificación',
    overview:
      'Octava y última fase del protocolo estándar EMDR. Se aplica al INICIO de cada nueva sesión de tratamiento para verificar el mantenimiento de los avances de la sesión anterior, explorar el material emergido entre sesiones y determinar el próximo target. Es el puente entre las sesiones y garantiza la fidelidad al protocolo.',
    indications: ['Inicio de toda sesión EMDR posterior a la primera', 'Monitoreo del progreso del tratamiento'],
    steps: [
      {
        title: 'Verificar el target procesado en la sesión anterior',
        body: '"La semana pasada trabajamos en [descripción del evento]. Cuando traes esa imagen a la mente ahora, ¿cuánto te perturba del 0 al 10?" Si el SUD se mantiene en 0–1, el procesamiento fue completo y estable. Si el SUD subió respecto al cierre (ej. era 0 y ahora es 3), hay material residual — vuelve a Fase 3 y reprocesa.',
      },
      {
        title: 'Explorar el material emergido entre sesiones',
        body: 'Revisa el diary card del paciente: "¿Qué apareció esta semana? ¿Sueños, recuerdos, emociones, sensaciones?" El material emergido entre sesiones es información clínica valiosa — puede indicar nuevas redes de memoria activadas, la dirección del procesamiento o material que necesita ser target directo.',
      },
      {
        title: 'Evaluar si hay targets incompletos de la sesión anterior',
        body: 'Si la sesión anterior cerró con SUD > 1 (sesión incompleta): verifica el SUD actual del mismo target. Si el procesamiento continuó entre sesiones (SUD bajó espontáneamente), es una buena señal — continúa desde donde quedó. Si el SUD aumentó, evalúa si hay un factor de vulnerabilidad o un bloqueo.',
      },
      {
        title: 'Seleccionar el target de la sesión actual',
        body: 'Decisión: (a) Si hay target incompleto → continúa ese mismo target. (b) Si el target anterior se completó → pasa al siguiente target del plan de tratamiento (Fase 1). (c) Si emergió material nuevo urgente → evalúa si desplaza al target planificado. Consulta con el paciente y justifica la decisión.',
      },
      {
        title: 'Actualizar el mapa de redes de memoria',
        body: 'Registra el progreso: qué targets completados, qué SUD residual, qué material emergió. El mapa evoluciona — algunos targets se resuelven en cascada (procesar uno puede generalizar a varios relacionados). Ajusta el plan de tratamiento si es necesario.',
      },
      {
        title: 'Proceder a Fase 3 con el nuevo target',
        body: 'Una vez identificado el target de la sesión: pasa a Fase 3 (evaluación) con ese target específico. Si el target ya fue parcialmente evaluado en sesión anterior, verifica que los elementos (imagen, CN, CP, VoC, emoción, SUD, localización corporal) sigan siendo los mismos o actualízalos.',
      },
    ],
    tips: [
      'La Fase 8 evita perder el trabajo de sesiones anteriores — siempre verifica el SUD del target previo antes de avanzar.',
      'El material emergido entre sesiones a veces es más importante que el target planificado — mantén flexibilidad.',
      'Un SUD que sube entre sesiones no indica "fracaso" — puede señalar una red de memoria más profunda activada.',
      'La Fase 8 es también el momento de evaluar el estado general del paciente y cualquier crisis entre sesiones antes de iniciar el procesamiento.',
    ],
    reference: 'Shapiro, F. (2018). Eye Movement Desensitization and Reprocessing (EMDR) Therapy (3.ª ed.). Guilford.',
  },
]

// ── Búsqueda ──────────────────────────────────────────────────────────────────
export function searchProtocols(query, modality = 'all') {
  const q = query.toLowerCase().trim()
  let list = modality === 'all' ? PROTOCOLS : PROTOCOLS.filter(p => p.modality === modality)
  if (!q) return list
  return list.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.indication.toLowerCase().includes(q) ||
    p.overview.toLowerCase().includes(q) ||
    p.steps.some(s => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q))
  )
}
