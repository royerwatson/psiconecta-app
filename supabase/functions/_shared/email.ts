const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'Psiconecta <noreply@psiconecta.app>'
const APP_URL        = Deno.env.get('APP_URL')    ?? 'https://psiconecta.app'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  const data = await res.json()
  if (!res.ok) console.error('Resend error:', data)
  return data
}

// ── Layout base ──────────────────────────────────────────────────
function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Psiconecta</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Open Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7e22ce 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
              Psico<span style="color:#a78bfa;">necta</span>
            </p>
            <p style="margin:6px 0 0;font-size:13px;color:#c4b5fd;">Tu espacio de bienestar mental</p>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e8f0f8;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              © 2026 Psiconecta · Tu privacidad es nuestra prioridad
            </p>
            <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">
              <a href="${APP_URL}" style="color:#4f46e5;text-decoration:none;">Abrir la app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(text: string, url: string, color = '#4f46e5') {
  return `<a href="${url}" style="display:inline-block;background:${color};color:#ffffff;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:600;text-decoration:none;margin-top:8px;">${text}</a>`
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:#64748b;width:130px;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#1e293b;font-weight:600;">${value}</td>
  </tr>`
}

// ── Plantillas ────────────────────────────────────────────────────

export function bookingConfirmationPatient({
  patientName,
  therapistName,
  date,
  time,
  price,
  isUrgent,
}: {
  patientName: string
  therapistName: string
  date: string
  time: string
  price: number
  isUrgent: boolean
}) {
  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">¡Cita confirmada! 🎉</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">Hola ${patientName}, tu sesión quedó reservada exitosamente.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Terapeuta', therapistName)}
          ${infoRow('Fecha', date)}
          ${infoRow('Hora', time)}
          ${infoRow('Total pagado', `$${price.toFixed(2)} USD`)}
          ${isUrgent ? infoRow('Tipo', '⚡ Cita urgente') : ''}
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#64748b;margin:0 0 20px;">
      Recibirás un recordatorio 24 horas antes de tu sesión. Puedes unirte a la videollamada directamente desde la app 15 minutos antes de la hora pactada.
    </p>

    <div style="text-align:center;">
      ${btn('Ver mis citas', `${APP_URL}/patient/appointments`)}
    </div>
  `)
}

export function bookingNotificationTherapist({
  therapistName,
  patientName,
  date,
  time,
  price,
  isUrgent,
}: {
  therapistName: string
  patientName: string
  date: string
  time: string
  price: number
  isUrgent: boolean
}) {
  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">Nueva cita agendada 📅</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">Hola ${therapistName}, tienes una nueva sesión programada.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Paciente', patientName)}
          ${infoRow('Fecha', date)}
          ${infoRow('Hora', time)}
          ${infoRow('Honorario', `$${price.toFixed(2)} USD`)}
          ${isUrgent ? infoRow('Tipo', '⚡ Cita urgente') : ''}
        </table>
      </td></tr>
    </table>

    <div style="text-align:center;">
      ${btn('Ver mi agenda', `${APP_URL}/therapist/schedule`)}
    </div>
  `)
}

export function reminderEmail({
  recipientName,
  otherPersonName,
  role,
  date,
  time,
}: {
  recipientName: string
  otherPersonName: string
  role: 'patient' | 'therapist'
  date: string
  time: string
}) {
  const dashUrl = role === 'therapist'
    ? `${APP_URL}/therapist/dashboard`
    : `${APP_URL}/patient/appointments`

  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">Recordatorio de sesión ⏰</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      Hola ${recipientName}, te recordamos que tienes una sesión <strong>mañana</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9e7;border:1px solid #fde68a;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow(role === 'patient' ? 'Terapeuta' : 'Paciente', otherPersonName)}
          ${infoRow('Fecha', date)}
          ${infoRow('Hora', time)}
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#64748b;margin:0 0 20px;">
      Puedes unirte a la videollamada desde la app 15 minutos antes de la sesión.
    </p>

    <div style="text-align:center;">
      ${btn('Abrir Psiconecta', dashUrl, '#d97706')}
    </div>
  `)
}

export function cancellationEmail({
  recipientName,
  otherPersonName,
  role,
  date,
  time,
  reason,
}: {
  recipientName: string
  otherPersonName: string
  role: 'patient' | 'therapist'
  date: string
  time: string
  reason?: string
}) {
  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">Sesión cancelada</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      Hola ${recipientName}, te informamos que la siguiente sesión ha sido cancelada.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border:1px solid #fecaca;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow(role === 'patient' ? 'Terapeuta' : 'Paciente', otherPersonName)}
          ${infoRow('Fecha', date)}
          ${infoRow('Hora', time)}
        </table>
      </td></tr>
    </table>

    ${role === 'patient' ? `
    <p style="font-size:14px;color:#64748b;margin:0 0 20px;">
      Si necesitas reagendar, puedes buscar otro terapeuta disponible en la app.
    </p>
    <div style="text-align:center;">
      ${btn('Buscar terapeuta', `${APP_URL}/patient/find`, '#dc2626')}
    </div>` : reason ? `
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#92400e;">Motivo indicado por el paciente:</p>
      <p style="margin:0;font-size:14px;color:#78350f;font-style:italic;">"${reason}"</p>
    </div>
    <div style="text-align:center;">
      ${btn('Ver mi agenda', `${APP_URL}/therapist/schedule`, '#64748b')}
    </div>` : `
    <div style="text-align:center;">
      ${btn('Ver mi agenda', `${APP_URL}/therapist/schedule`, '#64748b')}
    </div>`}
  `)
}

export function therapistChangedPatientEmail({
  patientName,
  oldTherapistName,
  newTherapistName,
  date,
  time,
}: {
  patientName: string
  oldTherapistName: string
  newTherapistName: string
  date: string
  time: string
}) {
  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">Cambio de terapeuta confirmado 🔄</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      Hola ${patientName}, tu cambio de terapeuta ha sido procesado exitosamente.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Terapeuta anterior', oldTherapistName)}
          ${infoRow('Nuevo terapeuta', newTherapistName)}
          ${infoRow('Fecha de sesión', date)}
          ${infoRow('Hora', time)}
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#64748b;margin:0 0 20px;">
      Tu sesión mantiene la misma fecha y hora. El nuevo terapeuta ya fue notificado.
    </p>

    <div style="text-align:center;">
      ${btn('Ver mis citas', `${APP_URL}/patient/appointments`)}
    </div>
  `)
}

export function therapistChangedNotifyEmail({
  therapistName,
  patientName,
  date,
  time,
  isNew,
}: {
  therapistName: string
  patientName: string
  date: string
  time: string
  isNew: boolean
}) {
  const color = isNew ? '#4f46e5' : '#94a3b8'
  const title = isNew ? 'Nueva sesión asignada 📅' : 'Sesión reasignada'
  const subtitle = isNew
    ? `Hola ${therapistName}, un paciente te ha seleccionado como su nuevo terapeuta.`
    : `Hola ${therapistName}, el siguiente paciente ha cambiado de terapeuta. Esta sesión ya no está en tu agenda.`

  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">${title}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">${subtitle}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Paciente', patientName)}
          ${infoRow('Fecha', date)}
          ${infoRow('Hora', time)}
        </table>
      </td></tr>
    </table>

    ${isNew ? `<div style="text-align:center;">${btn('Ver mi agenda', `${APP_URL}/therapist/schedule`, color)}</div>` : ''}
  `)
}

export function welcomeEmail({
  name,
  role,
}: {
  name: string
  role: 'therapist' | 'client'
}) {
  const isTherapist = role === 'therapist'
  const dashUrl = isTherapist ? `${APP_URL}/therapist/dashboard` : `${APP_URL}/patient/dashboard`

  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">
      Bienvenido/a a Psiconecta, ${name} 👋
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      Tu cuenta ha sido creada exitosamente. ${isTherapist
        ? 'Estamos procesando la verificación de tus credenciales.'
        : 'Ya puedes comenzar a buscar un terapeuta.'}
    </p>

    ${isTherapist ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#4f46e5;">Primeros pasos:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('1.', 'Completa tu perfil con foto y biografía')}
          ${infoRow('2.', 'Sube tus 3 documentos de credencial')}
          ${infoRow('3.', 'Configura tu disponibilidad y precio por sesión')}
          ${infoRow('4.', 'Espera la verificación (24-48 h) para aparecer en el directorio')}
        </table>
      </td></tr>
    </table>` : `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#4f46e5;">Para comenzar:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('1.', 'Completa tu perfil')}
          ${infoRow('2.', 'Busca un terapeuta por especialidad o disponibilidad')}
          ${infoRow('3.', 'Agenda tu primera sesión')}
        </table>
      </td></tr>
    </table>`}

    <div style="text-align:center;">
      ${btn('Ir a mi dashboard', dashUrl)}
    </div>
  `)
}

export function riskAlertEmail({
  therapistName,
  patientName,
  riskLevel,
  aiMessage,
  checkinDate,
}: {
  therapistName: string
  patientName: string
  riskLevel: 'high' | 'medium'
  aiMessage: string
  checkinDate: string
}) {
  const isHigh = riskLevel === 'high'
  const color  = isHigh ? '#dc2626' : '#d97706'
  const bgColor = isHigh ? '#fff5f5' : '#fffbeb'
  const borderColor = isHigh ? '#fecaca' : '#fde68a'
  const date = new Date(checkinDate).toLocaleDateString('es-DO', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">
      ${isHigh ? '⚠️ Alerta de riesgo alto' : '⚡ Alerta de riesgo moderado'}
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;">
      Hola ${therapistName}, tu paciente <strong>${patientName}</strong> completó su check-in de bienestar y presenta señales de ${isHigh ? 'riesgo alto' : 'malestar moderado'}.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:${bgColor};border:1px solid ${borderColor};border-radius:14px;padding:20px;margin-bottom:24px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Paciente', patientName)}
          ${infoRow('Nivel de riesgo', isHigh ? 'ALTO' : 'MODERADO')}
          ${infoRow('Fecha', date)}
        </table>
        <div style="margin-top:12px;padding:12px 16px;background:#ffffff;border-radius:10px;border-left:3px solid ${color};">
          <p style="margin:0;font-size:13px;color:#475569;font-style:italic;">"${aiMessage}"</p>
        </div>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#64748b;margin:0 0 20px;">
      ${isHigh
        ? 'Se recomienda contactar a tu paciente a la brevedad posible.'
        : 'Considera revisar el check-in completo de tu paciente.'}
    </p>

    <div style="text-align:center;">
      ${btn('Ver perfil del paciente', `${APP_URL}/therapist/patients`, color)}
    </div>
  `)
}

export function testResultAvailableEmail({
  patientName,
  testName,
  therapistName,
}: {
  patientName: string
  testName: string
  therapistName: string
}) {
  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">Resultado disponible 📊</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      Hola ${patientName}, tu terapeuta <strong>${therapistName}</strong> ha compartido contigo el resultado de una evaluación.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Evaluación', testName)}
          ${infoRow('Compartido por', therapistName)}
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#64748b;margin:0 0 20px;">
      Puedes ver tu resultado completo, incluyendo las puntuaciones y las notas de tu terapeuta, directamente en la app.
    </p>

    <div style="text-align:center;">
      ${btn('Ver mis resultados', `${APP_URL}/patient/my-results`)}
    </div>
  `)
}

export function rescheduleEmail({
  recipientName,
  otherPersonName,
  role,
  oldDate,
  oldTime,
  newDate,
  newTime,
}: {
  recipientName: string
  otherPersonName: string
  role: 'patient' | 'therapist'
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
}) {
  const dashUrl = role === 'therapist'
    ? `${APP_URL}/therapist/schedule`
    : `${APP_URL}/patient/appointments`

  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">Sesion reagendada 🔄</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      Hola ${recipientName}, tu sesion con <strong>${otherPersonName}</strong> ha sido movida a una nueva fecha.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Fecha anterior', `${oldDate} a las ${oldTime}`)}
          ${infoRow('Nueva fecha', `${newDate} a las ${newTime}`)}
          ${infoRow(role === 'patient' ? 'Terapeuta' : 'Paciente', otherPersonName)}
        </table>
      </td></tr>
    </table>

    <div style="text-align:center;">
      ${btn(role === 'patient' ? 'Ver mis citas' : 'Ver mi agenda', dashUrl)}
    </div>
  `)
}

export function subscriptionActivatedEmail({
  therapistName,
  expiresAt,
}: {
  therapistName: string
  expiresAt: string
}) {
  const expiry = new Date(expiresAt).toLocaleDateString('es-DO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">¡Plan Pro activado! ⭐</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      Hola ${therapistName}, tu suscripción mensual ha sido procesada exitosamente.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Plan', 'Suscripción Pro')}
          ${infoRow('Monto', '$79.99 USD')}
          ${infoRow('Válido hasta', expiry)}
          ${infoRow('Renovación', 'Manual — recibirás un aviso 7 días antes')}
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#64748b;margin:0 0 16px;">
      Ahora tienes acceso completo a todas las herramientas clínicas:
      tests psicométricos, DSM-5-TR, CIE-11, escalas clínicas, plan de crisis,
      biblioteca terapéutica, consulta con colegas y protocolos terapéuticos.
    </p>

    <div style="text-align:center;">
      ${btn('Ir al dashboard', `${APP_URL}/therapist/dashboard`)}
    </div>
  `)
}

export function subscriptionExpiryReminderEmail({
  therapistName,
  expiresAt,
  daysLeft,
}: {
  therapistName: string
  expiresAt: string
  daysLeft: number
}) {
  const expiry = new Date(expiresAt).toLocaleDateString('es-DO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">Tu suscripción vence pronto ⚠️</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      Hola ${therapistName}, tu Plan Pro vence en <strong>${daysLeft} día${daysLeft === 1 ? '' : 's'}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9e7;border:1px solid #fde68a;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Vencimiento', expiry)}
          ${infoRow('Plan', 'Suscripción Pro — $79.99 USD/mes')}
        </table>
      </td></tr>
    </table>

    <p style="font-size:14px;color:#64748b;margin:0 0 20px;">
      Renueva tu plan para seguir accediendo a las herramientas clínicas sin interrupciones.
      Si no renuevas, tu cuenta pasará al plan Gratuito automáticamente al vencer.
    </p>

    <div style="text-align:center;">
      ${btn('Renovar ahora', `${APP_URL}/therapist/subscription`, '#d97706')}
    </div>
  `)
}

export function newMessageEmail({
  recipientName,
  senderName,
  preview,
  role,
}: {
  recipientName: string
  senderName: string
  preview: string
  role: 'patient' | 'therapist'
}) {
  const chatUrl = role === 'patient'
    ? `${APP_URL}/patient/chat`
    : `${APP_URL}/therapist/chat`

  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">Nuevo mensaje 💬</p>
    <p style="margin:0 0 24px;font-size:15px;color:#64748b;">
      Hola ${recipientName}, <strong>${senderName}</strong> te envió un mensaje.
    </p>

    <div style="background:#eef2ff;border-left:4px solid #4f46e5;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:15px;color:#334155;font-style:italic;">"${preview}"</p>
    </div>

    <div style="text-align:center;">
      ${btn('Responder', chatUrl)}
    </div>
  `)
}

export function assessmentReportEmail({
  patientName,
  instrumentFull,
  instrument,
  totalScore,
  maxScore,
  severityLabel,
  severityHex,
  dimensionScores,
  interpretation,
  normativeContext,
  recommendations,
  reportUrl,
}: {
  patientName: string
  instrumentFull: string
  instrument: string
  totalScore: number
  maxScore: number
  severityLabel: string
  severityHex: string
  dimensionScores: Array<{ name: string; pct: number }>
  interpretation: string
  normativeContext: string
  recommendations: Array<{ title: string; description: string }>
  reportUrl: string
}) {
  const dimBars = dimensionScores.map(d => `
    <tr>
      <td style="padding:6px 0;">
        <p style="margin:0 0 4px;font-size:13px;color:#475569;font-weight:600;">${d.name}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="${d.pct}%" style="background:${severityHex};height:8px;border-radius:4px;"></td>
            <td style="padding-left:8px;font-size:12px;font-weight:700;color:#1e293b;white-space:nowrap;">${d.pct}%</td>
          </tr>
        </table>
      </td>
    </tr>`).join('')

  const recCards = recommendations.map((r, i) => `
    <tr>
      <td style="padding:10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:14px 18px;">
          <tr>
            <td style="padding-right:14px;font-size:20px;width:36px;vertical-align:top;">
              ${['✅', '🔍', '🗣️', '📅'][i] ?? '💡'}
            </td>
            <td>
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#1e293b;">${r.title}</p>
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${r.description}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('')

  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#1e293b;">Tu reporte está listo, ${patientName} 📊</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      Aquí tienes el resultado completo de tu evaluación con ${instrumentFull}.
    </p>

    <!-- Score card -->
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#7e22ce 100%);border-radius:18px;padding:24px 28px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:#c4b5fd;font-weight:600;letter-spacing:1px;text-transform:uppercase;">${instrument}</p>
      <p style="margin:0;font-size:48px;font-weight:900;color:#ffffff;line-height:1;">${totalScore}<span style="font-size:22px;font-weight:600;color:#a78bfa;"> / ${maxScore}</span></p>
      <div style="display:inline-block;background:${severityHex};color:#ffffff;font-size:14px;font-weight:700;padding:6px 20px;border-radius:99px;margin-top:12px;">${severityLabel}</div>
    </div>

    <!-- Dimensiones -->
    ${dimensionScores.length > 0 ? `
    <div style="background:#f8fafc;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Desglose por dimensión</p>
      <table width="100%" cellpadding="0" cellspacing="0">${dimBars}</table>
    </div>` : ''}

    <!-- Interpretación -->
    <div style="margin-bottom:24px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Interpretación</p>
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.75;">${interpretation.replace(/\n\n/g, '</p><p style="margin:12px 0 0;font-size:14px;color:#334155;line-height:1.75;">')}</p>
    </div>

    <!-- Contexto -->
    <div style="background:#eef2ff;border-left:4px solid #4f46e5;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.5px;">Contexto</p>
      <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">${normativeContext}</p>
    </div>

    <!-- Recomendaciones -->
    <div style="margin-bottom:28px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Recomendaciones</p>
      <table width="100%" cellpadding="0" cellspacing="0">${recCards}</table>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      ${btn('Ver reporte completo en la app', reportUrl)}
    </div>
    <div style="text-align:center;">
      ${btn('Buscar terapeuta', `${APP_URL}/patient/find`, '#059669')}
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
      Este reporte es confidencial · Guárdalo para compartirlo con tu psicólogo
    </p>
  `)
}

export function giftCardEmail({
  recipientName,
  senderName,
  message,
  code,
  amountUsd,
  redeemUrl,
}: {
  recipientName: string
  senderName:    string
  message?:      string
  code:          string
  amountUsd:     number
  redeemUrl:     string
}) {
  return baseLayout(`
    <p style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1e293b;">
      🎁 Tienes un regalo, ${recipientName}
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">
      <strong>${senderName}</strong> quiere regalarte sesiones de terapia online en Psiconecta.
    </p>

    <!-- Gift card visual -->
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#7e22ce 100%);border-radius:20px;padding:32px;text-align:center;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:13px;color:#c4b5fd;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Tarjeta de regalo</p>
      <p style="margin:0 0 16px;font-size:42px;font-weight:900;color:#ffffff;">$${amountUsd} USD</p>
      <p style="margin:0 0 4px;font-size:12px;color:#a78bfa;">De ${senderName} → Para ${recipientName}</p>
      <div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 24px;display:inline-block;margin-top:16px;">
        <p style="margin:0;font-size:11px;color:#c4b5fd;letter-spacing:1px;">CÓDIGO DE CANJE</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:4px;">${code}</p>
      </div>
    </div>

    ${message ? `
    <!-- Mensaje personal -->
    <div style="background:#eef2ff;border-left:4px solid #4f46e5;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 6px;font-size:12px;color:#6366f1;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Mensaje de ${senderName}</p>
      <p style="margin:0;font-size:15px;color:#334155;font-style:italic;">"${message}"</p>
    </div>
    ` : ''}

    <!-- Instrucciones -->
    <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1e293b;">¿Cómo usar tu regalo?</p>
      <table cellpadding="0" cellspacing="0">
        ${[
          ['1.', 'Crea una cuenta gratuita en Psiconecta (o inicia sesión si ya tienes una)'],
          ['2.', 'Ve a tu perfil → "Canjear código de regalo"'],
          ['3.', `Ingresa el código <strong>${code}</strong>`],
          ['4.', 'Usa tu crédito para reservar con el terapeuta que elijas'],
        ].map(([n, t]) => `<tr>
          <td style="padding:6px 12px 6px 0;font-size:14px;font-weight:800;color:#4f46e5;vertical-align:top;">${n}</td>
          <td style="padding:6px 0;font-size:14px;color:#334155;">${t}</td>
        </tr>`).join('')}
      </table>
    </div>

    <div style="text-align:center;">
      ${btn('Canjear mi regalo →', redeemUrl)}
    </div>

    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;">
      Este crédito es válido por 12 meses · Válido para cualquier terapeuta en Psiconecta
    </p>
  `)
}
