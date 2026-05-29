# PENDIENTES — Problemas conocidos y mejoras futuras

Archivo generado automáticamente durante la revisión de código (2026-05-29).
Lista de issues que requieren más contexto, infraestructura externa, o decisiones de producto para resolverse.

---

## 🔴 Críticos (afectan funcionalidad en producción)

### 1. `VITE_DAILY_API_KEY` expuesta en el cliente
**Archivo:** `src/pages/shared/VideoCall.jsx` → función `createRoom`

La sala de Daily.co se crea llamando directamente a `https://api.daily.co/v1/rooms` desde el navegador usando la API Key. Esto expone la clave en el bundle de producción (visible con DevTools).

**Solución:** Crear una Supabase Edge Function `create-daily-room` que reciba el `sessionId`, cree la sala en Daily.co usando la API Key guardada como secret, y devuelva la URL. El cliente nunca ve la clave.

---

### 2. Sesiones grupales llegan a `VideoCall` con `max_participants: 2`
**Archivo:** `src/pages/shared/VideoCall.jsx` → `createRoom` (línea ~97)
**Contexto:** `GroupSessions.jsx` redirige a `/video-call/${group.id}`, que usa el mismo componente.

El endpoint de Daily.co recibe `max_participants: 2`, por lo que solo dos personas podrán unirse a una sala pensada para grupos.

**Solución (opciones):**
- Pasar un query param `?type=group` desde `GroupSessions` y ajustar `max_participants` según corresponda.
- Crear una ruta y componente dedicado `/video-call/group/:groupId` con su propio `createRoom`.
- Almacenar `is_group` en la sesión DB y leer ese campo en `VideoCall`.

---

### 3. Edge Functions de PayPal no desplegadas
**Funciones requeridas:**
- `supabase/functions/create-paypal-order`
- `supabase/functions/capture-paypal-order`

Ambas deben existir en el proyecto Supabase y tener las variables de entorno:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_BASE_URL` (`https://api-m.sandbox.paypal.com` o producción)

Mientras no estén desplegadas, el flujo de pago fallará con un error 404.

**Verificar con:** `supabase functions list`

---

### 4. Edge Function `notify-new-message` no desplegada
**Archivo:** `src/pages/shared/ChatPage.jsx` → `sendMessage`

La notificación por email al destinatario de un mensaje llama a `/functions/v1/notify-new-message`. El error es silenciado (`catch(() => {})`) así que el chat funciona, pero los usuarios no reciben emails de nuevos mensajes.

**Solución:** Implementar y desplegar la función, o integrar con Resend/SendGrid desde un trigger de BD (más robusto).

---

## 🟡 Importantes (UX degradada)

### 5. Estado "En línea" hardcodeado en el chat
**Archivo:** `src/pages/shared/ChatPage.jsx` → línea ~294

El indicador verde siempre muestra "Sesión activa" independientemente de si el interlocutor está conectado. No existe un sistema de presencia real.

**Solución:** Implementar Supabase Presence con el canal de Realtime, o simplemente eliminar el indicador para no desinformar al usuario.

---

### 6. `TherapistProfileView.jsx` inserta sesiones saltando PayPal
**Archivo:** `src/pages/patient/TherapistProfileView.jsx`

Cuando el paciente reserva desde la vista de perfil del terapeuta, la sesión se inserta directamente en la tabla `sessions` con status `'scheduled'` sin pasar por el flujo PayPal. Esto es inconsistente con `FindTherapist.jsx` que sí usa `PayPalButton`.

**Decisión de producto necesaria:**
- ¿La reserva desde el perfil también debe pasar por pago?
- Si sí: reemplazar el `supabase.from('sessions').insert(...)` directo por el componente `<PayPalButton>` igual que en `FindTherapist`.
- Si no: documentar que este flujo es gratuito/por invitación del terapeuta.

---

### 7. Conteo de pacientes incluye duplicados
**Archivo:** `src/pages/therapist/TherapistDashboard.jsx` → consulta `patientsCount`

```js
const { count: patientsCount } = await supabase
  .from('sessions')
  .select('patient_id', { count: 'exact' })
  .eq('therapist_id', user.id)
  .eq('status', 'completed')
```

`COUNT` sin `DISTINCT` cuenta filas, no pacientes únicos. Un paciente con 5 sesiones completadas suma 5.

**Solución:** Usar una RPC/función de Postgres con `COUNT(DISTINCT patient_id)`, o hacer el conteo en el cliente con un `Set`.

---

## 🟢 Mejoras de producto (baja urgencia)

### 8. Chat: no hay indicación de "mensajes no leídos"
No existe un campo `read_at` o `is_read` en la tabla `messages`. No se puede mostrar el badge de mensajes sin leer en el sidebar ni en el layout.

**Sugerencia:** Agregar columna `read_at TIMESTAMPTZ` a `messages` y actualizar al abrir la conversación.

---

### 9. VideoCall: sin reconexión automática si se corta la red
Si el usuario pierde conectividad brevemente, el iframe de Daily.co muestra error pero no hay lógica para reconectar o reiniciar el frame.

**Sugerencia:** Escuchar el evento `network-quality-change` de Daily.co y mostrar un banner de advertencia con opción de "Reconectar".

---

### 10. Sin paginación en la lista de mensajes
`fetchMessages` limita a 100 mensajes. Conversaciones largas perderán el historial.

**Sugerencia:** Cargar más mensajes al hacer scroll hacia arriba (infinite scroll inverso) usando `.range()` de Supabase.

---

### 11. Imagen de avatar no se actualiza tras cambio en perfil
`useAuthStore.updateProfile()` actualiza el estado local, pero si el usuario sube un nuevo avatar, otros componentes que leen `profile.avatar_url` del store puede que no reflejen el cambio hasta recargar la página.

**Sugerencia:** Después de subir el avatar, llamar a `fetchProfile(user)` para sincronizar el store completo con la BD.

---

*Para resolver cualquiera de estos puntos, contactar al equipo o abrir un issue en el repositorio.*
