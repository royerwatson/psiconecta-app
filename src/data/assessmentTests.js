/**
 * assessmentTests.js — Instrumentos clínicos validados para evaluaciones con reporte.
 * Cada test tiene: preguntas, escala, dimensiones y bandas de severidad.
 */

export const ASSESSMENT_TESTS = {
  ansiedad: {
    slug: 'ansiedad',
    name: 'Ansiedad & Estrés',
    instrument: 'GAD-7',
    instrumentFull: 'Escala de Trastorno de Ansiedad Generalizada (GAD-7)',
    description: 'Evalúa la frecuencia de síntomas de ansiedad en las últimas 2 semanas.',
    price: 4.99,
    duration: '5 min',
    color: 'violet',
    maxScore: 21,
    timeframe: 'Durante las últimas 2 semanas, ¿con qué frecuencia te ha molestado…?',
    scaleLabels: ['Para nada', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'],
    items: [
      'Sentirte nervioso/a, ansioso/a o con los nervios de punta',
      'No poder dejar de preocuparte o de controlar tu preocupación',
      'Preocuparte demasiado por cosas diferentes',
      'Dificultad para relajarte',
      'Estar tan inquieto/a que es difícil mantenerte quieto/a',
      'Molestarte o irritarte fácilmente',
      'Sentir miedo, como si algo terrible fuera a pasar',
    ],
    dimensions: [
      { name: 'Preocupación', itemIndices: [0, 1, 2], maxDim: 9 },
      { name: 'Tensión física', itemIndices: [3, 4], maxDim: 6 },
      { name: 'Irritabilidad', itemIndices: [5, 6], maxDim: 6 },
    ],
    bands: [
      { min: 0,  max: 4,  label: 'Mínima',  hex: '#10b981', description: 'Los síntomas de ansiedad están en un nivel muy bajo o ausente.' },
      { min: 5,  max: 9,  label: 'Leve',    hex: '#f59e0b', description: 'Ansiedad leve que puede manejarse con técnicas de autocuidado.' },
      { min: 10, max: 14, label: 'Moderada',hex: '#f97316', description: 'Ansiedad moderada que interfiere con algunas áreas de funcionamiento.' },
      { min: 15, max: 21, label: 'Severa',  hex: '#ef4444', description: 'Ansiedad severa que requiere atención profesional.' },
    ],
  },

  depresion: {
    slug: 'depresion',
    name: 'Ánimo & Depresión',
    instrument: 'PHQ-9',
    instrumentFull: 'Cuestionario de Salud del Paciente (PHQ-9)',
    description: 'Evalúa la presencia y severidad de síntomas depresivos en las últimas 2 semanas.',
    price: 4.99,
    duration: '5 min',
    color: 'primary',
    maxScore: 27,
    timeframe: 'Durante las últimas 2 semanas, ¿con qué frecuencia te han molestado los siguientes problemas?',
    scaleLabels: ['Para nada', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'],
    items: [
      'Poco interés o placer en hacer las cosas',
      'Sentirte decaído/a, deprimido/a o sin esperanza',
      'Con problemas para quedarte o mantenerte dormido/a, o por dormir demasiado',
      'Sintiéndote cansado/a o con poca energía',
      'Con poco apetito o comiendo en exceso',
      'Sintiéndote mal contigo mismo/a, o que eres un fracaso',
      'Con dificultad para concentrarte en cosas como leer o ver televisión',
      'Moviéndote o hablando más lento de lo normal, o por el contrario, más agitado/a o inquieto/a',
      'Pensamientos de que estarías mejor muerto/a o de hacerte daño de alguna manera',
    ],
    dimensions: [
      { name: 'Humor depresivo', itemIndices: [0, 1], maxDim: 6 },
      { name: 'Síntomas somáticos', itemIndices: [2, 3, 4], maxDim: 9 },
      { name: 'Autocrítica y cognitivo', itemIndices: [5, 6, 7], maxDim: 9 },
      { name: 'Ideación', itemIndices: [8], maxDim: 3 },
    ],
    bands: [
      { min: 0,  max: 4,  label: 'Mínima',          hex: '#10b981', description: 'Los síntomas depresivos están prácticamente ausentes.' },
      { min: 5,  max: 9,  label: 'Leve',             hex: '#f59e0b', description: 'Síntomas leves que pueden vigilarse sin intervención inmediata.' },
      { min: 10, max: 14, label: 'Moderada',         hex: '#f97316', description: 'Síntomas que podrían beneficiarse de apoyo psicológico.' },
      { min: 15, max: 19, label: 'Moderada-Severa',  hex: '#ef4444', description: 'Sintomatología significativa que requiere atención especializada.' },
      { min: 20, max: 27, label: 'Severa',           hex: '#dc2626', description: 'Síntomas severos. Se recomienda atención profesional urgente.' },
    ],
  },

  sueno: {
    slug: 'sueno',
    name: 'Calidad del Sueño',
    instrument: 'ISI',
    instrumentFull: 'Índice de Severidad del Insomnio (ISI)',
    description: 'Evalúa la severidad e impacto del insomnio en tu funcionamiento cotidiano.',
    price: 4.99,
    duration: '5 min',
    color: 'indigo',
    maxScore: 28,
    timeframe: 'Por favor, responde sobre cómo ha sido tu sueño en el último mes.',
    // Per-item scale labels (array of arrays)
    items: [
      { text: 'Dificultad para iniciar el sueño (tardar en dormirte)', scale: ['Ninguna', 'Leve', 'Moderada', 'Grave', 'Muy grave'] },
      { text: 'Dificultad para mantener el sueño (despertares nocturnos)', scale: ['Ninguna', 'Leve', 'Moderada', 'Grave', 'Muy grave'] },
      { text: 'Despertarte demasiado temprano y no poder volver a dormirte', scale: ['Ninguna', 'Leve', 'Moderada', 'Grave', 'Muy grave'] },
      { text: '¿Qué tan satisfecho/a estás con tu sueño actual?', scale: ['Muy satisfecho/a', 'Satisfecho/a', 'Neutral', 'Insatisfecho/a', 'Muy insatisfecho/a'] },
      { text: '¿Hasta qué punto tu problema de sueño interfiere con tu funcionamiento diario?', scale: ['Para nada', 'Un poco', 'Algo', 'Mucho', 'Muchísimo'] },
      { text: '¿Hasta qué punto tu problema de sueño es notable para los demás?', scale: ['Para nada', 'Un poco', 'Algo', 'Mucho', 'Muchísimo'] },
      { text: '¿Cuánto te preocupa tu problema actual de sueño?', scale: ['Para nada', 'Un poco', 'Algo', 'Mucho', 'Muchísimo'] },
    ],
    dimensions: [
      { name: 'Perfil del sueño', itemIndices: [0, 1, 2], maxDim: 12 },
      { name: 'Satisfacción e impacto', itemIndices: [3, 4], maxDim: 8 },
      { name: 'Preocupación', itemIndices: [5, 6], maxDim: 8 },
    ],
    bands: [
      { min: 0,  max: 7,  label: 'Sin insomnio',   hex: '#10b981', description: 'Tu patrón de sueño está dentro del rango normal.' },
      { min: 8,  max: 14, label: 'Leve',            hex: '#f59e0b', description: 'Dificultades leves que pueden mejorar con higiene del sueño.' },
      { min: 15, max: 21, label: 'Moderado',        hex: '#f97316', description: 'Insomnio clínico moderado que afecta el funcionamiento.' },
      { min: 22, max: 28, label: 'Severo',          hex: '#ef4444', description: 'Insomnio severo que requiere intervención especializada.' },
    ],
  },

  burnout: {
    slug: 'burnout',
    name: 'Trabajo & Burnout',
    instrument: 'MBI-GS',
    instrumentFull: 'Inventario de Burnout de Maslach — General Survey',
    description: 'Evalúa el agotamiento emocional, la despersonalización y el desgaste laboral.',
    price: 6.99,
    duration: '7 min',
    color: 'cyan',
    maxScore: 40,
    timeframe: 'Indica con qué frecuencia experimentas cada afirmación en relación con tu trabajo.',
    scaleLabels: ['Nunca', 'Raramente', 'Algunas veces', 'Frecuentemente', 'Siempre'],
    items: [
      'Me siento emocionalmente agotado/a por mi trabajo',
      'Me siento agotado/a al final de la jornada laboral',
      'Cuando me levanto por la mañana me cuesta enfrentarme a otro día de trabajo',
      'Me siento al límite de mis posibilidades en el trabajo',
      'Siento que estoy demasiado tiempo en mi trabajo y que me está agotando',
      'Siento que mi trabajo me endurece emocionalmente',
      'Me preocupa que el trabajo me haga más insensible con las personas',
      'Me cuesta conectar genuinamente con las personas con las que trabajo',
      'Siento que los problemas de mi trabajo los tengo que resolver solo/a',
      'Me cuesta encontrar sentido o propósito en lo que hago',
    ],
    dimensions: [
      { name: 'Agotamiento emocional', itemIndices: [0, 1, 2, 3, 4], maxDim: 20 },
      { name: 'Despersonalización', itemIndices: [5, 6, 7], maxDim: 12 },
      { name: 'Pérdida de propósito', itemIndices: [8, 9], maxDim: 8 },
    ],
    bands: [
      { min: 0,  max: 12, label: 'Sin burnout',      hex: '#10b981', description: 'Tu nivel de agotamiento laboral es bajo o inexistente.' },
      { min: 13, max: 22, label: 'Leve',             hex: '#f59e0b', description: 'Signos tempranos de desgaste que pueden manejarse preventivamente.' },
      { min: 23, max: 31, label: 'Moderado',         hex: '#f97316', description: 'Desgaste laboral significativo que está afectando tu bienestar.' },
      { min: 32, max: 40, label: 'Severo',           hex: '#ef4444', description: 'Burnout severo que requiere atención profesional y cambios.' },
    ],
  },
}

/**
 * Calcula la banda de severidad dado un score y el test.
 */
export function getSeverityBand(test, score) {
  return test.bands.find(b => score >= b.min && score <= b.max) || test.bands[test.bands.length - 1]
}

/**
 * Calcula los scores por dimensión.
 */
export function getDimensionScores(test, responses) {
  return test.dimensions.map(dim => {
    const raw = dim.itemIndices.reduce((sum, i) => sum + (responses[i] ?? 0), 0)
    const pct = Math.round((raw / dim.maxDim) * 100)
    return { name: dim.name, raw, max: dim.maxDim, pct }
  })
}

/**
 * Formatea las respuestas para enviar al prompt de Claude.
 */
export function formatResponsesForClaude(test, responses) {
  return test.items.map((item, i) => {
    const text = typeof item === 'object' ? item.text : item
    const scale = typeof item === 'object' ? item.scale : test.scaleLabels
    const val = responses[i] ?? 0
    const label = scale[val] ?? `${val}`
    return `P${i + 1}: "${text}" → ${label} (${val}/${scale.length - 1})`
  }).join('\n')
}

export const AREA_LIST = [
  { slug: 'ansiedad',  name: 'Ansiedad & Estrés',       icon: '🫁', color: 'violet',  price: '$4.99' },
  { slug: 'depresion', name: 'Ánimo & Depresión',        icon: '🧠', color: 'primary', price: '$4.99' },
  { slug: 'sueno',     name: 'Calidad del Sueño',        icon: '🌙', color: 'indigo',  price: '$4.99' },
  { slug: 'burnout',   name: 'Trabajo & Burnout',        icon: '💼', color: 'cyan',    price: '$6.99' },
  { slug: 'relaciones',name: 'Relaciones & Pareja',      icon: '💑', color: 'teal',    price: '$9.99', soon: true },
  { slug: 'personalidad', name: 'Rasgos de Personalidad',icon: '🪞', color: 'accent',  price: '$9.99', soon: true },
]
