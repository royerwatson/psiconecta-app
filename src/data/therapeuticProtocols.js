/**
 * Protocolos y técnicas terapéuticas basadas en evidencia — guía clínica
 * TCC · DBT · ACT · EMDR
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
    icon: '🧠',
    color: 'blue',
    tagline: 'Basada en evidencia · Estructurada · Orientada al problema',
    description:
      'Modelo terapéutico que identifica y modifica pensamientos distorsionados y conductas desadaptativas que mantienen el malestar psicológico. Eficacia establecida para depresión, ansiedad, TOC, fobias y TEPT.',
  },
  {
    id: 'dbt',
    name: 'DBT',
    fullName: 'Terapia Dialéctico-Conductual',
    icon: '🌊',
    color: 'teal',
    tagline: 'Linehan · Biosocial · Habilidades + Validación',
    description:
      'Desarrollada por Marsha Linehan para TLP. Integra estrategias de aceptación (mindfulness, validación) y cambio (TCC). Cuatro módulos de habilidades: mindfulness, tolerancia al malestar, regulación emocional y efectividad interpersonal.',
  },
  {
    id: 'act',
    name: 'ACT',
    fullName: 'Terapia de Aceptación y Compromiso',
    icon: '🌿',
    color: 'green',
    tagline: 'Hayes · Hexaflex · Flexibilidad psicológica',
    description:
      'Terapia de tercera generación basada en la teoría del marco relacional. Promueve la flexibilidad psicológica a través de seis procesos nucleares: defusión, aceptación, contacto presente, yo como contexto, valores y acción comprometida.',
  },
  {
    id: 'emdr',
    name: 'EMDR',
    fullName: 'Desensibilización y Reprocesamiento por Movimientos Oculares',
    icon: '👁️',
    color: 'purple',
    tagline: 'Shapiro · 8 fases · Requiere certificación',
    description:
      'Protocolo estructurado de 8 fases para procesar memorias traumáticas mediante estimulación bilateral (movimientos oculares, tapping o tonos). Reconocido por OMS y APA para TEPT. Requiere formación y certificación específica (EMDR Europe/EMDRIA).',
  },
]

export const MODALITY_MAP = Object.fromEntries(MODALITIES.map(m => [m.id, m]))

// ── Colores de modalidad ──────────────────────────────────────────────────────
export const MOD_COLOR = {
  blue:   { tab: 'bg-blue-600 text-white',   pill: 'bg-blue-100 text-blue-700 border-blue-200',   step: 'bg-blue-50 border-blue-200',   num: 'bg-blue-600 text-white'   },
  teal:   { tab: 'bg-teal-600 text-white',   pill: 'bg-teal-100 text-teal-700 border-teal-200',   step: 'bg-teal-50 border-teal-200',   num: 'bg-teal-600 text-white'   },
  green:  { tab: 'bg-green-600 text-white',  pill: 'bg-green-100 text-green-700 border-green-200', step: 'bg-green-50 border-green-200', num: 'bg-green-600 text-white'  },
  purple: { tab: 'bg-purple-600 text-white', pill: 'bg-purple-100 text-purple-700 border-purple-200',step:'bg-purple-50 border-purple-200',num: 'bg-purple-600 text-white'},
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
