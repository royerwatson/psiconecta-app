/**
 * Biblioteca de ejercicios terapéuticos predefinidos — español
 * 56 ejercicios en 8 categorías.
 *
 * Cada ejercicio:
 *  id          string — identificador único
 *  category    string — clave de categoría
 *  title       string — nombre del ejercicio
 *  summary     string — descripción breve (max ~120 chars)
 *  instructions string — pasos detallados para el paciente
 *  goal        string — objetivo terapéutico
 *  duration    string — tiempo estimado
 *  frequency   string — frecuencia sugerida
 *  difficulty  'básico' | 'intermedio' | 'avanzado'
 *  tags        string[] — palabras clave para búsqueda
 */

// ── Categorías ────────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'tcc',         label: 'TCC',                 icon: 'Brain',    color: 'blue'   },
  { id: 'dbt',         label: 'DBT',                 icon: 'Waves',    color: 'teal'   },
  { id: 'act',         label: 'ACT',                 icon: 'Leaf',     color: 'green'  },
  { id: 'mindfulness', label: 'Mindfulness',          icon: 'Focus',    color: 'purple' },
  { id: 'activacion',  label: 'Activación conductual',icon: 'Dumbbell', color: 'amber'  },
  { id: 'emocional',   label: 'Regulación emocional', icon: 'Smile',    color: 'rose'   },
  { id: 'relajacion',  label: 'Relajación',           icon: 'Wind',     color: 'sky'    },
  { id: 'escritura',   label: 'Escritura reflexiva',  icon: 'BookOpen', color: 'orange' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

// ── Biblioteca ────────────────────────────────────────────────────────────────
export const LIBRARY = [

  // ──────────────────────────────────────────────────────────────────────────
  // TCC — Terapia Cognitivo-Conductual
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'tcc-01',
    category: 'tcc',
    title: 'Registro de pensamientos ABC',
    summary: 'Identifica situaciones activadoras, creencias automáticas y consecuencias emocionales.',
    goal: 'Aumentar la conciencia de la relación entre pensamientos, emociones y comportamiento.',
    duration: '15 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['pensamientos automáticos', 'reestructuración', 'registro', 'ABC', 'Ellis'],
    instructions: `Durante el día, cuando notes un cambio emocional significativo, completa este registro:

A — Situación activadora:
¿Qué pasó exactamente? Describe la situación objetivamente (dónde estabas, qué ocurrió, quién estaba presente).

B — Pensamiento automático:
¿Qué te pasó por la mente en ese momento? ¿Qué te decías a ti mismo/a?
Evalúa cuánto crees ese pensamiento (0–100 %).

C — Consecuencias (emociones y conducta):
¿Qué emoción sentiste? ¿Qué tan intensa fue (0–100)?
¿Qué hiciste o quisiste hacer?

D — Disputa (pensamiento alternativo):
¿Qué evidencia tienes a favor y en contra de ese pensamiento?
¿Cómo lo vería alguien que te quiere?
¿Existe otra explicación posible?

E — Nuevo resultado:
Escribe un pensamiento alternativo más equilibrado.
Evalúa de nuevo la emoción (0–100).

Lleva el registro en papel o en el apartado de notas de la app.`,
  },
  {
    id: 'tcc-02',
    category: 'tcc',
    title: 'Cuestionamiento socrático',
    summary: 'Desafía pensamientos distorsionados con preguntas guiadas basadas en evidencia real.',
    goal: 'Reducir la credibilidad de pensamientos catastróficos o absolutistas.',
    duration: '10 min',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['distorsiones cognitivas', 'pensamiento alternativo', 'sócrates', 'preguntas'],
    instructions: `Cuando identifiques un pensamiento negativo recurrente, hazte estas preguntas por escrito:

1. ¿Cuál es la evidencia a favor de este pensamiento?
2. ¿Cuál es la evidencia en contra?
3. ¿Estoy confundiendo un pensamiento con un hecho?
4. ¿Estoy interpretando las intenciones de otros sin suficiente información?
5. ¿Estoy sobreestimando la probabilidad de que ocurra algo malo?
6. Si le ocurriera a un amigo, ¿qué le diría?
7. ¿Qué es lo peor que podría pasar? ¿Podría sobrevivirlo?
8. ¿Qué es lo más probable que realmente ocurra?
9. ¿Cuál sería un pensamiento más útil y realista?

Escribe el pensamiento alternativo y valora cómo te sientes después (0–10).`,
  },
  {
    id: 'tcc-03',
    category: 'tcc',
    title: 'Experimento conductual',
    summary: 'Pon a prueba una creencia negativa diseñando una pequeña experiencia en el mundo real.',
    goal: 'Generar evidencia directa que contradiga predicciones catastróficas o negativas.',
    duration: '20 min + acción',
    frequency: 'Semanal',
    difficulty: 'intermedio',
    tags: ['exposición', 'creencias', 'hipótesis', 'comprobación'],
    instructions: `Un experimento conductual tiene cuatro pasos:

1. Define la creencia a poner a prueba:
   Ejemplo: "Si hablo en una reunión, todos pensarán que soy incompetente."

2. Haz una predicción concreta y medible:
   "Al menos 3 personas me mirarán con desaprobación cuando hable."

3. Diseña y realiza el experimento:
   Decide qué harás, cuándo, dónde y cómo lo observarás.
   Realiza la acción acordada.

4. Registra los resultados:
   ¿Qué ocurrió realmente?
   ¿Tu predicción se cumplió? ¿En qué porcentaje?
   ¿Qué aprendiste sobre tu creencia?

Empieza con situaciones de baja dificultad y avanza gradualmente hacia las más retadoras.`,
  },
  {
    id: 'tcc-04',
    category: 'tcc',
    title: 'Jerarquía de exposición gradual',
    summary: 'Construye una lista ordenada de situaciones temidas y enfréntelas de menor a mayor dificultad.',
    goal: 'Reducir la evitación y desensibilizar el miedo mediante la exposición progresiva.',
    duration: '30 min (preparación) + práctica diaria',
    frequency: 'Diario',
    difficulty: 'avanzado',
    tags: ['ansiedad', 'fobia', 'evitación', 'miedo', 'SUDS', 'exposición'],
    instructions: `Paso 1 — Identifica la situación/objeto temido y crea tu lista:
Escribe de 8 a 12 situaciones relacionadas con tu miedo, ordenadas de menor a mayor ansiedad.
Asigna a cada una una puntuación SUDS (0 = sin ansiedad, 100 = pánico máximo).

Paso 2 — Empieza por el nivel más bajo (SUDS ≤ 30):
Mantente en la situación hasta que tu ansiedad baje al menos un 50 % de forma natural (sin escapar).
No uses estrategias de seguridad (rituales, distracción, etc.).

Paso 3 — Repite hasta que ese nivel ya no genere ansiedad significativa.
Luego pasa al siguiente ítem de la jerarquía.

Paso 4 — Registro diario:
Anota la situación practicada, el SUDS al inicio y al final, y la duración de la sesión.

Importante: la ansiedad siempre baja si te quedas el tiempo suficiente. No hay peligro real.`,
  },
  {
    id: 'tcc-05',
    category: 'tcc',
    title: 'Tarjetas de afrontamiento',
    summary: 'Crea tarjetas físicas o digitales con respuestas racionales a tus pensamientos más frecuentes.',
    goal: 'Tener respuestas preparadas para los momentos de mayor malestar.',
    duration: '15 min (preparación)',
    frequency: 'Según necesidad',
    difficulty: 'básico',
    tags: ['recursos', 'preparación', 'crisis', 'pensamientos', 'afrontamiento'],
    instructions: `Paso 1 — Identifica tus 3–5 pensamientos automáticos más frecuentes y perturbadores.

Paso 2 — Por cada pensamiento, escribe en una tarjeta o nota:
• El pensamiento negativo (anverso).
• Una respuesta racional y compasiva que tú mismo/a hayas construido (reverso).
  Ejemplo: "No puedo con esto" → "He superado situaciones difíciles antes. Puedo hacer una cosa pequeña ahora mismo."

Paso 3 — Guarda las tarjetas en el celular, bolso o lugar visible.

Paso 4 — Cuando aparezca el pensamiento difícil, saca la tarjeta, léela en voz alta si puedes y actúa según la respuesta racional.

Revisa y actualiza las tarjetas con tu terapeuta regularmente.`,
  },
  {
    id: 'tcc-06',
    category: 'tcc',
    title: 'Resolución de problemas en 5 pasos',
    summary: 'Método estructurado para abordar problemas concretos de forma sistemática.',
    goal: 'Aumentar la sensación de control y la eficacia en la resolución de dificultades cotidianas.',
    duration: '20 min',
    frequency: 'Según necesidad',
    difficulty: 'básico',
    tags: ['problemas', 'soluciones', 'toma de decisiones', 'planificación'],
    instructions: `Usa este método cuando enfrentes un problema concreto:

1. Define el problema con precisión:
   ¿Qué está pasando exactamente? Escríbelo en una sola frase clara.

2. Genera alternativas sin juzgar:
   Haz una lluvia de ideas — escribe todas las soluciones posibles, incluso las que parecen tontas.

3. Evalúa cada alternativa:
   Para cada opción, anota ventajas y desventajas en términos de consecuencias a corto y largo plazo.

4. Elige y planifica:
   Selecciona la mejor opción. Define qué harás, cuándo, cómo y qué necesitas.

5. Evalúa los resultados:
   Después de actuar, reflexiona: ¿funcionó? ¿Qué cambiarías? ¿Qué aprendiste?`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DBT — Terapia Dialéctico-Conductual
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'dbt-01',
    category: 'dbt',
    title: 'Habilidad TIPP — Regulación de crisis',
    summary: 'Usa temperatura, ejercicio intenso, respiración pausada y relajación para bajar la activación fisiológica.',
    goal: 'Reducir rápidamente la intensidad emocional extrema en momentos de crisis.',
    duration: '5–15 min',
    frequency: 'Según necesidad',
    difficulty: 'básico',
    tags: ['crisis', 'emergencia', 'fisiología', 'Linehan', 'DBT', 'activación'],
    instructions: `Usa TIPP cuando la emoción sea tan intensa que no puedas pensar con claridad:

T — Temperatura:
Sumerge la cara en agua helada durante 30 segundos (o sostén hielo en las manos).
Esto activa el reflejo de buceo y baja rápidamente la frecuencia cardíaca.

I — Ejercicio Intenso:
Corre, salta, haz sentadillas durante 5–10 minutos a máxima intensidad.
El cuerpo metaboliza la adrenalina y el cortisol.

P — Respiración Pausada (Paced Breathing):
Inhala 4 segundos → exhala lentamente 6–8 segundos.
Repite 5–10 veces. La exhalación larga activa el sistema parasimpático.

P — Relajación Muscular Progresiva:
Tensa cada grupo muscular 5 segundos y suéltalo.
Empieza por los pies y sube hasta el rostro.

Elige una o combínalas según la situación.`,
  },
  {
    id: 'dbt-02',
    category: 'dbt',
    title: 'PLEASE — Cuidado básico del cuerpo',
    summary: 'Checklist de hábitos físicos que reducen la vulnerabilidad emocional a lo largo del tiempo.',
    goal: 'Reducir la sensibilidad emocional mediante el cuidado consistente del cuerpo.',
    duration: '5 min (revisión diaria)',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['hábitos', 'vulnerabilidad', 'sueño', 'alimentación', 'ejercicio', 'DBT'],
    instructions: `PLEASE es un acrónimo de hábitos a revisar cada día:

PL — enfermedades (PLease treat PhysicaL iLLness):
¿Has tomado tus medicamentos? ¿Atendiste algún síntoma físico pendiente?

E — Equilibrio alimentario:
¿Has comido de forma regular y nutritiva? Evita el hambre extrema o el exceso.

A — Alcohol y sustancias:
Evita el consumo de alcohol u otras sustancias que alteren las emociones.

S — Sueño equilibrado:
¿Has dormido entre 7 y 9 horas? Mantén un horario regular de sueño.

E — Ejercicio:
¿Has hecho al menos 20–30 minutos de movimiento físico hoy?

Puntúa cada ítem de 0 a 2 (0 = no lo hice, 1 = parcialmente, 2 = sí).
Suma tu "puntaje de cuidado" diario. Cuanto más alto, menor tu vulnerabilidad emocional.`,
  },
  {
    id: 'dbt-03',
    category: 'dbt',
    title: 'DEAR MAN — Comunicación asertiva',
    summary: 'Guion estructurado para hacer peticiones o decir "no" de forma eficaz y respetuosa.',
    goal: 'Aumentar la efectividad interpersonal sin sacrificar la relación ni la autoestima.',
    duration: '15 min (preparación)',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['asertividad', 'comunicación', 'límites', 'peticiones', 'DBT', 'relaciones'],
    instructions: `Antes de una conversación difícil, prepara tu guion con DEAR MAN:

D — Describe la situación objetivamente:
"Cuando llegas tarde sin avisar…"

E — Expresa cómo te sientes (sin acusar):
"Me siento preocupado/a y frustrado/a…"

A — Afirma lo que necesitas / pides:
"Necesito que me avises si te vas a retrasar más de 15 minutos."

R — Refuerzo (explica el beneficio mutuo):
"Así podré planificar mejor y estaré más tranquilo/a cuando llegues."

M — Mantente firme (Mindful):
No te desvíes del tema. Si atacan, regresa al punto central.

A — Aparenta confianza:
Mantén contacto visual, tono calmado y postura erguida.

N — Negocia si es necesario:
"¿Qué podríamos hacer para que ambos estemos cómodos?"

Practica tu guion en voz alta antes de la conversación.`,
  },
  {
    id: 'dbt-04',
    category: 'dbt',
    title: 'Cadena de análisis conductual',
    summary: 'Analiza paso a paso cómo llegaste a un comportamiento problemático para encontrar los puntos de intervención.',
    goal: 'Comprender el patrón que conduce a conductas no deseadas y encontrar alternativas.',
    duration: '20 min',
    frequency: 'Después de conducta problemática',
    difficulty: 'avanzado',
    tags: ['análisis', 'conducta', 'patrones', 'prevención', 'DBT'],
    instructions: `Completa este análisis después de una conducta que quieras cambiar:

1. Conducta problema: ¿Qué hiciste exactamente? (sé específico/a, sin juicios)

2. Factor de vulnerabilidad: ¿Cómo estabas antes? (dormido/a, estresado/a, con hambre, solo/a…)

3. Evento desencadenante: ¿Qué ocurrió justo antes de que empezaras a sentirte mal?

4. Cadena de eventos: Describe cronológicamente cada pensamiento, emoción y acción que te llevó a la conducta problemática. Sé minucioso/a: ¿qué pasó entre el desencadenante y la conducta?

5. Consecuencias: ¿Qué ocurrió después? ¿Qué ganaste y qué perdiste?

6. Puntos de intervención: En cada eslabón de la cadena, ¿qué podrías haber hecho diferente? ¿Qué habilidad de DBT podrías haber usado?

7. Plan de prevención: ¿Qué harás diferente la próxima vez?`,
  },
  {
    id: 'dbt-05',
    category: 'dbt',
    title: 'Tolerancia al malestar — Distracción ACCEPTS',
    summary: 'Siete categorías de distracción saludable para tolerar momentos de alta angustia sin empeorar la situación.',
    goal: 'Sobrevivir situaciones de crisis sin actuar impulsivamente.',
    duration: '10–30 min',
    frequency: 'Según necesidad',
    difficulty: 'básico',
    tags: ['crisis', 'tolerancia', 'distracción', 'impulso', 'DBT'],
    instructions: `Cuando la angustia sea muy alta, elige una o varias estrategias de ACCEPTS:

A — Actividades:
Haz algo que requiera concentración: ejercicio, cocinar, limpiar, pintar.

C — Contribución (Contributing):
Haz algo por otra persona: envía un mensaje de apoyo, ayuda en casa.

C — Comparaciones:
Piensa en momentos en que has superado algo igual de difícil. Reconoce tu fortaleza.

E — Emociones contrarias (Emotions):
Ve una película de comedia, escucha música alegre, lee algo interesante.

P — Pensar en otras cosas (Pushing away):
Imagina mentalmente poner el problema en una caja y cerrarlo temporalmente.

T — Pensamientos alternativos (Thoughts):
Cuenta, recita letras de canciones, resuelve un crucigrama.

S — Sensaciones físicas (Sensations):
Sostén hielo, date una ducha fría/caliente, come algo con sabor intenso.

Elige la estrategia que más se ajuste a la situación y a ti.`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ACT — Aceptación y Compromiso
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'act-01',
    category: 'act',
    title: 'Hojas en el río — Defusión cognitiva',
    summary: 'Observa tus pensamientos como hojas que flotan en un río sin que te arrastren.',
    goal: 'Reducir la fusión con pensamientos difíciles creando distancia psicológica.',
    duration: '10 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['defusión', 'pensamientos', 'metáfora', 'ACT', 'mindfulness'],
    instructions: `Siéntate cómodamente y cierra los ojos. Sigue estos pasos:

1. Imagina un río tranquilo que fluye frente a ti. El agua es clara y suave.

2. En la superficie del río flotan hojas de otoño.

3. Cuando aparezca un pensamiento, una imagen o un recuerdo, colócalo sobre una de las hojas.
   No importa si es agradable, desagradable o neutro.

4. Observa cómo la hoja se aleja río abajo con ese pensamiento. No tienes que aferrarte a ella ni rechazarla.

5. Si te "engancha" un pensamiento (te encuentras pensando en él en lugar de observarlo), obsérvalo con curiosidad: "Interesante, me ha enganchado este pensamiento." Y vuelve al río.

6. Continúa durante 10 minutos.

Después, anota: ¿Qué pensamientos aparecieron con más frecuencia? ¿Cuándo te "enganchaste"?`,
  },
  {
    id: 'act-02',
    category: 'act',
    title: 'Clarificación de valores personales',
    summary: 'Identifica qué es verdaderamente importante para ti como guía para tus acciones.',
    goal: 'Conectar con los valores profundos que orientan una vida con sentido.',
    duration: '20 min',
    frequency: 'Mensual',
    difficulty: 'básico',
    tags: ['valores', 'sentido', 'propósito', 'ACT', 'brújula'],
    instructions: `Paso 1 — Reflexión libre (10 min):
Responde por escrito estas preguntas sin filtro:
• ¿Qué tipo de persona quieres ser en tu vida diaria?
• ¿Cómo quieres relacionarte con las personas que más te importan?
• ¿Qué contribución quieres hacer al mundo o a tu comunidad?
• Si pudieras vivir sin miedo al juicio ajeno, ¿qué harías diferente?

Paso 2 — Elige tus áreas:
De las siguientes áreas, puntúa la importancia (1–10) y tu satisfacción actual (1–10):
Familia · Pareja · Amigos · Trabajo · Salud · Crecimiento personal · Ocio · Comunidad · Espiritualidad

Paso 3 — Define tu valor en cada área:
Para las 3 áreas con mayor brecha (importancia alta, satisfacción baja), escribe:
"En el área de ___, quiero ser alguien que ___."

Paso 4 — Acción comprometida:
¿Qué pequeña acción puedes hacer esta semana que sea coherente con ese valor?`,
  },
  {
    id: 'act-03',
    category: 'act',
    title: 'Ejercicio del pasajero del autobús',
    summary: 'Metáfora para relacionarte de forma flexible con pensamientos y emociones difíciles.',
    goal: 'Aprender a avanzar hacia los valores aunque los pensamientos "pasajeros" provoquen incomodidad.',
    duration: '10 min',
    frequency: 'Semanal',
    difficulty: 'intermedio',
    tags: ['metáfora', 'aceptación', 'valores', 'pensamientos', 'ACT'],
    instructions: `Lee esta metáfora y reflexiona sobre ella por escrito:

Imagina que eres el conductor de un autobús.
Los pasajeros son tus pensamientos, emociones, recuerdos y sensaciones — algunos agradables, otros muy incómodos o amenazantes.

A veces los pasajeros gritan: "¡Gira aquí!", "¡Detente!", "¡Eres un fracasado!"
La tentación es obedecer o parar el autobús para negociar con ellos.

Pero tú eres el conductor. Solo tú decides la dirección del autobús: hacia tus valores.

Reflexión escrita:
1. ¿Quiénes son tus "pasajeros" más ruidosos en este momento? (pensamientos, miedos, críticas internas)
2. ¿A qué destino (valor) te están impidiendo llegar?
3. ¿Qué significaría seguir conduciendo aunque los pasajeros griten?
4. ¿Qué acción concreta puedes hacer esta semana en la dirección de ese valor?`,
  },
  {
    id: 'act-04',
    category: 'act',
    title: 'Yo como contexto — El observador',
    summary: 'Conéctate con la parte de ti que observa pensamientos y emociones sin ser definida por ellos.',
    goal: 'Reducir la identificación rígida con el contenido mental y ampliar la perspectiva.',
    duration: '10 min',
    frequency: 'Semanal',
    difficulty: 'intermedio',
    tags: ['self', 'observador', 'identidad', 'distancia', 'ACT'],
    instructions: `Siéntate cómodamente y cierra los ojos. Sigue la guía:

1. Noto que tengo el pensamiento de que [escribe tu pensamiento].
   — No eres ese pensamiento. Eres quien lo observa.

2. Noto que siento [emoción] en este momento.
   — No eres esa emoción. Eres quien la nota.

3. Noto que mi cuerpo siente [sensación].
   — No eres esa sensación. Eres quien la percibe.

4. Piensa en un recuerdo de hace 10 años. ¿Notas que hay algo en ti que estuvo ahí entonces y sigue aquí ahora, observando? Eso eres tú — el observador constante.

5. Desde ese lugar de observación: ¿Qué ves en tu vida con más claridad ahora?

Escribe al menos 3 frases comenzando con "Noto que…" sobre tu semana.`,
  },
  {
    id: 'act-05',
    category: 'act',
    title: 'Acción comprometida — Pequeños pasos',
    summary: 'Define una acción concreta y manejable alineada con un valor personal para esta semana.',
    goal: 'Construir momentum hacia una vida con sentido a través de pasos pequeños y consistentes.',
    duration: '10 min',
    frequency: 'Semanal',
    difficulty: 'básico',
    tags: ['valores', 'acción', 'metas', 'comprometida', 'ACT', 'semana'],
    instructions: `Responde estas preguntas por escrito:

1. ¿Cuál es el valor que quiero honrar esta semana?
   Ejemplo: "Ser un padre/madre presente" o "Cuidar mi salud".

2. ¿Qué obstáculo (pensamiento, emoción, situación) podría interponerse?
   No es un problema — solo es útil anticiparlo.

3. ¿Qué acción concreta haré esta semana?
   Debe ser:
   - Específica (qué, cuándo, cómo)
   - Pequeña y realista (no perfecta, solo posible)
   - Tuya (no depende de que otros cambien)

   Ejemplo: "El martes a las 7 pm leeré un cuento a mi hijo sin el celular cerca."

4. En una escala del 1 al 10, ¿cuán comprometido/a estás con esta acción?
   Si es menos de 7, reduce la acción hasta que sea un 8 o más.

Comparte el resultado en tu próxima sesión.`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Mindfulness
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'mind-01',
    category: 'mindfulness',
    title: 'Meditación de respiración consciente',
    summary: 'Practica traer la atención al momento presente usando la respiración como ancla.',
    goal: 'Desarrollar la capacidad de observar el momento presente sin reactividad.',
    duration: '10 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['meditación', 'respiración', 'atención', 'presente', 'ancla'],
    instructions: `Busca un lugar tranquilo. Siéntate con la espalda erguida pero sin rigidez.

1. Cierra los ojos o baja suavemente la mirada.

2. Lleva la atención a tu respiración. No la cambies — solo obsérvala.
   Nota el aire al entrar por la nariz, el movimiento del pecho o el abdomen, y la salida del aire.

3. Cada vez que la mente se vaya (a pensamientos, planes, recuerdos), simplemente nota que se fue sin juzgarte, y regresa suavemente a la respiración.
   Esto no es un error — es el ejercicio. Regresar es la habilidad.

4. Continúa durante 10 minutos.

5. Al terminar, abre los ojos despacio y observa cómo te sientes.

Anota: ¿Cuántas veces te fuiste? ¿Fue fácil o difícil regresar? ¿Cómo te sientes ahora comparado con antes?`,
  },
  {
    id: 'mind-02',
    category: 'mindfulness',
    title: 'Escaneo corporal (body scan)',
    summary: 'Recorre mentalmente cada parte del cuerpo para aumentar la conciencia corporal y liberar tensión.',
    goal: 'Conectar con las sensaciones físicas y reducir la tensión acumulada.',
    duration: '15–20 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['cuerpo', 'tensión', 'sensaciones', 'relajación', 'mindfulness'],
    instructions: `Acuéstate o siéntate cómodamente. Cierra los ojos.

1. Comienza llevando la atención a los dedos del pie derecho.
   ¿Notas alguna sensación? Frío, calor, presión, cosquilleo. No intentes cambiar nada.

2. Sube lentamente la atención: pie, tobillo, pantorrilla, rodilla, muslo derecho.
   Luego repite con la pierna izquierda.

3. Continúa hacia el abdomen, notando el movimiento con cada respiración.

4. Sigue hacia el pecho, hombros, brazos, manos, dedos.

5. Luego el cuello, mandíbula, mejillas, ojos, frente y cuero cabelludo.

6. Si encuentras tensión en algún lugar, simplemente obsérvala y al exhalar imagina que esa zona se ablanda un poco.

7. Termina notando el cuerpo completo como una unidad.

Al finalizar, escribe dos sensaciones que notaste y cómo te sientes.`,
  },
  {
    id: 'mind-03',
    category: 'mindfulness',
    title: 'Técnica STOP',
    summary: 'Mini-pausa de conciencia plena para reconectar con el momento presente en cualquier situación.',
    goal: 'Interrumpir el piloto automático y responder en lugar de reaccionar.',
    duration: '2 min',
    frequency: 'Diario (3–5 veces)',
    difficulty: 'básico',
    tags: ['pausa', 'presente', 'reactividad', 'consciencia', 'STOP'],
    instructions: `Puedes hacer esto en cualquier momento y lugar — nadie notará que lo estás haciendo:

S — Stop (Para):
Interrumpe lo que estás haciendo por un momento.

T — Take a breath (Respira):
Haz una respiración lenta y profunda. Inhala 4 segundos, exhala 6 segundos.

O — Observe (Observa):
¿Qué está pasando en este momento?
• En tu cuerpo: ¿hay tensión, cansancio, malestar?
• En tus emociones: ¿cómo te sientes ahora?
• En tus pensamientos: ¿qué está ocupando tu mente?

P — Proceed (Continúa):
Retoma lo que estabas haciendo, pero ahora desde un lugar más consciente.

Meta: practica STOP al menos 3 veces hoy — antes de comer, en un momento de tensión y antes de dormir.`,
  },
  {
    id: 'mind-04',
    category: 'mindfulness',
    title: 'Mindfulness en actividades cotidianas',
    summary: 'Elige una actividad diaria y practícala con plena atención como si fuera la primera vez.',
    goal: 'Integrar la atención plena en la rutina diaria sin necesidad de tiempo extra.',
    duration: '10–20 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['rutina', 'presente', 'cotidiano', 'integración', 'mindfulness'],
    instructions: `Elige UNA de estas actividades para practicar con atención plena hoy:
• Desayuno / comida / cena
• Ducha o lavarse los dientes
• Caminar (aunque sea de la cama a la cocina)
• Lavar los platos
• Preparar un café o té

Durante esa actividad:
1. Apaga el celular o ponlo lejos.
2. Lleva toda tu atención a los sentidos: ¿qué ves, escuchas, hueles, sientes en la piel, en la boca?
3. Cada vez que tu mente se vaya a otra cosa, sonríe internamente y vuelve a la actividad.
4. No hay prisa. Eres como un explorador descubriendo algo ordinario por primera vez.

Anota al final: ¿Qué notaste que normalmente no notas? ¿Cómo te sentiste?`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Activación Conductual
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'act-cond-01',
    category: 'activacion',
    title: 'Planificación semanal de actividades',
    summary: 'Programa actividades placenteras y de logro para cada día de la semana.',
    goal: 'Romper el ciclo de inactividad-depresión aumentando el refuerzo positivo.',
    duration: '20 min (planificación)',
    frequency: 'Semanal',
    difficulty: 'básico',
    tags: ['depresión', 'rutina', 'refuerzo', 'agenda', 'activación'],
    instructions: `La depresión reduce la actividad, y la inactividad aumenta la depresión. Rompemos ese ciclo actuando primero.

Paso 1 — Lista de actividades:
Haz dos listas:
• Actividades de placer (lo que antes disfrutabas): caminar, música, cocinar, ver amigos…
• Actividades de logro (tareas pequeñas que te darán sensación de logro): ordenar un cajón, hacer una llamada, preparar una comida.

Paso 2 — Planifica la semana:
Asigna al menos 1 actividad de placer y 1 de logro por día. Empieza por las más fáciles.

Paso 3 — Registro:
Después de cada actividad, anota:
• ¿La hiciste? (Sí / No)
• Placer percibido (0–10)
• Logro percibido (0–10)
• Estado de ánimo antes y después (0–10)

Paso 4 — Reflexión:
¿Qué actividades mejoraron más tu estado de ánimo? Programa más de esas.`,
  },
  {
    id: 'act-cond-02',
    category: 'activacion',
    title: 'Registro de actividades y estado de ánimo',
    summary: 'Monitorea durante una semana qué haces y cómo te sientes para identificar patrones.',
    goal: 'Detectar qué actividades están asociadas a mejor estado de ánimo y cuáles lo empeoran.',
    duration: '5 min al día',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['monitoreo', 'actividad', 'estado de ánimo', 'patrones', 'depresión'],
    instructions: `Cada hora (o al menos 4 veces al día) anota en una tabla:

| Hora | ¿Qué hacías? | Estado de ánimo (0–10) |

Instrucciones:
• 0 = estado de ánimo más bajo posible, 10 = el mejor posible.
• Sé específico/a con la actividad: "viendo redes sociales" es diferente a "hablando con un amigo".
• No juzgues — solo registra.

Al final de la semana, revisa:
• ¿Qué actividades coinciden con los momentos de mejor estado de ánimo?
• ¿Qué actividades coinciden con los peores momentos?
• ¿Hay patrones horarios?

Trae la tabla a la próxima sesión para analizarla juntos.`,
  },
  {
    id: 'act-cond-03',
    category: 'activacion',
    title: 'Lista de actividades placenteras',
    summary: 'Construye un banco personal de actividades que generan bienestar para tener siempre a mano.',
    goal: 'Tener un repertorio amplio de actividades positivas para la planificación conductual.',
    duration: '15 min',
    frequency: 'Única vez (actualizar mensualmente)',
    difficulty: 'básico',
    tags: ['placer', 'refuerzo', 'bienestar', 'banco', 'recursos'],
    instructions: `Crea tu banco personal de actividades placenteras en tres categorías:

SENCILLAS — Actividades cortas (5–15 min, sin preparación):
Escribe al menos 10: escuchar una canción favorita, salir a la calle, preparar un té, llamar a alguien, leer unas páginas, estirar el cuerpo, mirar fotos bonitas…

MEDIANAS — Actividades (30 min – 2h, algo de planificación):
Escribe al menos 8: ir al cine, cocinar algo especial, pasear en un parque, ver una serie, practicar un hobby, visitar a alguien…

ESPECIALES — Actividades (más de 2h, planificación mayor):
Escribe al menos 5: un viaje de fin de semana, un concierto, una clase nueva, un día en la naturaleza…

Guarda esta lista en un lugar visible.
Cuando estés con bajo estado de ánimo, elige siempre de la categoría verde primero.`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Regulación Emocional
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'emoc-01',
    category: 'emocional',
    title: 'Diario emocional',
    summary: 'Registra tus emociones diarias con contexto para aumentar la inteligencia emocional.',
    goal: 'Ampliar el vocabulario emocional y la conciencia de los propios estados internos.',
    duration: '10 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['emociones', 'registro', 'autoconciencia', 'vocabulario', 'diario'],
    instructions: `Cada noche, antes de dormir, responde estas preguntas por escrito:

1. ¿Cuál fue la emoción más intensa que sentí hoy?
   Nómbrala con precisión (no solo "bien" o "mal"). Usa: ansiedad, orgullo, vergüenza, gratitud, tristeza, enojo, ternura, frustración, alivio, soledad…

2. ¿Qué la desencadenó? (situación, persona, pensamiento)

3. ¿Dónde la sentí en el cuerpo? (pecho oprimido, nudo en la garganta, tensión en los hombros…)

4. ¿Cómo reaccioné? (¿fue útil esa reacción?)

5. ¿Qué necesitaba yo en ese momento?

6. ¿Qué emoción quisiera sentir más seguido? ¿Qué podría favorecerla?

Revisa las entradas semanalmente: ¿hay patrones? ¿Qué desencadenantes se repiten?`,
  },
  {
    id: 'emoc-02',
    category: 'emocional',
    title: 'Técnica de los opuestos (Opposite Action)',
    summary: 'Actúa de forma opuesta a lo que la emoción te impulsa a hacer cuando esa acción no es útil.',
    goal: 'Cambiar la intensidad emocional a través de la acción contraria a la urgencia del impulso.',
    duration: '10–20 min',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['emoción', 'impulso', 'acción opuesta', 'DBT', 'regulación'],
    instructions: `Usa esta técnica cuando la emoción sea intensa pero actuar según ella sea perjudicial:

Paso 1 — Identifica la emoción y su acción impulsiva:
• Miedo → evitar / huir
• Tristeza → aislarse, no hacer nada
• Enojo → atacar, distanciarse
• Vergüenza → esconderse
• Ansiedad → buscar reaseguramiento

Paso 2 — Evalúa: ¿Es útil actuar según ese impulso en esta situación?
Si la respuesta es NO, aplica la acción opuesta.

Paso 3 — Elige y haz la acción opuesta completamente:
• Miedo → acércate suavemente a lo temido
• Tristeza → haz una actividad activa, contacta con alguien
• Enojo → haz algo amable por la persona; aléjate y cuida el cuerpo
• Vergüenza → comparte lo que te avergüenza con alguien de confianza

Paso 4 — Evalúa: ¿Cómo cambió la intensidad emocional (0–10)?`,
  },
  {
    id: 'emoc-03',
    category: 'emocional',
    title: 'Registro de intensidad emocional',
    summary: 'Monitorea la intensidad de emociones difíciles a lo largo del día para identificar picos y factores.',
    goal: 'Aumentar la conciencia emocional y detectar desencadenantes.',
    duration: '2 min (varias veces al día)',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['intensidad', 'emociones', 'monitoreo', 'regulación', 'picos'],
    instructions: `3 veces al día (mañana, tarde, noche) completa esta evaluación rápida:

Hora: ___
Emoción principal: ___
Intensidad (0–10): ___
¿Qué la provocó? (una frase): ___
¿Qué hice? (una frase): ___

Al final del día:
• ¿En qué momento del día la intensidad fue mayor?
• ¿Qué situaciones o pensamientos la dispararon?
• ¿Qué estrategias usaste? ¿Cuáles funcionaron mejor?

Al final de la semana, trae el registro a la sesión para analizarlo juntos y diseñar estrategias específicas para los picos más frecuentes.`,
  },
  {
    id: 'emoc-04',
    category: 'emocional',
    title: 'Autocompasión en momentos difíciles',
    summary: 'Aplícate la misma amabilidad y comprensión que le darías a un buen amigo que está sufriendo.',
    goal: 'Reducir la autocrítica y cultivar una relación más compasiva con uno mismo.',
    duration: '10 min',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['autocompasión', 'Neff', 'crítica interna', 'amabilidad', 'humanidad común'],
    instructions: `Cuando estés pasando un momento difícil, practica estos tres pasos (Kristin Neff):

1. Mindfulness — reconoce el sufrimiento sin exagerarlo ni minimizarlo:
   Escribe o piensa: "Esto es un momento de sufrimiento. Estoy luchando ahora mismo."

2. Humanidad común — recuerda que no estás solo/a:
   "El sufrimiento y las dificultades son parte de la vida humana. Otras personas sienten esto también."

3. Amabilidad hacia uno mismo — trátate como tratarías a un buen amigo:
   Pon una mano en el corazón y pregúntate:
   "¿Qué necesito escuchar ahora mismo?"
   "¿Qué le diría a un amigo que estuviera pasando por esto?"
   Escríbete ese mensaje.

Al finalizar, lee lo que escribiste en voz alta. Nota cómo te sientes.`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Relajación y Respiración
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'relax-01',
    category: 'relajacion',
    title: 'Respiración diafragmática 4-7-8',
    summary: 'Técnica de respiración que activa el sistema nervioso parasimpático para reducir ansiedad.',
    goal: 'Calmar el sistema nervioso de forma rápida en situaciones de estrés o ansiedad.',
    duration: '5 min',
    frequency: 'Diario (2–3 veces)',
    frequency_alt: 'Según necesidad',
    difficulty: 'básico',
    tags: ['respiración', 'ansiedad', 'relajación', 'nervioso', 'parasimpático'],
    instructions: `Puedes hacerlo sentado, de pie o acostado:

1. Exhala completamente por la boca haciendo un sonido suave.

2. Cierra la boca e inhala silenciosamente por la nariz contando mentalmente hasta 4.

3. Retén el aire contando hasta 7.

4. Exhala completamente por la boca (puedes hacer un pequeño sonido) contando hasta 8.

Esto es un ciclo. Repite 4 ciclos al principio (puedes aumentar a 8 con la práctica).

Importante:
• La exhalación siempre es el doble (o más) que la inhalación.
• Si te mareas, vuelve a respirar normalmente. Es normal al principio.
• Practica en momentos de calma antes de usarla en momentos de crisis.

Usa esta técnica antes de dormir, al despertar, o cuando sientas ansiedad.`,
  },
  {
    id: 'relax-02',
    category: 'relajacion',
    title: 'Respiración cuadrada (box breathing)',
    summary: 'Técnica usada por equipos de fuerzas especiales para regular el estrés en situaciones de alta presión.',
    goal: 'Estabilizar el sistema nervioso y mejorar la concentración bajo presión.',
    duration: '5 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['respiración', 'cuadrada', 'concentración', 'estrés', 'Navy SEAL'],
    instructions: `La respiración cuadrada tiene 4 fases iguales de 4 segundos cada una:

Lado 1 — Inhala:
Respira lentamente por la nariz durante 4 segundos.

Lado 2 — Retén:
Mantén el aire 4 segundos sin tensión.

Lado 3 — Exhala:
Suelta el aire lentamente por la boca durante 4 segundos.

Lado 4 — Pausa:
Mantén los pulmones vacíos durante 4 segundos.

Repite el cuadrado 4–6 veces.

Visualización opcional: imagina que estás dibujando un cuadrado con la mente, un lado por fase.

Con la práctica, puedes aumentar a 5 o 6 segundos por fase.
Ideal antes de situaciones estresantes: exámenes, reuniones importantes, conversaciones difíciles.`,
  },
  {
    id: 'relax-03',
    category: 'relajacion',
    title: 'Relajación muscular progresiva (Jacobson)',
    summary: 'Tensa y suelta grupos musculares de forma sistemática para liberar tensión física.',
    goal: 'Reducir la tensión muscular y el estado de alerta fisiológico asociados a la ansiedad.',
    duration: '20 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['músculos', 'tensión', 'Jacobson', 'relajación', 'cuerpo'],
    instructions: `Acuéstate o siéntate cómodamente. Sigue este orden de grupos musculares:

Para cada grupo:
• Tensa el músculo con fuerza (sin dolor) durante 5 segundos.
• Suelta de repente y nota la diferencia durante 15–20 segundos.
• Respira profundo antes de pasar al siguiente.

Grupos musculares (de abajo hacia arriba):
1. Pies: dobla los dedos hacia dentro
2. Pantorrillas: apunta los pies hacia arriba
3. Muslos: aprieta los músculos del muslo
4. Abdomen: tensa el estómago
5. Manos: cierra el puño
6. Antebrazos: dobla la muñeca
7. Bíceps: dobla el brazo
8. Hombros: súbelos hacia las orejas
9. Cuello: presiona la cabeza hacia atrás suavemente
10. Cara: frunce toda la cara

Al terminar, permanece en reposo 2–3 minutos y observa cómo se siente el cuerpo.`,
  },
  {
    id: 'relax-04',
    category: 'relajacion',
    title: 'Grounding 5-4-3-2-1',
    summary: 'Técnica de anclaje sensorial para salir de la disociación o los ataques de pánico.',
    goal: 'Reconectar con el momento presente usando los 5 sentidos en momentos de disociación o crisis.',
    duration: '5 min',
    frequency: 'Según necesidad',
    difficulty: 'básico',
    tags: ['grounding', 'disociación', 'pánico', 'sentidos', 'presente', 'anclaje'],
    instructions: `Cuando sientas que te estás "despegando" de la realidad o estás en pánico:

5 — Nombra 5 cosas que puedes VER ahora mismo:
Mira a tu alrededor y descríbelas en detalle: color, forma, tamaño.

4 — Nombra 4 cosas que puedes TOCAR:
Toca tu ropa, la silla, una superficie. Describe la textura, la temperatura.

3 — Nombra 3 cosas que puedes ESCUCHAR:
Presta atención a los sonidos del ambiente: cercanos, lejanos, suaves, fuertes.

2 — Nombra 2 cosas que puedes OLER (o que te gustan oler):
Si no hueles nada, piensa en un olor favorito.

1 — Nombra 1 cosa que puedes SABOREAR:
Un sabor presente o un favorito que recuerdes.

Respira profundamente entre cada sentido.
Puedes repetirlo hasta que sientas los pies en el suelo.`,
  },
  {
    id: 'relax-05',
    category: 'relajacion',
    title: 'Visualización del lugar seguro',
    summary: 'Crea mentalmente un lugar de calma y refugio al que puedas acudir cuando necesites serenidad.',
    goal: 'Desarrollar un recurso interno de calma accesible en cualquier momento.',
    duration: '10 min',
    frequency: 'Semanal',
    difficulty: 'básico',
    tags: ['visualización', 'refugio', 'calma', 'imaginación', 'seguridad'],
    instructions: `Siéntate o acuéstate cómodamente. Cierra los ojos y respira profundamente 3 veces.

1. Imagina un lugar donde te sientes completamente seguro/a y en paz.
   Puede ser real (un lugar que conoces) o imaginario.

2. Explora ese lugar con todos los sentidos:
   • ¿Qué ves? (paisaje, luz, colores)
   • ¿Qué escuchas? (silencio, agua, viento, música)
   • ¿Qué sientes en la piel? (temperatura, brisa, textura)
   • ¿Qué hueles?

3. Nota cómo se siente tu cuerpo en ese lugar. Deja que la calma entre en cada respiración.

4. Permanece ahí 5–8 minutos. Si la mente se va, vuelve suavemente al lugar.

5. Antes de abrir los ojos, crea una "señal de acceso": una palabra, imagen o gesto que te lleve de vuelta a ese lugar cuando lo necesites.

Practica regularmente para que sea un recurso disponible en momentos difíciles.`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Escritura Reflexiva
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'escr-01',
    category: 'escritura',
    title: 'Carta a mi yo futuro',
    summary: 'Escríbete una carta desde el futuro imaginando que ya has superado la dificultad actual.',
    goal: 'Activar la perspectiva de crecimiento y fortalecer la esperanza orientada al futuro.',
    duration: '20 min',
    frequency: 'Mensual',
    difficulty: 'básico',
    tags: ['esperanza', 'futuro', 'narrativa', 'perspectiva', 'escritura'],
    instructions: `Imagina que han pasado 2 años y has superado los desafíos actuales. Eres esa versión futura de ti mismo/a.

Escríbete una carta desde ese lugar, dirigida a tu yo de hoy. Incluye:

1. ¿Cómo te encuentras ahora (en el futuro)? ¿Qué ha cambiado?

2. ¿Qué fue lo más difícil del proceso? ¿Qué te ayudó a superarlo?

3. ¿Qué le quieres decir a tu yo de hoy que lo está pasando mal?

4. ¿Qué aprendiste sobre ti mismo/a en ese proceso?

5. ¿Qué quieres que tu yo actual sepa o no olvide?

Escribe al menos una página completa. No te corrijas — deja fluir.

Al terminar, léela en voz alta y observa cómo te sientes.`,
  },
  {
    id: 'escr-02',
    category: 'escritura',
    title: 'Diario de gratitud',
    summary: 'Registra tres cosas por las que te sientes agradecido/a cada día, con los motivos detrás.',
    goal: 'Entrenar la atención hacia lo positivo y aumentar el bienestar subjetivo.',
    duration: '5–10 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['gratitud', 'bienestar', 'positivo', 'diario', 'Emmons'],
    instructions: `Cada noche, antes de dormir, escribe:

3 cosas por las que me siento agradecido/a hoy:

1. ___ → ¿Por qué me importa esto? ¿Cómo contribuyó a mi bienestar?
2. ___ → ¿Por qué me importa esto?
3. ___ → ¿Por qué me importa esto?

Reglas para hacerlo efectivo:
• Busca especificidad: no "mi familia" sino "la llamada de mi hermana esta tarde".
• Varía las cosas que escribes — no repitas las mismas cada día.
• Incluye pequeñas cosas: una comida rica, una buena conversación, el sol por la ventana.
• Algunos días puede parecer difícil. Eso también tiene valor — busca con más atención.

Práctica opcional: antes de escribir, siéntate un momento y siente genuinamente la gratitud en el cuerpo.`,
  },
  {
    id: 'escr-03',
    category: 'escritura',
    title: 'Carta de autocompasión',
    summary: 'Escríbete una carta compasiva sobre una situación por la que te criticas o juzgas.',
    goal: 'Reducir la autocrítica y cultivar la comprensión hacia uno mismo como se haría con un amigo.',
    duration: '20 min',
    frequency: 'Semanal',
    difficulty: 'intermedio',
    tags: ['autocompasión', 'autocrítica', 'carta', 'Neff', 'amabilidad'],
    instructions: `Elige una situación por la que te sientes mal contigo mismo/a (algo que hiciste o no hiciste, una característica que no te gusta, una situación dolorosa).

Escribe una carta desde el punto de vista de un amigo/a imaginario que:
• Te quiere incondicionalmente
• Es sabio/a y comprensivo/a
• No te juzga

En la carta, ese amigo debe:

1. Reconocer tu dolor y sufrimiento sin minimizarlo.
   "Entiendo que esto ha sido muy difícil para ti…"

2. Recordarte que sufrir y cometer errores es parte de ser humano.
   "Nadie es perfecto y todos pasamos por momentos así…"

3. Ofrecerte amabilidad y comprensión, no consejos.
   "Lo que necesitas ahora es…"

4. Si hay algo que cambiar, mencionarlo con gentileza, no con juicio.

Al terminar, léela en voz alta. ¿Cómo se siente recibirla?`,
  },
  {
    id: 'escr-04',
    category: 'escritura',
    title: 'Diario de fortalezas',
    summary: 'Registra cada día situaciones en las que usaste una fortaleza personal.',
    goal: 'Aumentar el autoconocimiento de fortalezas y su uso activo en la vida diaria.',
    duration: '10 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['fortalezas', 'virtudes', 'VIA', 'autoconocimiento', 'recursos'],
    instructions: `Durante 7 días, antes de dormir, completa este registro:

¿Qué fortaleza usé hoy?
(Ejemplos: creatividad, curiosidad, valentía, perseverancia, amabilidad, liderazgo, humor, gratitud, esperanza, honestidad, prudencia…)

Fortaleza: ___
Situación donde la usé: ___
¿Cómo lo noté yo? ___
¿Lo notó alguien más? ___
¿Cómo me sentí después de usarla? ___

¿Cómo podría usar esta misma fortaleza mañana?
Situación: ___ · Plan concreto: ___

Al terminar la semana: ¿Cuál fue tu fortaleza más frecuente? ¿Cuál te gustaría desarrollar más?

Trae el registro a la próxima sesión.`,
  },
  {
    id: 'escr-05',
    category: 'escritura',
    title: 'Escritura expresiva de Pennebaker',
    summary: 'Escribe libremente sobre una experiencia emocional difícil durante 4 días consecutivos.',
    goal: 'Procesar experiencias traumáticas o estresantes mediante la escritura libre y sin censura.',
    duration: '20 min',
    frequency: '4 días consecutivos',
    difficulty: 'avanzado',
    tags: ['Pennebaker', 'trauma', 'expresión', 'procesamiento', 'escritura libre'],
    instructions: `Este ejercicio está basado en la investigación de James Pennebaker (Universidad de Texas).

Durante 4 días consecutivos, escribe durante 20 minutos ininterrumpidos sobre:
Una experiencia emocionalmente significativa, dolorosa o que todavía te afecte.

Instrucciones clave:
• Escribe sin parar — si te quedas sin ideas, repite la última frase hasta que lleguen más.
• No te corrijas, no te preocupes por la ortografía o el estilo.
• Escribe sobre lo que sentiste y sientes, no solo lo que pasó (pensamientos y emociones).
• Puedes escribir sobre el mismo evento o diferentes cada día.
• Lo que escribas es completamente privado.

Puede ser incómodo al principio. Esto es normal.

Importante: si sientes que el material es muy intenso, habla con tu terapeuta antes de continuar.

Al finalizar los 4 días, escribe una reflexión: ¿Qué aprendiste? ¿Cómo te sientes ahora comparado con el día 1?`,
  },
  {
    id: 'escr-06',
    category: 'escritura',
    title: 'Carta al problema',
    summary: 'Escríbele directamente al problema como si fuera una entidad separada de ti.',
    goal: 'Externalizar el problema para verlo con más distancia y recuperar sensación de agencia.',
    duration: '15 min',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['narrativa', 'externalización', 'White', 'agencia', 'escritura'],
    instructions: `Esta técnica viene de la terapia narrativa (White & Epston).

Paso 1 — Pon nombre al problema:
¿Cómo llamarías al problema si fuera una entidad?
Ejemplos: "La Tristeza gris", "El Miedo controlador", "La Autocrítica implacable".

Paso 2 — Escríbele una carta directamente:
Empieza con: "Querida/o ___,"

En la carta puedes decirle:
• Cuánto tiempo llevas aguantándolo/a
• Cómo ha afectado tu vida, tus relaciones, tus decisiones
• Qué has aprendido de él/ella
• Qué ya no estás dispuesto/a a tolerar
• Qué tipo de relación quieres tener de ahora en adelante

Paso 3 — Escribe la respuesta del problema (si quieres):
¿Qué te diría el problema a ti?

Paso 4 — Reflexión:
¿Qué descubriste al verlo como algo separado de ti?`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TCC — Adicionales
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'tcc-07',
    category: 'tcc',
    title: 'Decatastrofización — ¿Qué tan probable es realmente?',
    summary: 'Evalúa la probabilidad real de que ocurra lo que temes y tu capacidad de afrontarlo.',
    goal: 'Reducir el pensamiento catastrófico poniendo a prueba las predicciones negativas con datos.',
    duration: '15 min',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['catastrofismo', 'probabilidad', 'peor caso', 'ansiedad', 'TCC'],
    instructions: `Cuando notes que estás imaginando lo peor, completa este ejercicio:

1. ¿Cuál es mi pensamiento catastrófico?
   Escríbelo exactamente: "Va a pasar que…"

2. ¿Qué probabilidad real tiene de ocurrir? (0–100 %)
   No lo que sientes — lo que los datos y la experiencia sugieren.

3. ¿Cuántas veces he temido algo similar y no ocurrió?
   Escribe al menos 3 ejemplos concretos de tu propia vida.

4. Si ocurriera lo peor: ¿podría sobrevivirlo?
   ¿Qué recursos tengo? ¿Qué haría? ¿He superado cosas difíciles antes?

5. ¿Cuál es el escenario más probable (no el peor ni el mejor)?
   Descríbelo con realismo.

6. ¿Qué consejo le daría a un amigo que pensara lo mismo?

Escribe un pensamiento más equilibrado y evalúa cómo cambia tu ansiedad (0–10) antes y después.`,
  },
  {
    id: 'tcc-08',
    category: 'tcc',
    title: 'Programación de tareas graduales',
    summary: 'Divide una tarea que evitas en pasos muy pequeños y agrégalos a tu agenda de forma progresiva.',
    goal: 'Superar la procrastinación y la evitación mediante la descomposición y planificación gradual.',
    duration: '20 min',
    frequency: 'Según necesidad',
    difficulty: 'básico',
    tags: ['procrastinación', 'evitación', 'planificación', 'pasos', 'tareas'],
    instructions: `Elige una tarea que llevas tiempo evitando. Sigue estos pasos:

1. Escribe la tarea completa tal como la ves ahora (aunque se sienta enorme):
   Ejemplo: "Ordenar toda mi habitación"

2. Descomponla en 6–10 pasos muy concretos y pequeños:
   • Paso 1: Poner la ropa del suelo en el cesto (5 min)
   • Paso 2: Hacer la cama (3 min)
   • Paso 3: Ordenar el escritorio (10 min)
   … y así sucesivamente.

3. Ordénalos de menor a mayor dificultad.

4. Asigna cada paso a un día y hora específica de esta semana.
   Empieza siempre con el más fácil.

5. Después de completar cada paso, anota:
   • ¿Lo hice? Sí / No
   • ¿Cuánto tardé?
   • ¿Cómo me sentí al terminar? (0–10)

Recuerda: el objetivo de hoy es UN PASO, no toda la tarea. El impulso llega después de empezar, no antes.`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DBT — Adicionales
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'dbt-06',
    category: 'dbt',
    title: 'Mente sabia (Wise Mind)',
    summary: 'Accede al punto de equilibrio entre la mente racional y la mente emocional para tomar decisiones sabias.',
    goal: 'Tomar decisiones desde un estado interno integrado, ni puramente emocional ni puramente lógico.',
    duration: '10 min',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['mente sabia', 'decisiones', 'equilibrio', 'emocional', 'racional', 'DBT', 'Linehan'],
    instructions: `La Mente Sabia es el lugar interno donde la emoción y la razón se integran.

Antes de una decisión difícil, haz este ejercicio:

Paso 1 — Consulta la Mente Emocional:
¿Qué sientes sobre esta situación? ¿Qué quiere la emoción que hagas?
Escríbelo sin filtro.

Paso 2 — Consulta la Mente Racional:
¿Cuáles son los hechos objetivos? ¿Qué dice la lógica?
¿Cuáles son las consecuencias a corto y largo plazo de cada opción?

Paso 3 — Busca la Mente Sabia:
Siéntate en silencio. Respira lentamente. Pregúntate:
"¿Qué sé en lo más profundo que es lo correcto aquí?"
No es lo que la emoción grita ni solo lo que la razón calcula — es la intersección.

Una señal de Mente Sabia: suele sentirse como calma, certeza tranquila, no como urgencia.

Paso 4 — Escribe la respuesta de tu Mente Sabia:
¿Qué te dice? ¿Qué acción es coherente con eso?`,
  },
  {
    id: 'dbt-07',
    category: 'dbt',
    title: 'GIVE — Mantener relaciones valiosas',
    summary: 'Cuatro habilidades clave para cuidar las relaciones importantes durante conversaciones difíciles.',
    goal: 'Fortalecer los vínculos interpersonales manteniendo el respeto y la validación mutua.',
    duration: '15 min (preparación)',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['relaciones', 'comunicación', 'validación', 'respeto', 'DBT', 'GIVE'],
    instructions: `Usa GIVE cuando quieras mantener o mejorar una relación importante durante un conflicto o conversación difícil:

G — Sé Gentil (Gentle):
• No ataques, amenaces ni juzgues.
• Evita el sarcasmo y el tono burlón.
• Si estás enojado/a, espera antes de hablar.

I — Actúa Interesado/a (Interested):
• Escucha activamente lo que la otra persona dice.
• Haz preguntas genuinas. No interrumpas.
• El objetivo es entender, no solo responder.

V — Valida (Validate):
• Busca algo válido en lo que siente o piensa la otra persona.
• "Tiene sentido que te sientas así porque…"
• La validación no significa que estés de acuerdo — significa que entiendes.

E — Actúa con Calma (Easy manner):
• Usa un poco de humor cuando sea apropiado.
• Sonríe. Mantén un tono relajado.
• Evita la rigidez o la actitud defensiva.

Antes de la conversación, escribe:
¿Cómo aplicaré cada letra de GIVE en esta situación específica?`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // ACT — Adicionales
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'act-06',
    category: 'act',
    title: 'El control como problema — Metáfora de la arena de arenas movedizas',
    summary: 'Explora cómo luchar contra pensamientos y emociones difíciles puede empeorar la situación.',
    goal: 'Reducir la lucha interna y abrirse a la aceptación como alternativa al control.',
    duration: '10 min',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['aceptación', 'control', 'metáfora', 'lucha', 'ACT', 'Hayes'],
    instructions: `Lee esta metáfora y reflexiona por escrito:

Imagina que caes en arenas movedizas.
El instinto es luchar, agitarte, intentar salir con fuerza.
Pero cuanto más luchas, más te hundes.

La contra-intuición: para sobrevivir en arenas movedizas, debes extenderte y dejar que la superficie de tu cuerpo toque la arena. Rendirse al miedo, no combatirlo.

Tus pensamientos y emociones difíciles son esas arenas movedizas.
Cuanto más luchas contra la ansiedad, la tristeza, los pensamientos no deseados — más energía consumes y más atrapado/a te sientes.

Reflexión escrita (responde estas preguntas):

1. ¿Con qué emoción o pensamiento llevas más tiempo luchando?
   ¿Cuánta energía has gastado tratando de controlarlo o eliminarlo?

2. ¿Ha funcionado la lucha a largo plazo? ¿Qué has perdido mientras luchabas?

3. ¿Qué significaría "dejar de luchar" con esa emoción o pensamiento?
   (No es rendirse ni estar de acuerdo — es soltar el esfuerzo de control)

4. Si no gastaras energía en luchar, ¿qué podrías hacer con esa energía en tu vida?`,
  },
  {
    id: 'act-07',
    category: 'act',
    title: 'Defusión — Dale un nombre ridículo a tu pensamiento',
    summary: 'Reduce el impacto de pensamientos negativos cambiando la forma en que te relacionas con ellos.',
    goal: 'Crear distancia psicológica de pensamientos automáticos sin suprimirlos ni creerlos literalmente.',
    duration: '5 min',
    frequency: 'Según necesidad',
    difficulty: 'básico',
    tags: ['defusión', 'pensamiento', 'distancia', 'humor', 'ACT'],
    instructions: `Cuando aparezca un pensamiento difícil o recurrente, prueba una de estas técnicas de defusión:

Técnica 1 — Voz de caricatura:
Di el pensamiento en voz alta con una voz ridícula (un personaje de dibujos animados, voz de robot, etc.).
¿Cambia su poder cuando lo escuchas así?

Técnica 2 — La mente como radio:
Imagina que tu mente es una radio que pone el programa "Pensamientos catastrofistas".
No tienes que cambiar la estación, pero sí recordar que eres el oyente, no el locutor.
Anota: "La radio está poniendo el programa: ___"

Técnica 3 — Etiqueta el pensamiento:
En lugar de "Voy a fracasar", di:
"Noto que estoy teniendo el pensamiento de que voy a fracasar."
Esa pequeña frase pone distancia entre tú y el pensamiento.

Técnica 4 — Gracias, mente:
Cuando aparezca el pensamiento, dile en voz baja: "Gracias, mente. Mensaje recibido."
No lo rechaces — simplemente reconócelo y sigue haciendo lo que ibas a hacer.

Anota qué técnica usaste y cómo cambió la intensidad del pensamiento (0–10).`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Mindfulness — Adicionales
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'mind-05',
    category: 'mindfulness',
    title: 'Meditación de amor y bondad (Metta)',
    summary: 'Cultiva sentimientos de amor, bondad y compasión hacia ti mismo/a y hacia otros.',
    goal: 'Aumentar la compasión propia, reducir la hostilidad y fortalecer la conexión con los demás.',
    duration: '10–15 min',
    frequency: 'Diario',
    difficulty: 'intermedio',
    tags: ['compasión', 'bondad', 'amor', 'Metta', 'budista', 'mindfulness', 'hostilidad'],
    instructions: `Siéntate cómodamente, cierra los ojos y respira profundamente 3 veces.

Esta meditación se hace en 4 fases, dirigiendo las mismas frases a diferentes personas:

Las frases base (puedes adaptarlas):
"Que estés bien. Que seas feliz. Que estés libre de sufrimiento. Que tengas paz."

FASE 1 — Hacia ti mismo/a:
Imagina tu propia imagen con claridad. Repite las frases hacia ti 5 veces, sintiendo genuinamente cada una.

FASE 2 — Hacia alguien querido:
Piensa en alguien que amas sin complicaciones. Repite las frases hacia esa persona 5 veces.

FASE 3 — Hacia alguien neutral:
Piensa en alguien que no te genera emociones fuertes (un vecino, un conocido). Repite las frases 5 veces.

FASE 4 — Hacia alguien difícil:
Piensa en alguien con quien tengas dificultades. Sin forzar nada, intenta enviarle las frases 3 veces.
(Si es muy difícil, empieza con alguien con quien el conflicto sea pequeño.)

Al terminar, regresa a ti mismo/a y repite las frases una vez más.

Anota: ¿En qué fase fue más difícil? ¿Cómo te sientes ahora?`,
  },
  {
    id: 'mind-06',
    category: 'mindfulness',
    title: 'Mindfulness en un solo bocado',
    summary: 'Practica la atención plena con un solo bocado de comida como objeto de meditación.',
    goal: 'Desarrollar la conciencia sensorial plena y reducir el comer automático o emocional.',
    duration: '5 min',
    frequency: 'Diario (durante una comida)',
    difficulty: 'básico',
    tags: ['comer', 'atención', 'sentidos', 'presente', 'impulsivo', 'mindfulness'],
    instructions: `Elige un alimento pequeño (una uva, un trozo de chocolate, una nuez, una galleta).

Antes de comerlo, haz esto:

1. Míralo durante 30 segundos:
   Observa su color, forma, textura. Como si nunca hubieras visto ese alimento.

2. Huélelo:
   Acércalo a la nariz. ¿Qué notas? ¿Te genera alguna reacción en la boca?

3. Tócalo:
   ¿Cómo se siente en los dedos? ¿Duro, suave, rugoso?

4. Ponlo en la boca sin morderlo todavía:
   ¿Qué sientes? ¿Cambia algo?

5. Mastícalo lentamente:
   ¿Cómo evoluciona el sabor? ¿Hay diferentes notas?

6. Trágalo con plena conciencia.

Reflexión:
• ¿Cómo fue diferente a comer de manera automática?
• ¿Qué notaste que normalmente no notas?
• ¿Qué emociones o pensamientos surgieron durante el ejercicio?

Puedes aplicar esto al primer bocado de cualquier comida.`,
  },
  {
    id: 'mind-07',
    category: 'mindfulness',
    title: 'Meditación de la montaña',
    summary: 'Conéctate con una estabilidad interna profunda usando la imagen de una montaña ante las tormentas.',
    goal: 'Cultivar ecuanimidad y fortaleza interna ante las circunstancias cambiantes de la vida.',
    duration: '15 min',
    frequency: 'Semanal',
    difficulty: 'intermedio',
    tags: ['estabilidad', 'ecuanimidad', 'montaña', 'Kabat-Zinn', 'metáfora', 'mindfulness'],
    instructions: `Siéntate erguido/a, como si fueras una montaña. Cierra los ojos.

1. Visualiza una montaña grande y poderosa.
   Tiene una cima que a veces está entre nubes, laderas boscosas, nieve, roca antigua.
   Es completamente inmóvil en su esencia.

2. Imagina que tú ERES esa montaña.
   Tu cabeza es la cima. Tus hombros y brazos son las laderas. Tu base es el suelo firme.

3. Observa cómo las estaciones cambian sobre la montaña:
   • Primavera: flores, lluvia, suavidad.
   • Verano: calor intenso, visitantes, actividad.
   • Otoño: viento, hojas que caen, cambio de colores.
   • Invierno: nieve, silencio, frío.

4. La montaña no "resiste" el clima — lo recibe. Sigue siendo montaña en todas las estaciones.

5. Ahora piensa en las "tormentas" de tu vida: el estrés, el dolor, la incertidumbre, la alegría, la pérdida.
   Tú puedes ser la montaña: recibirlo todo sin ser destruido/a por ello.

Al terminar, escribe: ¿Qué tormenta estás viviendo ahora? ¿Qué significa ser montaña ante ella?`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Activación Conductual — Adicionales
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'act-cond-04',
    category: 'activacion',
    title: 'Activación de contacto social gradual',
    summary: 'Planifica interacciones sociales de menor a mayor complejidad para salir del aislamiento.',
    goal: 'Reducir el aislamiento social asociado a la depresión o la ansiedad mediante pasos graduales.',
    duration: '15 min (planificación)',
    frequency: 'Semanal',
    difficulty: 'intermedio',
    tags: ['aislamiento', 'social', 'depresión', 'relaciones', 'gradual', 'activación'],
    instructions: `El aislamiento alimenta la depresión. Esta semana planifica al menos 3 contactos sociales graduales:

NIVEL 1 — Contacto mínimo (sin salir de casa):
• Enviar un mensaje de texto a alguien que aprecias
• Comentar una foto de un amigo en redes
• Llamar a un familiar por 5 minutos
→ Elige uno y comprométete a hacerlo mañana.

NIVEL 2 — Contacto breve fuera de casa:
• Saludar al vecino
• Hacer una consulta en una tienda
• Tomar un café solo/a en un lugar público
→ Planifica cuándo y dónde harás esto esta semana.

NIVEL 3 — Interacción social real:
• Quedar con un amigo para caminar 30 minutos
• Llamar a alguien para hablar (no texto)
• Asistir a una actividad grupal (clase, reunión, evento)
→ Elige una opción y ponla en tu agenda con fecha y hora.

Después de cada contacto, anota:
¿Cómo me sentía antes? ¿Cómo me sentí después? ¿Valió la pena?`,
  },
  {
    id: 'act-cond-05',
    category: 'activacion',
    title: 'Rutina matutina anti-depresión',
    summary: 'Diseña una rutina de mañana simple y estructurada para contrarrestar la inercia depresiva.',
    goal: 'Establecer un ancla conductual diaria que genere estructura y sensación de logro desde temprano.',
    duration: '15 min (diseño) + práctica diaria',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['rutina', 'mañana', 'depresión', 'estructura', 'hábitos', 'activación'],
    instructions: `La depresión prospera en el caos y la inactividad. Una rutina matutina simple puede cambiar el tono del día.

Diseña TU rutina de 30–45 minutos eligiendo entre estas opciones:

Bloque 1 — Activar el cuerpo (10 min):
[ ] Levantarse a la misma hora
[ ] Hacer la cama inmediatamente
[ ] Tomar un vaso de agua
[ ] Estiramiento básico o caminata corta

Bloque 2 — Higiene y presencia (10 min):
[ ] Ducha o lavarse la cara
[ ] Vestirse (aunque no salgas)

Bloque 3 — Nutrirse (10 min):
[ ] Desayuno sin pantallas
[ ] 5 respiraciones conscientes o 2 min de silencio

Bloque 4 — Intención (5 min):
[ ] Escribir UNA cosa que haré hoy
[ ] Leer o escuchar algo positivo

Reglas:
• Empieza con solo 3 elementos. No seas ambicioso/a al principio.
• Hazla a la misma hora cada día (el horario es más importante que los elementos).
• Registra si la cumpliste (sí/parcial/no) durante 7 días.

¿Cuánto mejor fue el día cuando hiciste la rutina vs. cuando no la hiciste?`,
  },
  {
    id: 'act-cond-06',
    category: 'activacion',
    title: 'Técnica "Actuar como si"',
    summary: 'Actúa como si ya tuvieras la motivación o el estado de ánimo deseado, antes de sentirlo.',
    goal: 'Romper la espera de la motivación para actuar, entendiendo que la acción precede al estado de ánimo.',
    duration: '10 min',
    frequency: 'Según necesidad',
    difficulty: 'básico',
    tags: ['motivación', 'acción', 'depresión', 'activación', 'cambio conductual'],
    instructions: `Esperamos sentir motivación para actuar. En la depresión, esa motivación no llega espontáneamente.
La solución: actuar primero, sentir después.

Ejercicio:

1. Identifica cómo te gustaría sentirte hoy:
   Ejemplo: "Con energía", "Motivado/a", "Tranquilo/a", "Productivo/a"

2. Pregúntate: ¿Qué haría una persona que ya se siente así?
   Ejemplo: Si tuviera energía, me levantaría, desayunaría bien, saldría a caminar.

3. Elige UNA de esas acciones y hazla ahora, aunque no lo sientas:
   No tienes que creerlo. Solo actúa como si.

4. Después de hacerlo, anota:
   • ¿Cómo me sentía antes (0–10)?
   • ¿Cómo me siento ahora (0–10)?
   • ¿Qué noté?

Principio clave: El estado de ánimo sigue a la acción, no al revés.
La motivación no aparece esperando — aparece actuando.`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Regulación Emocional — Adicionales
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'emoc-05',
    category: 'emocional',
    title: 'Técnica del semáforo emocional',
    summary: 'Usa la metáfora del semáforo para pausar, evaluar y responder ante emociones intensas.',
    goal: 'Interrumpir respuestas emocionales automáticas y elegir una respuesta más consciente.',
    duration: '5 min',
    frequency: 'Según necesidad (en el momento)',
    difficulty: 'básico',
    tags: ['semáforo', 'pausa', 'impulsividad', 'regulación', 'emociones', 'respuesta'],
    instructions: `Cuando sientas que una emoción fuerte está a punto de controlarte, aplica el semáforo:

🔴 ROJO — Para:
Detente. No actúes todavía.
Respira: inhala 4 segundos, exhala 6 segundos. Repite 3 veces.
Reconoce: "Estoy sintiendo ___. Esto es una señal de que necesito una pausa."

🟡 AMARILLO — Evalúa:
Hazte estas preguntas rápidas:
• ¿Qué está pasando realmente?
• ¿Qué estoy sintiendo y por qué?
• ¿Cuáles son mis opciones ahora?
• Si actúo impulsivamente, ¿qué consecuencias habrá?
• ¿Qué diría mi "mejor yo" en este momento?

🟢 VERDE — Responde:
Elige la respuesta más útil, no la más automática.
Actúa desde ese lugar.

Después, reflexiona:
• ¿Qué emoción detuvo el semáforo?
• ¿Qué habrías hecho sin la pausa?
• ¿Qué hiciste en cambio? ¿Cómo resultó?`,
  },
  {
    id: 'emoc-06',
    category: 'emocional',
    title: 'Surfeo de la ola emocional (Urge Surfing)',
    summary: 'Observa cómo una emoción o impulso intenso sube y baja como una ola sin necesidad de actuar sobre él.',
    goal: 'Tolerar impulsos y emociones intensas sin actuar, aprendiendo que siempre bajan por sí solos.',
    duration: '10–15 min',
    frequency: 'Según necesidad',
    difficulty: 'intermedio',
    tags: ['impulso', 'urge surfing', 'tolerancia', 'ola', 'emoción', 'Marlatt'],
    instructions: `Esta técnica viene de la investigación sobre adicciones (Marlatt) y funciona con cualquier impulso o emoción intensa.

Cuando sientas un impulso fuerte (comer emocionalmente, discutir, aislarte, etc.):

1. Nómbralo:
   "Siento el impulso de ___. La emoción detrás es ___."

2. Visualiza la ola:
   Las emociones siempre suben, llegan a un pico y bajan. Son como olas.
   Esta emoción también pasará si no la alimentas ni la combates.

3. Obsérvala en tu cuerpo (sin actuar):
   ¿Dónde la sientes? ¿En el pecho, garganta, estómago?
   ¿Cómo es la sensación? ¿Cómo cambia con cada respiración?
   Pon tu atención en las sensaciones físicas, no en el pensamiento que las acompaña.

4. Respira y surféala:
   Imagina que eres un surfista sobre esa ola.
   No la controlas — la cabalgas. Subes con ella, llegas a la cima y bajas.

5. Nota cuándo baja:
   Anota cuánto tardó en bajar la intensidad (en minutos).
   ¿Qué aprendiste sobre ese impulso?

Con práctica, cada vez confiarás más en que la ola siempre baja.`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Relajación — Adicionales
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'relax-06',
    category: 'relajacion',
    title: 'Respiración alternada de fosas nasales',
    summary: 'Técnica de pranayama que equilibra el sistema nervioso alternando la respiración por cada fosa nasal.',
    goal: 'Reducir el estrés y la ansiedad, y mejorar la concentración mediante el equilibrio del sistema nervioso.',
    duration: '5–10 min',
    frequency: 'Diario',
    difficulty: 'básico',
    tags: ['pranayama', 'fosas nasales', 'yoga', 'equilibrio', 'sistema nervioso', 'respiración'],
    instructions: `Esta técnica proviene del yoga (Nadi Shodhana). Siéntate erguido/a con la espalda recta.

Posición de la mano:
Coloca el pulgar derecho sobre la fosa nasal derecha y el anular derecho sobre la izquierda.
(El índice y el medio se doblan hacia la palma o se apoyan entre las cejas.)

El ciclo:
1. Cierra la fosa DERECHA con el pulgar. Inhala lentamente por la fosa IZQUIERDA (4 seg).
2. Cierra ambas fosas. Retén brevemente (2 seg).
3. Abre la fosa DERECHA. Exhala lentamente por la DERECHA (4 seg).
4. Inhala por la fosa DERECHA (4 seg).
5. Cierra ambas. Retén brevemente (2 seg).
6. Abre la fosa IZQUIERDA. Exhala por la IZQUIERDA (4 seg).

Eso es un ciclo completo. Repite 5–10 ciclos.

Siempre termina exhalando por la fosa izquierda.

Puedes ir aumentando los tiempos gradualmente (4-4-6, luego 4-4-8).
Ideal por la mañana o antes de dormir.`,
  },
  {
    id: 'relax-07',
    category: 'relajacion',
    title: 'Relajación autógena de Schultz',
    summary: 'Induce estados de relajación profunda mediante autosugestiones de calor y pesadez en el cuerpo.',
    goal: 'Generar un estado de relajación fisiológica profunda mediante la regulación voluntaria del sistema nervioso.',
    duration: '15–20 min',
    frequency: 'Diario',
    difficulty: 'intermedio',
    tags: ['autógena', 'Schultz', 'autosugestión', 'pesadez', 'calor', 'relajación', 'profunda'],
    instructions: `Acuéstate o siéntate cómodamente. Cierra los ojos. Respira normalmente.

Repite cada fórmula mentalmente 3–6 veces, en voz baja o solo pensándola, y tómate tiempo para sentirla:

FASE 1 — Pesadez:
"Mi brazo derecho está pesado…" (luego izquierdo, piernas)
"Mis brazos y piernas están pesados y relajados."

FASE 2 — Calor:
"Mi brazo derecho está caliente…" (luego izquierdo, piernas)
"Mis brazos y piernas están cálidos y pesados."

FASE 3 — Corazón (solo observa, no controles):
"Mi corazón late tranquilo y regular."

FASE 4 — Respiración:
"Mi respiración es suave y tranquila."

FASE 5 — Abdomen:
"Mi abdomen irradia calor."

FASE 6 — Frente:
"Mi frente está fresca y despejada."

Al terminar, sal lentamente:
• Dobla y estira los brazos con energía (3 veces).
• Respira profundamente.
• Abre los ojos.

Con práctica (2–4 semanas), el estado de relajación llegará más rápido.`,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Escritura Reflexiva — Adicionales
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'escr-07',
    category: 'escritura',
    title: 'Los tres buenos momentos (Seligman)',
    summary: 'Escribe cada noche tres cosas buenas que ocurrieron hoy y explica por qué ocurrieron.',
    goal: 'Entrenar el cerebro para notar lo positivo y aumentar el bienestar subjetivo de forma sostenida.',
    duration: '10 min',
    frequency: 'Diario (durante 2 semanas)',
    difficulty: 'básico',
    tags: ['psicología positiva', 'Seligman', 'bienestar', 'positivo', 'gratitud', 'tres cosas buenas'],
    instructions: `Este ejercicio proviene de la investigación de Martin Seligman (Psicología Positiva) y ha demostrado reducir la depresión y aumentar el bienestar en estudios clínicos controlados.

Cada noche durante al menos 2 semanas, escribe:

Tres cosas buenas que ocurrieron hoy
(pueden ser pequeñas: una conversación agradable, un café rico, un logro en el trabajo, un momento de paz)

Por cada una, responde:
1. ¿Qué pasó exactamente?
   Descríbelo con detalle.

2. ¿Por qué ocurrió?
   Esta es la parte clave. No es "tuve suerte" — busca causas:
   ¿Fue por algo que hiciste tú? ¿Por una cualidad tuya? ¿Por algo que organizaste?

3. ¿Qué significa esto para ti?

Instrucción importante: escribe de puño y letra si puedes, o en la app de notas — no solo en la cabeza. La escritura fija la experiencia.

Los días malos son los más importantes: buscar los tres momentos cuando todo estuvo mal entrena la resilencia real.`,
  },
  {
    id: 'escr-08',
    category: 'escritura',
    title: 'Mi historia de resiliencia',
    summary: 'Escribe la historia de una dificultad que superaste, identificando los recursos que usaste.',
    goal: 'Fortalecer la narrativa de resiliencia personal y recuperar confianza en la propia capacidad de afrontar.',
    duration: '30 min',
    frequency: 'Mensual',
    difficulty: 'intermedio',
    tags: ['resiliencia', 'narrativa', 'historia', 'fortalezas', 'superación', 'escritura'],
    instructions: `Elige una dificultad significativa que hayas superado en tu vida (no tiene que ser la más grande — elige una de la que puedas hablar con cierta distancia).

Escribe tu historia siguiendo esta estructura:

1. El contexto (¿qué estaba pasando?):
   Describe la situación. ¿Cuántos años tenías? ¿Qué hacía difícil ese momento?

2. El punto más duro:
   ¿Cuál fue el momento en que fue más difícil? ¿Qué sentiste?

3. Lo que hiciste:
   ¿Qué recursos usaste para seguir adelante? (personas, habilidades, valores, decisiones)
   ¿Qué parte de ti salió a la luz en ese momento?

4. El giro:
   ¿Qué cambió? ¿Cómo empezaste a salir de esa etapa?

5. Lo que aprendiste:
   ¿Qué sabe hoy tu yo actual que no sabía entonces?
   ¿Qué te dejó esa experiencia que llevas contigo?

6. El mensaje para tu yo actual:
   ¿Qué le diría esa versión de ti que superó aquello a la versión que vive lo que vive hoy?

Lee la historia en voz alta al terminar.`,
  },
]

// ── Función de búsqueda ───────────────────────────────────────────────────────
export function searchLibrary(query) {
  const q = query.toLowerCase().trim()
  if (!q) return LIBRARY
  return LIBRARY.filter(ex =>
    ex.title.toLowerCase().includes(q) ||
    ex.summary.toLowerCase().includes(q) ||
    ex.goal.toLowerCase().includes(q) ||
    ex.tags.some(t => t.toLowerCase().includes(q)) ||
    ex.category.toLowerCase().includes(q)
  )
}
