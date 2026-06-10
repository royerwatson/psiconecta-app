# Staging, monitoreo y tests — Guía de configuración

## 1. Sentry (monitoreo de errores)

Código ya integrado (`src/lib/sentry.js`, init en `main.jsx`, usuario
asociado por id/rol en `authStore`). Para activarlo:

1. Crear cuenta/proyecto **React** en sentry.io (plan gratuito: 5K errores/mes).
2. Copiar el DSN del proyecto.
3. Vercel → Settings → Environment Variables:
   - `VITE_SENTRY_DSN` = el DSN (Production y Preview)
   - `VITE_SENTRY_ENVIRONMENT` = `production` (en Production) / `preview` (en Preview)
4. Redeploy. Sin DSN, Sentry es no-op (dev local no reporta nada).

Privacidad: `sendDefaultPii: false` y los ids de pacientes se sanean de
las URLs antes de enviar. Solo se asocia `user.id` y rol, nunca nombre/email.

## 2. Staging con Vercel Preview

Hoy todo commit a `main` va directo a producción. Flujo recomendado (sin
costo extra, Vercel ya lo soporta):

1. Crear rama de trabajo: `git checkout -b dev`
2. Push a `dev` → Vercel genera automáticamente una **Preview URL**
   (`psiconecta-app-git-dev-….vercel.app`) con las env vars de Preview.
3. Probar en la preview (incluyendo `npm run test:e2e` contra esa URL).
4. Merge a `main` solo cuando la preview esté verificada:
   `git checkout main && git merge dev && git push`

Recomendado en Vercel → Settings → Git: proteger Production Branch = `main`.

Nota Supabase: las previews comparten la BD de producción. Para cambios de
esquema arriesgados, crear un segundo proyecto Supabase (free tier) y
apuntar las env vars de Preview a él.

## 3. Tests E2E (Playwright)

Instalado como devDependency con config en `playwright.config.js` y smoke
tests en `tests/e2e/smoke.spec.js` (rutas públicas + auth básico, sin
credenciales).

Primer uso (descarga browsers):
```bash
npx playwright install chromium
```

Correr:
```bash
npm run test:e2e            # build local + vite preview automático
BASE_URL=https://psiconecta-app-git-dev-xxx.vercel.app npm run test:e2e   # contra preview
npm run test:e2e:prod       # contra producción (solo lectura, no paga nada)
```

### Siguiente nivel (cuando haya PayPal sandbox estable)
- Test del flujo completo de reserva+pago con cuenta sandbox de PayPal y
  usuario de prueba (crear `tests/e2e/booking.spec.js` con credenciales en
  env vars `E2E_PATIENT_EMAIL` / `E2E_PATIENT_PASSWORD`).
- Integrar en CI (GitHub Actions) para que corra en cada PR a `main`.

## 4. Checklist de despliegue seguro

1. `npm run build` → 0 errores
2. `npm run test:e2e` en local o contra preview
3. Merge a `main`
4. Verificar Sentry sin errores nuevos en los primeros minutos
