/**
 * Push notifications nativas (Capacitor + FCM/APNs).
 *
 * - Solo actúa en iOS/Android (no-op en web).
 * - Pide permiso, registra el dispositivo y guarda el token en
 *   `device_tokens` (RLS: cada usuario solo ve los suyos).
 * - Al tocar una notificación navega a la ruta indicada en data.route.
 *
 * Requiere configuración nativa (ver PUSH_SETUP.md):
 *   Android: google-services.json del proyecto Firebase
 *   iOS: capability Push Notifications + APNs key subida a Firebase
 */
import { Capacitor } from '@capacitor/core'
import { supabase } from '@/lib/supabase'

let initialized = false

export async function initPushNotifications(userId, navigate) {
  if (!Capacitor.isNativePlatform() || !userId || initialized) return

  // Import dinámico: el plugin no existe en web
  const { PushNotifications } = await import('@capacitor/push-notifications')

  let perm = await PushNotifications.checkPermissions()
  if (perm.receive === 'prompt') {
    perm = await PushNotifications.requestPermissions()
  }
  if (perm.receive !== 'granted') return

  initialized = true

  // Token nuevo o renovado → guardarlo asociado al usuario
  await PushNotifications.addListener('registration', async ({ value: token }) => {
    await supabase.from('device_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Capacitor.getPlatform(), // 'ios' | 'android'
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' }
    )
  })

  await PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err)
  })

  // Tap en la notificación → navegar a la ruta indicada por el backend
  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const route = action.notification?.data?.route
    if (route && navigate) navigate(route)
  })

  await PushNotifications.register()
}

/** Eliminar el token al cerrar sesión (no recibir push de otra cuenta) */
export async function teardownPushNotifications() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    await PushNotifications.removeAllListeners()
    initialized = false
  } catch (_e) { /* noop */ }
}
