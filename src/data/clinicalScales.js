/**
 * Escalas clínicas validadas — datos en español
 * PHQ-9 · GAD-7 · AUDIT · PCL-5
 *
 * Referencias:
 *  PHQ-9  : Kroenke, Spitzer & Williams (2001). J Gen Intern Med.
 *  GAD-7  : Spitzer, Kroenke, Williams & Löwe (2006). Arch Intern Med.
 *  AUDIT  : Saunders et al. (1993). OMS. Adaptación española PAHO.
 *  PCL-5  : Weathers et al. (2013). National Center for PTSD.
 *
 * Uso clínico: estas escalas son auxiliares del juicio clínico, no sustituyen
 * la evaluación diagnóstica formal.
 */

// ─────────────────────────────────────────────────────────────────────────────
// PHQ-9 — Cuestionario de Salud del Paciente (depresión)
// ─────────────────────────────────────────────────────────────────────────────
const PHQ9 = {
  id: 'PHQ9',
  name: 'PHQ-9',
  fullName: 'Cuestionario de Salud del Paciente — 9',
  domain: 'Depresión',
  icon: '😔',
  themeClass: 'blue',
  duration: '3–5 min',
  description: 'Evalúa la severidad de síntomas depresivos durante las últimas 2 semanas.',
  reference: 'Kroenke, Spitzer & Williams, 2001',
  instruction: 'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
  defaultOptions: [
    { label: 'Nunca',                        value: 0 },
    { label: 'Varios días',                   value: 1 },
    { label: 'Más de la mitad de los días',   value: 2 },
    { label: 'Casi todos los días',           value: 3 },
  ],
  questions: [
    'Poco interés o placer en hacer las cosas',
    'Sentirse decaído/a, deprimido/a o sin esperanza',
    'Problemas para quedarse o permanecer dormido/a, o dormir demasiado',
    'Sentirse cansado/a o tener poca energía',
    'Tener poco apetito o comer en exceso',
    'Sentirse mal consigo mismo/a, sentirse un/a fracasado/a o haber fallado a sí mismo/a o a su familia',
    'Dificultad para concentrarse en cosas como leer el periódico o ver la televisión',
    'Moverse o hablar tan lento que otras personas lo han notado — o lo contrario: estar tan agitado/a e inquieto/a que se mueve mucho más de lo usual',
    'Pensamientos de que estaría mejor muerto/a o de que se haría daño de alguna manera',
  ],
  maxScore: 27,
  bands: [
    { min: 0,  max: 4,  label: 'Mínima',              severity: 0, color: 'green',  action: 'Monitorear. Sin tratamiento específico indicado.' },
    { min: 5,  max: 9,  label: 'Leve',                severity: 1, color: 'lime',   action: 'Psicoeducación, hábitos saludables y seguimiento activo.' },
    { min: 10, max: 14, label: 'Moderada',            severity: 2, color: 'amber',  action: 'Considerar psicoterapia estructurada y/o evaluación farmacológica.' },
    { min: 15, max: 19, label: 'Moderadamente grave', severity: 3, color: 'orange', action: 'Psicoterapia intensiva + evaluación psiquiátrica para farmacoterapia.' },
    { min: 20, max: 27, label: 'Grave',               severity: 4, color: 'red',    action: 'Tratamiento combinado urgente. Evaluar riesgo suicida en profundidad.' },
  ],
  clinicalNote: '⚠️ Si el ítem 9 (ideación suicida) puntúa ≥1, realizar evaluación de riesgo suicida de forma inmediata con escala específica (Columbia C-SSRS o similar).',
}

// ─────────────────────────────────────────────────────────────────────────────
// GAD-7 — Trastorno de Ansiedad Generalizada
// ─────────────────────────────────────────────────────────────────────────────
const GAD7 = {
  id: 'GAD7',
  name: 'GAD-7',
  fullName: 'Escala de Trastorno de Ansiedad Generalizada — 7',
  domain: 'Ansiedad',
  icon: '😰',
  themeClass: 'purple',
  duration: '2–3 min',
  description: 'Mide la severidad de la ansiedad generalizada durante las últimas 2 semanas.',
  reference: 'Spitzer, Kroenke, Williams & Löwe, 2006',
  instruction: 'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
  defaultOptions: [
    { label: 'Nunca',                        value: 0 },
    { label: 'Varios días',                   value: 1 },
    { label: 'Más de la mitad de los días',   value: 2 },
    { label: 'Casi todos los días',           value: 3 },
  ],
  questions: [
    'Sentirse nervioso/a, ansioso/a o con los nervios de punta',
    'No ser capaz de dejar de preocuparse o de controlar la preocupación',
    'Preocuparse demasiado por diferentes cosas',
    'Dificultad para relajarse',
    'Estar tan inquieto/a que es difícil permanecer sentado/a tranquilamente',
    'Molestarse o irritarse fácilmente',
    'Sentir miedo como si algo terrible fuera a ocurrir',
  ],
  maxScore: 21,
  bands: [
    { min: 0,  max: 4,  label: 'Mínima',   severity: 0, color: 'green',  action: 'Monitorear. Técnicas de manejo del estrés si hay malestar subjetivo.' },
    { min: 5,  max: 9,  label: 'Leve',     severity: 1, color: 'lime',   action: 'Psicoeducación, técnicas de relajación y seguimiento.' },
    { min: 10, max: 14, label: 'Moderada', severity: 2, color: 'amber',  action: 'Evaluar inicio de TCC y/o consulta con psiquiatría.' },
    { min: 15, max: 21, label: 'Grave',    severity: 3, color: 'red',    action: 'Tratamiento activo. Considerar evaluación psiquiátrica urgente.' },
  ],
  clinicalNote: 'Con puntuación ≥10 se recomienda evaluación diferencial: ansiedad social, trastorno de pánico y TEPT comparten síntomas. El GAD-7 ≥10 tiene sensibilidad 89% y especificidad 82% para TAG.',
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT — Identificación de Trastornos por Uso de Alcohol (OMS)
// ─────────────────────────────────────────────────────────────────────────────
const AUDIT = {
  id: 'AUDIT',
  name: 'AUDIT',
  fullName: 'Test de Identificación de Trastornos por Uso de Alcohol',
  domain: 'Alcohol',
  icon: '🍷',
  themeClass: 'amber',
  duration: '3–5 min',
  description: 'Identifica el nivel de riesgo asociado al consumo de alcohol (OMS).',
  reference: 'Saunders et al., 1993 — OMS. Adaptación española PAHO.',
  instruction: 'A continuación se harán preguntas sobre el consumo de bebidas alcohólicas durante el último año. Por favor responda con la mayor honestidad posible.',
  questions: [
    {
      text: '¿Con qué frecuencia consume alguna bebida alcohólica?',
      options: [
        { label: 'Nunca',                       value: 0 },
        { label: 'Una vez al mes o menos',       value: 1 },
        { label: 'De 2 a 4 veces al mes',        value: 2 },
        { label: 'De 2 a 3 veces por semana',    value: 3 },
        { label: '4 o más veces por semana',     value: 4 },
      ],
    },
    {
      text: '¿Cuántas bebidas alcohólicas suele tomar en un día en que bebe?',
      options: [
        { label: '1 o 2',    value: 0 },
        { label: '3 o 4',    value: 1 },
        { label: '5 o 6',    value: 2 },
        { label: '7, 8 o 9', value: 3 },
        { label: '10 o más', value: 4 },
      ],
    },
    {
      text: '¿Con qué frecuencia toma 6 o más bebidas en una sola ocasión?',
      options: [
        { label: 'Nunca',                       value: 0 },
        { label: 'Menos de una vez al mes',     value: 1 },
        { label: 'Mensualmente',                value: 2 },
        { label: 'Semanalmente',                value: 3 },
        { label: 'A diario o casi a diario',    value: 4 },
      ],
    },
    {
      text: 'En el último año, ¿con qué frecuencia no pudo parar de beber una vez que había empezado?',
      options: [
        { label: 'Nunca',                       value: 0 },
        { label: 'Menos de una vez al mes',     value: 1 },
        { label: 'Mensualmente',                value: 2 },
        { label: 'Semanalmente',                value: 3 },
        { label: 'A diario o casi a diario',    value: 4 },
      ],
    },
    {
      text: 'En el último año, ¿con qué frecuencia no pudo cumplir con lo que se esperaba de usted por haber bebido?',
      options: [
        { label: 'Nunca',                       value: 0 },
        { label: 'Menos de una vez al mes',     value: 1 },
        { label: 'Mensualmente',                value: 2 },
        { label: 'Semanalmente',                value: 3 },
        { label: 'A diario o casi a diario',    value: 4 },
      ],
    },
    {
      text: 'En el último año, ¿con qué frecuencia bebió a la mañana siguiente después de haber bebido mucho la noche anterior?',
      options: [
        { label: 'Nunca',                       value: 0 },
        { label: 'Menos de una vez al mes',     value: 1 },
        { label: 'Mensualmente',                value: 2 },
        { label: 'Semanalmente',                value: 3 },
        { label: 'A diario o casi a diario',    value: 4 },
      ],
    },
    {
      text: 'En el último año, ¿con qué frecuencia tuvo sentimientos de culpa o remordimiento después de beber?',
      options: [
        { label: 'Nunca',                       value: 0 },
        { label: 'Menos de una vez al mes',     value: 1 },
        { label: 'Mensualmente',                value: 2 },
        { label: 'Semanalmente',                value: 3 },
        { label: 'A diario o casi a diario',    value: 4 },
      ],
    },
    {
      text: 'En el último año, ¿con qué frecuencia no pudo recordar lo que pasó la noche anterior porque había bebido?',
      options: [
        { label: 'Nunca',                       value: 0 },
        { label: 'Menos de una vez al mes',     value: 1 },
        { label: 'Mensualmente',                value: 2 },
        { label: 'Semanalmente',                value: 3 },
        { label: 'A diario o casi a diario',    value: 4 },
      ],
    },
    {
      text: '¿Usted u otra persona ha resultado herida como consecuencia de su consumo de alcohol?',
      options: [
        { label: 'No',                              value: 0 },
        { label: 'Sí, pero no en el último año',   value: 2 },
        { label: 'Sí, en el último año',            value: 4 },
      ],
    },
    {
      text: '¿Algún familiar, amigo, médico u otro profesional de salud ha mostrado preocupación por su consumo de alcohol o le ha sugerido que deje de beber?',
      options: [
        { label: 'No',                              value: 0 },
        { label: 'Sí, pero no en el último año',   value: 2 },
        { label: 'Sí, en el último año',            value: 4 },
      ],
    },
  ],
  maxScore: 40,
  bands: [
    { min: 0,  max: 7,  label: 'Bajo riesgo',          severity: 0, color: 'green',  action: 'Educación sobre consumo responsable y monitoreo.' },
    { min: 8,  max: 15, label: 'Consumo de riesgo',    severity: 1, color: 'amber',  action: 'Consejo breve estructurado y seguimiento periódico.' },
    { min: 16, max: 19, label: 'Consumo perjudicial',  severity: 2, color: 'orange', action: 'Intervención breve intensiva + seguimiento mensual.' },
    { min: 20, max: 40, label: 'Probable dependencia', severity: 3, color: 'red',    action: 'Derivar a especialista en adicciones. Evaluar síndrome de abstinencia.' },
  ],
  clinicalNote: 'El AUDIT-C (ítems 1–3, máx. 12) se usa como cribado rápido: punto de corte ≥4 en hombres y ≥3 en mujeres indica consumo de riesgo. Si el paciente reporta "Nunca" en el ítem 1, asigne 0 al resto y finalice.',
}

// ─────────────────────────────────────────────────────────────────────────────
// PCL-5 — Lista de Verificación para TEPT (DSM-5)
// ─────────────────────────────────────────────────────────────────────────────
const PCL5 = {
  id: 'PCL5',
  name: 'PCL-5',
  fullName: 'Lista de Verificación del TEPT — DSM-5',
  domain: 'TEPT',
  icon: '🧠',
  themeClass: 'rose',
  duration: '5–10 min',
  description: 'Evalúa la presencia y severidad de síntomas de TEPT en el último mes.',
  reference: 'Weathers et al., 2013 — National Center for PTSD.',
  instruction: 'A continuación hay una lista de problemas que la gente a veces tiene en respuesta a una experiencia muy estresante. Pensando en el evento estresante más perturbador del último mes, ¿cuánto le ha molestado cada uno de los siguientes problemas en el ÚLTIMO MES?',
  defaultOptions: [
    { label: 'En absoluto',     value: 0 },
    { label: 'Un poco',         value: 1 },
    { label: 'Moderadamente',   value: 2 },
    { label: 'Bastante',        value: 3 },
    { label: 'Extremadamente',  value: 4 },
  ],
  questions: [
    // Criterio B — Intrusión (5 ítems)
    'Recuerdos angustiantes, repetitivos e involuntarios del evento estresante',
    'Sueños angustiantes repetidos relacionados con el evento',
    'Sentir o actuar de repente como si el evento estuviera ocurriendo de nuevo (flashbacks)',
    'Sentirse muy angustiado/a cuando algo le recuerda el evento',
    'Tener fuertes reacciones físicas cuando algo le recuerda el evento (p. ej., corazón acelerado, dificultad para respirar, sudoración)',
    // Criterio C — Evitación (2 ítems)
    'Evitar recuerdos, pensamientos o sentimientos relacionados con el evento',
    'Evitar recordatorios externos del evento (personas, lugares, conversaciones, actividades, objetos o situaciones)',
    // Criterio D — Cognición/Ánimo negativo (7 ítems)
    'Problemas para recordar partes importantes del evento',
    'Tener creencias muy negativas sobre usted mismo/a, otras personas o el mundo (p. ej., "Soy malo/a", "Nadie es de confianza", "El mundo es completamente peligroso")',
    'Culparse a sí mismo/a o culpar a otros por el evento o sus consecuencias',
    'Sentimientos muy negativos como miedo, horror, ira, culpa o vergüenza',
    'Pérdida de interés en actividades que antes disfrutaba',
    'Sentirse distante o alejado/a de otras personas',
    'Dificultad para experimentar sentimientos positivos (p. ej., incapacidad para sentir alegría o amor)',
    // Criterio E — Hiperactivación/Reactividad (6 ítems)
    'Comportamiento irritable, arrebatos de ira o actuar de forma agresiva',
    'Asumir riesgos o hacer cosas que podrían causarle daño',
    'Estar "superalerta", en guardia o en tensión',
    'Sobresaltarse fácilmente con ruidos o cosas inesperadas',
    'Tener dificultades para concentrarse',
    'Dificultad para conciliar o mantener el sueño',
  ],
  // Clusters para análisis por criterio DSM-5
  clusters: [
    { name: 'Criterio B — Intrusión',            questions: [0,1,2,3,4],         threshold: 1, label: 'Requiere ≥1 síntoma' },
    { name: 'Criterio C — Evitación',            questions: [5,6],               threshold: 1, label: 'Requiere ≥1 síntoma' },
    { name: 'Criterio D — Cognición/Ánimo neg.', questions: [7,8,9,10,11,12,13], threshold: 2, label: 'Requiere ≥2 síntomas' },
    { name: 'Criterio E — Reactividad',          questions: [14,15,16,17,18,19], threshold: 2, label: 'Requiere ≥2 síntomas' },
  ],
  maxScore: 80,
  bands: [
    { min: 0,  max: 32, label: 'Bajo umbral provisional', severity: 0, color: 'green', action: 'No alcanza el umbral para TEPT. Continuar evaluación clínica y seguimiento.' },
    { min: 33, max: 80, label: 'Probable TEPT',           severity: 3, color: 'red',   action: 'Iniciar protocolo de trauma (TF-CBT, EMDR, CPT). Coordinar plan de seguridad.' },
  ],
  clinicalNote: 'Umbral provisional de 33 (sensibilidad/especificidad balanceadas). Para diagnóstico formal DSM-5 se requiere: B≥1 síntoma, C≥1, D≥2, E≥2 síntomas que puntúen ≥2 ("Moderadamente"), duración >1 mes y deterioro funcional significativo. Un ítem puntúa positivo si el valor ≥2.',
}

// ─────────────────────────────────────────────────────────────────────────────
// Exportaciones
// ─────────────────────────────────────────────────────────────────────────────
export const CLINICAL_SCALES = [PHQ9, GAD7, AUDIT, PCL5]

/** Devuelve las preguntas normalizadas (siempre objetos {text, options}) */
export function getNormalizedQuestions(scale) {
  return scale.questions.map((q, i) => ({
    index: i,
    text:    typeof q === 'string' ? q : q.text,
    options: typeof q === 'object' && q.options ? q.options : scale.defaultOptions,
  }))
}

/** Devuelve la banda de interpretación para un puntaje dado */
export function getBand(scale, score) {
  return scale.bands.find(b => score >= b.min && score <= b.max) ?? null
}

/** Para PCL-5: análisis por clusters DSM-5 */
export function getPCL5ClusterAnalysis(answers) {
  return PCL5.clusters.map(cluster => {
    // Un ítem positivo = respuesta ≥ 2
    const positiveCount = cluster.questions.filter(qi => (answers[qi] ?? 0) >= 2).length
    const met = positiveCount >= cluster.threshold
    return { ...cluster, positiveCount, met }
  })
}
