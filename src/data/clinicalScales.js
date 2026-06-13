/**
 * Escalas clínicas validadas — datos en español
 * PHQ-9 · GAD-7 · AUDIT · PCL-5 · ISI · PSS-10 · DASS-21 · SPIN · DAST-10 · Columbia C-SSRS
 *
 * Referencias:
 *  PHQ-9       : Kroenke, Spitzer & Williams (2001). J Gen Intern Med.
 *  GAD-7       : Spitzer, Kroenke, Williams & Löwe (2006). Arch Intern Med.
 *  AUDIT       : Saunders et al. (1993). OMS. Adaptación española PAHO.
 *  PCL-5       : Weathers et al. (2013). National Center for PTSD.
 *  ISI         : Morin (1993). Insomnia: Psychological Assessment and Management.
 *  PSS-10      : Cohen, Kamarck & Mermelstein (1983). J Health Soc Behav.
 *  DASS-21     : Lovibond & Lovibond (1995). Behaviour Research and Therapy.
 *  SPIN        : Connor et al. (2000). J Clin Psychiatry.
 *  DAST-10     : Skinner (1982). Addictive Behaviors. OMS adaptación.
 *  C-SSRS      : Posner et al. (2011). Am J Psychiatry. Columbia University.
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
  icon: 'Frown',
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
  clinicalNote: 'Si el ítem 9 (ideación suicida) puntúa ≥1, realizar evaluación de riesgo suicida de forma inmediata con escala específica (Columbia C-SSRS o similar).',
}

// ─────────────────────────────────────────────────────────────────────────────
// GAD-7 — Trastorno de Ansiedad Generalizada
// ─────────────────────────────────────────────────────────────────────────────
const GAD7 = {
  id: 'GAD7',
  name: 'GAD-7',
  fullName: 'Escala de Trastorno de Ansiedad Generalizada — 7',
  domain: 'Ansiedad',
  icon: 'HeartPulse',
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
  icon: 'Droplets',
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
  icon: 'Brain',
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
// ISI — Índice de Severidad del Insomnio
// ─────────────────────────────────────────────────────────────────────────────
const ISI = {
  id: 'ISI',
  name: 'ISI',
  fullName: 'Índice de Severidad del Insomnio',
  domain: 'Sueño',
  icon: 'Moon',
  themeClass: 'indigo',
  duration: '2–3 min',
  description: 'Evalúa la naturaleza, severidad e impacto del insomnio durante las últimas 2 semanas.',
  reference: 'Morin, 1993. Validación española: Fernández-Mendoza et al., 2012.',
  instruction: 'Por favor, responda las siguientes preguntas sobre sus problemas de sueño ACTUALES (últimas 2 semanas).',
  questions: [
    {
      text: 'Dificultad para conciliar el sueño (quedarse dormido/a)',
      options: [
        { label: 'Ninguna',  value: 0 },
        { label: 'Leve',     value: 1 },
        { label: 'Moderada', value: 2 },
        { label: 'Grave',    value: 3 },
        { label: 'Muy grave',value: 4 },
      ],
    },
    {
      text: 'Dificultad para mantener el sueño (despertarse durante la noche)',
      options: [
        { label: 'Ninguna',  value: 0 },
        { label: 'Leve',     value: 1 },
        { label: 'Moderada', value: 2 },
        { label: 'Grave',    value: 3 },
        { label: 'Muy grave',value: 4 },
      ],
    },
    {
      text: 'Problemas para despertarse demasiado temprano',
      options: [
        { label: 'Ninguna',  value: 0 },
        { label: 'Leve',     value: 1 },
        { label: 'Moderada', value: 2 },
        { label: 'Grave',    value: 3 },
        { label: 'Muy grave',value: 4 },
      ],
    },
    {
      text: '¿En qué medida está SATISFECHO/A con su patrón de sueño actual?',
      options: [
        { label: 'Muy satisfecho/a',     value: 0 },
        { label: 'Satisfecho/a',         value: 1 },
        { label: 'Moderadamente insatisfecho/a', value: 2 },
        { label: 'Insatisfecho/a',       value: 3 },
        { label: 'Muy insatisfecho/a',   value: 4 },
      ],
    },
    {
      text: '¿En qué medida considera que su problema de sueño es VISIBLE para los demás (deterioro en calidad de vida, cansancio, capacidad de concentración, memoria, estado de ánimo)?',
      options: [
        { label: 'Nada visible',         value: 0 },
        { label: 'Un poco',              value: 1 },
        { label: 'Algo',                 value: 2 },
        { label: 'Mucho',               value: 3 },
        { label: 'Extremadamente visible', value: 4 },
      ],
    },
    {
      text: '¿En qué medida está PREOCUPADO/A por su problema de sueño actual?',
      options: [
        { label: 'Nada',         value: 0 },
        { label: 'Un poco',      value: 1 },
        { label: 'Algo',         value: 2 },
        { label: 'Mucho',       value: 3 },
        { label: 'Extremadamente', value: 4 },
      ],
    },
    {
      text: '¿En qué medida considera que su problema de sueño INTERFIERE con su funcionamiento diario (p. ej., cansancio diurno, capacidad para las tareas cotidianas, concentración, memoria, estado de ánimo)?',
      options: [
        { label: 'Nada',         value: 0 },
        { label: 'Un poco',      value: 1 },
        { label: 'Algo',         value: 2 },
        { label: 'Mucho',       value: 3 },
        { label: 'Extremadamente', value: 4 },
      ],
    },
  ],
  maxScore: 28,
  bands: [
    { min: 0,  max: 7,  label: 'Sin insomnio clínico',      severity: 0, color: 'green',  action: 'Monitorear. Psicoeducación sobre higiene del sueño si hay malestar subjetivo.' },
    { min: 8,  max: 14, label: 'Insomnio subumbral',        severity: 1, color: 'lime',   action: 'Higiene del sueño estructurada y restricción de cama. Seguimiento.' },
    { min: 15, max: 21, label: 'Insomnio clínico moderado', severity: 2, color: 'amber',  action: 'Terapia Cognitivo-Conductual para el Insomnio (TCC-I). Evaluar comorbilidades.' },
    { min: 22, max: 28, label: 'Insomnio clínico grave',    severity: 3, color: 'red',    action: 'TCC-I intensiva. Consultar con médico para descartar causas orgánicas y evaluar farmacoterapia temporal.' },
  ],
  clinicalNote: 'La TCC-I (restricción de cama, control de estímulos, reestructuración cognitiva) es el tratamiento de primera línea para el insomnio crónico, superior a largo plazo a la farmacoterapia. Un ISI ≥15 indica insomnio clínico que requiere intervención activa.',
}

// ─────────────────────────────────────────────────────────────────────────────
// PSS-10 — Escala de Estrés Percibido (Cohen)
// ─────────────────────────────────────────────────────────────────────────────
const PSS10 = {
  id: 'PSS10',
  name: 'PSS-10',
  fullName: 'Escala de Estrés Percibido — 10',
  domain: 'Estrés',
  icon: 'Zap',
  themeClass: 'orange',
  duration: '2–3 min',
  description: 'Mide el grado en que situaciones de la vida se perciben como estresantes durante el último mes.',
  reference: 'Cohen, Kamarck & Mermelstein, 1983. Validación española: Remor, 2006.',
  instruction: 'Las preguntas le piden sobre sus sentimientos y pensamientos durante el ÚLTIMO MES. En cada caso, indique con qué frecuencia se sintió o pensó de una determinada manera.',
  defaultOptions: [
    { label: 'Nunca',        value: 0 },
    { label: 'Casi nunca',   value: 1 },
    { label: 'De vez en cuando', value: 2 },
    { label: 'A menudo',     value: 3 },
    { label: 'Muy a menudo', value: 4 },
  ],
  // Ítems 4, 5, 7, 8 son inversos (se restan)
  reversedItems: [3, 4, 6, 7],
  questions: [
    'En el último mes, ¿con qué frecuencia ha estado afectado/a por algo que ha ocurrido inesperadamente?',
    'En el último mes, ¿con qué frecuencia se ha sentido incapaz de controlar las cosas importantes de su vida?',
    'En el último mes, ¿con qué frecuencia se ha sentido nervioso/a o estresado/a?',
    'En el último mes, ¿con qué frecuencia ha manejado con éxito los pequeños problemas irritantes de la vida?', // inverso
    'En el último mes, ¿con qué frecuencia ha sentido que ha afrontado efectivamente los cambios importantes que han estado ocurriendo en su vida?', // inverso
    'En el último mes, ¿con qué frecuencia ha estado seguro/a sobre su capacidad para manejar sus problemas personales?', // inverso — nota: es el ítem 6 (índice 5) pero el inverso es [3,4,6,7]
    'En el último mes, ¿con qué frecuencia ha sentido que las cosas le van bien?', // inverso
    'En el último mes, ¿con qué frecuencia ha sentido que no podía afrontar todas las cosas que tenía que hacer?',
    'En el último mes, ¿con qué frecuencia ha podido controlar las dificultades de su vida?', // inverso
    'En el último mes, ¿con qué frecuencia ha sentido que tenía todo bajo control?', // inverso
    'En el último mes, ¿con qué frecuencia ha estado enojado/a porque las cosas que le han ocurrido estaban fuera de su control?',
    'En el último mes, ¿con qué frecuencia ha pensado sobre las cosas que le quedan por hacer?',
    'En el último mes, ¿con qué frecuencia ha podido controlar la forma de pasar el tiempo?', // inverso
    'En el último mes, ¿con qué frecuencia ha sentido que las dificultades se acumulan tanto que no puede superarlas?',
  ],
  maxScore: 40,
  bands: [
    { min: 0,  max: 13, label: 'Estrés bajo',      severity: 0, color: 'green',  action: 'Mantenimiento de recursos de afrontamiento. Sin intervención específica indicada.' },
    { min: 14, max: 26, label: 'Estrés moderado',   severity: 1, color: 'amber',  action: 'Técnicas de manejo del estrés, mindfulness y activación conductual. Evaluar fuentes de estrés.' },
    { min: 27, max: 40, label: 'Estrés alto',       severity: 2, color: 'red',    action: 'Intervención psicoterapéutica activa. Evaluar comorbilidades de ansiedad y depresión.' },
  ],
  clinicalNote: 'La PSS-10 mide estrés percibido (subjetivo), no eventos estresantes objetivos. Los ítems 4, 5, 7, 8 (índices 3, 4, 6, 7) son inversos y se puntúan 4→0, 3→1, 2→2, 1→3, 0→4. Puntuaciones >14 en población general son indicativas de estrés moderado-alto. Útil para monitorear cambios a lo largo del tratamiento.',
}

// ─────────────────────────────────────────────────────────────────────────────
// DASS-21 — Escala de Depresión, Ansiedad y Estrés (21 ítems)
// ─────────────────────────────────────────────────────────────────────────────
const DASS21 = {
  id: 'DASS21',
  name: 'DASS-21',
  fullName: 'Escala de Depresión, Ansiedad y Estrés — 21',
  domain: 'Depresión / Ansiedad / Estrés',
  icon: 'Activity',
  themeClass: 'teal',
  duration: '5–7 min',
  description: 'Mide tres dimensiones del malestar psicológico — depresión, ansiedad y estrés — en la última semana. Cada subescala tiene 7 ítems y se multiplica ×2 para comparar con la versión DASS-42.',
  reference: 'Lovibond & Lovibond, 1995. Validación española: Bados, Solanas & Andrés, 2005.',
  instruction: 'Por favor, lea cada afirmación y seleccione el número que indica cuánto le ha aplicado la afirmación DURANTE LA ÚLTIMA SEMANA. No hay respuestas correctas o incorrectas. No tarde demasiado en cada ítem.',
  defaultOptions: [
    { label: 'No me aplicó en absoluto',              value: 0 },
    { label: 'Me aplicó un poco, o durante parte del tiempo', value: 1 },
    { label: 'Me aplicó bastante, o durante una parte considerable del tiempo', value: 2 },
    { label: 'Me aplicó mucho, o la mayor parte del tiempo', value: 3 },
  ],
  questions: [
    'Me costó mucho relajarme',                                           // Estrés
    'Me di cuenta de que tenía la boca seca',                            // Ansiedad
    'No podía sentir ningún sentimiento positivo',                        // Depresión
    'Se me hizo difícil respirar (p. ej., respiración excesivamente rápida, falta de aliento sin haber hecho esfuerzo físico)', // Ansiedad
    'Se me hizo difícil tomar la iniciativa para hacer cosas',           // Depresión
    'Reaccioné exageradamente en ciertas situaciones',                   // Estrés
    'Sentí que mis manos temblaban',                                     // Ansiedad
    'Sentí que tenía muchos nervios',                                    // Estrés
    'Estaba preocupado/a por situaciones en las que podría entrar en pánico y hacer el ridículo', // Ansiedad
    'Sentí que no tenía nada que esperar',                               // Depresión
    'Me encontré agitado/a',                                             // Estrés
    'Se me hizo difícil relajarme',                                      // Estrés
    'Me sentí triste y deprimido/a',                                     // Depresión
    'No toleré nada que no me dejara continuar con lo que estaba haciendo', // Estrés
    'Sentí que estaba a punto de entrar en pánico',                      // Ansiedad
    'No me pude entusiasmar con nada',                                   // Depresión
    'Sentí que valía muy poco como persona',                             // Depresión
    'Sentí que estaba muy irritable',                                    // Estrés
    'Sentí los latidos de mi corazón a pesar de no haber hecho ningún esfuerzo físico', // Ansiedad
    'Tuve miedo sin razón',                                              // Ansiedad
    'Sentí que la vida no valía la pena',                                // Depresión
  ],
  // Subescalas: los ítems están indexados desde 0
  subscales: [
    { name: 'Depresión', items: [2, 4, 9, 12, 15, 16, 20], multiplier: 2 },
    { name: 'Ansiedad',  items: [1, 3, 6, 8, 14, 18, 19],  multiplier: 2 },
    { name: 'Estrés',    items: [0, 5, 7, 10, 11, 13, 17], multiplier: 2 },
  ],
  maxScore: 42, // por subescala (21 × 2)
  // Bandas por subescala (puntaje ya multiplicado ×2)
  subscaleBands: {
    Depresión: [
      { min: 0,  max: 9,  label: 'Normal',    color: 'green'  },
      { min: 10, max: 13, label: 'Leve',      color: 'lime'   },
      { min: 14, max: 20, label: 'Moderada',  color: 'amber'  },
      { min: 21, max: 27, label: 'Grave',     color: 'orange' },
      { min: 28, max: 42, label: 'Muy grave', color: 'red'    },
    ],
    Ansiedad: [
      { min: 0,  max: 7,  label: 'Normal',    color: 'green'  },
      { min: 8,  max: 9,  label: 'Leve',      color: 'lime'   },
      { min: 10, max: 14, label: 'Moderada',  color: 'amber'  },
      { min: 15, max: 19, label: 'Grave',     color: 'orange' },
      { min: 20, max: 42, label: 'Muy grave', color: 'red'    },
    ],
    Estrés: [
      { min: 0,  max: 14, label: 'Normal',    color: 'green'  },
      { min: 15, max: 18, label: 'Leve',      color: 'lime'   },
      { min: 19, max: 25, label: 'Moderado',  color: 'amber'  },
      { min: 26, max: 33, label: 'Grave',     color: 'orange' },
      { min: 34, max: 42, label: 'Muy grave', color: 'red'    },
    ],
  },
  bands: [
    { min: 0,  max: 29, label: 'Rango normal-leve',    severity: 0, color: 'green',  action: 'Monitorear. Técnicas de manejo del estrés si hay malestar subjetivo.' },
    { min: 30, max: 59, label: 'Malestar moderado',    severity: 1, color: 'amber',  action: 'Intervención psicoterapéutica. Evaluar cada subescala individualmente.' },
    { min: 60, max: 84, label: 'Malestar significativo', severity: 2, color: 'red',  action: 'Tratamiento activo diferenciado por subescala. Evaluar farmacoterapia.' },
  ],
  clinicalNote: 'El DASS-21 puntúa cada subescala por separado (×2 para comparar con DASS-42 original). Analiza las tres subescalas individualmente: es posible tener depresión grave con ansiedad leve. Especialmente útil para planificar el enfoque del tratamiento (depresión → activación conductual; ansiedad → exposición/relajación; estrés → manejo del estrés/mindfulness).',
}

// ─────────────────────────────────────────────────────────────────────────────
// SPIN — Inventario de Fobia Social
// ─────────────────────────────────────────────────────────────────────────────
const SPIN = {
  id: 'SPIN',
  name: 'SPIN',
  fullName: 'Inventario de Fobia Social',
  domain: 'Ansiedad social',
  icon: 'Users',
  themeClass: 'violet',
  duration: '3–5 min',
  description: 'Evalúa el miedo, la evitación y el malestar fisiológico en situaciones sociales durante la última semana.',
  reference: 'Connor et al., 2000. Validación española: García-López et al., 2010.',
  instruction: 'Por favor, indique en qué medida le MOLESTÓ cada uno de los siguientes problemas durante la ÚLTIMA SEMANA.',
  defaultOptions: [
    { label: 'Nada',           value: 0 },
    { label: 'Un poco',        value: 1 },
    { label: 'Bastante',       value: 2 },
    { label: 'Mucho',         value: 3 },
    { label: 'Muchísimo',     value: 4 },
  ],
  questions: [
    'Temo a las personas que tienen autoridad',
    'Me molesta el rubor en presencia de personas',
    'Las fiestas y eventos sociales me asustan',
    'Evito hablar con personas que no conozco',
    'Ser criticado/a me asusta mucho',
    'El miedo a la vergüenza hace que evite hacer cosas o hablar con la gente',
    'Sudar delante de la gente me causa angustia',
    'Evito acudir a fiestas',
    'Evito actividades en las que soy el/la centro de atención',
    'Hablar con extraños me da miedo',
    'Evito pronunciar discursos',
    'Haría cualquier cosa para evitar ser criticado/a',
    'Los palpitaciones me molestan cuando estoy con gente',
    'Tengo miedo de hacer cosas cuando la gente me puede estar mirando',
    'El mayor miedo es el ridículo',
    'Evito hablar con cualquier persona que tenga autoridad',
    'Temblar o sacudirse delante de otros me resulta angustioso',
  ],
  maxScore: 68,
  bands: [
    { min: 0,  max: 20, label: 'Sin fobia social',        severity: 0, color: 'green',  action: 'Sin intervención específica indicada. Monitorear si hay malestar subjetivo.' },
    { min: 21, max: 30, label: 'Fobia social leve',       severity: 1, color: 'lime',   action: 'Psicoeducación, técnicas de exposición gradual y habilidades sociales básicas.' },
    { min: 31, max: 40, label: 'Fobia social moderada',   severity: 2, color: 'amber',  action: 'TCC para ansiedad social (protocolo Heimberg). Grupo de habilidades sociales.' },
    { min: 41, max: 68, label: 'Fobia social grave',      severity: 3, color: 'red',    action: 'TCC intensiva ± evaluación psiquiátrica (ISRS son primera línea farmacológica).' },
  ],
  clinicalNote: 'Punto de corte para fobia social probable: ≥19 (sensibilidad 89%, especificidad 90%). El SPIN tiene tres subescalas implícitas: Miedo (ítems 1,2,5,7,9,13,15,17), Evitación (ítems 3,4,8,10,11,14,16) y Malestar fisiológico (ítems 6,12). El análisis por subescala orienta el foco de la intervención.',
}

// ─────────────────────────────────────────────────────────────────────────────
// DAST-10 — Test de Detección de Abuso de Drogas (10 ítems)
// ─────────────────────────────────────────────────────────────────────────────
const DAST10 = {
  id: 'DAST10',
  name: 'DAST-10',
  fullName: 'Test de Detección de Abuso de Drogas — 10',
  domain: 'Sustancias',
  icon: 'Pill',
  themeClass: 'red',
  duration: '2–3 min',
  description: 'Cribado del uso problemático de drogas (excluye alcohol y tabaco) en los últimos 12 meses.',
  reference: 'Skinner, 1982. Adaptación breve: Yudko, Lozhkina & Fouts, 2007. OMS.',
  instruction: 'Las siguientes preguntas son sobre el posible uso de drogas. Al responder, no incluya bebidas alcohólicas ni tabaco. Responda SÍ o NO según lo que le haya ocurrido en los ÚLTIMOS 12 MESES.',
  questions: [
    {
      text: '¿Ha utilizado drogas que no sean las recetadas por un médico?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
    },
    {
      text: '¿Abusa de más de una droga a la vez?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
    },
    {
      text: '¿Puede dejar de usar drogas cuando quiere? (Si nunca las usa, responda No)',
      options: [{ label: 'Sí (puede dejar)', value: 0 }, { label: 'No (no puede dejar)', value: 1 }],
      reversed: true,
    },
    {
      text: '¿Ha tenido alguna vez "alucinaciones" o "lagunas" como resultado del uso de drogas?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
    },
    {
      text: '¿Se siente alguna vez mal (culpable) por su uso de drogas?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
    },
    {
      text: '¿Su familia o pareja se queja alguna vez de su uso de drogas?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
    },
    {
      text: '¿Ha descuidado a su familia por el uso de drogas?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
    },
    {
      text: '¿Ha participado en actividades ilegales para obtener drogas?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
    },
    {
      text: '¿Ha experimentado síntomas de abstinencia (se ha sentido enfermo/a) cuando ha dejado de usar drogas?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
    },
    {
      text: '¿Ha tenido problemas médicos como resultado del uso de drogas (p. ej., pérdida de memoria, hepatitis, convulsiones, hemorragia)?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
    },
  ],
  maxScore: 10,
  bands: [
    { min: 0,  max: 0,  label: 'Sin problema aparente',           severity: 0, color: 'green',  action: 'Sin intervención específica. Educación preventiva si hay contexto de riesgo.' },
    { min: 1,  max: 2,  label: 'Uso de bajo nivel / riesgo',     severity: 1, color: 'lime',   action: 'Consejo breve sobre riesgos. Psicoeducación y seguimiento.' },
    { min: 3,  max: 5,  label: 'Nivel moderado de problemas',    severity: 2, color: 'amber',  action: 'Intervención breve motivacional. Evaluar criterios de trastorno por uso de sustancias (DSM-5).' },
    { min: 6,  max: 8,  label: 'Nivel sustancial de problemas',  severity: 3, color: 'orange', action: 'Derivación a programa de tratamiento de adicciones. Entrevista motivacional.' },
    { min: 9,  max: 10, label: 'Nivel grave de problemas',       severity: 4, color: 'red',    action: 'Derivación urgente a especialista en adicciones. Evaluar riesgo de abstinencia grave.' },
  ],
  clinicalNote: 'El DAST-10 no es diagnóstico — identifica la necesidad de evaluación adicional. Excluye explícitamente alcohol y tabaco (use AUDIT para alcohol). Si el ítem 1 es "No", el puntaje total es 0 y no se necesita continuar. Un puntaje ≥3 requiere evaluación clínica completa de trastorno por uso de sustancias.',
}

// ─────────────────────────────────────────────────────────────────────────────
// Columbia C-SSRS — Escala Columbia de Severidad de Ideación Suicida (cribado)
// ─────────────────────────────────────────────────────────────────────────────
const CSSRS = {
  id: 'CSSRS',
  name: 'C-SSRS',
  fullName: 'Escala Columbia de Severidad de Ideación Suicida — Versión de Cribado',
  domain: 'Riesgo suicida',
  icon: 'AlertTriangle',
  themeClass: 'red',
  duration: '3–5 min',
  description: 'Evalúa la presencia y severidad de ideación e intento de suicidio. Versión de cribado clínico (no sustituye la evaluación clínica completa).',
  reference: 'Posner et al., 2011. Columbia University Medical Center. Dominio público para uso clínico.',
  instruction: 'Responda estas preguntas sobre pensamientos o conductas relacionadas con hacerse daño o quitarse la vida. Responda pensando en el ÚLTIMO MES (salvo que se indique otra cosa).',
  // Formato especial: preguntas secuenciales con lógica de ramificación
  isRiskScale: true,
  questions: [
    {
      text: '¿Ha deseado estar muerto/a o desear que pudiera dormir para siempre?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
      level: 1,
    },
    {
      text: '¿Ha tenido pensamientos de hacerse daño o de suicidarse?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
      level: 2,
    },
    {
      text: '¿Ha pensado en cómo haría para suicidarse?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
      level: 3,
    },
    {
      text: '¿Ha tenido la intención de actuar según estos pensamientos?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
      level: 4,
    },
    {
      text: '¿Ha empezado a prepararse para suicidarse o ha hecho algo para preparar su suicidio (p. ej., conseguir pastillas, armas, escribir una nota de suicidio)?',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
      level: 5,
    },
    {
      text: '¿Ha realizado algún intento de suicidio o ha hecho algo con la intención de quitarse la vida? (En cualquier momento de su vida)',
      options: [{ label: 'No', value: 0 }, { label: 'Sí', value: 1 }],
      level: 6,
      lifetime: true,
    },
  ],
  maxScore: 6,
  // Lógica de riesgo basada en nivel de ideación
  riskLevels: [
    {
      condition: 'none',
      label: 'Sin ideación activa',
      color: 'green',
      severity: 0,
      action: 'Sin riesgo aparente. Mantener monitoreo en sesiones periódicas.',
    },
    {
      condition: 'level1',
      label: 'Deseos pasivos de muerte',
      color: 'lime',
      severity: 1,
      action: 'Bajo riesgo. Psicoeducación, razones para vivir, plan de seguridad básico. Seguimiento cercano.',
    },
    {
      condition: 'level2',
      label: 'Ideación suicida sin plan',
      color: 'amber',
      severity: 2,
      action: 'Riesgo moderado. Plan de seguridad detallado. Evaluar factores protectores y de riesgo. Aumentar frecuencia de sesiones.',
    },
    {
      condition: 'level3_4',
      label: 'Ideación con plan o intención',
      color: 'orange',
      severity: 3,
      action: 'Riesgo alto. Plan de seguridad exhaustivo. Involucrar red de apoyo. Evaluar hospitalización. Coordinación con psiquiatría urgente.',
    },
    {
      condition: 'level5_6',
      label: 'Preparación o intento previo',
      color: 'red',
      severity: 4,
      action: 'Riesgo muy alto. Acción inmediata requerida. Evaluar hospitalización. No dejar al paciente solo. Activar protocolos de emergencia.',
    },
  ],
  bands: [
    { min: 0, max: 0, label: 'Sin ideación activa',          severity: 0, color: 'green',  action: 'Sin riesgo aparente. Mantener monitoreo en sesiones periódicas.' },
    { min: 1, max: 1, label: 'Deseos pasivos de muerte',     severity: 1, color: 'lime',   action: 'Riesgo bajo. Plan de seguridad básico y seguimiento cercano.' },
    { min: 2, max: 2, label: 'Ideación sin plan',            severity: 2, color: 'amber',  action: 'Riesgo moderado. Plan de seguridad detallado. Aumentar frecuencia de sesiones.' },
    { min: 3, max: 4, label: 'Ideación con plan o intención',severity: 3, color: 'orange', action: 'Riesgo alto. Coordinación con psiquiatría. Evaluar hospitalización.' },
    { min: 5, max: 6, label: 'Preparación o intento previo', severity: 4, color: 'red',    action: 'Riesgo muy alto. Acción inmediata. Evaluar hospitalización de urgencia.' },
  ],
  clinicalNote: 'ATENCIÓN: cualquier respuesta positiva en los ítems 3–6 requiere evaluación de riesgo suicida completa de forma INMEDIATA y documentación en el expediente. Esta versión de cribado NO reemplaza la evaluación clínica completa. Un intento previo (ítem 6) es el predictor más fuerte de intentos futuros. Siga siempre el protocolo de gestión del riesgo de su institución.',
}

// ─────────────────────────────────────────────────────────────────────────────
// Exportaciones
// ─────────────────────────────────────────────────────────────────────────────
export const CLINICAL_SCALES = [PHQ9, GAD7, AUDIT, PCL5, ISI, PSS10, DASS21, SPIN, DAST10, CSSRS]

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
