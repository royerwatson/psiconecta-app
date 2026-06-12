/**
 * blogPosts.js — Artículos estáticos del blog de Psiconecta.
 * Para agregar un artículo nuevo: copiar la estructura y agregarlo al array.
 * El slug debe ser único y en minúsculas con guiones.
 */

export const BLOG_POSTS = [
  {
    slug: 'como-saber-si-necesito-terapia',
    icon: 'HeartPulse',
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
    icon: 'Users',
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
    icon: 'Video',
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
    icon: 'BrainCircuit',
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
    icon: 'CalendarCheck',
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

  {
    slug: 'depresion-sintomas-causas-tratamiento',
    icon: 'CloudRain',
    title: 'Depresión: síntomas, causas y cómo se trata',
    excerpt:
      'La depresión es mucho más que tristeza. Conocer sus síntomas reales, entender por qué aparece y saber que tiene tratamiento efectivo es el primer paso para salir de ella.',
    category: 'Salud mental',
    readTime: 7,
    date: '2026-06-08',
    coverGradient: 'from-primary-500 to-accent-500',
    sections: [
      {
        heading: null,
        body: `"Es que no tengo ánimo para nada." "Duermo pero amanezco cansado." "Ya nada me ilusiona como antes." La depresión rara vez se presenta diciendo su nombre. Se disfraza de cansancio, de irritabilidad, de desinterés — y por eso muchas personas pasan meses o años sin reconocerla ni buscar ayuda. La Organización Mundial de la Salud estima que más de 280 millones de personas viven con depresión, y es una de las principales causas de discapacidad en el mundo. La buena noticia, que se repite poco: es una de las condiciones de salud mental con tratamientos más efectivos.`,
      },
      {
        heading: 'No es tristeza: cómo se ve la depresión realmente',
        body: `La tristeza es una emoción normal y pasajera. La depresión es un estado persistente que tiñe toda la experiencia. Los síntomas más frecuentes incluyen:\n\n- Estado de ánimo bajo la mayor parte del día, casi todos los días\n- Pérdida de interés o placer en actividades que antes disfrutabas (anhedonia)\n- Cambios en el sueño: insomnio o dormir demasiado\n- Cambios en el apetito y el peso\n- Fatiga o falta de energía constante\n- Dificultad para concentrarse o tomar decisiones\n- Sentimientos de culpa o inutilidad desproporcionados\n- Movimientos o pensamiento más lentos de lo habitual\n- Pensamientos recurrentes sobre la muerte\n\nPara hablar de depresión clínica, estos síntomas deben mantenerse al menos dos semanas y afectar la vida diaria. Pero no necesitas "cumplir la lista completa" para merecer ayuda.`,
      },
      {
        heading: 'En los hombres puede verse diferente',
        body: `Un dato importante para el contexto dominicano, donde a muchos hombres se les enseñó que "los hombres no lloran": la depresión masculina frecuentemente se manifiesta como irritabilidad, explosiones de ira, conductas de riesgo, aumento del consumo de alcohol o aislamiento — más que como tristeza visible. Si un hombre de tu vida cambió su carácter y "anda insoportable", puede que no sea mal genio. Puede ser depresión sin diagnosticar.`,
      },
      {
        heading: '¿Por qué aparece?',
        body: `La depresión no tiene una causa única ni es culpa de quien la sufre. Es el resultado de una combinación de factores:\n\n**Biológicos.** Cambios en neurotransmisores, predisposición genética, condiciones médicas (hipotiroidismo, dolor crónico) y hasta efectos de algunos medicamentos.\n\n**Psicológicos.** Estilos de pensamiento muy autocríticos, experiencias tempranas adversas, duelos no procesados.\n\n**Sociales.** Estrés económico sostenido, soledad, violencia, desempleo, sobrecarga de cuidados — factores muy presentes en la vida real de muchas personas.\n\nEntender esto importa por una razón: nadie sale de la depresión "echándole ganas", igual que nadie cura una fractura con fuerza de voluntad.`,
      },
      {
        heading: 'El tratamiento funciona',
        body: `La evidencia es clara: la mayoría de las personas con depresión mejoran significativamente con tratamiento adecuado.\n\n**Psicoterapia.** La terapia cognitivo-conductual y la terapia interpersonal tienen décadas de evidencia. Para depresión leve y moderada, la psicoterapia sola suele ser suficiente.\n\n**Medicación.** En depresiones moderadas a graves, los antidepresivos pueden ser necesarios y marcan una gran diferencia. Los receta un psiquiatra, tardan unas semanas en hacer efecto completo, y no son "para siempre" en la mayoría de los casos.\n\n**Cambios de base.** Reactivar el movimiento físico, regularizar el sueño y recuperar contacto social gradualmente son parte del tratamiento, no extras opcionales.\n\nLo que no funciona: esperar a que pase solo, esconderlo, o automedicarse con alcohol.`,
      },
      {
        heading: 'Si estás pasando por esto',
        body: `Si te reconociste en este artículo, el paso más importante es hablarlo con un profesional — no porque estés "loco", sino porque la depresión se trata y tú mereces estar bien. En Psiconecta puedes encontrar psicólogos verificados y empezar esta misma semana, incluso de forma anónima si eso te hace más fácil el primer paso.\n\nY algo importante: si has tenido pensamientos de hacerte daño, no esperes. Habla hoy con alguien de confianza y busca apoyo profesional de inmediato — en la sección de recursos de crisis de Psiconecta encontrarás líneas de ayuda disponibles en tu país.`,
      },
    ],
  },

  {
    slug: 'cuanto-cuesta-psicologo-republica-dominicana',
    icon: 'Wallet',
    title: '¿Cuánto cuesta un psicólogo en República Dominicana?',
    excerpt:
      'Una de las dudas más frecuentes antes de empezar terapia. Te explicamos los rangos de precios reales, qué influye en el costo y cómo hacer la terapia más accesible.',
    category: 'Guías',
    readTime: 5,
    date: '2026-06-09',
    coverGradient: 'from-accent-600 to-primary-400',
    sections: [
      {
        heading: null,
        body: `Hablemos de dinero, porque es una de las principales razones por las que las personas postergan ir a terapia. ¿Cuánto cuesta realmente ver a un psicólogo en República Dominicana? La respuesta corta: depende — pero conocer los rangos y los factores que influyen te ayudará a planificar y a encontrar una opción que se ajuste a tu bolsillo.`,
      },
      {
        heading: 'Los rangos generales',
        body: `Los precios varían considerablemente según la experiencia del profesional, su especialidad y la zona:\n\n**Consulta presencial privada.** En Santo Domingo y Santiago, una sesión con un psicólogo clínico suele moverse en un rango amplio que va desde unos RD$1,500 hasta RD$4,000 o más por sesión, dependiendo de la trayectoria del profesional y la ubicación del consultorio.\n\n**Terapia online.** Al eliminar los costos de consultorio y desplazamiento, la modalidad online suele ofrecer tarifas más accesibles y flexibles, además de abrir acceso a terapeutas fuera de tu ciudad.\n\n**Servicios públicos y universidades.** Algunos hospitales públicos y centros universitarios ofrecen atención psicológica de bajo costo o gratuita, aunque con listas de espera y disponibilidad limitada.`,
      },
      {
        heading: '¿Qué influye en el precio?',
        body: `**Formación y experiencia.** Un especialista con maestría, años de práctica y formación en abordajes específicos (trauma, terapia de pareja, TCC) generalmente cobra más.\n\n**Duración y frecuencia.** La sesión estándar dura entre 45 y 60 minutos. La frecuencia típica es semanal al inicio, espaciándose a medida que avanzas — es decir, el costo mensual baja con el progreso.\n\n**Modalidad.** Online tiende a ser más económica y te ahorra el transporte — un factor real si vives lejos o el tráfico te roba horas.\n\n**Especialidad.** Terapia individual, de pareja, infantil o evaluaciones psicológicas formales tienen tarifas distintas.`,
      },
      {
        heading: '¿La terapia es una buena inversión?',
        body: `Es la pregunta de fondo. Considera lo que cuesta NO tratarse: el insomnio que afecta tu rendimiento, la ansiedad que te hace evitar oportunidades, los conflictos que desgastan tus relaciones, las visitas médicas por síntomas físicos que en realidad son estrés. La investigación muestra consistentemente que la psicoterapia efectiva reduce costos de salud a mediano plazo y mejora la productividad y la calidad de vida.\n\nAdemás, la terapia no es para siempre: muchos procesos enfocados en un problema específico duran entre 8 y 20 sesiones.`,
      },
      {
        heading: 'Cómo hacerla más accesible',
        body: `**Compara con transparencia.** En Psiconecta cada terapeuta publica su tarifa por sesión desde su perfil — sin sorpresas ni "llame para precio". Puedes filtrar y elegir según tu presupuesto.\n\n**Pregunta por la frecuencia.** Si el presupuesto es ajustado, muchos terapeutas pueden trabajar con sesiones quincenales y tareas entre sesiones.\n\n**Empieza por lo importante.** Una primera sesión te permite evaluar al profesional y definir un plan realista antes de comprometerte a un proceso largo.\n\nLa salud mental no debería ser un lujo. Nuestra misión con Psiconecta es justamente esa: que encontrar un buen psicólogo en República Dominicana sea transparente, accesible y sin barreras.`,
      },
    ],
  },

  {
    slug: 'burnout-laboral-senales-recuperacion',
    icon: 'Flame',
    title: 'Burnout: cuando el trabajo te quema (y cómo recuperarte)',
    excerpt:
      'Agotamiento que no se cura durmiendo, cinismo hacia el trabajo y sensación de no rendir. El burnout es real, está reconocido por la OMS y tiene salida.',
    category: 'Bienestar',
    readTime: 6,
    date: '2026-06-10',
    coverGradient: 'from-accent-500 to-primary-500',
    sections: [
      {
        heading: null,
        body: `Llega el domingo en la tarde y sientes un nudo en el estómago pensando en el lunes. El trabajo que antes te motivaba ahora te drena. Duermes, pero amaneces agotado. Si esto te suena familiar, no eres "flojo" ni estás exagerando: podrías estar atravesando un síndrome de burnout, reconocido por la OMS en su clasificación CIE-11 como un fenómeno ocupacional resultado del estrés laboral crónico mal gestionado.`,
      },
      {
        heading: 'Las tres caras del burnout',
        body: `El burnout no es solo cansancio. Se define por tres dimensiones que suelen aparecer juntas:\n\n**Agotamiento extremo.** Una fatiga física y emocional que el descanso normal no repara. Te levantas cansado aunque hayas dormido.\n\n**Distancia mental y cinismo.** Empiezas a sentir desapego o negatividad hacia tu trabajo. Lo que antes te importaba ahora te da igual — o te irrita.\n\n**Sensación de ineficacia.** Sientes que rindes menos, que nada de lo que haces es suficiente, y la confianza en tus propias capacidades se erosiona.`,
      },
      {
        heading: 'Señales de alerta tempranas',
        body: `El burnout no aparece de un día para otro — se cocina a fuego lento. Presta atención si notas:\n\n- Dolores de cabeza, tensión muscular o problemas digestivos frecuentes\n- Insomnio o despertarte pensando en pendientes\n- Irritabilidad con colegas, clientes o tu propia familia\n- Dificultad para desconectar: revisas el correo a toda hora\n- Sensación de que nunca es suficiente, por mucho que hagas\n- Aumento del café para funcionar y del alcohol para "bajar"\n- Enfermarte más seguido (el estrés crónico debilita el sistema inmune)`,
      },
      {
        heading: 'Qué lo causa (pista: no es solo tuyo)',
        body: `Es importante decirlo claramente: el burnout no es un defecto personal, es la respuesta de una persona normal a condiciones anormales sostenidas. Los factores más estudiados incluyen sobrecarga crónica de trabajo, falta de control sobre tus tareas, reconocimiento insuficiente, ambientes injustos o tóxicos, y desalineación entre tus valores y lo que haces.\n\nEsto significa que la recuperación tiene dos frentes: lo que puedes cambiar en ti (límites, descanso, herramientas de gestión del estrés) y lo que hay que evaluar del entorno (carga, rol, e incluso si ese trabajo es sostenible para ti).`,
      },
      {
        heading: 'Cómo recuperarte',
        body: `**Empieza por el descanso real.** No el de ver pantallas hasta medianoche: sueño consistente, pausas verdaderas durante el día, y al menos un espacio semanal totalmente desconectado del trabajo.\n\n**Recupera límites.** Horario de cierre, notificaciones apagadas fuera de horas, aprender a decir "no puedo asumir eso ahora". Los límites no son egoísmo: son mantenimiento.\n\n**Reconecta con lo que te llena.** El burnout estrecha la vida hasta que solo queda trabajo y recuperación del trabajo. Reintroducir ejercicio, vínculos y actividades con sentido es parte del tratamiento.\n\n**Busca apoyo profesional.** Un psicólogo te ayuda a identificar los patrones que te llevaron al límite (perfeccionismo, dificultad para delegar, miedo a decepcionar) y a construir una relación más sana con el trabajo. Si el agotamiento ya se mezcla con síntomas de depresión o ansiedad, la terapia deja de ser opcional y pasa a ser prioritaria.\n\nEn Psiconecta hay terapeutas especializados en estrés laboral con horarios flexibles — incluso de noche, para agendas complicadas.`,
      },
    ],
  },

  {
    slug: 'como-ayudar-a-alguien-que-no-quiere-ir-a-terapia',
    icon: 'HeartHandshake',
    title: 'Cómo ayudar a alguien que necesita terapia pero no quiere ir',
    excerpt:
      'Ver sufrir a alguien que quieres y que rechaza la ayuda es muy duro. Estas estrategias respetuosas aumentan las probabilidades de que esa persona dé el paso.',
    category: 'Consejos',
    readTime: 6,
    date: '2026-06-11',
    coverGradient: 'from-primary-400 to-accent-600',
    sections: [
      {
        heading: null,
        body: `"Yo no estoy loco." "Eso es para gente débil." "¿Y pagar para hablar con un extraño?" Si alguien que quieres está sufriendo y responde así cuando le sugieres ayuda profesional, este artículo es para ti. No puedes obligar a nadie a ir a terapia — pero sí puedes influir mucho más de lo que crees, si sabes cómo.`,
      },
      {
        heading: 'Primero: entiende su resistencia',
        body: `Detrás del "no quiero ir" casi siempre hay algo más específico:\n\n**Estigma.** En muchas familias dominicanas, ir al psicólogo todavía se asocia con "estar loco" o ser débil. Reconocer que se necesita ayuda se siente como una derrota.\n\n**Miedo.** A ser juzgado, a remover cosas dolorosas, a descubrir algo de sí mismo que no quiere ver.\n\n**Desconocimiento.** Muchas personas no saben qué pasa en una sesión y se imaginan un interrogatorio o un diván de película.\n\n**Experiencias previas malas.** Una terapia anterior que no funcionó es razón frecuente de rechazo.\n\n**Dinero y logística.** A veces el "no quiero" es en realidad "no puedo pagarlo" o "no tengo cómo ir".\n\nIdentificar cuál es la barrera real de tu ser querido cambia completamente la conversación.`,
      },
      {
        heading: 'Lo que sí funciona',
        body: `**Elige bien el momento.** No en medio de una pelea ni cuando está alterado. Un momento tranquilo, en privado, sin público.\n\n**Habla desde ti, no sobre él.** "Te he notado muy agotado y me preocupo por ti" abre puertas. "Tú tienes un problema y necesitas ayuda" las cierra.\n\n**Valida antes de proponer.** Escucha de verdad, sin interrumpir con soluciones. Las personas aceptan ayuda de quien sienten que las entiende.\n\n**Normaliza.** Comparte si tú o alguien cercano ha ido a terapia y qué tal fue. Compara con la salud física: "si te doliera el pecho irías al médico — esto es igual de real".\n\n**Reduce la fricción.** "¿Quieres que veamos perfiles de terapeutas juntos?" es más efectivo que "deberías buscar ayuda". A veces el paso gigante de buscar, comparar y agendar es justo lo que la persona no tiene energía para hacer.\n\n**Planta la semilla y ten paciencia.** Pocas personas dicen que sí a la primera. Que la conversación termine sin acuerdo no significa que falló: el cambio se cocina entre conversaciones.`,
      },
      {
        heading: 'Lo que no funciona',
        body: `- Dar ultimátums (salvo situaciones de riesgo, donde el límite sí es necesario)\n- Diagnosticarlo: "tú lo que tienes es depresión"\n- Avergonzar: "mira cómo tienes a la familia"\n- Emboscadas grupales sorpresa\n- Insistir todos los días — produce el efecto contrario\n- Amenazar con contarle a otros\n\nY un recordatorio importante para ti: acompañar a alguien que sufre desgasta. Cuidar tu propia salud mental no es egoísmo — incluso puede ser el mejor ejemplo que puedas darle.`,
      },
      {
        heading: 'Cuándo no se puede esperar',
        body: `Si la persona habla de hacerse daño, ha dejado de comer o dormir de forma severa, o muestra señales de perder contacto con la realidad, la situación cambia: ya no se trata de respetar sus tiempos sino de protegerla. Busca ayuda profesional de inmediato, contacta líneas de crisis y no la dejes sola.\n\nPara los demás casos, recuerda que en Psiconecta el primer paso es especialmente fácil: la persona puede explorar perfiles sin compromiso, ver precios transparentes y hasta empezar de forma anónima — los terapeutas solo verían sus iniciales. Para alguien con miedo al estigma, ese detalle puede ser la diferencia entre dar el paso o no darlo.`,
      },
    ],
  },

  {
    slug: 'insomnio-ansiedad-no-puedo-dormir',
    icon: 'Moon',
    title: '"No puedo dormir": insomnio, ansiedad y cómo recuperar el sueño',
    excerpt:
      'Dar vueltas en la cama con la mente acelerada es una de las quejas más comunes en consulta. Te explicamos la relación entre sueño y salud mental, y qué hacer esta misma noche.',
    category: 'Bienestar',
    readTime: 6,
    date: '2026-06-12',
    coverGradient: 'from-primary-600 to-accent-500',
    sections: [
      {
        heading: null,
        body: `Son las 2 de la mañana. El cuerpo está agotado pero la mente no se apaga: repasa la discusión de ayer, la deuda pendiente, la lista de cosas de mañana. Miras el celular: "si me duermo ahora, me quedan 4 horas". La presión por dormir te despierta más. ¿Te suena? El insomnio afecta a una de cada tres personas en algún momento, y es a la vez síntoma y combustible de los problemas de salud mental.`,
      },
      {
        heading: 'El círculo vicioso del sueño y la ansiedad',
        body: `El insomnio y la ansiedad se alimentan mutuamente. La ansiedad activa el sistema de alerta del cuerpo — exactamente lo contrario de lo que necesitas para dormir. Y dormir mal deteriora la regulación emocional: al día siguiente todo se siente más amenazante, lo que genera más ansiedad, que esa noche vuelve a robarte el sueño.\n\nLo mismo ocurre con la depresión: el insomnio es uno de sus síntomas más frecuentes, y a la vez dormir mal de forma crónica multiplica el riesgo de desarrollarla. Por eso los profesionales tomamos el sueño tan en serio: tratarlo mejora todo lo demás.`,
      },
      {
        heading: 'Higiene del sueño: lo básico que sí funciona',
        body: `**Horario constante.** Acostarte y levantarte a la misma hora — sí, también el fin de semana. El cuerpo ama la predictibilidad.\n\n**La cama es para dormir.** No para trabajar, comer ni ver series. Tu cerebro debe asociar cama con sueño, no con actividad.\n\n**Pantallas fuera 60 minutos antes.** La luz de los dispositivos suprime la melatonina, y el contenido (noticias, redes, mensajes de trabajo) activa la mente.\n\n**Cafeína solo de mañana.** La cafeína tiene una vida media de 5-6 horas: el café de las 4 de la tarde sigue en tu sistema a las 10 de la noche.\n\n**Cuarto fresco, oscuro y silencioso.** En nuestro clima, un abanico o aire acondicionado no es lujo para dormir — es higiene del sueño.\n\n**Ejercicio, pero no de noche.** La actividad física regular es de lo más efectivo para dormir mejor, idealmente terminando 3+ horas antes de acostarte.`,
      },
      {
        heading: 'Si la mente no se apaga',
        body: `**Descarga mental antes de la cama.** Diez minutos con papel y lápiz: anota los pendientes de mañana y las preocupaciones de hoy. Lo escrito deja de necesitar ser "recordado" por una mente que no quiere soltar.\n\n**La regla de los 20 minutos.** Si llevas ~20 minutos sin dormir, levántate y haz algo aburrido y tranquilo con luz tenue hasta que vuelva el sueño. Quedarte batallando en la cama solo entrena a tu cerebro a asociar la cama con frustración.\n\n**Respiración 4-6.** Inhala en 4 tiempos, exhala lento en 6. Cinco minutos de esto activa la respuesta de relajación del cuerpo. No te dormirá por arte de magia, pero baja las revoluciones.\n\n**No mires la hora.** Calcular cuánto te queda por dormir es gasolina para la ansiedad. Voltea el reloj.`,
      },
      {
        heading: 'Cuándo buscar ayuda profesional',
        body: `Si llevas más de un mes durmiendo mal varias noches por semana, y eso afecta tu energía, ánimo o concentración, es momento de consultarlo. La buena noticia: la terapia cognitivo-conductual para el insomnio (TCC-I) es el tratamiento de primera línea recomendado internacionalmente — más efectiva a largo plazo que las pastillas para dormir, y sin sus riesgos de dependencia.\n\nY si detrás del insomnio hay ansiedad, depresión o estrés crónico, tratar la raíz es lo que devuelve el sueño de forma duradera. En Psiconecta puedes encontrar psicólogos con experiencia en ansiedad y problemas de sueño, con sesiones online en horarios que se adaptan a ti — incluso de noche.`,
      },
    ],
  },
]

export const getBlogPost = slug => BLOG_POSTS.find(p => p.slug === slug)

export const getRelatedPosts = (currentSlug, count = 2) =>
  BLOG_POSTS.filter(p => p.slug !== currentSlug).slice(0, count)
