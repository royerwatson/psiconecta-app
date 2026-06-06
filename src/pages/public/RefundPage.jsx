import LegalPage, { Section, P, Ul, Highlight } from './LegalPage'

export default function RefundPage() {
  return (
    <LegalPage
      title="Política de Reembolsos"
      subtitle="Condiciones para cancelaciones y devoluciones de pago en Psiconecta."
      updated="6 de junio de 2026"
      url="/reembolsos"
    >
      <Highlight>
        Entendemos que los imprevistos ocurren. Nuestra política busca ser justa tanto para el paciente como para el terapeuta.
      </Highlight>

      <div className="mt-8">
        <Section title="1. Cancelación de sesiones individuales">
          <P>El derecho a reembolso depende de con cuánta anticipación se cancela la cita:</P>

          <div className="space-y-3 mt-2">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">100%</span>
              </div>
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Más de 24 horas de anticipación</p>
                <p className="text-green-700 dark:text-green-400 text-sm mt-0.5">Reembolso completo. El monto íntegro es devuelto al método de pago original.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">50%</span>
              </div>
              <div>
                <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">Entre 2 y 24 horas de anticipación</p>
                <p className="text-orange-700 dark:text-orange-400 text-sm mt-0.5">Reembolso parcial del 50%. El terapeuta retiene el 50% restante por el tiempo reservado.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">0%</span>
              </div>
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Menos de 2 horas de anticipación</p>
                <p className="text-red-700 dark:text-red-400 text-sm mt-0.5">Sin reembolso. El tiempo ya fue bloqueado en la agenda del terapeuta.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="2. Cómo solicitar la cancelación">
          <P>Para cancelar una cita y activar el reembolso correspondiente:</P>
          <Ul items={[
            'Ve a "Mis citas" en tu panel de paciente.',
            'Selecciona la cita que deseas cancelar.',
            'Haz clic en "Cancelar cita" e indica el motivo.',
            'El sistema calculará automáticamente el porcentaje de reembolso según el tiempo restante.',
            'Confirma la cancelación para iniciar el proceso.',
          ]} />
          <P>El reembolso se procesará a través de PayPal en un plazo de 3 a 7 días hábiles, dependiendo del banco emisor.</P>
        </Section>

        <Section title="3. Cancelaciones por parte del terapeuta">
          <P>Si el terapeuta cancela una sesión confirmada por cualquier motivo, el paciente recibirá un reembolso del 100% del valor pagado, independientemente de cuándo se produzca la cancelación.</P>
          <P>En caso de cancelaciones reiteradas por parte del terapeuta, Psiconecta revisará el caso y podrá tomar medidas sobre la cuenta del terapeuta.</P>
        </Section>

        <Section title="4. Sesiones urgentes">
          <P>Las citas urgentes (agendadas con menos de 24 horas de anticipación) tienen un cargo adicional del 30% sobre el precio base del terapeuta. En caso de cancelación:</P>
          <Ul items={[
            'El 30% de urgencia no es reembolsable bajo ninguna circunstancia.',
            'El monto base sigue la política estándar de reembolso según el tiempo de anticipación.',
          ]} />
        </Section>

        <Section title="5. Suscripción Plan Pro (terapeutas)">
          <P>La suscripción mensual de $50 USD para el Plan Pro es no reembolsable una vez procesada. Sin embargo:</P>
          <Ul items={[
            'Puedes cancelar en cualquier momento desde tu panel de suscripción.',
            'El acceso a las herramientas Pro se mantiene activo hasta el fin del período pagado.',
            'No se realizan cobros automáticos tras la cancelación.',
          ]} />
        </Section>

        <Section title="6. Disputas y casos especiales">
          <P>Si consideras que tu reembolso no se procesó correctamente, o si ocurrió alguna situación especial (falla técnica, imposibilidad de conexión por causas ajenas al paciente, etc.), puedes contactarnos:</P>
          <Ul items={[
            'Correo: reembolsos@psiconecta.app',
            'Plazo para reportar una disputa: 7 días calendario desde la fecha de la sesión.',
            'Resolución estimada: 5 días hábiles tras recibir la solicitud.',
          ]} />
          <P>Psiconecta se reserva el derecho de evaluar cada caso individualmente y tomar la decisión que considere más justa para ambas partes.</P>
        </Section>

        <Section title="7. Fraude y abuso">
          <P>El uso indebido de la política de reembolsos (cancelaciones sistemáticas, solicitudes fraudulentas, etc.) puede resultar en la suspensión permanente de la cuenta.</P>
        </Section>

        <Section title="8. Contacto">
          <P>Para cualquier consulta sobre pagos o reembolsos: <a href="mailto:reembolsos@psiconecta.app" className="text-primary-600 font-semibold hover:underline">reembolsos@psiconecta.app</a></P>
        </Section>
      </div>
    </LegalPage>
  )
}
