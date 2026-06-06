import LegalPage, { Section, P, Ul, Highlight } from './LegalPage'

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidad"
      subtitle="Cómo recopilamos, usamos y protegemos tu información personal."
      updated="6 de junio de 2026"
      url="/privacidad"
    >
      <Highlight>
        En Psiconecta tratamos datos de salud mental — información especialmente sensible. Nos tomamos tu privacidad muy en serio y nunca vendemos ni compartimos tus datos con fines publicitarios.
      </Highlight>

      <div className="mt-8">
        <Section title="1. Responsable del tratamiento">
          <P>Psiconecta, plataforma operada desde República Dominicana, es responsable del tratamiento de tus datos personales conforme a lo establecido en la Ley 172-13 sobre Protección de Datos Personales de la República Dominicana.</P>
          <P>Contacto del responsable: <a href="mailto:privacidad@psiconecta.app" className="text-primary-600 font-semibold hover:underline">privacidad@psiconecta.app</a></P>
        </Section>

        <Section title="2. Datos que recopilamos">
          <P><strong className="font-semibold text-slate-800 dark:text-slate-200">Datos que tú nos proporcionas:</strong></P>
          <Ul items={[
            'Información de registro: nombre (o iniciales si usas modo anónimo), correo electrónico, contraseña.',
            'Información de perfil: foto de perfil, fecha de nacimiento, país.',
            'Información de pago: procesada directamente por PayPal — no almacenamos datos de tarjetas.',
            'Contenido de sesiones: notas de bienestar, check-ins diarios, tareas asignadas por el terapeuta.',
            'Credenciales profesionales (terapeutas): título, exequátur, acreditación del Colegio Psicológico.',
          ]} />
          <P><strong className="font-semibold text-slate-800 dark:text-slate-200">Datos generados automáticamente:</strong></P>
          <Ul items={[
            'Dirección IP y datos del dispositivo al conectarte.',
            'Registros de uso: páginas visitadas, funciones utilizadas, frecuencia de sesiones.',
            'Resultados de evaluaciones psicométricas completadas en la plataforma.',
          ]} />
        </Section>

        <Section title="3. Cómo usamos tus datos">
          <Ul items={[
            'Prestación del servicio: crear tu cuenta, conectarte con terapeutas y gestionar sesiones.',
            'Seguridad: detectar y prevenir fraudes, accesos no autorizados y abusos.',
            'Mejora del servicio: análisis agregado y anonimizado del uso de la plataforma.',
            'Comunicaciones: recordatorios de sesión, alertas de riesgo al terapeuta (solo con tu consentimiento), actualizaciones del servicio.',
            'Cumplimiento legal: cuando sea requerido por ley o autoridad competente.',
          ]} />
          <P>Nunca usamos tus datos para publicidad de terceros ni los vendemos a ninguna empresa.</P>
        </Section>

        <Section title="4. Datos de salud mental">
          <P>El contenido de tus sesiones, check-ins, diario personal y resultados de tests son datos de salud especialmente protegidos. Solo tienen acceso a ellos:</P>
          <Ul items={[
            'Tú mismo/a.',
            'El terapeuta que te atiende (solo los datos relacionados contigo).',
            'Nuestro equipo técnico, únicamente para mantenimiento y seguridad, bajo estricto deber de confidencialidad.',
          ]} />
          <P>Las videollamadas no son grabadas ni almacenadas por Psiconecta. Se realizan a través de Daily.co con cifrado de extremo a extremo.</P>
        </Section>

        <Section title="5. Modo anónimo">
          <P>Si activas el modo anónimo, tu terapeuta solo verá tus iniciales en lugar de tu nombre completo. Sin embargo, Psiconecta sí mantiene internamente la asociación entre tu cuenta y tu identidad real para garantizar la seguridad del servicio y el cumplimiento legal.</P>
        </Section>

        <Section title="6. Compartición de datos con terceros">
          <P>Solo compartimos datos con terceros en los siguientes casos:</P>
          <Ul items={[
            'PayPal: para procesar pagos. Consulta la política de privacidad de PayPal.',
            'Daily.co: para las videollamadas. Solo transmiten la sesión, no la almacenan.',
            'Supabase: proveedor de infraestructura de base de datos (servidores en la UE).',
            'Resend: para el envío de correos transaccionales.',
            'Autoridades: cuando sea obligatorio por orden judicial o requerimiento legal.',
          ]} />
        </Section>

        <Section title="7. Seguridad">
          <P>Implementamos medidas técnicas y organizativas para proteger tus datos:</P>
          <Ul items={[
            'Cifrado en tránsito (HTTPS/TLS) para toda la comunicación.',
            'Cifrado en reposo para datos clínicos sensibles.',
            'Control de acceso por roles: cada usuario solo accede a los datos que le corresponden.',
            'Políticas de seguridad a nivel de base de datos (Row Level Security en Supabase).',
            'Revisiones periódicas de seguridad.',
          ]} />
        </Section>

        <Section title="8. Tus derechos">
          <P>Tienes derecho a:</P>
          <Ul items={[
            'Acceder a tus datos personales que tenemos almacenados.',
            'Rectificar datos incorrectos o incompletos.',
            'Solicitar la eliminación de tu cuenta y datos asociados.',
            'Oponerte al tratamiento de tus datos para determinados fines.',
            'Portabilidad: recibir tus datos en formato legible por máquina.',
          ]} />
          <P>Para ejercer estos derechos, escríbenos a <a href="mailto:privacidad@psiconecta.app" className="text-primary-600 font-semibold hover:underline">privacidad@psiconecta.app</a>. Responderemos en un plazo máximo de 15 días hábiles.</P>
        </Section>

        <Section title="9. Retención de datos">
          <P>Conservamos tus datos mientras tu cuenta esté activa. Al solicitar la eliminación de tu cuenta:</P>
          <Ul items={[
            'Tus datos personales identificables se eliminan en un plazo de 30 días.',
            'Los registros de transacciones se conservan 7 años por obligación fiscal.',
            'Los datos anonimizados pueden conservarse para análisis estadísticos.',
          ]} />
        </Section>

        <Section title="10. Cookies">
          <P>Psiconecta utiliza cookies esenciales para el funcionamiento de la plataforma (autenticación, preferencias de idioma y modo oscuro). No utilizamos cookies de rastreo publicitario de terceros.</P>
        </Section>

        <Section title="11. Cambios a esta política">
          <P>Podemos actualizar esta política periódicamente. Te notificaremos por correo electrónico ante cambios significativos. La fecha de última actualización siempre estará visible en esta página.</P>
        </Section>

        <Section title="12. Contacto">
          <P>Para cualquier consulta sobre privacidad o protección de datos: <a href="mailto:privacidad@psiconecta.app" className="text-primary-600 font-semibold hover:underline">privacidad@psiconecta.app</a></P>
        </Section>
      </div>
    </LegalPage>
  )
}
