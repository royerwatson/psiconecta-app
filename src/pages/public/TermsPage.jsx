import LegalPage, { Section, P, Ul, Highlight } from './LegalPage'

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos de Uso"
      subtitle="Condiciones que rigen el uso de la plataforma Psiconecta."
      updated="6 de junio de 2026"
      url="/terminos"
    >
      <Highlight>
        Al crear una cuenta o usar Psiconecta, aceptas estos términos. Si no estás de acuerdo, no debes usar la plataforma.
      </Highlight>

      <div className="mt-8">
        <Section title="1. Qué es Psiconecta">
          <P>Psiconecta es una plataforma digital que conecta a pacientes con psicólogos y terapeutas verificados en República Dominicana. Facilitamos el agendamiento de sesiones de psicoterapia por videollamada, así como la comunicación entre pacientes y terapeutas.</P>
          <P>Psiconecta no es un proveedor de servicios de salud mental. Los servicios terapéuticos son prestados directamente por los terapeutas registrados, quienes son profesionales independientes con licencia para ejercer.</P>
        </Section>

        <Section title="2. Elegibilidad">
          <P>Para usar Psiconecta debes:</P>
          <Ul items={[
            'Tener al menos 18 años de edad.',
            'Proporcionar información veraz y completa al registrarte.',
            'No estar inhabilitado para usar la plataforma por violaciones previas de estos términos.',
          ]} />
          <P>Si eres terapeuta, debes además contar con título profesional válido, exequátur vigente y acreditación del Colegio Dominicano de Psicólogos.</P>
        </Section>

        <Section title="3. Cuentas de usuario">
          <P>Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta. Debes notificarnos de inmediato ante cualquier uso no autorizado.</P>
          <P>Psiconecta se reserva el derecho de suspender o eliminar cuentas que violen estos términos, proporcionen información falsa o sean utilizadas de forma fraudulenta.</P>
        </Section>

        <Section title="4. Servicios de terapia">
          <P>Los terapeutas en Psiconecta son profesionales independientes. Psiconecta verifica sus credenciales, pero no supervisa ni controla el contenido clínico de las sesiones.</P>
          <P>Psiconecta no es un servicio de emergencias. Si estás experimentando una crisis de salud mental o existe riesgo para tu vida o la de otros, contacta de inmediato a los servicios de emergencia de tu país o dirígete al centro de salud más cercano.</P>
          <Ul items={[
            'Las sesiones tienen una duración acordada entre paciente y terapeuta.',
            'El paciente debe conectarse a tiempo. El terapeuta no está obligado a extender la sesión por retrasos del paciente.',
            'El terapeuta puede finalizar una sesión ante conductas inapropiadas o amenazantes.',
          ]} />
        </Section>

        <Section title="5. Pagos y comisiones">
          <P>Los pagos se procesan a través de PayPal. Al pagar, aceptas los términos de servicio de PayPal aplicables.</P>
          <P>Psiconecta cobra una comisión sobre el valor de cada sesión como contraprestación por el uso de la plataforma: 20% para el plan Gratuito y 10% para el plan Suscripción. El porcentaje restante corresponde al terapeuta.</P>
          <P>Los terapeutas con plan Suscripción pagan adicionalmente $79.99 USD mensuales por acceso a herramientas clínicas avanzadas y comisión reducida.</P>
        </Section>

        <Section title="6. Cancelaciones y reembolsos">
          <P>La política de cancelación y reembolso se describe en detalle en nuestra <a href="/reembolsos" className="text-primary-600 font-semibold hover:underline">Política de Reembolsos</a>. En resumen:</P>
          <Ul items={[
            'Cancelación con más de 24 horas de anticipación: reembolso del 100%.',
            'Cancelación entre 2 y 24 horas antes: reembolso del 50%.',
            'Cancelación con menos de 2 horas: sin reembolso.',
          ]} />
        </Section>

        <Section title="7. Conducta del usuario">
          <P>Al usar Psiconecta, te comprometes a no:</P>
          <Ul items={[
            'Proporcionar información falsa sobre tu identidad o condición.',
            'Acosar, amenazar o intimidar a otros usuarios o terapeutas.',
            'Usar la plataforma para fines ilegales o no autorizados.',
            'Intentar acceder a cuentas o datos de otros usuarios.',
            'Compartir el acceso a sesiones con terceros no autorizados.',
            'Grabar sesiones sin el consentimiento expreso del terapeuta.',
          ]} />
        </Section>

        <Section title="8. Propiedad intelectual">
          <P>Todo el contenido de Psiconecta — incluyendo diseño, logotipo, textos, software y herramientas clínicas — es propiedad de Psiconecta o sus licenciantes. No puedes copiar, modificar, distribuir ni usar este contenido sin autorización escrita.</P>
        </Section>

        <Section title="9. Limitación de responsabilidad">
          <P>Psiconecta no se hace responsable por:</P>
          <Ul items={[
            'El contenido clínico o la calidad de los servicios prestados por los terapeutas.',
            'Decisiones tomadas por el paciente basadas en las sesiones.',
            'Interrupciones del servicio por causas técnicas ajenas a nuestro control.',
            'Daños indirectos, incidentales o consecuentes derivados del uso de la plataforma.',
          ]} />
        </Section>

        <Section title="10. Modificaciones">
          <P>Psiconecta puede modificar estos términos en cualquier momento. Te notificaremos por correo electrónico ante cambios importantes. El uso continuado de la plataforma tras la notificación implica aceptación de los nuevos términos.</P>
        </Section>

        <Section title="11. Ley aplicable">
          <P>Estos términos se rigen por las leyes de la República Dominicana. Cualquier disputa se resolverá ante los tribunales competentes del Distrito Nacional, Santo Domingo.</P>
        </Section>

        <Section title="12. Contacto">
          <P>Para preguntas sobre estos términos, escríbenos a <a href="mailto:legal@psiconecta.app" className="text-primary-600 font-semibold hover:underline">legal@psiconecta.app</a>.</P>
        </Section>
      </div>
    </LegalPage>
  )
}
