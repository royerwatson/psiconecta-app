# 💳 Configuración de PayPal — Psiconecta

## Paso 1: Crear cuenta de desarrollador en PayPal

1. Ve a https://developer.paypal.com y entra con tu cuenta PayPal (o crea una)
2. En el dashboard → **Apps & Credentials**
3. Asegúrate de estar en **Sandbox** (modo de prueba)
4. Haz clic en **Create App** → ponle nombre "Psiconecta" → tipo **Merchant**
5. Copia:
   - **Client ID** (empieza con `AZ...` en sandbox)
   - **Client Secret** (haz clic en "Show")

## Paso 2: Agregar variables de entorno

### En tu archivo `.env` y `.env.production`:
```
VITE_PAYPAL_CLIENT_ID=TU_CLIENT_ID_AQUI
```

### En `.vercel/.env.production.local` (para el deploy):
```
VITE_PAYPAL_CLIENT_ID=TU_CLIENT_ID_AQUI
```

## Paso 3: Ejecutar la migración SQL en Supabase

1. Ve a https://supabase.com → tu proyecto → **SQL Editor**
2. Copia y pega el contenido de `supabase/migration_payments.sql`
3. Ejecuta → debe decir "Migración de pagos completada ✅"

## Paso 4: Desplegar las Edge Functions

```bash
# Enlaza tu proyecto (solo la primera vez)
npx supabase login
npx supabase link --project-ref kudldawuehduidhipvmn

# Configura los secretos (Client ID Y Secret de PayPal)
npx supabase secrets set PAYPAL_CLIENT_ID=TU_CLIENT_ID_AQUI
npx supabase secrets set PAYPAL_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
npx supabase secrets set PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
npx supabase secrets set APP_URL=https://psiconecta-app.vercel.app

# Despliega las dos funciones
npx supabase functions deploy create-paypal-order
npx supabase functions deploy capture-paypal-order
```

## Paso 5: Redesplegar en Vercel

```bash
npx vercel build --prod && npx vercel deploy --prebuilt --prod
```

## Paso 6: Probar con cuentas sandbox de PayPal

PayPal crea automáticamente cuentas de prueba. Para encontrarlas:
1. Ve a developer.paypal.com → **Sandbox → Accounts**
2. Busca la cuenta de tipo **Personal** (es el "comprador")
3. Haz clic en los 3 puntos → **View/Edit Account** → copia el email y contraseña

Cuando pruebes el pago en la app, usa esas credenciales en el popup de PayPal.

## Paso 7: Pasar a producción (cuando estés listo para cobrar real)

1. En developer.paypal.com → cambia a **Live** mode
2. Crea una nueva App en modo Live → obtén nuevas credenciales
3. Actualiza los secretos en Supabase:
   ```bash
   npx supabase secrets set PAYPAL_CLIENT_ID=TU_CLIENT_ID_LIVE
   npx supabase secrets set PAYPAL_CLIENT_SECRET=TU_CLIENT_SECRET_LIVE
   npx supabase secrets set PAYPAL_BASE_URL=https://api-m.paypal.com
   ```
4. Actualiza la variable del frontend:
   ```
   VITE_PAYPAL_CLIENT_ID=TU_CLIENT_ID_LIVE
   ```
5. Redesploya en Vercel

## Flujo completo de pago

```
Paciente → Busca terapeuta → Agendar
  → Elige fecha y hora → "Continuar al pago"
  → Resumen de cita + botón PayPal
  → Popup de PayPal → paga con cuenta PayPal o tarjeta
  → ✅ Pago capturado server-side → cita en estado "scheduled"
  → Confirmación dentro de la app (sin redirigir)
```
