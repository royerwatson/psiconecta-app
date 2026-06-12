# Staging — Configuración del segundo proyecto Supabase

Objetivo: un entorno idéntico a producción pero con **PayPal sandbox**, conectado
a los **Vercel Previews** (rama `dev`). Producción queda libre para pasar a PayPal live.

## 1. Crear el proyecto Supabase de staging (~5 min)

1. supabase.com → New project → organización actual → nombre `psiconecta-staging`
   → plan **Free** → misma región que producción (us-east-1 probablemente) → Create.
2. Espera a que aprovisione. Anota: **Project ref** (en la URL), **anon key** y
   **URL** (Settings → API).

## 2. Esquema de base de datos

SQL Editor del proyecto staging → pegar y ejecutar **`supabase/STAGING_SCHEMA.sql`**
completo (réplica de producción: tablas, triggers, RLS, storage, funciones RPC y
catálogo psicométrico). Si un bloque falla, anota el error + el `[archivo]` del
encabezado más cercano y repórtalo.

Verificación rápida:
```sql
SELECT count(*) FROM tests;                          -- ~45 tests del seed
SELECT proname FROM pg_proc WHERE proname IN
  ('is_admin','is_pro_therapist','get_public_reviews','handle_new_user');  -- 4 filas
SELECT policyname FROM pg_policies WHERE tablename='messages';            -- 4 políticas
```

## 3. Edge Functions en staging

Desde la carpeta del proyecto (sustituye `<STAGING_REF>` por el project ref):

```bash
supabase functions deploy admin-toggle-user ai-checkin capture-paypal-order capture-subscription-payment clinical-content create-daily-room create-paypal-order create-subscription-order delete-user-data notify-cancellation notify-new-message notify-reschedule notify-test-result notify-therapist-change notify-welcome paypal-webhook process-payout process-refund verify-payment --project-ref <STAGING_REF>
supabase functions deploy send-reminders --no-verify-jwt --project-ref <STAGING_REF>
```

## 4. Secrets de staging

```bash
supabase secrets set --project-ref <STAGING_REF> \
  PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com" \
  PAYPAL_CLIENT_ID="<client id SANDBOX>" \
  PAYPAL_CLIENT_SECRET="<secret SANDBOX>" \
  PAYPAL_WEBHOOK_SANDBOX_ID="<webhook sandbox>" \
  APP_URL="https://psiconecta.app" \
  DAILY_API_KEY="<la misma u otra sala de pruebas>" \
  ANTHROPIC_API_KEY="<la misma>" \
  RESEND_API_KEY="<la misma>" \
  FROM_EMAIL="<el mismo>" \
  CRON_SECRET="<genera uno nuevo>" \
  CLINICAL_ENCRYPTION_KEY="<genera una nueva>" \
  FCM_SERVICE_ACCOUNT="$(cat /ruta/al/service-account.json)"   # opcional en staging
```

Notas: las credenciales sandbox de PayPal son las que ya usas hoy en producción
(múdalas aquí tal cual). `APP_URL` puede quedar apuntando a producción — el CORS
ya acepta los previews `https://psiconecta-app-*.vercel.app` por código.

## 5. Variables de Preview en Vercel

Vercel → Settings → Environment Variables. Para cada una de estas, **edita** la
existente y desmarca "Preview", luego crea una nueva versión solo-Preview:

| Variable | Valor en Preview |
|----------|------------------|
| `VITE_SUPABASE_URL` | URL del proyecto staging |
| `VITE_SUPABASE_ANON_KEY` | anon key de staging |
| `VITE_PAYPAL_CLIENT_ID` | client id **sandbox** |
| `VITE_SENTRY_ENVIRONMENT` | `preview` |

(Las demás — GA, Sentry DSN — pueden compartirse entre ambos entornos.)

## 6. Auth en staging

Dashboard staging → Authentication → URL Configuration:
- Site URL: `https://psiconecta-app.vercel.app`
- Redirect URLs: añadir `https://psiconecta-app-*.vercel.app/**` y `http://localhost:3000/**`

Google/Facebook OAuth: opcional en staging (el callback apunta al dominio de
staging `<STAGING_REF>.supabase.co` — habría que añadirlo en Google/Meta).
Para pruebas basta email+password.

## 7. Flujo de trabajo desde ahora

```bash
git checkout -b dev          # una sola vez
# ... cambios ...
git push origin dev          # → Vercel crea Preview con env vars de staging
# probar en la URL del preview (pagos sandbox, datos de staging)
git checkout main && git merge dev && git push   # → producción
```

## 8. Después de validar staging → producción a PayPal live

1. PayPal Developer Dashboard (developer.paypal.com) → Apps & Credentials →
   pestaña **Live** → Create App → copiar client id + secret live.
2. En el proyecto de **producción**:
```bash
supabase secrets set PAYPAL_BASE_URL="https://api-m.paypal.com" \
  PAYPAL_CLIENT_ID="<live>" PAYPAL_CLIENT_SECRET="<live>"
```
3. Webhook live: en la app Live de PayPal → Add webhook →
   URL `https://kudldawuehduidhipvmn.supabase.co/functions/v1/paypal-webhook` →
   eventos: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`,
   `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.EXPIRED` →
   copiar el Webhook ID → `supabase secrets set PAYPAL_WEBHOOK_ID="<id>"`.
4. Vercel → `VITE_PAYPAL_CLIENT_ID` en **Production** = client id live (Preview
   conserva el sandbox).
5. Prueba de fuego: una sesión real de bajo precio con tarjeta propia + verificar
   captura, comisión, registro en `sessions` y email de confirmación. Reembolsar después.
