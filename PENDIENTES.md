# PENDIENTES — Problemas conocidos y mejoras futuras

Última actualización: 2026-05-31

---

## Resueltos en este sprint

| # | Problema | Commit |
|---|----------|--------|
| 1 | API Key Daily.co expuesta en el cliente | `9ce9bb4` — Edge Function `create-daily-room` |
| 2 | Sesiones grupales con `max_participants: 2` | `9ce9bb4` — query param `?type=group&max=N` |
| 3 | `TherapistProfileView` inserción directa sin PayPal | `9ce9bb4` — ahora usa `<PayPalButton>` |
| 4 | Conteo de pacientes incluye duplicados | `9ce9bb4` — `COUNT(DISTINCT)` via Set |
| 5 | Imagen de avatar no se sincroniza | `9ce9bb4` — `fetchProfile()` post-upload |
| 6 | Chat sin indicador de mensajes no leídos | `9ce9bb4` — `read_at` + badge + `mark_messages_read` |

---

## Pendientes de infraestructura (requieren acceso externo)

### 1. Ejecutar migración SQL en Supabase
**Archivo:** `sql/014_messages_read_at.sql`

Agregar `read_at` a `messages` y crear la RPC `mark_messages_read`.

```bash
supabase db push
# o en el dashboard: SQL Editor → ejecutar 014_messages_read_at.sql
```

---

### 2. Variables de entorno de producción
Configurar en Supabase Dashboard → Edge Functions → Secrets:

| Variable | Descripción |
|----------|-------------|
| `DAILY_API_KEY` | API Key de Daily.co (ya no se usa en el cliente) |
| `PAYPAL_CLIENT_ID` | Client ID de PayPal |
| `PAYPAL_CLIENT_SECRET` | Secret de PayPal |
| `PAYPAL_BASE_URL` | `https://api-m.sandbox.paypal.com` (sandbox) o producción |
| `RESEND_API_KEY` | Para envío de emails (notify-new-message, etc.) |
| `ANTHROPIC_API_KEY` | Para la Edge Function ai-checkin |

Y en el `.env` del frontend:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_PAYPAL_CLIENT_ID=...
# VITE_DAILY_API_KEY ya no es necesaria (movida a Edge Function)
```

---

### 3. Desplegar Edge Functions pendientes
```bash
supabase functions deploy create-daily-room
supabase functions deploy create-paypal-order
supabase functions deploy capture-paypal-order
supabase functions deploy notify-new-message
supabase functions deploy ai-checkin
```

---

### 4. Instalar dependencias npm
```bash
npm install
# Instalará lucide-react ^0.469.0 (recién agregado al package.json)
```

---

## Mejoras de producto (baja urgencia)

### 5. VideoCall: sin reconexión automática si se corta la red
Escuchar `network-quality-change` de Daily.co y mostrar banner con opción "Reconectar".

---

### 6. Sin paginación en la lista de mensajes
`fetchMessages` limita a 100 mensajes. Para conversaciones largas, implementar scroll infinito inverso con `.range()` de Supabase.

---

### 7. Estado "En línea" hardcodeado en el chat
El indicador verde siempre muestra "Sesión activa". Implementar Supabase Presence o simplemente eliminar el indicador.

---

*Para resolver cualquiera de estos puntos, contactar al equipo o abrir un issue en el repositorio.*
