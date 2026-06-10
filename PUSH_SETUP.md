# Push Notifications — Guía de configuración

Código ya integrado:

- `src/lib/pushNotifications.js` — registro del dispositivo, guarda token en `device_tokens`, navegación al tocar la notificación. Se inicializa en `Layout.jsx` al iniciar sesión (no-op en web).
- `supabase/migration_device_tokens.sql` — tabla de tokens con RLS (**ejecutar**).
- `supabase/functions/_shared/push.ts` — envío vía FCM HTTP v1, limpia tokens expirados.
- Integrado en `notify-new-message` (mensajes de chat) y `send-reminders` (recordatorios 24h/1h). Best-effort: si FCM no está configurado, todo sigue funcionando solo con email.

## Pasos de configuración externa

### 1. Firebase (ambas plataformas usan FCM)

1. Crear proyecto en console.firebase.google.com (gratis, plan Spark).
2. Project Settings → Service accounts → **Generate new private key** → descarga un JSON.
3. Supabase → Settings → Edge Functions → Secrets:
   - `FCM_SERVICE_ACCOUNT` = contenido completo del JSON (pegado tal cual).

### 2. Android

1. En Firebase: Add app → Android → package `com.psiconecta.app`.
2. Descargar `google-services.json` → colocarlo en `android/app/`.
3. `npm run cap:sync` y rebuild en Android Studio.

### 3. iOS (requiere Apple Developer activo)

1. developer.apple.com → Certificates → Keys → crear **APNs Auth Key** (.p8).
2. En Firebase: Project Settings → Cloud Messaging → Apple app configuration → subir la key .p8 (con Key ID y Team ID).
3. En Firebase: Add app → iOS → bundle `com.psiconecta.app` → descargar `GoogleService-Info.plist` → añadirlo al proyecto en Xcode.
4. En Xcode: target Psiconecta → Signing & Capabilities → **+ Capability** → "Push Notifications" y "Background Modes → Remote notifications".

### 4. Desplegar funciones actualizadas

```bash
supabase functions deploy notify-new-message
supabase functions deploy send-reminders
```

### 5. Probar

1. Ejecutar `migration_device_tokens.sql` en Supabase.
2. Build nativa (`npm run cap:sync`, abrir en device real — push no funciona en simulador iOS).
3. Iniciar sesión → aceptar permiso → verificar fila en `device_tokens`.
4. Enviar un mensaje de chat desde otra cuenta → debe llegar la push.

## Extender a otros eventos

Cualquier Edge Function puede enviar push con 3 líneas:

```ts
import { sendPushToUser } from '../_shared/push.ts'
// ...
await sendPushToUser(supabaseAdmin, userId, {
  title: 'Título', body: 'Cuerpo', route: '/patient/dashboard',
})
```

Candidatos: confirmación de cita (`capture-paypal-order`), cancelación
(`notify-cancellation`), resultado de test (`notify-test-result`), alerta
de riesgo IA al terapeuta (`ai-checkin`).
