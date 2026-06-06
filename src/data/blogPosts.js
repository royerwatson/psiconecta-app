/**
 * blogPosts.js — Artículos estáticos del blog de Psiconecta.
 * Para agregar un artículo nuevo: copiar la estructura y agregarlo al array.
 * El slug debe ser único y en minúsculas con guiones.
 */

export const BLOG_POSTS = [
  {
    slug: 'como-saber-si-necesito-terapia',
    title: '¿Cómo saber si necesito ir a terapia?',
    excerpt:
      'Muchas personas dudan mucho antes de buscar ayuda psicológica. En este artículo te explicamos las señales que indican que hablar con un profesional puede marcar la diferencia.',
    category: 'Bienestar',
    readTime: 5,
    date: '2026-06-01',
    coverGradient: 'from-primary-500 to-accent-600',
    sections: [
      {
        heading: null,
        body: `Existe una idea errónea muy extendida: que la terapia es solo para personas en crisis o con un diagnóstico clínico grave. La realidad es muy diferente. La psicoterapia es útil para cualquier persona que quiera entenderse mejor, gestionar sus emociones con más eficacia o enfrentar situaciones que le generan malestar.`,
      },
      {
        heading: '¿Qué señales indican que podría ser buen momento?',
        body: `No hace falta estar "roto" para buscar apoyo. Estas son algunas señales frecuentes que indican que una conversación con un profesional podría ayudarte:\n\n**Te sientes abrumado de forma continua.** El estrés ocasional es normal, pero cuando la sensación de no poder más se vuelve tu estado habitual, algo merece atención.\n\n**Tus emociones afectan tu vida diaria.** Si la ansiedad, la tristeza o la irritabilidad te impiden trabajar, relacionarte o dormir bien, son señales importantes.\n\n**Repites patrones que no quieres repetir.** Relaciones que siempre terminan igual, reacciones que lamentas después, decisiones que sabotean tus propios objetivos.\n\n**Pasaste por algo difícil y no lograste procesarlo.** Una pérdida, una ruptura, un cambio grande, una experiencia traumática. A veces el tiempo solo no es suficiente.\n\n**Sientes que no puedes hablar con nadie.** Cuando los amigos y familia no son suficientes —porque te juzgan, no entienden o simplemente no tienes a quién acudir—, un espacio profesional y confidencial hace la diferencia.`,
      },
      {
        heading: '¿Y si simplemente quiero crecer como persona?',
        body: `También es una razón completamente válida. Muchas personas acuden a terapia sin ninguna crisis específica: quieren conocerse mejor, mejorar su autoestima, comunicarse mejor en sus relaciones o tomar decisiones más alineadas con sus valores. La terapia no es solo para el malestar — también es para el crecimiento.`,
      },
      {
        heading: '¿Qué pasa si no estoy seguro/a?',
        body: `Esa duda en sí misma ya es información. Si te estás haciendo esta pregunta, probablemente hay algo en tu vida que merece ser escuchado y explorado. La primera sesión con un terapeuta no te compromete a nada — es simplemente una conversación donde puedes ver si el espacio te hace bien.\n\nEn Psiconecta puedes explorar los perfiles de terapeutas verificados, ver sus especialidades y tarifas, y si lo prefieres, incluso comenzar de forma anónima.`,
      },
    ],
  },

  {
    slug: 'psicologo-psiquiatra-coach-diferencias',
    title: 'Psicólogo, psiquiatra o coach: ¿cuál necesito?',
    excerpt:
      'Tres profesiones que trabajan con el bienestar mental, pero con roles muy distintos. Te explicamos las diferencias para que puedas elegir con criterio.',
    category: 'Guías',
    readTime: 6,
    date: '2026-06-03',
    coverGradient: 'from-accent-500 to-primary-600',
    sections: [
      {
        heading: null,
        body: `Una de las confusiones más comunes al buscar apoyo para la salud mental es no saber a qué profesional acudir. Psicólogo, psiquiatra y coach son tres figuras distintas con formaciones, herramientas y objetivos diferentes. Conocer la diferencia te ahorrará tiempo y te ayudará a encontrar el apoyo que realmente necesitas.`,
      },
      {
        heading: 'El psicólogo clínico',
        body: `El psicólogo tiene una formación universitaria en psicología (generalmente de 4-5 años) y, en muchos países, requiere una licencia o registro profesional para ejercer. Su trabajo consiste en evaluar, diagnosticar y tratar problemas emocionales, conductuales y relacionales mediante técnicas psicoterapéuticas.\n\n**Lo que hace:** terapia cognitivo-conductual, psicoanálisis, terapia de aceptación y compromiso, terapia familiar, entre otras modalidades.\n\n**Para qué acudir:** ansiedad, depresión, trauma, duelo, problemas de relación, fobias, trastornos del comportamiento, desarrollo personal.\n\n**No puede:** recetar medicamentos (salvo excepciones en algunos países con formación especializada adicional).`,
      },
      {
        heading: 'El psiquiatra',
        body: `El psiquiatra es un médico que se especializó en salud mental. Su formación es médica primero (6 años de medicina) y luego una especialización en psiquiatría.\n\n**Lo que hace:** diagnóstico y tratamiento de trastornos mentales, especialmente cuando hay un componente biológico o neurológico importante. Puede —y en muchos casos debe— combinar medicación con psicoterapia.\n\n**Para qué acudir:** trastorno bipolar, esquizofrenia, depresión mayor con síntomas graves, trastorno obsesivo-compulsivo severo, cuando otros tratamientos no han funcionado.\n\n**También puede:** hacer psicoterapia, aunque muchos psiquiatras se enfocan principalmente en la gestión farmacológica.`,
      },
      {
        heading: 'El coach',
        body: `El coaching es una disciplina de desarrollo personal y profesional. A diferencia de psicólogos y psiquiatras, el coach no necesita una titulación universitaria regulada, aunque muchos tienen certificaciones de institutos reconocidos.\n\n**Lo que hace:** acompañar a la persona para que identifique sus metas, supere bloqueos y desarrolle su potencial. Trabaja orientado al futuro y a la acción.\n\n**Para qué acudir:** cambio de carrera, liderazgo, productividad, claridad de objetivos, mejora del rendimiento.\n\n**Importante:** el coaching no es adecuado para tratar trastornos mentales. Si hay malestar psicológico significativo, la consulta debe ser con un psicólogo o psiquiatra.`,
      },
      {
        heading: '¿Cómo elegir?',
        body: `Una buena regla general: si lo que te preocupa tiene que ver con emociones, relaciones, comportamientos o experiencias difíciles del pasado, empieza por un psicólogo. Si sientes que los síntomas son muy intensos o no responden a la terapia, considera una evaluación psiquiátrica. Si tu objetivo es el crecimiento personal o profesional sin malestar clínico, un coach puede ser el camino.\n\nEn Psiconecta puedes filtrar por especialidad y leer el perfil de cada terapeuta para encontrar el que mejor se ajusta a tu situación.`,
      },
    ],
  },

  {
    slug: 'terapia-online-vs-presencial',
    title: 'Terapia online vs. presencial: ¿cuál es mejor para ti?',
    excerpt:
      'La terapia online creció enormemente en los últimos años. ¿Es igual de efectiva? ¿Para quién funciona mejor? Resolvemos las preguntas más frecuentes.',
    category: 'Guías',
    readTime: 7,
    date: '2026-06-05',
    coverGradient: 'from-primary-400 to-accent-500',
    sections: [
      {
        heading: null,
        body: `Durante años, la terapia presencial fue prácticamente la única opción disponible. Hoy, la modalidad online es una alternativa sólida, respaldada por investigación científica y adoptada por millones de personas en todo el mundo. Pero ¿es igual de buena? ¿Para quién funciona mejor? Aquí te damos una respuesta honesta.`,
      },
      {
        heading: '¿Qué dice la ciencia?',
        body: `Múltiples estudios, incluyendo una revisión publicada en el Journal of Anxiety Disorders, han encontrado que la terapia cognitivo-conductual online produce resultados comparables a la presencial para la mayoría de los trastornos de ansiedad y depresión. La alianza terapéutica —el vínculo de confianza entre paciente y terapeuta— puede construirse igualmente bien en formato digital cuando hay una buena conexión y comunicación.`,
      },
      {
        heading: 'Ventajas de la terapia online',
        body: `**Accesibilidad.** Puedes acceder desde cualquier lugar: tu casa, una habitación privada en el trabajo, incluso desde el extranjero. Esto es especialmente relevante si vives en zonas donde hay pocos psicólogos disponibles.\n\n**Sin desplazamientos.** No necesitas movilizarte, lo que reduce el tiempo y costo asociado a cada sesión.\n\n**Mayor privacidad.** Para muchas personas, no tener que pasar por una sala de espera o ser visto entrando a una consulta reduce el estigma y facilita dar el primer paso.\n\n**Flexibilidad de horario.** Muchos terapeutas online ofrecen horarios más amplios, incluyendo mañanas temprano, noches y fines de semana.`,
      },
      {
        heading: 'Cuándo la presencial puede ser mejor',
        body: `La terapia presencial puede ser más adecuada en situaciones específicas:\n\n- Cuando hay riesgo para la seguridad del paciente y se requiere una evaluación directa.\n- En algunos abordajes que requieren observación corporal o técnicas de contacto (como EMDR en ciertos protocolos, o psicomotricidad).\n- Cuando el paciente tiene dificultades significativas con la tecnología.\n- Si el entorno en casa no ofrece la privacidad necesaria para una sesión.\n\nEn esos casos, la presencial sigue siendo la opción más recomendable.`,
      },
      {
        heading: '¿Cómo saber cuál me conviene?',
        body: `La respuesta más honesta es: prueba. Muchos terapeutas ofrecen una primera sesión de evaluación donde puedes sentir el formato y decidir. Si tu principal barrera para ir a terapia ha sido la distancia, el horario o el estigma, la modalidad online probablemente te abrirá una puerta que de otra forma permanecería cerrada.\n\nEn Psiconecta todas las sesiones son por videollamada, con terapeutas verificados y en un entorno seguro y cifrado.`,
      },
    ],
  },

  {
    slug: 'ansiedad-signos-y-que-hacer',
    title: 'Ansiedad: señales que no debes ignorar y qué puedes hacer',
    excerpt:
      'La ansiedad es la condición de salud mental más frecuente en el mundo. Conocer sus señales y saber cuándo buscar ayuda puede marcar una gran diferencia.',
    category: 'Salud mental',
    readTime: 6,
    date: '2026-06-06',
    coverGradient: 'from-accent-400 to-primary-500',
    sections: [
      {
        heading: null,
        body: `La ansiedad es una respuesta natural del cuerpo ante situaciones de amenaza o incertidumbre. En dosis moderadas, es útil: nos mantiene alerta, nos motiva a prepararnos, nos ayuda a reaccionar ante el peligro. El problema aparece cuando esa respuesta se dispara de forma desproporcionada, persistente o sin causa clara — y empieza a interferir con la vida cotidiana.`,
      },
      {
        heading: 'Señales físicas de la ansiedad',
        body: `La ansiedad no es solo "nerviosismo". Tiene manifestaciones físicas muy concretas que a menudo llevan a las personas al médico buscando una causa física:\n\n- Palpitaciones o sensación de latidos acelerados\n- Tensión muscular, especialmente en cuello, hombros y mandíbula\n- Dificultad para respirar o sensación de ahogo\n- Mareos, náuseas o malestar digestivo\n- Insomnio o sueño no reparador\n- Fatiga crónica a pesar de descansar\n\nCuando el médico no encuentra causa física para estos síntomas, la ansiedad suele ser la explicación.`,
      },
      {
        heading: 'Señales emocionales y conductuales',
        body: `Más allá del cuerpo, la ansiedad se manifiesta en la forma de pensar y actuar:\n\n- Preocupación excesiva y difícil de controlar\n- Anticipación catastrófica ("¿y si pasa lo peor?")\n- Dificultad para concentrarse\n- Irritabilidad desproporcionada\n- Evitación de situaciones que generan malestar (lo que a largo plazo empeora la ansiedad)\n- Sensación de estar "al borde del límite" de forma constante`,
      },
      {
        heading: '¿Cuándo buscar ayuda?',
        body: `Si la ansiedad lleva más de dos semanas afectando tu calidad de vida — tu trabajo, tus relaciones o tu descanso — es momento de hablar con un profesional. No hay que esperar a estar en crisis.\n\nLa buena noticia es que la ansiedad responde muy bien al tratamiento. La terapia cognitivo-conductual, en particular, tiene evidencia sólida para reducir los síntomas de ansiedad en pocas semanas. En algunos casos, el médico puede considerar un apoyo farmacológico de corto plazo.`,
      },
      {
        heading: 'Qué puedes hacer hoy',
        body: `Mientras buscas ayuda profesional, hay prácticas que reducen la intensidad de los síntomas:\n\n**Respiración diafragmática.** Inhala 4 segundos, retén 4, exhala 6. Activa el sistema nervioso parasimpático y reduce la respuesta de estrés.\n\n**Movimiento físico.** El ejercicio aeróbico regular es uno de los ansiolíticos naturales más estudiados.\n\n**Reducir estimulantes.** La cafeína y el alcohol pueden intensificar los síntomas de ansiedad.\n\n**Hablar.** Poner en palabras lo que sientes — con alguien de confianza o con un terapeuta — ya de por sí reduce la carga emocional.\n\nEn Psiconecta puedes conectar con un psicólogo especializado en ansiedad desde hoy, sin lista de espera.`,
      },
    ],
  },

  {
    slug: 'como-prepararte-para-primera-sesion',
    title: 'Cómo prepararte para tu primera sesión de terapia',
    excerpt:
      'La primera cita con un psicólogo puede generar nervios. Con estas claves, llegarás más tranquilo y sacarás más provecho desde el primer encuentro.',
    category: 'Consejos',
    readTime: 4,
    date: '2026-06-06',
    coverGradient: 'from-primary-600 to-accent-400',
    sections: [
      {
        heading: null,
        body: `Dar el primer paso y hacer una cita con un psicólogo ya es un logro importante. Pero es normal llegar a esa primera sesión sin saber bien qué esperar, o con algo de nerviosismo. Estas pautas te ayudarán a llegar más tranquilo y a aprovechar mejor ese primer encuentro.`,
      },
      {
        heading: 'No necesitas tener todo claro',
        body: `Una de las dudas más frecuentes es: "¿Qué le voy a decir?" No tienes que llegar con un discurso preparado ni con absoluta claridad sobre lo que te pasa. El terapeuta está entrenado para ayudarte a explorar y articular lo que sientes, aunque empieces con un "no sé muy bien por dónde empezar". Eso es completamente válido y muy común.`,
      },
      {
        heading: 'Piensa en qué te trajo hasta aquí',
        body: `Aunque no necesitas un guión, sí puede ayudarte reflexionar brevemente antes de la sesión:\n\n- ¿Qué situación o sensación me llevó a buscar ayuda ahora?\n- ¿Hay algo puntual que quiera mejorar o entender?\n- ¿Hay algo que me da miedo decir o explorar?\n\nNo tienes que responder estas preguntas por escrito. Solo tenerlas en mente puede ayudarte a orientar la conversación.`,
      },
      {
        heading: 'La primera sesión es una evaluación mutua',
        body: `Igual que tú estás viendo si el espacio te hace bien, el terapeuta también está conociéndote y evaluando cómo puede ayudarte. Es normal que la primera sesión se sienta más como una entrevista que como una sesión de trabajo profundo. Eso es parte del proceso.\n\nSi después de la primera sesión sientes que la conexión no fue la adecuada, está bien buscar otro terapeuta. La alianza terapéutica —esa sensación de confianza y entendimiento mutuo— es uno de los factores más importantes para que la terapia funcione.`,
      },
      {
        heading: 'Qué puedes esperar en una sesión online',
        body: `Si es tu primera sesión por videollamada, algunos consejos prácticos:\n\n- Busca un espacio privado donde no te vayan a interrumpir.\n- Usa auriculares si puedes: mejoran el audio y la privacidad.\n- Comprueba tu conexión a internet antes de la hora.\n- Ten agua cerca — hablar sobre emociones puede resecar la garganta.\n- Date 10 minutos antes para llegar tranquilo, no con prisas.\n\nEn Psiconecta las sesiones abren directamente desde el navegador, sin necesidad de instalar nada. Solo necesitas el enlace que recibirás al confirmar tu cita.`,
      },
      {
        heading: 'Después de la sesión',
        body: `Es normal sentirte un poco removido después de hablar de temas importantes. Date espacio para procesar: no programes algo intenso justo después. Si surgen pensamientos o emociones entre sesiones, puedes anotarlos para compartirlos con tu terapeuta en el próximo encuentro.\n\nLa terapia es un proceso gradual. Una sesión raramente cambia todo — pero el cambio empieza desde el primer día que decides ir.`,
      },
    ],
  },
]

export const getBlogPost = slug => BLOG_POSTS.find(p => p.slug === slug)

export const getRelatedPosts = (currentSlug, count = 2) =>
  BLOG_POSTS.filter(p => p.slug !== currentSlug).slice(0, count)
