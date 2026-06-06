const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'Psiconecta <noreply@psiconecta.app>'
const APP_URL        = Deno.env.get('APP_URL')    ?? 'https://psiconecta-app.vercel.app'

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
          <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
              Psico<span style="color:#7ec8e3;">necta</span>
            </p>
            <p style="margin:6px 0 0;font-size:13px;color:#a8d4ec;">Tu espacio de bienestar mental</p>
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
              <a href="${APP_URL}" style="color:#2d6a9f;text-decoration:none;">Abrir la app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(text: string, url: string, color = '#2d6a9f') {
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

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:14px;padding:20px;margin-bottom:28px;">
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

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:14px;padding:20px;margin-bottom:28px;">
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
}: {
  recipientName: string
  otherPersonName: string
  role: 'patient' | 'therapist'
  date: string
  time: string
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
    </div>` : ''}
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

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:14px;padding:20px;margin-bottom:28px;">
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
  const color = isNew ? '#2d6a9f' : '#94a3b8'
  const title = isNew ? 'Nueva sesión asignada 📅' : 'Sesión reasignada'
  const subtitle = isNew
    ? `Hola ${therapistName}, un paciente te ha seleccionado como su nuevo terapeuta.`
    : `Hola ${therapistName}, el siguiente paciente ha cambiado de terapeuta. Esta sesión ya no está en tu agenda.`

  return baseLayout(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">${title}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#64748b;">${subtitle}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:14px;padding:20px;margin-bottom:28px;">
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

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:14px;padding:20px;margin-bottom:28px;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Plan', 'Suscripción Pro')}
          ${infoRow('Monto', '$50.00 USD')}
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
          ${infoRow('Plan', 'Suscripción Pro — $50.00 USD/mes')}
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

    <div style="background:#f0f7ff;border-left:4px solid #2d6a9f;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:15px;color:#334155;font-style:italic;">"${preview}"</p>
    </div>

    <div style="text-align:center;">
      ${btn('Responder', chatUrl)}
    </div>
  `)
}
