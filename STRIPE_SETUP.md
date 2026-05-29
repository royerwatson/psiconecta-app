# 💳 Configuración de Stripe — Psiconecta

## Paso 1: Crear cuenta en Stripe

1. Ve a https://stripe.com y crea una cuenta gratuita
2. Activa el **modo de prueba** (Test mode) en el dashboard

## Paso 2: Obtener las claves API

En el dashboard de Stripe → Developers → API keys:
- **Publishable key**: empieza con `pk_test_...` (pública, va al frontend)
- **Secret key**: empieza con `sk_test_...` (privada, solo backend)

## Paso 3: Agregar variables al .env

Agrega esto a tu archivo `.env` y `.env.production`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_AQUI
```

## Paso 4: Ejecutar la migración SQL en Supabase

1. Ve a https://supabase.com → tu proyecto → SQL Editor
2. Copia y pega el contenido de `supabase/migration_stripe.sql`
3. Ejecuta el script → debe decir "Migración de Stripe completada ✅"

## Paso 5: Desplegar las Edge Functions en Supabase

Instala la CLI de Supabase si no la tienes:
```bash
brew install supabase/tap/supabase
```

Luego en la carpeta del proyecto:
```bash
# Enlaza tu proyecto Supabase (solo la primera vez)
npx supabase login
npx supabase link --project-ref kudldawuehduidhipvmn

# Configura los secretos de las Edge Functions
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA
npx supabase secrets set APP_URL=https://psiconecta-app.vercel.app

# Despliega las funciones
npx supabase functions deploy create-checkout-session
npx supabase functions deploy verify-payment
```

## Paso 6: Verificar que las Edge Functions estén desplegadas

En el dashboard de Supabase → Edge Functions, debes ver:
- ✅ `create-checkout-session`
- ✅ `verify-payment`

## Paso 7: Actualizar .vercel/.env.production.local y redesplegar

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_AQUI
```

Luego redesplegar:
```bash
npx vercel build --prod && npx vercel deploy --prebuilt --prod
```

## Flujo de pago completo (modo test)

1. Paciente busca terapeuta → Agendar → elige fecha/hora → "💳 Proceder al pago"
2. Se abre Stripe Checkout con el resumen de la cita
3. Para probar usa la tarjeta: `4242 4242 4242 4242` con cualquier fecha futura y CVC
4. Stripe redirige a `/payment/success` → se verifica el pago → cita queda en estado `scheduled`
5. Si cancela → redirige a `/payment/cancel` → la sesión pendiente se elimina

## Activar pagos reales

Cuando quieras cobrar dinero real:
1. Activa tu cuenta en Stripe (requiere datos bancarios)
2. Cambia las claves `pk_test_...` / `sk_test_...` por las de producción (`pk_live_...` / `sk_live_...`)
3. Redespliega
