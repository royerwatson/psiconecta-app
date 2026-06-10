/**
 * Helper compartido: envío de push notifications vía FCM HTTP v1.
 *
 * Secret requerido en Supabase:
 *   FCM_SERVICE_ACCOUNT — JSON completo de la service account de Firebase
 *   (Firebase Console → Project Settings → Service accounts → Generate new private key)
 *
 * Uso desde cualquier Edge Function:
 *   import { sendPushToUser } from '../_shared/push.ts'
 *   await sendPushToUser(adminClient, userId, {
 *     title: 'Nuevo mensaje',
 *     body: 'Tienes un mensaje de tu terapeuta',
 *     route: '/patient/chat',
 *   })
 *
 * Es best-effort: nunca lanza — si FCM no está configurado o falla,
 * devuelve { sent: 0 } y la función que la llama sigue su flujo normal.
 */

interface PushPayload {
  title: string
  body: string
  route?: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

function base64url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** OAuth2 access token a partir de la service account (JWT RS256) */
async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.token

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  // Importar la private key PEM (PKCS8)
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const keyData = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  )
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`)),
  )
  const jwt = `${header}.${claims}.${base64url(signature)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('FCM oauth failed: ' + JSON.stringify(data))
  cachedToken = { token: data.access_token, expiresAt: now + 3500 }
  return data.access_token
}

/**
 * Envía un push a todos los dispositivos registrados de un usuario.
 * `admin` debe ser un cliente Supabase con service role.
 */
export async function sendPushToUser(
  // deno-lint-ignore no-explicit-any
  admin: any,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number }> {
  try {
    const raw = Deno.env.get('FCM_SERVICE_ACCOUNT')
    if (!raw) return { sent: 0 } // push no configurado todavía

    const sa = JSON.parse(raw)
    const { data: tokens } = await admin
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)
    if (!tokens?.length) return { sent: 0 }

    const accessToken = await getAccessToken(sa)
    const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`

    let sent = 0
    for (const { token } of tokens) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: payload.title, body: payload.body },
            data: payload.route ? { route: payload.route } : {},
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default' } } },
          },
        }),
      })
      if (res.ok) {
        sent++
      } else if (res.status === 404 || res.status === 410) {
        // Token inválido/expirado → limpiarlo
        await admin.from('device_tokens').delete().eq('token', token)
      } else {
        console.error('FCM send error:', res.status, await res.text())
      }
    }
    return { sent }
  } catch (err) {
    console.error('sendPushToUser error (best-effort):', err)
    return { sent: 0 }
  }
}
