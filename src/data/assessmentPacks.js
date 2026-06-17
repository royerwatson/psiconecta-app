/**
 * assessmentPacks.js — Definición de paquetes temáticos de evaluación.
 * Cada pack agrupa varios tests con precio combinado y reporte integrado cruzado.
 */

import { ASSESSMENT_TESTS } from './assessmentTests'

export const ASSESSMENT_PACKS = {
  bienestar: {
    slug:        'bienestar',
    name:        'Pack Bienestar Emocional',
    price:       12.99,
    save:        '30%',
    color:       'violet',
    icon:        '🌿',
    tests:       ['ansiedad', 'depresion', 'sueno'],
    instruments: 'GAD-7 + PHQ-9 + ISI',
    description: 'Evalúa tu estado emocional, ánimo y calidad del sueño en un reporte integrado. Descubre cómo se conectan entre sí.',
    reportTitle: 'Reporte Bienestar Emocional Integrado',
    highlight:   false,
  },
  laboral: {
    slug:        'laboral',
    name:        'Pack Vida Laboral',
    price:       14.99,
    save:        '28%',
    color:       'cyan',
    icon:        '💼',
    tests:       ['burnout', 'ansiedad'],
    instruments: 'MBI-GS + GAD-7',
    description: 'Detecta el desgaste laboral y su relación con la ansiedad. Obtén recomendaciones concretas para tu entorno de trabajo.',
    reportTitle: 'Reporte Vida Laboral Integrado',
    highlight:   false,
  },
  completo: {
    slug:        'completo',
    name:        'Pack Evaluación Completa',
    price:       24.99,
    save:        '40%',
    color:       'primary',
    icon:        '⭐',
    tests:       ['ansiedad', 'depresion', 'sueno', 'burnout'],
    instruments: '4 instrumentos clínicos validados',
    description: 'La evaluación más completa: ansiedad, ánimo, sueño y burnout en un reporte cruzado de 10-12 páginas con 20% de descuento en tu primera sesión.',
    reportTitle: 'Reporte de Evaluación Completa',
    highlight:   true,
    bonus:       '20% descuento en 1ª sesión',
  },
}

export const PACK_LIST = Object.values(ASSESSMENT_PACKS)

/**
 * Retorna los datos de los tests que componen un pack.
 */
export function getPackTests(pack) {
  return pack.tests.map(slug => ASSESSMENT_TESTS[slug]).filter(Boolean)
}

/**
 * Precio individual si se compraran por separado.
 */
export function getPackOriginalPrice(pack) {
  return getPackTests(pack).reduce((sum, t) => sum + (t.price ?? 0), 0)
}
