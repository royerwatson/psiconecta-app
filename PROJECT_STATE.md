# PROJECT_STATE.md — Estado del Proyecto Psiconecta
*Última actualización: 2026-06-15 (v64 — Prompt clínico + PDF adjunto en email + fix descarga PDF en app)*

---

## ⚡ Sesión 2026-06-15 (v64) — Prompt clínico + PDF en email + fix descarga

### 1. Nuevo prompt clínico de Claude (capture-assessment-payment)

Reemplazado el prompt genérico por el **System Prompt oficial Psiconecta v1.0**:
- Rol: psicólogo clínico de Psiconecta para RD/Latinoamérica
- Tono: cálido, clínico-accesible, validador-orientador, culturalmente adaptado
- Palabras prohibidas: diagnóstico, trastorno, patología, enfermedad, anormal
- Input: objeto JSON estructurado `{ instrumento, area, puntuacion_total, rango_maximo, categoria, dimensiones [{nombre, puntuacion, max, nivel}], respuestas_individuales, segmento }`
- Output JSON con 4 campos: `parrafo_principal` (60-90 palabras, empieza con "Lo que muestran..."), `parrafo_patron` (dimensional, más personalizado), `parrafo_contexto` (40-60 palabras, cuándo surge), `frase_cierre` (20-30 palabras, esperanzadora)
- Mapeo al schema DB sin migraciones: `interpretation = parrafo_principal\n\nparrafo_patron`, `normative_context = parrafo_contexto`, `recommendations = [{title: "Para tener en cuenta", description: frase_cierre}]`
- `AREA_MAP`: ansiedad→"Ansiedad generalizada", depresion→"Estado de ánimo y depresión", sueno→"Calidad del sueño", burnout→"Agotamiento laboral"
- `dimensiones.nivel`: pct ≥67 → "alta", ≥34 → "moderada", <34 → "leve"

### 2. PDF adjunto en el correo (server-side)

**`supabase/functions/capture-assessment-payment/index.ts`**:
- Importa `pdf-lib` desde `https://esm.sh/pdf-lib@1.17.1`
- Función `generatePDFBytes()`: genera PDF A4 profesional con pdf-lib:
  - Header: "PSICONECTA" + nombre del instrumento
  - Score card: recuadro violeta con puntuación, severidad, fecha, nombre
  - Barras de dimensiones (texto + barra visual con rect)
  - Sección Interpretación (2 párrafos)
  - Sección Contexto
  - Sección "Para tener en cuenta" (frase en box con fondo lavanda)
  - Footer en cada página: "Este reporte es confidencial · psiconecta.app"
- Base64 via `btoa(bytes.reduce(...))` → adjunto Resend
- Fallo del PDF es non-fatal (try/catch interno)

**`supabase/functions/_shared/email.ts`**:
- `sendEmail()` ahora acepta `attachments?: Array<{ filename: string; content: string }>` (content = base64)
- Se incluye en el body de Resend solo si el array tiene elementos

### 3. Fix descarga PDF en la app

**Causa raíz**: `cdnjs.cloudflare.com` no estaba en `script-src` del CSP en `vercel.json` → el script de jsPDF era bloqueado silenciosamente por el browser.

**`vercel.json`**: añadido `https://cdnjs.cloudflare.com` a `script-src`.

**`AssessmentReportPage.jsx`**:
- Carga jsPDF con `id="jspdf-cdn"` para evitar duplicados + `setTimeout(resolve, 100)` para dar tiempo al UMD
- Verifica `window.jspdf?.jsPDF` antes y después de cargar, lanza error descriptivo si no disponible
- `handleDownload` muestra `toast.success('PDF descargado')` o `toast.error('...')` según resultado
- Importa `toast` desde `react-hot-toast`

### 4. Renombrado de secciones en reporte (app + email)
- "Contexto normativo" → **"Contexto"**
- "Recomendaciones" → **"Para tener en cuenta"**
- `frase_cierre` se muestra como callout con fondo degradado primary→accent e itálica

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `supabase/functions/capture-assessment-payment/index.ts` | Nuevo system prompt + generatePDFBytes() + adjunto email |
| `supabase/functions/_shared/email.ts` | sendEmail acepta attachments + header "Contexto" |
| `vercel.json` | CSP: añadido cdnjs.cloudflare.com a script-src |
| `src/pages/patient/AssessmentReportPage.jsx` | jsPDF loading robusto + toast feedback + secciones renombradas |

### Deploy
```bash
supabase functions deploy capture-assessment-payment --no-verify-jwt
git add -A && git commit -m "feat: prompt clínico v1 + PDF adjunto en email + fix CSP jsPDF" && git push
```

---

## ⚡ Sesión 2026-06-15 (v63) — Email post-pago + pantalla de éxito + fix redirect auth

---

## ⚡ Sesión 2026-06-15 (v63) — Email de reporte + fix flujo post-pago

### Problema resuelto
El flujo post-pago redirigía a `/patient/evaluaciones/:sessionId` pero el reporte no se encontraba. Causa real: el redirect post-login/register no funcionaba — el usuario nunca llegaba a pagar.

### Cambios implementados

#### 1. Email del reporte completo
**`supabase/functions/_shared/email.ts`** — nueva función `assessmentReportEmail()`:
- Tarjeta de puntuación con gradiente morado (score + badge de severidad)
- Barras de dimensiones con porcentajes
- Interpretación en párrafos
- Contexto normativo con borde violeta
- 4 recomendaciones con íconos emoji
- 2 CTAs: "Ver reporte en la app" + "Buscar terapeuta" (verde)

#### 2. Edge Function actualizada
**`supabase/functions/capture-assessment-payment/index.ts`**:
- Después de guardar el reporte en Supabase, fetcha `profiles.full_name` del usuario
- Llama `assessmentReportEmail()` y envía con `sendEmail()`
- Retorna `{ sessionId, success: true, email: user.email }` (email para mostrar en UI)
- El fallo de email no bloquea el flujo de pago (try/catch silencioso)

#### 3. Pantalla de éxito inline post-pago
**`src/pages/public/EvaluacionesResultadoPage.jsx`**:
- Estado `paid: { sessionId, email }` en lugar de `navigate()`
- Pantalla de éxito muestra: ✅ ícono verde, "¡Tu reporte está listo!", email donde se envió
- Botón "Ver reporte en la app" → `/patient/evaluaciones/:sessionId`
- Botón "Buscar terapeuta" → `/patient/find`
- Ya no hay redirect abrupto al dashboard

#### 4. Fix redirect post-auth (crítico)
El bug real: Login leía `location.state?.from?.pathname` pero EvaluacionesResultadoPage enviaba `?redirect=` como query param — incompatibles. Register ignoraba cualquier redirect.

**`src/pages/public/EvaluacionesResultadoPage.jsx`**:
- Botón principal → `/login` con `state: { from: { pathname } }` + `localStorage.setItem('psiconecta_auth_redirect', ...)`
- Link "Regístrate gratis" → `/register` con los mismos state + localStorage

**`src/pages/auth/Login.jsx`**:
- Lee `localStorage.getItem('psiconecta_auth_redirect')` como respaldo si no hay `state.from`
- Prioridad: `state.from` → `localStorage` → dashboard por rol

**`src/pages/auth/Register.jsx`**:
- Importa `useLocation` y `useNavigate`
- Post-registro: lee `location.state?.from?.pathname` y `localStorage` antes de ir al dashboard

**`src/pages/auth/AuthCallback.jsx`**:
- Lee `localStorage.getItem('psiconecta_auth_redirect')` para OAuth y verificación de email
- Solo aplica a pacientes (role = patient)

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `supabase/functions/_shared/email.ts` | NEW `assessmentReportEmail()` |
| `supabase/functions/capture-assessment-payment/index.ts` | Envío de email + retorna `email` |
| `src/pages/public/EvaluacionesResultadoPage.jsx` | Success screen inline + redirect con state/localStorage |
| `src/pages/auth/Login.jsx` | Lee localStorage como respaldo de redirect |
| `src/pages/auth/Register.jsx` | Respeta state.from + localStorage post-registro |
| `src/pages/auth/AuthCallback.jsx` | Lee localStorage para OAuth/email-verify |

### Deploy ejecutado
```bash
supabase functions deploy capture-assessment-payment  # ✅ 2026-06-15
git push  # → Vercel auto-deploy ✅ 2026-06-15
```

### Estado
✅ Flujo verificado end-to-end en producción: test → resultado → login → pago PayPal → pantalla de éxito → correo recibido

---

## ⚡ Sesión 2026-06-15 (v62) — Evaluaciones psicométricas end-to-end

### Flujo implementado

```
/evaluaciones (landing) 
  → /evaluaciones/elegir (selección de área)
  → /evaluaciones/test/:slug (test pregunta a pregunta, sin cuenta)
  → /evaluaciones/resultado/:slug (puntuación visible + secciones bloqueadas + paywall)
  → /register o /login (si no autenticado)
  → PayPal (pago único)
  → /patient/evaluaciones/:sessionId (reporte completo)
```

### Instrumentos disponibles
| Área | Instrumento | Items | Precio |
|------|-------------|-------|--------|
| Ansiedad & Estrés | GAD-7 | 7 | $4.99 |
| Ánimo & Depresión | PHQ-9 | 9 | $4.99 |
| Calidad del Sueño | ISI | 7 | $4.99 |
| Trabajo & Burnout | MBI-GS | 10 | $6.99 |
| Relaciones & Pareja | — | — | Próximamente |
| Rasgos de Personalidad | — | — | Próximamente |

### Reporte completo (6 secciones)
1. **Gauge animado** — Score/maxScore con color por severidad
2. **Desglose dimensional** — Barras por dimensión clínica (animadas)
3. **Interpretación** — Claude analiza el patrón de respuestas ítem por ítem, no solo el puntaje
4. **Contexto normativo** — Ubica al usuario en la población sin alarmar ni minimizar
5. **Recomendaciones** — 4 acciones concretas y específicas (nunca genéricas)
6. **Próximos pasos** — CTA a terapeuta + descarga PDF

### Archivos creados
| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/data/assessmentTests.js` | NEW | 4 instrumentos con preguntas, escala, dimensiones, bandas de severidad + helpers |
| `supabase/migration_assessment_sessions.sql` | NEW | Tablas `assessment_sessions` + `assessment_reports` con RLS |
| `supabase/functions/create-assessment-order/index.ts` | NEW | Crea assessment_session (paid:false) + orden PayPal |
| `supabase/functions/capture-assessment-payment/index.ts` | NEW | Captura PayPal + llama Claude sonnet-4-6 + guarda reporte |
| `src/pages/public/EvaluacionesSelectPage.jsx` | NEW | `/evaluaciones/elegir` — grid de 6 áreas |
| `src/pages/public/EvaluacionesTestPage.jsx` | NEW | `/evaluaciones/test/:slug` — test una pregunta a la vez, guarda en localStorage |
| `src/pages/public/EvaluacionesResultadoPage.jsx` | NEW | `/evaluaciones/resultado/:slug` — score visible + 4 secciones bloqueadas + PayPal |
| `src/pages/patient/AssessmentReportPage.jsx` | NEW | `/patient/evaluaciones/:sessionId` — reporte completo + gauge + PDF |
| `src/App.jsx` | MODIFIED | 5 rutas nuevas + lazy imports |
| `src/pages/public/EvaluacionesPage.jsx` | MODIFIED | CTAs apuntan a `/evaluaciones/elegir` |

### Detalles técnicos
- **Sin cuenta para el test**: respuestas guardadas en `localStorage` (`psiconecta_test_${slug}`)
- **Auth requerido para pagar**: si no autenticado → `/register?redirect=/evaluaciones/resultado/:slug`
- **Edge Function Claude**: usa `claude-sonnet-4-6`, prompt incluye respuestas ítem por ítem + dimensiones, retorna JSON con `interpretation`, `normativeContext`, `recommendations[]`
- **Polling**: si el reporte no está listo al abrir la página, hace polling cada 3s hasta 20 intentos
- **PDF**: jsPDF cargado dinámicamente desde CDN (sin dependencia en bundle)
- **Idempotencia**: `capture-assessment-payment` verifica `alreadyPaid` antes de reaprocesar

### Pasos manuales ejecutados
- `supabase/migration_assessment_sessions.sql` ✅ 2026-06-15
- `supabase functions deploy create-assessment-order` ✅ 2026-06-15
- `supabase functions deploy capture-assessment-payment` ✅ 2026-06-15
- `npm run build && vercel --prod` ✅ 2026-06-15

---

## ⚡ Sesión 2026-06-15 (v61 — Página /evaluaciones + copy premium)*

---

## ⚡ Sesión 2026-06-15 (v61) — Página /evaluaciones

### Cambios

1. **EvaluacionesPage.jsx** (NEW) — Página pública en `/evaluaciones` con flujo completo de evaluaciones psicométricas:
   - Navbar con logo Psiconecta
   - Hero: título, descripción, CTA y mockup de reporte bloqueado (puntuación visible + desglose dimensional con blur + lock overlay)
   - Cómo funciona: 5 pasos (gratis / desde $4.99 / conectar terapeuta)
   - Áreas de evaluación: 6 cards (Ansiedad, Ánimo, Sueño, Burnout, Relaciones, Personalidad) con instrumentos y precios
   - Paquetes temáticos: 4 paquetes con ahorro de 28-40%
   - Comparación de precio vs. sesión presencial
   - Garantías: instrumentos validados, lectura profunda, reporte descargable
   - CTA final + footer mínimo

2. **App.jsx** (MODIFIED) — Ruta lazy `/evaluaciones` → `EvaluacionesPage`

3. **LandingPage.jsx** (MODIFIED):
   - Nav: link "Evaluaciones" a la izquierda de "Regalar"
   - Sección evaluaciones reemplazada por teaser card compacto con link a `/evaluaciones`
   - Footer: link "Evaluaciones con reporte" bajo Pacientes
   - Eliminado bloque JSX huérfano que causaba build error (`Expected "}" but found "className"` en línea 903)

4. **Copy ajustado** — Lenguaje más afable y premium (estilo Apple):
   - Eliminado: "IA", "por IA", "Sin suscripción", "El momento de mayor receptividad."
   - "Desbloquea tu reporte IA" → "Tu reporte completo"
   - "Interpretación por IA" → "Lectura profunda"
   - "Reporte de evaluación · IA" → "Reporte de evaluación"
   - Footer hero: "Acceso inmediato · Reporte en minutos · Pago único"
   - Footer CTA: "Reporte desde $4.99 · Acceso inmediato · Pago único"

### Archivos
- `src/pages/public/EvaluacionesPage.jsx` (NEW)
- `src/App.jsx`
- `src/pages/public/LandingPage.jsx`

### Deploy
- Pendiente: `npm run build && vercel --prod`

---

## ⚡ Sesión 2026-06-15 (v60) — Fix avatares grupales + líneas de crisis por país

### Cambios

1. **Avatar del terapeuta en sesiones grupales** — El query de "Mis inscripciones" en `GroupSessions.jsx` no incluía `avatar_url`, por lo que la foto no aparecía en esa vista. Fix: añadido al select de `group_session_participants`. ✅

2. **Línea de crisis República Dominicana** — Agregada `809-200-1400` (Salud Mental RD, 24/7) a `CrisisPage.jsx`. ✅

3. **Filtrado de líneas por país** — La página de crisis ahora lee `profiles.country` (código ISO guardado en el registro) y muestra solo la línea local del paciente + Internacional. Si el país no tiene línea en el catálogo, muestra todas. ✅

### Archivos
- `src/pages/patient/GroupSessions.jsx`
- `src/pages/patient/CrisisPage.jsx`

### Deploy
- Vercel producción: `https://psiconecta.app` ✅

---

## ⚡ Sesión 2026-06-15 (v59) — Sistema de pagos para sesiones grupales

### Implementado

**Comisiones y estructura de pago:**
- Plan gratuito: 25% Psiconecta / 75% terapeuta (`group_commission_rate = 0.25`)
- Plan Pro/Premium: 15% Psiconecta / 85% terapeuta (`group_commission_rate = 0.15`)
- Trigger `sync_commission_rate()` actualizado para mantener ambas columnas en sync al cambiar de plan

**SQL pendiente de aplicar:** `supabase/migration_group_session_payments.sql`
- `ALTER TABLE therapist_profiles ADD COLUMN group_commission_rate`
- `ALTER TABLE group_session_participants ADD COLUMN paid, amount_paid, platform_fee, therapist_net, payment_intent_id, paid_at`
- Vista `therapist_pending_earnings` actualizada para incluir ingresos de sesiones grupales
- Policy `gsp_admin` para que admin gestione participantes

**Edge Functions nuevas (pendientes de deploy):**
- `supabase/functions/create-group-order/index.ts` — Crea orden PayPal para sesión grupal, calcula comisiones, verifica cupo
- `supabase/functions/capture-group-payment/index.ts` — Captura pago PayPal e inserta en `group_session_participants` con `paid=true` y campos de comisión

**Frontend:**
- `src/pages/patient/GroupSessions.jsx` — Flujo completo: sesiones gratuitas usan insert directo; sesiones con precio abren modal `PaymentModal` con `GroupPayPalButton` inline que llama a `create-group-order` → `capture-group-payment`. Botón de inscripción muestra el precio si aplica.

### Pasos para activar en producción
```bash
# 1. Aplicar SQL en Supabase SQL Editor
#    → supabase/migration_group_session_payments.sql

# 2. Deploy de Edge Functions
supabase functions deploy create-group-order
supabase functions deploy capture-group-payment
```

### Archivos
- `supabase/migration_group_session_payments.sql`
- `supabase/functions/create-group-order/index.ts`
- `supabase/functions/capture-group-payment/index.ts`
- `src/pages/patient/GroupSessions.jsx`

---

## ⚡ Sesión 2026-06-15 (v58) — Fix sesiones grupales desde admin

### Problemas resueltos

1. **RLS bloqueaba al admin** — `gs_all` solo permitía operaciones cuando `auth.uid() = therapist_id`, bloqueando al admin que inserta con el UUID de otro terapeuta. Fix: `migration_fix_group_sessions_rls.sql` añade policy `gs_admin` con acceso total para `role = 'admin'`. ✅

2. **INSERT fallaba con HTTP 400** — El código usaba `topic` y `price_per_person` pero la tabla real tiene `title NOT NULL` y `price`. El `title` quedaba NULL y violaba el constraint. Fix: renombrados todos los campos en `AdminGroupSessions.jsx` (`topic→title`, `price_per_person→price`). ✅

### Archivos
- `supabase/migration_fix_group_sessions_rls.sql`
- `src/pages/admin/AdminGroupSessions.jsx`

---

## ⚡ Sesión 2026-06-15 (v57) — Fix avatares de terapeuta

### Problema resuelto

**Fotos de perfil de terapeutas no se mostraban en ninguna pantalla** — El componente `<Avatar>` recibía `name` pero no `src`, así que siempre mostraba iniciales. El `avatar_url` sí estaba en los datos (la query lo seleccionaba correctamente), pero simplemente no se pasaba al componente.

Archivos corregidos (se añadió `src={...avatar_url}` en cada `<Avatar>` de terapeuta/paciente):

- `FindTherapist.jsx` — lista de terapeutas + modal de booking
- `TherapistProfileView.jsx` — perfil público del terapeuta (header + booking)
- `TherapistMatchPage.jsx` — resultados del match
- `MyAppointments.jsx` — citas activas, cambio de terapeuta, modal de reseña
- `SessionHistoryPage.jsx` — historial de sesiones
- `PatientDashboard.jsx` — próxima sesión
- `AdminTherapists.jsx` — lista y detalle de terapeuta
- `AdminSubscriptions.jsx` — lista de suscripciones
- `AdminStats.jsx` — ranking de terapeutas
- `TherapistDashboard.jsx` — alertas IA + sesiones de pacientes
- `TherapistSchedule.jsx` — detalle de sesión en agenda

---

## ⚡ Sesión 2026-06-15 (v56) — Fix RLS therapist_credentials

### Problema resuelto

**Terapeutas no podían subir documentos** — El storage upload al bucket `credentials` funcionaba, pero el INSERT en `therapist_credentials` fallaba con "new row violates row-level security policy". La política `tc_insert` no existía correctamente en producción. Fix: `supabase/migration_fix_tc_rls.sql` que hace DROP + recreación limpia de las 3 políticas (`tc_select`, `tc_insert`, `tc_update`). El `tc_select` ahora también permite que admins vean todos los documentos. ✅

**Verificado:** Upload funcional en todas las etapas (título, exequátur, colegio). Las opciones de aprobar/rechazar son visibles en el admin. Flujo de revisión pendiente de prueba completa.

### Archivos
- `supabase/migration_fix_tc_rls.sql` — ejecutar en Supabase SQL Editor

---

## ⚡ Sesión 2026-06-15 (v55) — Crédito de regalo funcional end-to-end

### Problemas resueltos

1. **Botón "Confirmar cita sin pago adicional" no hacía nada** — El botón llamaba a `create-paypal-order` con `freeWithCredit: true`, pero esa función ignora ese flag y siempre crea una orden PayPal. El error se perdía en el catch sin feedback. Fix: función PostgreSQL SECURITY DEFINER `confirm_credit_booking` que en una sola transacción: crea la sesión como `scheduled`, descuenta `patient_credits` (elimina filas agotadas, actualiza parciales). El botón ahora usa `supabase.rpc('confirm_credit_booking', ...)` — sin CORS, sin Edge Function, atómica. ✅

2. **Crédito no visible en FindTherapist** — Solo aparecía en TherapistProfileView. Fix: añadidos `creditBalance`, `applyCredit`, `loadCreditBalance` y banner de crédito idéntico al de TherapistProfileView. Ambas rutas de booking (FindTherapist y TherapistProfileView) muestran y aplican el crédito de regalo. ✅

3. **Flujo completo verificado** — Cita con Dra. Laura Martínez agendada el 17/06/2026 a las 15:00, cubierta con crédito de regalo, pantalla de éxito mostrada, archivo `.ics` descargado para calendario. ✅

### Archivos clave
- `supabase/migration_confirm_credit_booking.sql` — función SQL a ejecutar en Supabase
- `supabase/functions/confirm-credit-booking/index.ts` — Edge Function (ya no usada, reemplazada por RPC)
- `src/pages/patient/TherapistProfileView.jsx` — botón verde usa `supabase.rpc`
- `src/pages/patient/FindTherapist.jsx` — crédito añadido al paso de pago

---

## ⚡ Sesión 2026-06-15 (v54) — TherapistProfileView: slot picker + credit balance

### Cambios

1. **Selector de horarios por slots en TherapistProfileView** — Reemplazados los `<input type="date">` / `<input type="time">` nativos por el mismo grid de fechas y horas disponibles que usa `FindTherapist`. Al hacer click en "Agendar" se llama `loadSlots()` que consulta `therapist_availability`, `therapist_blocked_dates` y `sessions` para generar solo las franjas libres en los próximos 28 días.
   - Nuevos imports: `addDays`, `format`, `getISODay` de `date-fns`; `es` de `date-fns/locale`; `Clock` de lucide-react
   - Nuevo estado: `availSlots`, `selectedDate`, `loadingSlots`
   - Eliminados helpers obsoletos: `todayStr`, `minDate`, `isToday`, `getMinTime`, `noUrgentSlotsToday`
   - La preview de precio urgente (+30% si < 24h) se mantiene igual mediante `bookingPreview`

2. **Credit balance en TherapistProfileView** — Reemplazado el RPC `get_patient_credit_balance` (que daba error 400 en producción) por query directa a `patient_credits`. El banner de crédito en el paso de pago funciona correctamente ✅
   - Verificado: crédito $100.00 USD aparece, se aplica automáticamente, total muestra "¡Cubierto con crédito!" y aparece botón "Confirmar cita sin pago adicional →" ✅

---

## ⚡ Sesión 2026-06-14 (v53) — Gift Cards: debugging y fix completo

### Problemas resueltos

1. **Auth 401 en Edge Functions** — `create-gift-order` y `capture-gift-payment` son endpoints públicos pero Supabase requería encabezado `Authorization`. Fix: GiftPage.jsx añade `Bearer ${VITE_SUPABASE_ANON_KEY}` + `apikey` en ambas llamadas fetch.

2. **Redirect a sandbox.paypal.com** — `payment_source.paypal` con `return_url`/`cancel_url` fuerza flujo redirect, incompatible con el popup de `window.paypal.Buttons()`. Fix: cambiado a `application_context` en `create-gift-order/index.ts`.

3. **`INVALID_RESOURCE_ID`** — Orden creada con credenciales de producción PayPal (`PAYPAL_BASE_URL=https://api-m.paypal.com`) pero el SDK del frontend usaba Client ID de sandbox (`VITE_PAYPAL_CLIENT_ID=AZL5qAfBdit248...`). Fix: actualizar secrets Supabase a credenciales sandbox:
   - `PAYPAL_BASE_URL` → `https://api-m.sandbox.paypal.com`
   - `PAYPAL_CLIENT_ID` → mismo que `VITE_PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET` → secret de la app sandbox

4. **"No se pudo obtener token de PayPal"** — `PAYPAL_CLIENT_SECRET` incorrecto para el Client ID sandbox. Fix: obtener el secret correcto desde developer.paypal.com → Apps → app sandbox.

5. **Deploy Edge Functions** — `capture-gift-payment` y `redeem-gift-card` no estaban desplegadas. Fix: `npx supabase functions deploy capture-gift-payment` + `redeem-gift-card`.

6. **`maxLength={14}` en input de canje** — el código `PSICO-XXXX-XXXX` tiene 15 caracteres. El campo bloqueaba la última letra. Fix: `maxLength={14}` → `maxLength={15}` en `PatientProfile.jsx`.

### Flujo verificado ✅ end-to-end
- `/regalo` → formulario → PayPal popup → captura → "¡Listo, gracias!" con código `PSICO-XRAU-8ULW` ✅
- Perfil paciente → ingresar código → "Canjear" → crédito acreditado ✅

### Archivos modificados (v53)
| Archivo | Cambio |
|---------|--------|
| `src/pages/public/GiftPage.jsx` | Auth headers (anon key) en fetch `createOrder` + `onApprove` |
| `supabase/functions/create-gift-order/index.ts` | `payment_source.paypal` → `application_context` |
| `src/pages/patient/PatientProfile.jsx` | `maxLength={14}` → `maxLength={15}` |

### Acciones manuales ejecutadas
- Secrets Supabase: `PAYPAL_BASE_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` → sandbox ✅
- Deploy: `capture-gift-payment`, `redeem-gift-card`, `create-gift-order` ✅
- Build + deploy Vercel: `npm run build && npx vercel --prod` ✅

---

## ⚡ Sesión 2026-06-14 (v52) — Fix crítico: FindTherapist + profiles RLS

### Descripción
Diagnóstico y resolución del error "No pudimos cargar los terapeutas" en la página Buscar del paciente. El problema tenía dos capas:

1. **Causa raíz**: columnas `languages`, `years_experience`, `approaches`, `education` faltaban en `therapist_profiles` en producción (en `migration_payouts_and_payment_fields.sql` pero no ejecutadas). La query de FindTherapist fallaba con error de columna inexistente.

2. **Daño colateral**: al ejecutar `migration_fix_findtherapist.sql`, el `DROP POLICY` en `profiles` tuvo éxito pero el `CREATE POLICY` falló (is_admin() no disponible en ese momento), dejando `profiles` con RLS activo sin ninguna política → nadie podía leer perfiles → "Usuario" en header + FindTherapist error.

3. **Fix definitivo**: `EMERGENCIA_fix_profiles_rls.sql` — crea `is_admin()` primero, luego recrea `profiles_select` simplificada (`auth.uid() = id OR role = 'therapist' OR is_admin()`), agrega las 4 columnas faltantes, y recrea `tp_select`.

### Verificación exitosa (4/4 true en Supabase)
- `is_admin()` existe ✓
- `profiles_select` existe ✓  
- Columnas FindTherapist OK ✓
- `tp_select` existe ✓

### Archivos modificados (v52)
| Archivo | Tipo | Cambio |
|---------|------|--------|
| `supabase/EMERGENCIA_fix_profiles_rls.sql` | NEW | Fix definitivo RLS profiles + columnas |
| `supabase/migration_fix_findtherapist.sql` | NEW | Migración auxiliar (ejecutar con precaución) |
| `src/pages/patient/FindTherapist.jsx` | MODIFIED | Error catch muestra mensaje real de Supabase |

### SQL ejecutado en producción
`EMERGENCIA_fix_profiles_rls.sql` — verificación: 4/4 true

---

## ⚡ Sesión 2026-06-14 (v51) — Tipografía global Plus Jakarta Sans + coherencia landing

### Descripción
Corrección global de tipografía: `font-serif` (Lora/Georgia) eliminado de todos los archivos JSX. Adición de features al Plan Pro. Badges de calculadoras unificados. Fondo de calculadoras unificado con la landing.

### Cambios

**Tipografía global**
- `font-serif` removido de **59 archivos JSX** vía `sed` batch — toda la plataforma usa ahora exclusivamente `Plus Jakarta Sans Variable` (definida en `tailwind.config.js` como `fontFamily.sans`)
- Raíz del problema: Tailwind `fontFamily.serif` mapeaba a `['Lora', 'Georgia', 'serif']`, causando inconsistencia visual en headings de páginas internas y públicas

**Plan Pro — nuevos features (3 archivos)**
- `SubscriptionPage.jsx`: añadidos `TrendingUp` + `UserCheck` imports y dos nuevas features: "Análisis clínico longitudinal inteligente" / "Acompañamiento 1:1 con coordinador clínico"
- `PricingPage.jsx`: mismos dos puntos añadidos al array de features
- `LandingPage.jsx`: actualizados en el `PlanCard` features array

**Calculadoras landing — coherencia visual**
- `PatientTimeCalc`: fondo `#0a0a0f` → `bg-psiconecta`; card izquierda glass oscuro → `bg-white shadow-sm border-slate-100`; todos los textos oscuros; slider violet en lugar de thumb blanco; badge `font-serif` eliminado
- `TherapistTimeCalc`: fondo `#f8f7ff` → `bg-psiconecta`; badge "Para terapeutas" → **"Para profesionales"**
- Ambos badges: clase `tracking-widest uppercase border inline-style` → `bg-accent-100 text-accent-700 text-xs font-semibold` (idéntico al badge de la sección "Para profesionales" existente)

### Archivos modificados (v51)
| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/**/*.jsx` (59 archivos) | MODIFIED | `font-serif` eliminado globalmente |
| `src/pages/therapist/SubscriptionPage.jsx` | MODIFIED | 2 nuevas features Pro + imports TrendingUp/UserCheck |
| `src/pages/public/PricingPage.jsx` | MODIFIED | 2 nuevas features Pro |
| `src/pages/public/LandingPage.jsx` | MODIFIED | 2 nuevas features Pro + badges calculadoras + fondos |

---

## ⚡ Sesión 2026-06-14 (v50) — GiftPage: logo, tipografía y corrección de coma

### Descripción
Correcciones de detalle en GiftPage para mantener coherencia con la identidad visual de Psiconecta.

- **Logo**: igualado al de la landing (36×36, gradiente `#4f46e5→#7c3aed`, border-radius 12, shadow, texto 18px `#0f172a` + `necta` en violet)
- **Tipografía**: `Plus Jakarta Sans` definida en el root div; eliminado `Georgia, serif` de h1/h2
- **Coma**: "apoya, y transforma" → "apoya y transforma"

---

## ⚡ Sesión 2026-06-14 (v49) — GiftPage fondo claro bg-psiconecta

### Descripción
Fondo oscuro `#060612` reemplazado por `linear-gradient(160deg, #f0f2ff → #faf5ff → #f5f5f7)` (mismo que landing). Todos los textos, inputs y cards adaptados al tema claro. Ambient glows reducidos a opacidad 0.06-0.12.

---

## ⚡ Sesión 2026-06-14 (v48) — GiftPage premium redesign + navbar Sparkles pill

### Descripción
Rediseño completo de `/regalo` y actualización del navbar de la landing.

**LandingPage.jsx**
- Navbar: `🎁 Regalar` → pill `bg-gradient-to-r from-violet-600 to-fuchsia-500` con icono `Sparkles`
- Imports: `Gift`, `Sparkles` añadidos

**GiftPage.jsx — rediseño premium**
- Layout 2 columnas: formulario izquierda, live card preview derecha (sticky)
- `GiftCardPreview` component: gradiente `#3b0d8a→#6d28d9→#0ea5e9`, shine radial, círculos deco, campos De/Para dinámicos
- PayPal pill shape, trust badges (SSL, entrega inmediata, 12 meses)
- Paso pago: card preview mini + resumen limpio
- Paso éxito: check verde, card reveal + código mono-font

---

## ⚡ Sesión 2026-06-14 (v47) — Premium redesign GiftPage + navbar pill

### Descripción
Rediseño completo de `/regalo` con estética dark cinematic premium, y reemplazo del emoji en el navbar de la landing por un pill con gradiente.

### LandingPage.jsx
- Navbar: reemplazado `🎁 Regalar` por pill `bg-gradient-to-r from-violet-600 to-fuchsia-500` con icono `Sparkles` de lucide
- Footer: eliminado emoji del link
- Imports: añadidos `Gift`, `Sparkles`

### GiftPage.jsx — rediseño completo
**Background:** `#060612` con tres ambient glows fijos (violet / pink / cyan) en posición `fixed`

**Hero:**
- Badge pill "EL REGALO QUE CAMBIA VIDAS" con borde violet semitransparente
- H1 con gradiente `violet → pink → cyan` via `WebkitBackgroundClip: text`

**Layout dos columnas (desktop):**
- Izquierda: formulario (monto + datos remitente + destinatario + CTA)
- Derecha sticky: live preview de la tarjeta + "¿Cómo funciona?" 4 pasos

**Componente `GiftCardPreview`:**
- Gradiente `#3b0d8a → #6d28d9 → #0ea5e9`
- Shine overlay radial + círculos decorativos
- Muestra logo, monto (48px bold), de/para, validez
- Prop `mini` para versión compacta en paso de pago

**Formulario:**
- Inputs con `bg-white/8`, `border-white/15`, focus violet ring
- Botones de monto con glow box-shadow en seleccionado
- CTA con gradiente violet→purple→pink, shadow 40px

**Trust badges:** Shield (SSL) · Clock (entrega inmediata) · Star (12 meses)

**Paso pago:** card preview mini + summary items + PayPal pill + security badge
**Paso éxito:** check en ring verde, card preview + código en mono font, botones

### Archivos modificados (v47)
| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/pages/public/GiftPage.jsx` | MODIFIED | Rediseño premium completo |
| `src/pages/public/LandingPage.jsx` | MODIFIED | Navbar pill + imports Gift/Sparkles |

---

## ⚡ Sesión 2026-06-14 (v46) — Gift card UI en perfil del paciente

### Descripción
Sección de **crédito de regalo** añadida a `PatientProfile.jsx` para que el paciente pueda ver su saldo y canjear códigos directamente desde su perfil.

### Ubicación en el perfil
Inserted between the avatar/photo card and the Configuración card.

### UI implementada
- **Saldo disponible** — muestra `$X.XX USD` con texto explicativo si hay saldo positivo ("Se descuenta automáticamente en tu próxima sesión")
- **Input código** — mono-font, uppercase automático, `PSICO-XXXX-XXXX` placeholder
- **Botón Canjear** — spinner `Loader2` durante carga, `Check` verde en éxito, rojo en error
- **Feedback** — mensaje de éxito (balance actualizado) o error debajo del input
- **Link** — invita a comprar tarjeta en `/regalo`

### Estado y lógica (ya existentes desde sesión anterior)
- `creditBalance`, `giftCode`, `redeemStatus`, `redeemMsg`
- `loadCreditBalance()` → `supabase.rpc('get_patient_credit_balance')`
- `handleRedeem()` → POST `redeem-gift-card` Edge Function con JWT, actualiza balance en UI

### Archivos modificados (v46)
| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/pages/patient/PatientProfile.jsx` | MODIFIED | Card gift card entre avatar y configuración |

---

## ⚡ Sesión 2026-06-14 (v45) — Análisis clínico longitudinal

### Descripción
Nuevo tab **"Evolución"** en `PatientDetail` (vista del terapeuta) con análisis longitudinal completo del paciente.

### Componente: `LongitudinalAnalysis.jsx`
`src/components/psychometrics/LongitudinalAnalysis.jsx`

**Datos que consume:**
- `therapeutic_relationships` → relación activa terapeuta-paciente
- `test_assignments` + `test_sessions` (status=completed) + `test_results` → scores históricos con `raw_score`, `adjusted_score`, `severity_label`, `score_delta`, `is_clinically_significant`
- `ai_checkins` → mood_score + risk_level por semana (últimas 12 semanas)

**Secciones:**

1. **Tarjetas resumen por test** — Una card por cada test aplicado al paciente. Muestra último score, severity label con color semántico (verde/ámbar/rojo), flecha de tendencia (TrendingUp/Down/Minus), badge "↓ Cambio significativo" si `is_clinically_significant=true`, y conteo de aplicaciones. Clic filtra la gráfica.

2. **Gráfica de evolución** — `LineChart` de Recharts. Una línea por test, paleta de 6 colores, puntos interactivos, tooltip custom con score + severity. Líneas de referencia clínica hardcodeadas:
   - PHQ-9: 10 (moderado) / 20 (grave)
   - GAD-7: 10 (moderado) / 15 (grave)
   - PCL-5: 33 (PTSD probable)
   - AUDIT: 8 (riesgo) / 15 (dependencia)
   - PHQ-15: 10 / ISI: 15

3. **Resumen semanal de check-ins** — Colapsable. Gráfica de mood promedio por semana + línea de referencia en 4/10. Tabla: semana, nº check-ins, ánimo promedio (color por valor), alertas de riesgo alto.

### Archivos modificados (v45)
| Archivo | Tipo | Cambio |
|---------|------|--------|
| `src/components/psychometrics/LongitudinalAnalysis.jsx` | NEW | Componente completo |
| `src/pages/therapist/PatientDetail.jsx` | MODIFIED | Tab "Evolución" + import + TrendingUp icon |

**Commit:** `b1d817a`

---

## ⚡ Sesión 2026-06-14 (v44) — Calculadoras de tiempo interactivas en Landing

### Descripción
Dos secciones interactivas añadidas a `LandingPage.jsx` para demostrar el valor de Psiconecta con datos personalizados en tiempo real.

### Calculadora para pacientes (`PatientTimeCalc`)
- **Ubicación:** Entre "Cómo funciona" y "Testimonios"
- **Fondo:** Dark `#0a0a0f` con ambient glows radiales violeta/cyan
- **Slider:** 1–12 sesiones/mes. Calcula horas eliminadas en traslados, coordinación, búsqueda de terapeuta y recordatorios
- **Animaciones:**
  - Número principal (88px) animado con `useAnimatedNumber` hook (RAF + ease-out-cubic)
  - Barras con spring bounce `cubic-bezier(0.34, 1.56, 0.64, 1)` + stagger de 60ms por fila
  - Slider custom CSS: thumb blanco con glow violeta, scale on hover
  - Card de resultado con gradiente `#4f1fc4 → #7c3aed → #0ea5e9` + shine overlay radial

### Calculadora para terapeutas (`TherapistTimeCalc`)
- **Ubicación:** Después de "Para terapeutas", antes del Quiz de matching
- **Fondo:** Crema `#f8f7ff` con dot-grid sutil violeta
- **Slider:** 3–50 pacientes activos. Desglose: agenda y reagendas (0.55h/pt), cobros (0.30h/pt), tareas/seguimiento (0.40h/pt), IA + protocolos + tests + PDF (0.65h/pt)
- **Animaciones:** Mismas que pacientes. Card izquierda oscura `#1e0050 → #3b0d8a → #0f172a` con CTA inline. Card derecha blanca limpia con dots de color por categoría
- **CTA:** "Empieza gratis como terapeuta" → `/register?role=therapist`

### Hook compartido
```js
function useAnimatedNumber(target, decimals = 1, duration = 600)
// requestAnimationFrame loop con ease-out-cubic
// from → to suavizado, sin dependencias externas
```

### Archivos modificados (v44)
- `src/pages/public/LandingPage.jsx` — `PatientTimeCalc` + `TherapistTimeCalc` + hook `useAnimatedNumber` + CSS inline para sliders premium

---

## ⚡ Sesión 2026-06-14 (v43) — Sistema de Gift Cards 🎁

### Arquitectura

**Flujo completo:**
1. Cualquier persona (sin cuenta) entra a `/regalo`
2. Elige monto ($50/$100/$150 o libre ≥ $50), llena datos del remitente y destinatario + mensaje
3. Paga vía PayPal → `create-gift-order` crea la orden, `capture-gift-payment` la activa
4. El destinatario recibe email con código `PSICO-XXXX-XXXX` y botón "Canjear mi regalo"
5. Destinatario entra a `/canjear?code=PSICO-XXXX-XXXX` (requiere login como paciente)
6. `redeem-gift-card` valida el código, marca como canjeado, agrega crédito en `patient_credits`
7. En el checkout de TherapistProfileView aparece el banner de crédito disponible — el paciente lo aplica con un click

**Tablas nuevas:**
- `gift_cards` — código, monto, remitente, destinatario, estado (pending_payment → paid → redeemed), expiración 1 año
- `patient_credits` — créditos por usuario (source: gift_card/refund/promo), con `get_patient_credit_balance()` SECURITY DEFINER
- `session_payments` — nuevas columnas `credit_used_usd` y `gift_card_id`

### Archivos creados/modificados (v43)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `supabase/migration_gift_cards.sql` | NEW | Tablas, índices, RLS, función de balance |
| `supabase/functions/create-gift-order/index.ts` | NEW | Crea orden PayPal (endpoint público) |
| `supabase/functions/capture-gift-payment/index.ts` | NEW | Captura pago, activa gift card, envía email |
| `supabase/functions/redeem-gift-card/index.ts` | NEW | Valida código, agrega crédito al paciente |
| `supabase/functions/_shared/email.ts` | MODIFIED | Añadida `giftCardEmail()` — template purple gradient con código en display grande |
| `src/pages/public/GiftPage.jsx` | NEW | `/regalo` — página pública con 3 pasos: form → PayPal → éxito |
| `src/pages/patient/RedeemGiftPage.jsx` | NEW | `/canjear` — canje de código (requiere login) |
| `src/components/payment/PayPalButton.jsx` | MODIFIED | Prop `creditUsed` → se pasa a `create-paypal-order` |
| `src/pages/patient/TherapistProfileView.jsx` | MODIFIED | Carga balance en `useEffect`, banner "Aplicar crédito" en checkout paso 2 |
| `src/pages/public/LandingPage.jsx` | MODIFIED | "🎁 Regalar" en navbar + "Regalar sesiones 🎁" en footer |
| `src/App.jsx` | MODIFIED | Rutas `/regalo` y `/canjear` |

### Pendientes de ejecución manual

```bash
# 1. Limpiar lock file y hacer commit+push
rm ~/Documents/Claude/Projects/Psiconecta\ App/.git/index.lock
cd ~/Documents/Claude/Projects/Psiconecta\ App
git add -A && git commit -m "feat: gift cards system" && git push origin main

# 2. Ejecutar SQL en Supabase Dashboard → SQL Editor
# Archivo: supabase/migration_gift_cards.sql

# 3. Deploy Edge Functions
supabase functions deploy create-gift-order
supabase functions deploy capture-gift-payment
supabase functions deploy redeem-gift-card
```

### Seguridad
- `create-gift-order` y `capture-gift-payment`: endpoints públicos (no requieren JWT) — necesario porque el comprador puede no tener cuenta
- `redeem-gift-card`: requiere JWT de paciente autenticado
- Race condition prevenida: `redeem-gift-card` hace UPDATE con `.eq('status', 'paid')` como guard atómico antes de insertar crédito; revierte si falla
- Idempotencia: `capture-gift-payment` verifica si la order ya fue procesada antes de capturar
- Códigos sin caracteres ambiguos: charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin O, 0, I, 1)

---

## ⚡ Sesión 2026-06-14 (v42) — Auditoría de seguridad + fixes

### Hallazgos y resoluciones

| Hallazgo | Severidad | Estado |
|----------|-----------|--------|
| `worker-src` CSP bloqueaba SW | Medio | ✅ Resuelto (v41) |
| `capture-subscription-payment` sin validación JWT | Medio | ✅ Resuelto (v42) |
| 9 vulnerabilidades HIGH en npm audit (tooling) | Medio | ✅ `npm audit fix` ejecutado |
| `apple-mobile-web-app-capable` deprecado | Bajo | ✅ Resuelto (v42) |
| `dangerouslySetInnerHTML` en BlogPostPage | Info | ✅ Ya protegido con DOMPurify |
| Sin `eval()` ni `.innerHTML =` en frontend | Info | ✅ Confirmado |
| Secrets hardcodeados | Info | ✅ Ninguno — solo `import.meta.env.*` y `Deno.env.get()` |

**Archivos modificados (v42):**
- `supabase/functions/capture-subscription-payment/index.ts` — JWT validation opcional: si el header `Authorization` está presente, verifica JWT con Supabase y hace cross-check `user.id === therapistId`. Si no coinciden → 403. Sin JWT → procede (flujo redirect, orderId de PayPal es prueba suficiente).
- `src/pages/payment/SubscriptionSuccess.jsx` — ahora intenta adjuntar JWT via `supabase.auth.getSession()` si la sesión sigue activa en el flujo redirect.
- `index.html` — agregado `<meta name="mobile-web-app-capable">` (estándar actual); mantenido `apple-mobile-web-app-capable` para compatibilidad iOS.

**Deploy:** `supabase functions deploy capture-subscription-payment` + commit + push ✅ 2026-06-14

**Fix adicional — Open Redirect (react-router CVE):**
- `src/components/ui/NotificationBell.jsx` — `handleClick` ahora valida que `notif.link` empiece con `/` y no con `//` antes de llamar `navigate()`. Bloquea redirect a dominios externos vía protocol-relative URLs (`//evil.com`). Commit + push ✅ 2026-06-14

**PWA Screenshots ✅ 2026-06-14:**
- `public/screenshots/screenshot-desktop.png` — 1280×800, landing page, `form_factor: "wide"`
- `public/screenshots/screenshot-mobile.png` — 390×844, landing page móvil, `form_factor: "narrow"`
- `public/manifest.webmanifest` — sección `screenshots` agregada. Elimina warnings de Chrome "Richer PWA Install UI". Banner de instalación enriquecido en Android.

**Playwright E2E — primera ejecución ✅ 2026-06-14:**
```
BASE_URL=https://psiconecta.app npm run test:e2e
20 passed (23.6s) — Chromium + Mobile (Pixel 7)
```
Cobertura: landing, pricing, directorio, blog, páginas legales, 404, login form, registro, credenciales inválidas, redirect de rutas privadas.

---

## ⚡ Sesión 2026-06-14 (v41) — PWA Service Worker activo

**Problema:** Service Worker no se registraba en producción — `navigator.serviceWorker.getRegistrations()` retornaba `[]`.

**Causa raíz:** `vercel.json` CSP tenía `worker-src blob:` sin `'self'`. Chrome bloquea silenciosamente el registro de `/sw.js` (mismo origen) cuando `'self'` no está en `worker-src`. El `.catch(() => {})` en `main.jsx` ocultaba el error.

**Fix:** `vercel.json` → `worker-src 'self' blob:` (1 carácter cambiado).

**Archivos modificados:**
- `vercel.json` — CSP: `worker-src blob:` → `worker-src 'self' blob:`

**Verificado ✅ 2026-06-14:**
- SW #254 `activated and is running` en Application → Service Workers (`https://psiconecta.app/`)
- Botón "Abrir en la app" visible en barra de Chrome → instalable como PWA nativa
- Instalación manual desde Safari/iPhone: compartir → "Agregar a pantalla de inicio"
- Lighthouse ya no tiene categoría PWA separada (removida en Chrome 116+) — los indicadores reales son el SW activo y el manifest válido, ambos ✅
- Commit `1406641`

---

## ⚡ Sesión 2026-06-14 (v40) — Reporte PDF de progreso del paciente

**Archivos modificados/creados:**
- `src/lib/generatePatientPDF.js` — NUEVO: genera PDF client-side con jsPDF (cargado dinámicamente desde CDN). Secciones: resumen numérico, historial de sesiones, notas clínicas (con nivel de riesgo por nota), tareas terapéuticas (% completadas), check-ins IA (con colores por riesgo), tests psicométricos completados. Sin datos de contacto ni pagos. Footer con paginación y marca "Confidencial". Descarga como `reporte_NombrePaciente_YYYY-MM-DD.pdf`
- `src/pages/therapist/PatientDetail.jsx` — botón "Exportar PDF" en header del paciente (solo visible si `isPro && hasAccess`). Al clickear: fetcha `therapeutic_relationships` + `test_assignments` completados, luego llama `generatePatientPDF`. Estado `generatingPDF` muestra "Generando…" mientras procesa.
- `src/pages/public/LandingPage.jsx` — feature "Exporta el expediente clínico completo en PDF" agregado al Plan Pro en sección Para profesionales
- `src/pages/public/PricingPage.jsx` — mismo feature agregado a la lista de features del plan Pro
- `src/pages/therapist/SubscriptionPage.jsx` — "Expediente clínico en PDF" con icono BookMarked en features del plan Pro

**Sin dependencias nuevas de npm** — jsPDF y jspdf-autotable se cargan desde CDN en tiempo de ejecución (mismo patrón que PayPal SDK). No requiere `npm install`.

**Sin migraciones SQL necesarias** — usa datos ya existentes en BD.

---

---

## ⚡ Sesión 2026-06-14 (v39) — Plan anual con descuento 17%

**Archivos modificados:**
- `supabase/migration_annual_billing.sql` — NUEVO: agrega `billing_cycle TEXT DEFAULT 'monthly' CHECK (monthly|annual)` a `therapist_profiles` y `subscription_payments`; índice `idx_therapist_profiles_billing_cycle`
- `supabase/functions/create-subscription-order/index.ts` — acepta `billingCycle` en el body; monto $799 si anual, $79.99 si mensual; `period_end` +1 año si anual; guarda `billing_cycle` en `subscription_payments`
- `supabase/functions/capture-subscription-payment/index.ts` — lee `billing_cycle` de `subscription_payments`; si anual → `plan_expires_at` +1 año; escribe `billing_cycle` en `therapist_profiles`; fallback por `amountPaid >= 300` si no hay registro previo
- `src/components/payment/PayPalSubscriptionButton.jsx` — prop `billingCycle` (default `'monthly'`); ref `billingCycleRef` para capturar valor fresco en closure de PayPal; envía `{ plan: 'pro', billingCycle }` al Edge Function
- `src/pages/therapist/SubscriptionPage.jsx` — estado `billingCycle`; toggle Mensual/Anual (resetea `showPayPal` al cambiar); precio dinámico con badge "−17%"; savings callout "$159.88 ahorrado/año"; CTA label dinámico; disclaimer dinámico; `fetchPlan` lee `billing_cycle` de BD
- `src/pages/public/PricingPage.jsx` — estado `billing`; toggle Mensual/Anual sobre el grid; precio del plan Pro dinámico ($799/año con badge "−17%", savings "$159.88" en verde); CTA dinámico; nueva FAQ sobre diferencia mensual/anual
- `src/pages/admin/AdminSubscriptions.jsx` — función `monthlyEquivalent(plan, billingCycle)`: anual = 799/12, mensual = 79.99; MRR calculado correctamente; nueva métrica "Ciclo Anual"; badge verde "Anual ($799/año)" en lista de terapeutas; `changePlan` limpia `billing_cycle` a 'monthly' al bajar a básico

**SQL a ejecutar en Supabase (migration_annual_billing.sql):**
```sql
ALTER TABLE therapist_profiles ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual'));
ALTER TABLE subscription_payments ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual'));
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_billing_cycle ON therapist_profiles (billing_cycle);
```

**Edge Functions a redesplegar:**
```bash
supabase functions deploy create-subscription-order
supabase functions deploy capture-subscription-payment
```

---

## ⚡ Sesión 2026-06-14 (v38) — Resumen de cambios

**Build verificado: 0 errores (verificación sintáctica — build nativo en Mac).**

**Estado de ejecución:**
- [x] Push `main` ✅ 2026-06-14
- [x] SQL `MIGRAR_AHORA.sql` ✅ ejecutado — bloques 4-9 aplicados: `is_anonymous`, RPC `get_public_reviews`, `deletion_requests`, `emergency_contacts`, `device_tokens`, 6 tests psicométricos (isi, pss10, dass21, spin, dast10, cssrs)
- [x] SQL `seed_psychometrics_clinicas_nuevas.sql` ✅ ejecutado — seed completo para ISI, PSS-10, SPIN, DAST-10, C-SSRS (DASS-21 ya existía en `seed_psychometrics.sql`)
- [ ] Verificación en producción: escalas nuevas visibles, realtime admin activo, CSV Payouts funcional

**Escalas clínicas — 6 nuevas (v38):**
- **`src/data/clinicalScales.js`** — de 4 a **10 escalas validadas**: ISI, PSS-10, DASS-21, SPIN, DAST-10, C-SSRS añadidas con esquema completo (`questions`, `bands`, `maxScore`, `reference`, `instruction`)
- **`ClinicalScalesPage.jsx`** — THEME expandido de 4 a 9 colores (indigo, orange, teal, violet, red). Fix Sentry: `TypeError: Cannot read properties of undefined (reading 'pill')`. `SCALE_SLUG_MAP` actualizado con los 6 slugs nuevos — botón "Aplicar a paciente" ahora aparece en todas las escalas.
- **`supabase/seed_psychometrics_clinicas_nuevas.sql`** — seed de 5 escalas con `test_sections`, `items`, `response_options`, `scoring_rules` e `interpretation_ranges`:
  - ISI: 7 ítems, opciones por ítem (distintas etiquetas 0-4), 4 bandas de insomnio
  - PSS-10: 10 ítems, 4 ítems inversos con valor ya embebido en `response_options` (evita `sum_reversed` — no está en el CHECK constraint), 3 bandas
  - SPIN: 17 ítems, 3 subescalas (miedo/evitación/fisiológico) + total, 4 bandas, punto corte ≥19
  - DAST-10: 10 ítems `multiple_choice` Sí/No, Q3 invertido con opciones propias, 5 bandas de riesgo
  - C-SSRS: 6 ítems `multiple_choice`, `alert_threshold=1` en ítems 3-6, 3 subescalas (ideación/plan/conducta), `is_risk_level=TRUE` desde score ≥3
- **Errores SQL corregidos durante ejecución:** `sum_reversed` no existe en constraint (→ reverso en options), `binary` no existe (→ `multiple_choice`), VALUES con columnas desiguales en DAST-10 Q10 (→ columna `alert_threshold` explícita con NULL)

**Admin — lista de terapeutas (v38):**
- `AdminTherapists.jsx`: query cambiada de `therapist_profiles` a `profiles` con LEFT JOIN — muestra todos los terapeutas registrados, incluso sin perfil completo
- `Badge.jsx`: `VerificationBadge` maneja nuevo estado `incomplete` → badge "Perfil incompleto"
- `AdminDashboard.jsx`: conteo revertido a `profiles` con `role='therapist'` para que coincida con la lista
- Filtro "Pendientes" incluye `pending` e `incomplete`

**FindTherapist / TherapistMatchPage (v38):**
- Restauradas columnas `languages`, `years_experience`, `approaches`, `education` en los SELECT (ya existen en BD desde `migration_payouts_and_payment_fields.sql`)
- Chips visuales bajo el bio en ambas páginas: años de experiencia (warm), idiomas (blue), enfoques (indigo/primary)

**Realtime admin (v38):**
- **`AdminAIAlerts.jsx`** — suscripción `postgres_changes INSERT` en `ai_checkins`. Cuando llega alerta high/medium: ítem prepended sin recargar, contadores actualizados, toast 8s con fondo rojo/amarillo. Chip "En tiempo real" + contador "+N nuevas en esta sesión" siempre visibles.
- **`AdminTherapists.jsx`** — suscripción `postgres_changes INSERT` en `therapist_credentials`. Toast azul con nombre del terapeuta, lista auto-refrescada, banner "Nuevas credenciales subidas".

**CSV export (v38):**
- **`AdminPayouts.jsx`** — botón CSV en tab Historial. 11 columnas: ID, terapeuta, monto, estado, método, referencia, período desde/hasta, pagado en, creado en, nota. Solo visible cuando hay datos. Respeta el filtro de búsqueda activo.
- `AdminSessions.jsx` ya tenía CSV desde v36.

---

## ⚡ Sesión 2026-06-09 (v32) — Resumen de cambios

**Build verificado: 0 errores.**

**Estado de ejecución:**
- [x] SQL ✅ ejecutado 2026-06-09 — las 7 migraciones aplicadas (vía `EJECUTAR_2026-06-09_v32.sql` + `EJECUTAR_FALTANTES.sql`). Incidencias resueltas: vista huérfana `my_profile` eliminada (`DROP VIEW`, dependía de las columnas emergency_* y no se usaba en el código).
- [x] Edge Functions ✅ desplegadas 2026-06-09: `clinical-content`, `delete-user-data`, `notify-new-message`, `send-reminders` (esta última con `--no-verify-jwt` — se autentica con CRON_SECRET).
- [x] Push del frontend a `main` ✅ 2026-06-12 (incluye fixes v33, abajo)
- [ ] Verificación en producción: landing/testimonios, DSM-CIE con Pro, "Eliminar mi cuenta", registro con contacto de emergencia, chat OK, errores llegando a Sentry
- [ ] Verificar comisiones (query en `supabase/RUNBOOK_MIGRACIONES_PENDIENTES.md`, debe devolver 0 filas)
- [x] Sentry ✅ configurado 2026-06-09 — proyecto creado en sentry.io (org `psiconecta-ii`), `VITE_SENTRY_DSN` y `VITE_SENTRY_ENVIRONMENT` añadidas en Vercel (Production + Preview). Solo Error Monitoring + tracing 10%; Session Replay descartado por privacidad.
- [ ] Firebase/FCM para push nativas (ver `PUSH_SETUP.md`) — secret `FCM_SERVICE_ACCOUNT` + apps Android/iOS
- [ ] `npx playwright install chromium` y `npm run test:e2e` antes del próximo deploy
- [x] Restaurar columnas `languages/years_experience/approaches/education` en `FindTherapist.jsx` y `TherapistMatchPage.jsx` ✅ 2026-06-14

**Fixes v33 (2026-06-12) — incidente chat + hallazgos de consola:**
- **CRÍTICO — chat roto (42501):** la política INSERT de `messages` no existía en
  producción (se perdió en alguna edición por dashboard; el repo la tenía). Restauradas
  las 4 políticas vía `migration_fix_messages_policies.sql` ✅ ejecutada 2026-06-12.
- **CSP bloqueaba Sentry:** añadidos `*.ingest.us.sentry.io` y `www.google.com` (GA4
  regional) a `connect-src` en `vercel.json` — los errores no llegaban a Sentry.
- **ChatPage `markAsRead`:** `.catch()` encadenado al builder de supabase-js lanzaba
  TypeError — reemplazado por try/await.
- **CORS para app nativa ✅ resuelto en código:** `_shared/cors.ts` ahora exporta
  `getCorsHeaders(req)` con allowlist (psiconecta.app, www, `https://localhost` Android,
  `capacitor://localhost` iOS, `localhost:*` dev). Las 18 funciones migradas al helper
  (eliminados los `corsHeaders` inline duplicados). **Pendiente: redesplegar TODAS las
  funciones** — `supabase functions deploy <cada-una>` (send-reminders con `--no-verify-jwt`).
- **FindTherapist/TherapistMatchPage:** restauradas las columnas `languages,
  years_experience, approaches, education` en los SELECT (ya existen en BD).

**Push notifications — progreso emulador (2026-06-12):**
- Android Studio instalado, proyecto `android/` generado (`cap add android`), TypeScript
  añadido como devDependency (lo requiere el CLI de Capacitor).
- `google-services.json` correcto en `android/app/` (package `com.psiconecta.app`;
  ojo: hay una app fantasma `com.psiconecta.psiconecta` registrada en Firebase, ignorable).
- `FCM_SERVICE_ACCOUNT` ✅ configurado en Supabase Secrets (proyecto `psiconecta-app-web`).
- Emulador Pixel 7 (API 35, con Play Store) funcionando — requirió liberar espacio en disco.
- [x] **✅ PUSH FUNCIONANDO EN ANDROID (validado 2026-06-12):** flujo completo
  verificado en emulador — registro de token, mensaje de chat → notificación FCM.
  CORS de funciones redesplegado con soporte de orígenes nativos.
- Pendiente solo iOS: requiere Apple Developer Program ($99/año) — misma membresía
  que desbloquea Apple OAuth (obligatorio para publicar en App Store).

**v36 (2026-06-12) — Panel admin operativo:**
- **Badges de pendientes en sidebar** (AdminLayout): credenciales por revisar,
  alertas IA sin revisar, reembolsos pendientes/disputados y solicitudes de
  eliminación — refresco al navegar + cada 60s. También en nav móvil.
- **Confirmación con motivo al banear** (`ConfirmToggleModal` compartido en
  Terapeutas y Pacientes): motivo obligatorio al desactivar, registrado en
  `audit_log` (best-effort) y enviado a `admin-toggle-user`.
- **Búsqueda** añadida en: Terapeutas (nombre/especialidad/licencia), Sesiones,
  Reembolsos, Suscripciones (nombre/email) y Pagos (ambas pestañas).
- **Paginación** en Sesiones (50/página con "Cargar más"; métricas siguen
  siendo globales vía query ligera).
- **Bandeja "Requiere tu atención hoy"** en AdminDashboard: las 4 categorías
  (alertas IA, credenciales, reembolsos, eliminaciones) como tarjetas accionables
  con conteo y acceso directo; banner verde "Todo al día" cuando no hay pendientes.
- **Sidebar agrupado:** Dashboard · Personas (Terapeutas/Pacientes/Reseñas) ·
  Clínico (Alertas IA/Sesiones/Grupales) · Finanzas (Finanzas/Pagos/Reembolsos/
  Suscripciones) · Sistema (Estadísticas/Actividad/Elim. de datos).
- Pendiente próxima sesión: 2FA admins, paginación en Pacientes cuando crezca.

**v35 (2026-06-12) — Contenido + UX premium: ✅ DESPLEGADO Y VERIFICADO**
- **Blog ×2:** 5 artículos SEO nuevos (depresión, costo psicólogo RD, burnout,
  cómo ayudar a alguien, insomnio) — 10 en total. Sitemap actualizado.
  Pendiente: registrar/verificar sitemap en Google Search Console.
- **Lenguaje de animación premium** (hook `useScrollReveal` + CSS en index.css):
  landing, /pricing, /terapeutas, /blog y artículos. Hero en cascada, stagger
  90ms, hover lift, float del mockup. GPU puro, reduced-motion respetado.
- **Estados vacíos:** testimonios de landing se ocultan sin reseñas; directorio
  sin terapeutas muestra invitación "terapeutas fundadores" con CTA.
- **Post-pago premium:** PaymentSuccess con resumen de cita, contador y botón
  "Añadir a mi calendario" (.ics con alarma -30min). PayPalButton pasa bookingId.
- **Micro-interacciones:** mensajes de chat con slide-up, mood tracker con pop,
  fade de ruta en Layout y AdminLayout.

**v34 (2026-06-12) — Mejoras móviles/PWA: ✅ DESPLEGADO COMPLETO**
(SQL ejecutado: cron a */15 + banderas · funciones redesplegadas · splash generada · push a main)
- **Push agendar/cancelar:** `capture-paypal-order` y `notify-cancellation` envían
  push a paciente y terapeuta (además del email).
- **Recordatorio 30 min antes (solo push)** con deep-link directo a `/video-call/:id`
  (videollamada a un toque). `migration_reminder_flags.sql` PENDIENTE de ejecutar:
  añade banderas anti-duplicado + cambia el cron a cada 15 min.
- **PWA instalable:** `manifest.webmanifest` + iconos 192/512/maskable + `sw.js`
  (shell offline: navegaciones network-first con fallback, assets cache-first).
  Registro del SW en `main.jsx` (solo prod, no en app nativa).
- **Entrada directa `/app`:** ruta `AppEntry` que salta al dashboard según rol con
  la sesión persistida — `start_url` del manifest. Abrir el ícono = caer en la agenda.
- **Agenda offline del terapeuta:** TherapistDashboard cachea sesiones/stats en
  localStorage; sin conexión muestra la agenda guardada con banner + Reintentar.
  (Historial clínico offline descartado a propósito: datos de salud sin cifrar en disco.)
- **Splash nativa:** config SplashScreen en capacitor.config.ts + `resources/`
  (icon.png, splash.png 2732² fondo indigo). Pendiente en terminal:
  `npm i -D @capacitor/assets && npm i @capacitor/splash-screen && npx capacitor-assets generate --android && npm run cap:sync`
- **Dato clave (Google Play):** la comisión 15-30% NO aplica — los pagos por
  servicios humanos en tiempo real (terapia) están exentos del Play Billing.
  Solo cuesta $25 únicos la cuenta de desarrollador.

**Cambios:**
- **DSM-5-TR y CIE-11 fuera del bundle JS** → Edge Function `clinical-content`
  (verifica `is_pro_therapist()` server-side). Hook `useClinicalContent` con caché
  en memoria. `src/data/dsm5tr.js` y `cie11.js` eliminados del frontend.
- **Migraciones pendientes corregidas antes de ejecutar:** `public_reviews` reescrita
  como RPC `get_public_reviews()` (la política anon exponía patient_id y el join a
  profiles fallaba — LandingPage actualizada); `payouts` con `WITH CHECK` + vista
  `security_invoker=true` (exponía cuentas bancarias a cualquier autenticado).
- **RGPD / Ley 172-13:** tabla `deletion_requests`, Edge Function `delete-user-data`
  (borra datos clínicos, anonimiza perfil, banea cuenta, conserva registros
  financieros), sección "Eliminar mi cuenta" en perfil paciente/terapeuta,
  panel `/admin/deletions`.
- **Contacto de emergencia** → tabla `emergency_contacts` con RLS estricta
  (paciente + terapeuta con relación activa + admin). Columnas eliminadas de
  `profiles`. Register.jsx actualizado.
- **Sentry** integrado (`src/lib/sentry.js`, no-op sin DSN, sin PII, usuario por id/rol).
- **Playwright E2E**: `playwright.config.js` + `tests/e2e/smoke.spec.js`
  (rutas públicas + auth). Scripts `test:e2e` y `test:e2e:prod`. Guía de staging
  con Vercel Previews en `STAGING.md`.
- **Push notifications nativas**: `@capacitor/push-notifications` instalado,
  registro de tokens en `device_tokens`, helper FCM v1 (`_shared/push.ts`),
  integrado en chat y recordatorios. Falta config Firebase (ver `PUSH_SETUP.md`).

---

## 1. Descripción General

**Psiconecta** es una plataforma de psicoterapia online (web + iOS + Android) con tres roles: **terapeuta**, **paciente** y **administrador**.

- **Stack:** React 18 + Vite 6, Tailwind CSS, Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions), Capacitor 7, Daily.co (video), PayPal (pagos)
- **Deploy:** Vercel — `psiconecta-app.vercel.app`
- **GitHub:** `royerwatson/psiconecta-app` (rama `main`)
- **Supabase project ID:** `kudldawuehduidhipvmn`

---

## 2. Arquitectura de Archivos

```
src/
├── App.jsx                          # Router con todas las rutas
├── main.jsx                         # Entry point con CurrencyProvider
├── store/authStore.js               # Zustand: user, profile, role, fetchProfile
├── lib/
│   ├── supabase.js                  # Cliente Supabase
│   ├── utils.js                    # formatPrice, formatDateTime, cn, getDisplayName, isAnonymous
│   └── generatePatientPDF.js       # Genera PDF clínico client-side (jsPDF CDN dinámico)
├── context/
│   └── CurrencyContext.jsx          # Provider global tipo de cambio USD→DOP
├── hooks/
│   └── useCurrency.js               # Tasa de cambio open.er-api.com, caché 6h localStorage
├── components/
│   ├── layout/
│   │   ├── Layout.jsx               # Nav paciente/terapeuta, tab bar, drawer "Más", candado Pro
│   │   ├── AdminLayout.jsx          # Sidebar admin con 12 secciones
│   │   ├── ProtectedRoute.jsx       # TherapistRoute, ClientRoute, AdminRoute
│   │   └── ProGate.jsx              # Bloquea rutas clínicas a plan Gratuito
│   ├── auth/
│   │   └── SocialLoginButtons.jsx   # Google, Apple, Facebook OAuth buttons
│   ├── ui/
│   │   ├── Spinner.jsx              # Spinner + LoadingScreen + PsiconectaLogo (SVG dos arcos)
│   │   ├── Button/Card/Modal/Input/Avatar/Badge/StarRating/AvatarUpload/NotificationBell
│   ├── patient/
│   │   ├── MoodTracker.jsx          # Widget estado de ánimo + gráfica 7 días
│   │   └── AICheckin.jsx            # Check-in diario IA (análisis riesgo con Claude)
│   ├── payment/
│   │   └── PayPalButton.jsx         # SDK PayPal con createOrder/onApprove
│   ├── psychometrics/
│   │   ├── AssignTestModal.jsx      # Modal terapeuta asigna test al paciente
│   │   ├── PatientTestsTab.jsx      # Tab tests en detalle paciente
│   │   └── PendingTestsSection.jsx  # Tests pendientes en dashboard paciente
│   └── onboarding/
│       └── OnboardingSlides.jsx     # Slides bienvenida por rol (íconos Lucide)
├── data/
│   ├── dsm5tr.js                    # DSM-5-TR completo en español
│   ├── cie11.js                     # CIE-11 completo en español
│   ├── clinicalScales.js            # PHQ-9, GAD-7, AUDIT, PCL-5 con scoring automático
│   ├── therapeuticLibrary.js        # 40+ ejercicios terapéuticos por categoría
│   └── therapeuticProtocols.js      # Protocolos TCC, DBT, ACT, EMDR
└── pages/
    ├── auth/       Login, Register, ForgotPassword, ResetPassword, AdminLogin, AuthCallback
    ├── admin/      12 páginas (ver §4)
    ├── patient/    11 páginas (ver §4)
    ├── therapist/  14 páginas (ver §4)
    ├── shared/     ChatPage, VideoCall
    ├── payment/    PaymentSuccess, PaymentCancel
    └── public/     LandingPage, PricingPage, SEOHead, TherapistDirectoryPage, BlogListPage, BlogPostPage, LegalPage, TermsPage, PrivacyPage, RefundPage
```

---

## 3. Base de Datos (Supabase PostgreSQL)

### Tablas clave
| Tabla | Descripción |
|-------|-------------|
| `profiles` | Todos los usuarios (role, full_name, avatar_url, **is_anonymous**, gender, birth_date, preferred_language) |
| `therapist_profiles` | Perfil extendido (specialty, price, **subscription_plan**, **commission_rate**, **billing_cycle**, verified, **payment_method**, paypal_email, bank_*) |
| `payouts` | Liquidaciones a terapeutas (amount, status, payment_method, reference, paid_at) |
| `sessions` | Citas (status, price, **platform_commission**, **therapist_net**, video_room_url, is_urgent) |
| `messages` | Chat (sender_id, receiver_id, content, **read_at**) |
| `therapist_credentials` | Docs de verificación (**document_type**, status, **rejection_reason**) |
| `subscription_payments` | Historial pagos de suscripción ($79.99/mes o $799/año) + `billing_cycle` |
| `tests` / `test_assignments` / `test_sessions` / `test_results` | Sistema psicométrico completo |
| `mood_entries` | Estado de ánimo diario del paciente |
| `ai_checkins` | Check-ins IA con risk_level (low/medium/high) |
| `patient_tasks` | Tareas asignadas por el terapeuta |
| `patient_journal` | Diario personal del paciente |
| `group_sessions` / `group_participants` | Terapia grupal |
| `payouts` | Liquidaciones a terapeutas |
| `reviews` | Reseñas (rating 1-5) |

### Migraciones SQL ejecutadas (en `/supabase/`)
| Archivo | Estado |
|---------|--------|
| `schema_1_tables.sql` + triggers + RLS + storage | Ejecutado |
| `migration_psychometrics_core.sql` | Ejecutado |
| `migration_subscriptions.sql` | Ejecutado |
| `migration_subscription_update.sql` | Ejecutado |
| `migration_messages_read_at.sql` | Ejecutado |
| `migration_anonymity.sql` | Ejecutado |
| `migration_credentials.sql` | Ejecutado |
| `migration_fix_results_rls.sql` | **Ejecutado** — política INSERT para paciente en `test_results` |
| `migration_fix_test_assignment_patient_update.sql` | **Ejecutado** — política UPDATE para paciente en `test_assignments` |
| `migration_checkin_reviewed.sql` | **Ejecutado** — columna `therapist_reviewed_at` en `ai_checkins` |
| `migration_fix_profile_role_escalation.sql` | **Ejecutado** — bloquea auto-escalada de rol + función `admin_set_user_role()` |
| `migration_fix_profiles_select.sql` | **Ejecutado** — `profiles_select` restrictiva por relación + función `is_admin()` |
| `migration_fix_sessions_update.sql` | **Ejecutado** — `WITH CHECK` bloquea campos financieros en `sessions` |
| `migration_fix_credentials_rls.sql` | **Ejecutado** — admin puede leer/aprobar `therapist_credentials` |
| `migration_fix_progate_server_side.sql` | **Ejecutado** — RLS server-side módulo psicométrico + función `is_pro_therapist()` |
| `migration_fix_length_constraints.sql` | **Ejecutado** — CHECK constraints longitud en messages, clinical_history, patient_tasks, etc. |
| `migration_add_profile_fields.sql` | **Ejecutado** ✅ 2026-06-09 — columnas `gender`, `birth_date`, `preferred_language` en `profiles` |
| `migration_payouts_and_payment_fields.sql` | **Ejecutado** ✅ 2026-06-09 — tabla `payouts`, vista `therapist_pending_earnings` (con `security_invoker=true`), columnas de cobro; política admin con `WITH CHECK` + `is_admin()` |
| `migration_commission_rates.sql` | **Ejecutado** ✅ 2026-06-09 — comisión básico 20%, pro/premium 10%; trigger + filas existentes actualizadas |
| `migration_public_reviews.sql` | **Ejecutado** ✅ 2026-06-09 — v2: RPC `get_public_reviews()` SECURITY DEFINER (nombre anonimizado server-side) en lugar de abrir RLS a anon |
| `migration_deletion_requests.sql` | **Ejecutado** ✅ 2026-06-09 — tabla `deletion_requests` + RLS (derecho de supresión) |
| `migration_emergency_contacts.sql` | **Ejecutado** ✅ 2026-06-09 — tabla `emergency_contacts` con RLS estricta; columnas emergency_* eliminadas de `profiles` (+ `DROP VIEW my_profile` huérfana) |
| `migration_device_tokens.sql` | **Ejecutado** ✅ 2026-06-09 — tabla `device_tokens` para push FCM/APNs |
| `migration_fix_availability.sql` | **Ejecutado** ✅ — RLS explícita por operación en `therapist_availability` + UNIQUE constraint |
| `fix_find_therapist_columns.md` | **Fix código** ✅ — Removidas columnas `languages/years_experience/approaches/education` de `FindTherapist.jsx` y `TherapistMatchPage.jsx` (requieren `migration_payouts_and_payment_fields.sql` pendiente) |
| `migration_annual_billing.sql` | **Ejecutado** ✅ 2026-06-14 — `billing_cycle TEXT DEFAULT 'monthly' CHECK (monthly\|annual)` en `therapist_profiles` y `subscription_payments`; índice `idx_therapist_profiles_billing_cycle` |

---

## 4. Páginas y Rutas

### Admin (`/admin/*`)
| Ruta | Página |
|------|--------|
| `/admin/dashboard` | Dashboard métricas + alertas IA |
| `/admin/therapists` | Verificación credenciales (3 docs individuales) |
| `/admin/patients` | Lista pacientes con riesgo IA |
| `/admin/sessions` | Todas las sesiones |
| `/admin/groups` | Sesiones grupales |
| `/admin/stats` | Estadísticas engagement |
| `/admin/financial` | Reportes financieros |
| `/admin/payouts` | Liquidaciones terapeutas |
| `/admin/subscriptions` | Planes + MRR |
| `/admin/activity` | Log de actividad |
| `/admin/reviews` | Moderación reseñas |
| `/admin/ai-alerts` | Alertas riesgo IA |

### Terapeuta (`/therapist/*`)
| Ruta | Página | Plan requerido |
|------|--------|----------------|
| `/therapist/dashboard` | Dashboard + sesiones próximas | Todos |
| `/therapist/schedule` | Agenda y disponibilidad | Todos |
| `/therapist/patients` | Lista pacientes (con badge anónimo) | Todos |
| `/therapist/patients/:id` | Detalle paciente | Todos |
| `/therapist/profile` | Perfil + 3 credenciales + pagos | Todos |
| `/therapist/subscription` | Gestión plan Gratuito/$50 | Todos |
| `/therapist/chat` | Mensajería | Todos |
| `/therapist/stats` | Dashboard estadísticas avanzadas | **Suscripción** |
| `/therapist/tests` | Catálogo 45+ tests | **Suscripción** |
| `/therapist/test-result/:id` | Resultado de test | Todos |
| `/therapist/dsm` | DSM-5-TR | **Suscripción** |
| `/therapist/cie` | CIE-11 | **Suscripción** |
| `/therapist/scales` | Escalas clínicas con scoring | **Suscripción** |
| `/therapist/safety-plan` | Plan de crisis | **Suscripción** |
| `/therapist/library` | Biblioteca terapéutica | **Suscripción** |
| `/therapist/peers` | Consulta con colegas | **Suscripción** |
| `/therapist/protocols` | Protocolos terapéuticos | **Suscripción** |

### Paciente (`/patient/*`)
| Ruta | Página |
|------|--------|
| `/patient/dashboard` | Home con AICheckin + MoodTracker |
| `/patient/find` | Búsqueda terapeutas (badges Pro, filtros, PayPal) |
| `/patient/therapist/:id` | Perfil público terapeuta + agendar |
| `/patient/appointments` | Mis citas |
| `/patient/chat` | Mensajería |
| `/patient/tasks` | Tareas asignadas |
| `/patient/journal` | Diario personal |
| `/patient/sessions` | Historial de sesiones |
| `/patient/crisis` | Recursos de crisis por país |
| `/patient/groups` | Terapia grupal |
| `/patient/profile` | Perfil + **toggle de anonimato** |
| `/patient/tests/:id` | Tomar test psicométrico |
| `/patient/results` | Mis resultados |

### Compartidas / Públicas
| Ruta | Página |
|------|--------|
| `/` | LandingPage pública (hero, beneficios, pasos, terapeutas, FAQ, confianza) |
| `/terapeutas` | Directorio público de terapeutas verificados (indexable por Google) |
| `/blog` | Listado de artículos de salud mental |
| `/blog/:slug` | Artículo individual con SEO, artículos relacionados y CTA |
| `/terminos` | Términos de uso (12 secciones, ley RD 172-13) |
| `/privacidad` | Política de privacidad (datos de salud, terceros, derechos) |
| `/reembolsos` | Política de reembolsos (100%/50%/0%, urgentes, Pro) |
| `/video-call/:id` | VideoCall Daily.co (reconexión automática) |
| `/pricing` | Landing pública de planes |
| `/auth/callback` | Callback OAuth (Google/Apple/Facebook) |
| `/payment/success` / `/payment/cancel` | Resultado de pago |

---

## 5. Modelo de Negocio

### Planes del terapeuta
| Plan | Precio | Comisión | Herramientas |
|------|--------|----------|--------------|
| **Gratuito** | $0/mes | **20%** | Perfil, agenda, chat, videollamadas |
| **Suscripción mensual** | $79.99/mes USD | **10%** | Todo + tests, DSM, CIE, escalas, crisis, biblioteca, colegas, protocolos, estadísticas, PDF clínico |
| **Suscripción anual** | $799/año USD (~17% dto.) | **10%** | Igual que mensual · ahorro $159.88/año · `billing_cycle='annual'` |

### Moneda
- Pagos procesados en **USD** vía PayPal
- Conversión referencial a **DOP** (open.er-api.com, caché 6h)
- Disclaimer en modales: "monto exacto lo determina PayPal"

### Verificación de terapeutas
Flujo de 3 documentos obligatorios, revisados individualmente por el admin:
1. **Título profesional** — diploma universitario
2. **Exequátur** — autorización del Estado
3. **Acreditación Colegio Psicológico** — membresía vigente

Flujo: terapeuta sube docs → admin aprueba/rechaza cada uno con motivo → cuando los 3 están aprobados aparece el botón "Completar verificación" → al hacer clic se activa el terapeuta.

---

## 6. Edge Functions (Supabase Deno)

| Función | Descripción |
|---------|-------------|
| `create-daily-room` | Crea sala Daily.co server-side (DAILY_API_KEY en secrets) |
| `create-paypal-order` | Orden PayPal + comisión según plan del terapeuta |
| `capture-paypal-order` | Captura pago, actualiza sesión, envía emails |
| `create-subscription-order` | Orden PayPal suscripción — acepta `billingCycle` (monthly $79.99 / annual $799), guarda `billing_cycle` en `subscription_payments` |
| `capture-subscription-payment` | Captura + activa plan Pro — +30 días si mensual, +365 días si anual; escribe `billing_cycle` en `therapist_profiles` |
| `ai-checkin` | Analiza check-in con Claude API, detecta riesgo |
| `process-payout` | Liquidación al terapeuta vía PayPal |
| `notify-new-message` | Email al recibir mensaje |
| `notify-cancellation` | Email al cancelar cita |
| `send-reminders` | Recordatorios automáticos (cron) |
| `admin-toggle-user` | Admin activa/desactiva cuentas |
| `verify-payment` | Verifica pago completado |
| `clinical-content` | Sirve DSM-5-TR / CIE-11 solo a terapeutas Pro (`is_pro_therapist()`) — los datos ya no van en el bundle JS (✅ desplegada 2026-06-09) |
| `delete-user-data` | Derecho de supresión: borra datos clínicos, anonimiza perfil, banea cuenta; conserva registros financieros. Solo admin (✅ desplegada 2026-06-09) |

**Helper compartido nuevo:** `_shared/push.ts` — envío push vía FCM HTTP v1 (best-effort, no-op sin `FCM_SERVICE_ACCOUNT`). Integrado en `notify-new-message` y `send-reminders`.

### Secrets configurados en Supabase
```
DAILY_API_KEY              ✅ rotado 2026-06-05
PAYPAL_CLIENT_ID           ✅ configurado
PAYPAL_CLIENT_SECRET       ✅ configurado
PAYPAL_BASE_URL            ✅ configurado (sandbox actualmente)
PAYPAL_WEBHOOK_SANDBOX_ID  ✅ configurado
APP_URL                    ✅ configurado
RESEND_API_KEY             ✅ configurado
FROM_EMAIL                 ✅ configurado
ANTHROPIC_API_KEY          ✅ configurado — IA de check-ins activa
CLINICAL_ENCRYPTION_KEY    ✅ configurado
```

**Pendientes en Supabase Secrets:**
```
PAYPAL_WEBHOOK_ID    — para producción (actualmente solo existe PAYPAL_WEBHOOK_SANDBOX_ID)
FCM_SERVICE_ACCOUNT  — JSON de service account de Firebase para push (ver PUSH_SETUP.md)
```

**Configurados en Vercel (frontend):**
```
VITE_SENTRY_DSN          ✅ configurado 2026-06-09 (Production + Preview)
VITE_SENTRY_ENVIRONMENT  ✅ configurado 2026-06-09
```

**Secrets configurados (2026-06-06):**
```
APP_URL     ✅ actualizado a https://psiconecta.app
CRON_SECRET ✅ configurado — protege endpoint send-reminders
```

---

## 7. Variables de Entorno Frontend (`.env`)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_PAYPAL_CLIENT_ID=...
# VITE_DAILY_API_KEY — NO usar, la key está en Supabase Secrets
```

---

## 8. Auth y Login Social
- Email + password (nativo Supabase)
- **Google OAuth** ✅ configurado y funcionando
- **Apple OAuth** — requiere membresía Apple Developer ($99/año) — bloqueado
- **Facebook OAuth** ✅ configurado y funcionando
  - App ID: `1117610634776862` (Psiconecta.app en Meta for Developers)
  - URI de callback: `https://kudldawuehduidhipvmn.supabase.co/auth/v1/callback`
  - Permisos: `email`, `public_profile`, `user_age_range`, `user_birthday`, `user_gender`
  - App en modo desarrollo (publicar requiere revisión de Meta)
- Callback: `/auth/callback` — detecta si es usuario nuevo (sin role) → `/register?social=true`

---

## 9. Funcionalidades Completadas

### Core y Auth
- [x] Registro con rol (terapeuta/paciente), login email+password+Google
- [x] Onboarding slides por rol
- [x] Perfil terapeuta (bio, especialidad, precio, credenciales 3 docs, pagos)
- [x] Perfil paciente con toggle de anonimato (iniciales visibles al terapeuta)
- [x] Notificaciones in-app + preferencias email

### Citas y Video
- [x] Búsqueda terapeutas (filtros, badges Pro, orden por plan)
- [x] Agendamiento + pago PayPal (flujo completo)
- [x] Citas urgentes (<24h) con +30% precio — toggle activar/desactivar en agenda del terapeuta (`/therapist/schedule`)
- [x] Cambio de terapeuta (hasta 48h antes)
- [x] Videollamadas Daily.co (sala server-side, sin API key expuesta)
- [x] Reconexión automática + banner calidad de red
- [x] Sesiones grupales multi-participante

### Chat
- [x] Mensajería realtime (Supabase Realtime)
- [x] Badge mensajes no leídos (read_at)
- [x] Presencia real (Supabase Presence — En línea / Desconectado)
- [x] Paginación scroll infinito inverso (40 msg/página)
- [x] Lista de conversaciones al abrir (no auto-abre la última)
- [x] Indicador "Leído / Enviado" en mensajes propios con actualización realtime

### Herramientas Clínicas (plan Suscripción)
- [x] 45+ tests psicométricos con scoring automático
- [x] Asignación tests + resultados liberados al paciente
- [x] Botón "Revisado" en vista de resultado de test (terapeuta)
- [x] Tests completados aparecen en dashboard del terapeuta (CompletedTestsSection)
- [x] DSM-5-TR y CIE-11 en español
- [x] Escalas clínicas validadas (10 escalas: PHQ-9, GAD-7, AUDIT, PCL-5, ISI, PSS-10, DASS-21, SPIN, DAST-10, C-SSRS)
- [x] Escalas: botón "Aplicar a paciente" en todas las escalas — crea test_assignment directo al paciente
- [x] Seed psicométrico completo para ISI, PSS-10, SPIN, DAST-10, C-SSRS (secciones, ítems, opciones, scoring rules, interpretation ranges)
- [x] Realtime en alertas IA admin (INSERT ai_checkins → toast + prepend sin recargar)
- [x] Realtime en verificaciones admin (INSERT therapist_credentials → toast + auto-refresh)
- [x] CSV export en AdminPayouts (tab Historial, 11 columnas, respeta búsqueda activa)
- [x] **Reporte PDF de progreso clínico** — `generatePatientPDF.js` (jsPDF vía CDN, sin npm). Botón "Exportar PDF" en expediente del paciente (solo plan Pro + hasAccess). Secciones: resumen numérico, sesiones, notas clínicas con nivel de riesgo, tareas (% completadas), check-ins IA con colores, tests completados. Sin datos de contacto ni pagos. Paginado, footer confidencial.
- [x] Plan de crisis (Safety Planning Intervention)
- [x] Biblioteca terapéutica (40+ ejercicios)
- [x] Terapeuta asigna ejercicios desde la biblioteca al ver perfil del paciente (tab Tareas → "Desde biblioteca")
- [x] Protocolos terapéuticos (vista "Todos" corregida)
- [x] Consulta con colegas (interconsulta)
- [x] Tareas asignadas al paciente (terapeuta usa `patient_tasks`, paciente las ve en su dashboard)

### Bienestar del Paciente
- [x] Check-in diario IA (análisis riesgo, alerta terapeuta) — Claude Haiku activo, email de alerta directo al terapeuta para riesgo alto/medio, rate limit 1/día server-side con resultado cacheado
- [x] Widget estado de ánimo + gráfica semanal
- [x] Diario personal con prompts terapéuticos
- [x] Página de crisis con recursos por país
- [x] Modo anónimo (iniciales en lugar de nombre completo)
- [x] Check-ins verificados se eliminan del dashboard del terapeuta (`therapist_reviewed_at`)

### Pagos y Negocio
- [x] Pago sesiones PayPal (flujo completo)
- [x] Comisión 10% automática sobre cada sesión
- [x] Plan Suscripción **$79.99 USD/mes** — Edge Functions create/capture funcionando, email confirmación, downgrade automático
- [x] **Plan anual $799/año** — toggle mensual/anual en SubscriptionPage + PricingPage, badge "−17%", savings callout, `billing_cycle` en BD + Edge Functions, MRR admin corregido (anual ÷ 12)
- [x] Liquidaciones a terapeutas (AdminPayouts) + CSV export
- [x] Conversión USD → DOP en tiempo real
- [x] Landing pública de precios (/pricing) con toggle mensual/anual
- [x] Panel admin de suscripciones + MRR + métrica "Ciclo Anual"
- [x] Sistema de reembolsos — política temporal (>24h=100%, 2-24h=50%, <2h=bloqueado), Edge Function process-refund, panel admin `/admin/refunds`
- [x] Política de cancelación con motivo — campo de motivo en modal, email al terapeuta con razón incluida

### Verificación de Terapeutas
- [x] 3 documentos obligatorios: Título / Exequátur / Colegio Psicológico
- [x] Admin revisa y aprueba/rechaza cada doc individualmente
- [x] Motivo de rechazo visible al terapeuta
- [x] Barra de progreso de verificación (X/3 aprobados)
- [x] Botón "Completar verificación" aparece solo cuando los 3 están aprobados
- [x] Al completar, terapeuta queda activo y visible para pacientes

### Emails Transaccionales (Resend — activo, dominio psiconecta.app verificado ✅ SPF + MX 2026-06-07)
- [x] Bienvenida al registrarse (`notify-welcome`)
- [x] Confirmación de cita — paciente y terapeuta (`capture-paypal-order`)
- [x] Cancelación con motivo — paciente y terapeuta (`notify-cancellation`)
- [x] Recordatorio 24h antes de sesión (`send-reminders` cron hourly)
- [x] Recordatorio 1h antes de sesión (`send-reminders` cron hourly)
- [x] Alerta riesgo alto/medio al terapeuta (`ai-checkin`)
- [x] Resultado de test disponible al paciente (`notify-test-result`)
- [x] Plan Pro activado (`capture-subscription-payment`)
- [x] Vencimiento suscripción 7 días antes (`send-reminders`)
- [x] Downgrade automático al vencer suscripción (`send-reminders`)

### UX/UI y Performance
- [x] Design system: Plus Jakarta Sans Variable + Lora, paleta azul
- [x] Logo oficial SVG: dos arcos + nodo central (PsiconectaLogo)
- [x] Favicon SVG con logo de Psiconecta
- [x] 100% sin emojis — Lucide React uniformes (strokeWidth=1.8)
- [x] Code splitting: React.lazy en todas las ~50 páginas; chunks vendor, datos clínicos, page-landing
- [x] Build limpio — 0 errores (3198 módulos) · index.js 53 KiB · page-landing 63 KiB
- [x] Fuentes auto-hospedadas: Plus Jakarta Sans Variable en `public/fonts/` + Lora vía @fontsource — sin DNS externo
- [x] `<link rel="preload" as="font">` para fuente crítica del hero (LCP)
- [x] Google Analytics 4 diferido (`window.addEventListener('load', ...)`) — no bloquea render
- [x] Google Fonts eliminado — reemplazado por @fontsource (mismo origen, Vercel CDN)
- [x] Forced reflow corregido: estilos `.fade-in` movidos de runtime a `index.css`
- [x] PageSpeed Insights mobile: **87/100** · FCP 2.0s · LCP 3.9s · TBT 30ms · SI 2.0s · CLS 0 (desde 35 en v24)
- [x] Política de contraseña con complejidad + indicador visual de fortaleza
- [x] Pantalla de verificación de email post-registro

---

## 10. Auditoría de Seguridad (sesión 2026-06-05 + 2026-06-06)

### Vulnerabilidades corregidas en código

| Severidad | Archivo | Corrección |
|-----------|---------|------------|
| CRÍTICO | `authStore.js` | `role` y `profile` eliminados del `partialize` de localStorage — solo persiste el JWT |
| CRÍTICO | `.env.example` | Eliminadas `VITE_DAILY_API_KEY` y `VITE_ANTHROPIC_API_KEY`; documentado que van en Supabase Secrets |
| ALTO | `Login.jsx` | Query de `subscription_payments` ahora filtra `.eq('therapist_id', currentUser.id)` |
| MEDIO | `PatientDetail.jsx` | Query de `ai_checkins` ahora filtra `.eq('therapist_id', user.id)` |
| MEDIO | `PatientDetail.jsx` | `sanitize()` aplicada en historial clínico, tareas y notas liberadas |
| MEDIO | `utils.js` | `sanitize()` exportada como utilidad global |
| BAJO | `Register.jsx` | Validación de complejidad de contraseña (mayúscula + número + carácter especial) |
| BAJO | `Register.jsx` | Indicador visual de fortaleza de contraseña |
| BAJO | `Register.jsx` | Pantalla de verificación de email post-registro (detecta `session === null`) |
| INFO | `TherapistDashboard.jsx` | Check-ins verificados se eliminan del dashboard (`therapist_reviewed_at`) |

### Migraciones SQL de seguridad (ver §3 — pendientes de ejecutar)
- `migration_fix_profile_role_escalation.sql` — previene auto-escalada de rol
- `migration_fix_profiles_select.sql` — privacidad de perfiles de pacientes
- `migration_fix_sessions_update.sql` — campos financieros inmutables desde el cliente
- `migration_fix_credentials_rls.sql` — admin puede gestionar credenciales
- `migration_fix_progate_server_side.sql` — ProGate reforzado en BD (is_pro_therapist)
- `migration_fix_length_constraints.sql` — límites de longitud en campos de texto

### Vulnerabilidades corregidas (2026-06-06)

| Severidad | Área | Corrección |
|-----------|------|------------|
| MEDIA | `supabase/functions/_shared/cors.ts` + 14 funciones individuales | CORS cambiado de `*` a `https://psiconecta.app` |
| MEDIA | `vercel.json` CSP | GA4/GTM añadidos a `script-src` y `connect-src` |
| BAJA | `BlogPostPage.jsx` `parseBold()` | DOMPurify sanitiza HTML antes de `dangerouslySetInnerHTML` |
| COSMÉTICO | `index.html` | `theme-color` corregido de `#1a527d` a `#4f46e5` (indigo de marca) |

### Funciones de base de datos creadas
- `is_admin()` — SECURITY DEFINER, verifica rol admin sin recursión RLS
- `is_pro_therapist()` — SECURITY DEFINER, verifica plan pro/premium
- `admin_set_user_role()` — única vía segura para cambiar el rol de un usuario

### Historial de Git
- **Daily.co API key rotada** — clave comprometida en commit `3ca2f41` invalidada
- **Historial limpiado** con `git-filter-repo` — `.env`, `.env.production`, `.env.production.save` eliminados de todos los commits
- **Force push** ejecutado — historial remoto reescrito

---

## 11. Staging, Monitoreo y Tests

### Sentry (monitoreo de errores) — ✅ Activo en producción

Código integrado en `src/lib/sentry.js`, init en `main.jsx`, usuario asociado por `id/rol` en `authStore`. `sendDefaultPii: false`; ids de pacientes saneados de URLs antes de enviar.

| Variable | Entorno | Estado |
|----------|---------|--------|
| `VITE_SENTRY_DSN` | Production + Preview | ✅ configurado 2026-06-09 |
| `VITE_SENTRY_ENVIRONMENT` | Production = `production` · Preview = `preview` | ✅ configurado 2026-06-09 |

Plan gratuito: 5K errores/mes. Sin DSN, Sentry es no-op en dev local.

---

### Staging con Vercel Preview — ⚠️ Disponible, no adoptado como flujo

Vercel genera automáticamente una Preview URL por cada push a cualquier rama distinta de `main` (`psiconecta-app-git-<rama>-xxx.vercel.app`).

**Flujo recomendado (pendiente de adoptar):**
```bash
git checkout -b dev
# trabajar + push a dev → Preview URL disponible
git checkout main && git merge dev && git push   # solo cuando preview OK
```

- Recomendado: proteger rama `main` en Vercel → Settings → Git → Production Branch.
- ⚠️ Las previews comparten la BD de producción. Para cambios de esquema arriesgados crear un segundo proyecto Supabase (free tier) y apuntar las env vars de Preview a él.

---

### Tests E2E (Playwright) — 🔴 Instalado, nunca ejecutado

Configuración en `playwright.config.js` + smoke tests en `tests/e2e/smoke.spec.js` (rutas públicas + auth básico, sin credenciales reales).

**Primer uso (descarga browsers — una sola vez):**
```bash
npx playwright install chromium
```

**Correr:**
```bash
npm run test:e2e                                                          # build local + vite preview automático
BASE_URL=https://psiconecta-app-git-dev-xxx.vercel.app npm run test:e2e  # contra preview
npm run test:e2e:prod                                                     # contra producción (solo lectura)
```

**Siguiente nivel (cuando PayPal sandbox sea estable):**
- `tests/e2e/booking.spec.js` — flujo completo reserva + pago con cuenta sandbox de PayPal.
- Variables en env vars: `E2E_PATIENT_EMAIL` / `E2E_PATIENT_PASSWORD`.
- Integrar en GitHub Actions para correr en cada PR a `main`.

---

### Checklist de despliegue seguro

| Paso | Estado actual |
|------|--------------|
| `npm run build` → 0 errores | ⚠️ No se corre en local — Vercel compila en su CI |
| `npm run test:e2e` en local o contra preview | 🔴 Nunca ejecutado |
| Merge a `main` + push | ✅ Se hace |
| Verificar Sentry sin errores nuevos (~5 min post-deploy) | ✅ Se revisa |

---

## 12. Bugs Corregidos

### Sesión 2026-06-09 (v31) — Preload fuente crítica + fix forced reflow

| Área | Corrección |
|------|------------|
| `public/fonts/plus-jakarta-sans.woff2` | Fuente variable copiada a public/ para URL estable sin hash |
| `index.html` | `<link rel="preload" as="font" crossorigin href="/fonts/plus-jakarta-sans.woff2">` — el browser descarga la fuente antes que el CSS termine de parsear |
| `src/index.css` | `@font-face` apuntando a `/fonts/` + `.fade-in/.fade-in.visible` con `will-change: opacity, transform` |
| `src/pages/public/LandingPage.jsx` | Eliminado `document.createElement('style') + appendChild` — causaba forced reflow. Estilos movidos a index.css |
| Resultado build | CSS: 97.84 KiB (gzip 15.42 KiB), JS index: 53.84 KiB |
| PageSpeed mobile | Score: 79 → **87** ✅ · FCP 2.0s · LCP 3.9s · TBT 30ms · SI 2.0s · CLS 0 |

### Sesión 2026-06-09 (v30) — Self-host fuentes + LandingPage lazy chunk nombrado

| Área | Corrección |
|------|------------|
| `package.json` | Instalados `@fontsource-variable/plus-jakarta-sans` y `@fontsource/lora` — fuentes servidas desde mismo origen, sin DNS externo |
| `src/main.jsx` | Importa `wght.css` (variable, todos los pesos, unicode-range) y `latin-{400,600,700}.css` de Lora |
| `tailwind.config.js` | `fontFamily.sans` actualizado a `'Plus Jakarta Sans Variable'` como primera opción |
| `index.html` | Eliminados los `<link rel="preconnect">` y `<link rel="preload">` de Google Fonts (ya no se usan) |
| `vite.config.js` | Chunk `'page-landing'` con nombre fijo para LandingPage lazy |
| Resultado build | index.js: 53 KiB (era 117 KiB estático, 81 KiB antes) · CSS: 100 KiB gzip 17.78 KiB · 10 archivos de fuente en /assets/ |

### Sesión 2026-06-09 (v29) — Optimización PageSpeed mobile

| Área | Corrección |
|------|------------|
| `src/App.jsx` | Todas las páginas convertidas a `React.lazy()` (code splitting). `LandingPage` se mantiene como import estático para evitar waterfall en "/" (la ruta más visitada). Bundle inicial: 117 KiB vs ~800 KiB antes. |
| `index.html` | Google Fonts cambiado a `rel="preload" as="style" onload=...` — carga no bloqueante. |
| `index.html` | Google Analytics diferido con `window.addEventListener('load', ...)` — ya no bloquea render. |
| `src/index.css` | Eliminado `@import url(...)` de Google Fonts (era inválido en PostCSS + duplicado). `scroll-behavior: smooth` desactivado (penaliza LCP mobile). |
| Resultado | TBT: 930ms → 50ms · LCP: 6.1s → 4.7s · FCP: 4.5s → 3.8s (pendiente reverificar con GA diferido) |

### Sesión 2026-06-08 (v28) — Precio suscripción $79.99/mes

| Área | Corrección |
|------|------------|
| Precio suscripción | Actualizado de $50 → **$79.99 USD/mes** en todos los archivos: `SubscriptionPage.jsx`, `PricingPage.jsx`, `LandingPage.jsx`, `ProGate.jsx`, `PayPalSubscriptionButton.jsx`, `AdminSubscriptions.jsx`, `TermsPage.jsx`, `RefundPage.jsx`, `create-subscription-order/index.ts`, `_shared/email.ts` |

### Sesión 2026-06-07 (v27) — Restricción horaria urgentes + Fix checklist onboarding

| Área | Corrección |
|------|------------|
| `TherapistProfileView.jsx` — Citas urgentes | Si `available_urgent = false`: fecha mínima = mañana (no permite agendar hoy). Si `available_urgent = true`: puede seleccionar hoy con hora mínima = ahora+1h (redondeado al siguiente cuarto de hora) y máxima = 23:00. Si ya no quedan franjas válidas hoy, muestra aviso y bloquea el botón. Validación duplicada en `handleBookContinue`. |
| `TherapistDashboard.jsx` — Checklist onboarding | El paso "Configura tu disponibilidad horaria" tenía `done: false` hardcodeado. Ahora consulta `therapist_availability` en `fetchData` y se marca como ✅ cuando el terapeuta tiene al menos un día configurado. |

### Sesión 2026-06-07 (v26) — Toggle urgentes en agenda + Fix FindTherapist

| Área | Corrección |
|------|------------|
| `FindTherapist.jsx` + `TherapistMatchPage.jsx` | Columnas `languages`, `years_experience`, `approaches`, `education` removidas del SELECT — no existen en producción hasta ejecutar `migration_payouts_and_payment_fields.sql`. Causaban error de query completa. |
| `TherapistSchedule.jsx` — Toggle citas urgentes | Card toggle "Citas urgentes" añadida en la agenda del terapeuta. Guarda `available_urgent` en `therapist_profiles` al instante (sin botón guardar separado). El terapeuta aparece en búsquedas urgentes del paciente solo cuando está activo. |

### Sesión 2026-06-07 (v24) — Landing overhaul + Fix disponibilidad

| Área | Corrección |
|------|------------|
| `LandingPage.jsx` — Testimonios | Reemplazados testimonios falsos por reseñas reales de Supabase (3 al azar, rating ≥ 4, skeleton loader mientras carga) |
| `LandingPage.jsx` — Quiz matching | Quiz interactivo inline (4 preguntas, barra de progreso, guarda en `sessionStorage`, redirige a `/register?quiz=1`) en lugar de botón directo al registro |
| `LandingPage.jsx` — Mockup terapeutas | "Paciente Demo" → "Paciente anónimo" |
| `LandingPage.jsx` — Tipografía | FAQ questions `font-semibold` → `font-bold`; quiz h2 alineado con demás section headers (`text-3xl sm:text-4xl`) |
| `index.css` — Dark mode | Overrides para `.card-elevated` y `.btn-secondary-premium` que no tenían variantes oscuras |
| `TherapistSchedule.jsx` — Disponibilidad | Reemplazado `upsert` (requería UNIQUE constraint inexistente) por DELETE+INSERT. Causa raíz real: RLS `FOR ALL USING(...)` sin `WITH CHECK` explícito no cubre INSERT en PostgreSQL 15 (error 42501). Fix: políticas separadas por operación en `migration_fix_availability.sql` |

---

### Sesión 2026-06-07 (v19) — Auditoría completa de plataforma

| Severidad | Área | Corrección |
|-----------|------|------------|
| ALTO | `admin-toggle-user/index.ts` | CORS `Access-Control-Allow-Origin: *` → `https://psiconecta.app`. La función de banear/desbanear usuarios era accesible desde cualquier origen. |
| ALTO | `ai-checkin/index.ts` | CORS `*` → `https://psiconecta.app`. Inconsistente con las demás funciones aunque tiene validación JWT. |
| ALTO | `notify-new-message/index.ts` | Sin validación de relación sender-recipient — cualquier usuario autenticado podía usarla para enviar emails con contenido arbitrario a cualquier usuario de la plataforma (spam/phishing vector). Fix: verifica que exista un mensaje real del sender al recipient en los últimos 90 segundos antes de enviar. |
| ALTO | `reviews` — RLS INSERT | La política solo verificaba `auth.uid() = patient_id`, permitiendo a cualquier paciente reseñar a cualquier terapeuta sin sesión real. Fix: WITH CHECK requiere sesión `completed` entre el paciente y el terapeuta para esa sesión específica. |
| ALTO | `reviews` — Sin UNIQUE constraint | Sin `UNIQUE(session_id)`, un paciente podía dejar múltiples reseñas inflando el rating artificialmente. Fix: `migration_fix_reviews_and_tp_security.sql`. |
| ALTO | `FindTherapist.jsx` + `TherapistMatchPage.jsx` | Hacían `SELECT *` en `therapist_profiles`, exponiendo `paypal_email`, `bank_account_number`, `bank_routing`, `commission_rate` a cualquier paciente autenticado. Fix: SELECT explícito solo de campos públicos. |
| MEDIO | `PaymentSuccess.jsx` | Llamaba a `verify-payment` (Edge Function de Stripe) que ya no existe en el flujo. Psiconecta usa PayPal — el flujo real navega directamente desde `capture-paypal-order`. Página convertida a success genérico sin llamadas externas. |
| BAJO | `ChatPage.jsx` | Input de mensajes sin `maxLength`. Fix: `maxLength={2000}`. |
| BAJO | `JournalPage.jsx` | Título sin `maxLength={200}`, textarea sin `maxLength={10000}`. |
| BAJO | `MyAppointments.jsx` / `SessionHistoryPage.jsx` | Textareas de reseña y reflexión sin `maxLength`. |

**SQL ejecutado en Supabase (`migration_fix_reviews_and_tp_security.sql`) ✅ 2026-06-07:**
- Reviews duplicadas eliminadas (conservada la más reciente por `session_id`)
- `UNIQUE(session_id)` en `reviews`
- RLS INSERT en `reviews` — verifica sesión completada
- RLS UPDATE admin en `reviews`
- RLS UPDATE split en `therapist_profiles` (propietario + admin separados)
- RLS UPDATE en `subscription_payments` (faltaba)

---

### Sesión 2026-06-07 (v18) — Facebook OAuth

| Severidad | Área | Corrección |
|-----------|------|------------|
| ALTO | `AuthCallback.jsx` | Importaba `fetchProfile` del store pero nunca lo llamaba. Después del redirect OAuth, el store quedaba sin usuario y `ProtectedRoute` redirigía al login. Fix: `await fetchProfile(session.user)` antes de navegar al dashboard. |

**Configuración completada:**
- Meta for Developers: app "Psiconecta.app" (ID `1117610634776862`), caso de uso "Inicio de sesión de Facebook", URI de callback registrada
- Supabase Dashboard → Authentication → Providers → Facebook: App ID + App Secret configurados

---

### Sesión 2026-06-06 (v17) — fetchProfile 500, nombre "Usuario", navegación y loop

| Severidad | Área | Corrección |
|-----------|------|------------|
| CRÍTICO | `profiles_select` RLS policy | La política tenía JOINs complejos con `sessions` y `therapeutic_relationships` que crasheaban PostgREST con HTTP 500 en cualquier SELECT de profiles. Eliminadas 3 políticas (`profiles_select`, `admin_select_all_profiles`, `profiles_select_public`) y recreada una sola: `auth.uid() IS NOT NULL`. |
| ALTO | `authStore.js` → `fetchProfile()` | La query `SELECT *, therapist_profiles(*)` usaba un embedded join de PostgREST que fallaba si no hay FK explícita. Dividida en dos queries separadas: primero el perfil base (`SELECT *`), luego `therapist_profiles` solo si `role='therapist'`. |
| ALTO | `authStore.js` → `fetchProfile()` catch | Si `fetchProfile` fallaba, `role` quedaba `null`. Ahora el catch extrae `role` de `user.user_metadata.role` como fallback para que el dashboard sea usable aunque la BD no responda. |
| ALTO | `ProtectedRoute.jsx` — `TherapistRoute` / `ClientRoute` | Cuando `role=null`, ambas rutas se redirigían mutuamente causando un loop infinito (TherapistRoute → /patient/dashboard → ClientRoute → /therapist/dashboard). Ahora devuelven `<LoadingScreen />` cuando `role=null`. |
| MEDIO | `authStore.js` → `signUp()` — nombre "Usuario" | El trigger `handle_new_user` creaba el perfil con `'Usuario'` cuando los metadatos no estaban listos. El fallback del store detectaba el perfil existente y no lo sobreescribía. Fix: cuando el perfil YA existe, hacer `UPDATE` con el `fullName` real del formulario. |
| MEDIO | `Register.jsx` — navegación post-registro | `navigate()` usaba el estado local `role` (potencialmente stale en closures async). Cambiado a `useAuthStore.getState().role` que refleja el rol real cargado por `fetchProfile`. |
| BAJO | `Login.jsx` — email no confirmado | Detecta el error `"Email not confirmed"` de Supabase, reenvía automáticamente el email de confirmación y muestra un mensaje claro al usuario. |

**SQL ejecutado en Supabase (2026-06-06):**
```sql
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

---

### Sesión 2026-06-06 (v16) — Registro de usuarios

| Severidad | Área | Corrección |
|-----------|------|------------|
| CRÍTICO | `handle_new_user()` trigger | Agregado `SET search_path = public` — sin esto, en el contexto del schema `auth` el trigger no encontraba la tabla `profiles`. Causa raíz del error "database error saving new user" en registros nuevos. |
| CRÍTICO | `handle_new_user()` trigger | Tabla calificada como `public.profiles` (nombre completo) |
| CRÍTICO | `handle_new_user()` trigger | Agregado bloque `EXCEPTION WHEN OTHERS THEN RETURN NEW` — el trigger nunca bloquea la creación del usuario aunque falle la inserción del perfil |
| ALTO | `profiles_insert` RLS policy | Actualizada a `auth.uid() = id OR auth.uid() IS NULL` para permitir el contexto del trigger (sin JWT activo) |
| MEDIO | `authStore.js` → `signUp()` | Fallback: si el trigger no crea el perfil, el frontend lo inserta directamente antes de continuar |

**SQL ejecutado en Supabase (2026-06-06):**
```sql
-- Trigger con search_path explícito + exception handler
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name','Usuario'),
          NEW.email, COALESCE(NEW.raw_user_meta_data->>'role','client'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user() error for user %: % (%)', NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END; $$;

-- RLS INSERT policy actualizada
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);
```

### Sesión 2026-06-05

### RLS / Base de datos
- `test_results` — faltaba política INSERT para el paciente (resultados nunca se guardaban)
- `test_assignments` — faltaba política UPDATE para el paciente (status no cambiaba a 'completed'; tests seguían apareciendo como pendientes)
- `PatientDetail.jsx` — escribía tareas en tabla `tasks` inexistente en lugar de `patient_tasks`

### Lógica y datos
- `Layout.jsx` — `role === 'patient'` debía ser `'client'`; NotificationBell y botón de crisis nunca aparecían al paciente
- `Layout.jsx` — `{} .isActive` siempre `undefined`; badge de no leídos aparecía erróneamente en todos los items
- `AICheckin.jsx` — `onConflict: 'patient_id,created_at::date'` es sintaxis SQL inválida como columna; creaba entradas duplicadas de humor por día
- `MyResultsPage.jsx` — `scoring_rules` no incluido en query separado; etiquetas de subescalas siempre en blanco
- `PatientResultDetailPage.jsx` — filtro `.eq('test_assignments.tests.slug', ...)` ignorado por Supabase JS; gráfica de tendencia mezclaba tests distintos
- `PatientDetail.jsx` — sesiones sin filtro `therapist_id`; mostraba sesiones de otros terapeutas
- `CompletedTestsSection.jsx` — relaciones sin filtro `status='active'`; mostraba tests de pacientes inactivos
- `TherapistDashboard.jsx` — "Ingresos" mostraba sesiones futuras; ahora muestra ingresos reales del mes
- `TherapistDashboard.jsx` — `CompletedTestsSection` usado pero no importado → dashboard en blanco
- `PatientTestsTab.jsx` — `test_sessions[0]` sin orden; puede mostrar sesión incorrecta
- `TakeTestPage.jsx` — instrucciones de sección 2+ nunca se mostraban (`itemSectionChanged` ignorado)
- `TestResultPage.jsx` — crash silencioso si `sess` es null
- `Login.jsx` — redirect a suscripción pendiente bloqueaba el dashboard si el token PayPal había expirado (>3h); ahora marca como `failed` y deja pasar

### Nuevas funciones entregadas
- Chat: lista de conversaciones al entrar (no auto-abre), indicador "Leído/Enviado" en tiempo real
- Escalas clínicas: botón "Aplicar a paciente" por escala (crea test_assignment)
- Protocolos: vista "Todos" corregida (bug en `searchProtocols(null)`)
- Terapeuta → detalle paciente → tab Tareas: botón "Desde biblioteca" para asignar ejercicios terapéuticos
- Tests: botón "Revisado" en `TestResultPage` (marca `therapist_dismissed_at`)
- `SubscriptionSuccess`: botón de escape "Ir al dashboard" cuando captura falla

---

## 12. Pendiente / En Cola

### Migraciones SQL de seguridad ✅ todas ejecutadas (2026-06-05)

### Configuración externa
- [ ] Apple OAuth — Apple Developer Console
- [ ] Facebook OAuth — Meta for Developers
- [ ] PayPal producción — crear cuenta Business, obtener credenciales live, actualizar Supabase Secrets y Vercel
- [ ] `PAYPAL_WEBHOOK_ID` — reemplazar `PAYPAL_WEBHOOK_SANDBOX_ID` por el ID de producción
- [x] Cron job `send-reminders-hourly` — ✅ activo en pg_cron, cada hora (`0 * * * *`)
- [x] `CRON_SECRET` en Supabase Secrets — ✅ configurado 2026-06-06
- [x] Dominio `psiconecta.app` en Resend — DKIM + SPF verificados ✅
- [x] Resend integrado como proveedor SMTP de Supabase Auth — emails de verificación y reset de contraseña salen de `@psiconecta.app` en lugar del dominio genérico de Supabase ✅
- [ ] Registrar eventos en PayPal webhook: `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.EXPIRED`

### Sistema de reembolsos ✅ (2026-06-05)
- Edge Function `process-refund` — llama PayPal Refunds API con política temporal
- `MyAppointments.jsx` — botón Cancelar muestra % de reembolso antes de confirmar
- Tabla `refunds` con RLS — historial completo por paciente
- Panel admin `/admin/refunds` — gestión de reembolsos fallidos y disputas

### Roadmap pendiente
- [x] Calendario de disponibilidad en booking — slot picker con slots reales del terapeuta en FindTherapist
- [x] Reagendamiento de citas — modal con slots del terapeuta, actualiza sesión, notifica ambas partes
- [x] Onboarding guiado para terapeutas nuevos — checklist 5 pasos con barra de progreso en dashboard
- [x] Match automático terapeuta-paciente — cuestionario 4 preguntas + scoring en `/patient/match`
- [x] Consentimiento informado digital — modal antes de primera sesión, firma en BD, PDF descargable
- [x] Landing page pública — ruta `/` con hero split, mockups UI, beneficios, pasos, terapeutas, testimonios y footer
- [x] SEO landing page — `SEOHead.jsx` con meta tags, OpenGraph, Twitter Card, schema.org `MedicalBusiness` + `WebSite`, helper `therapistSchema()`
- [x] Sección de confianza y seguridad — 4 garantías: cifrado, anónimo, cancelación, verificación
- [x] FAQ accordion — 6 preguntas expandibles (confidencialidad, precio, cancelación, verificación, apps, anonimato)
- [x] Animaciones on-scroll — `IntersectionObserver` CSS puro, fade-in en beneficios, pasos y testimonios
- [x] `react-helmet-async` integrado en `main.jsx` con `HelmetProvider`
- [x] Hero emocional — copy estilo Apple: "Ese paso que llevas tiempo posponiendo." Línea emocional + línea funcional separadas
- [x] Sección quiz de matching — preview de las 4 preguntas del algoritmo, CTA → `/register` → `/patient/match`
- [x] Claims honestos — sin cobertura LATAM falsa, sin stats inventados, cobertura solo RD
- [x] Hero emocional — copy estilo Apple: "Ese paso que llevas tiempo posponiendo."
- [x] Sección quiz de matching — preview de las 4 preguntas del algoritmo, CTA → `/register` → `/patient/match`
- [x] Modo oscuro en landing — variantes `dark:` Tailwind en todos los componentes; coherente con el resto de la app
- [x] Directorio público `/terapeutas` — `TherapistDirectoryPage.jsx`, búsqueda + filtros por especialidad, cards con rating/precio/badge Pro, SEO title/description propios, sin auth requerida
- [x] Link "Terapeutas" en navbar y footer de la landing
- [x] Blog de salud mental — `src/data/blogPosts.js` con 5 artículos SEO para RD
- [x] `BlogListPage.jsx` — listado con artículo destacado + grid, categorías con color, tiempo de lectura
- [x] `BlogPostPage.jsx` — layout editorial, soporte **negrita** y listas, CTA integrado, artículos relacionados
- [x] Rutas `/blog` y `/blog/:slug` registradas en App.jsx
- [x] Link "Blog" en navbar y footer de la landing
- [x] Blog visual mejorado — portadas con patrón SVG + icono Lucide por artículo (sin imágenes externas)
- [x] Artículo destacado en layout horizontal (imagen izq / texto der)
- [x] Extracto del artículo sobre gradiente de color del post
- [x] Pull quotes en secciones pares, separadores decorativos entre secciones
- [x] Headings con chip de icono en gradiente, CTA integrado en color del artículo
- [x] Cards de artículos relacionados con mini-portada SVG
- [x] `public/sitemap.xml` — todas las rutas públicas con priority y changefreq correctos
- [x] `public/robots.txt` — Allow rutas públicas, Disallow rutas privadas, apunta al sitemap
- [x] `index.html` — meta description, OG tags y link rel="sitemap" mejorados
- [x] `TermsPage.jsx` — Términos de uso, 12 secciones, referencia Ley 172-13 RD
- [x] `PrivacyPage.jsx` — Política de privacidad con énfasis en datos de salud mental
- [x] `RefundPage.jsx` — Política de reembolsos con tarjetas visuales 100%/50%/0%
- [x] `LegalPage.jsx` — Layout compartido con componentes Section, P, Ul, Highlight
- [x] Footer de landing apunta a rutas reales (antes apuntaban a #)
- [x] Sitemap actualizado con rutas /terminos, /privacidad, /reembolsos
- [x] Google Analytics 4 — `src/lib/analytics.js` wrapper con trackPageview y trackEvent
- [x] `src/hooks/usePageTracking.js` — pageview automático en cada cambio de ruta (SPA)
- [x] `AppRoutes` componente interno en App.jsx para usar useLocation dentro de BrowserRouter
- [x] `VITE_GA_MEASUREMENT_ID` en .env y Vercel Environment Variables
- [x] Eventos listos: clickHeroCTA, viewBlogPost, startRegister, viewTherapist, bookTherapist, openFAQ
- [x] `NotFoundPage.jsx` — página 404 con logo, links de recuperación (inicio, terapeutas, blog) y CTA
- [x] Ruta catch-all `*` en App.jsx apunta a NotFoundPage (antes redirigía a /login)
- [x] Eventos GA conectados al UI: hero CTAs, quiz matching, FAQ accordion, blog posts, directorio terapeutas
- [x] `public/og-image.png` — 1200×630 px, gradiente indigo/violeta, logo + tagline + pills, generada con cairosvg
- [x] `public/favicon.svg` — gradiente corregido a indigo/violeta (#4f46e5→#7e22ce), alineado con brand
- [x] `src/index.css` — scrollbar personalizada con gradiente indigo→violeta de la marca (6px, visible en Chrome/Edge/Safari; thin en Firefox)
- [x] Modo oscuro — toggle luna/sol en header, CSS variables, localStorage + prefers-color-scheme
- [x] Kit de logos `brand/` — 4 versiones PNG para redes sociales: icono gradiente (1080×1080), horizontal con texto (2200×500), icono sobre blanco (1080×1080), icono transparente (1080×1080)
- [ ] Reporte de progreso PDF del paciente — Edge Function generate-report
- [ ] 2FA para terapeutas y admins — Supabase Auth TOTP
- [ ] Filtros de búsqueda ampliados — idioma, modalidad, género del terapeuta
- [ ] Chat con archivos adjuntos — bucket Storage + componente upload
- [ ] Paginación chat: scroll infinito funcional, falta test con conversaciones largas reales
- [ ] VideoCall: `network-connection` event pendiente de prueba real
- [ ] Tests: sesiones previas a migración RLS sin `test_results` — terapeuta debe reasignar
- [x] DSM y CIE — movidos a Edge Function `clinical-content` (✅ v32). Escalas, biblioteca y protocolos siguen en el bundle (aceptable por tamaño)
- [x] Realtime admin alertas IA y credenciales nuevas (✅ v38)
- [x] CSV export AdminPayouts (✅ v38)
- [x] Contacto de emergencia — tabla `emergency_contacts` con RLS estricta (✅ v32)
- [x] Flujo RGPD — Edge Function `delete-user-data` + panel `/admin/deletions` + solicitud desde perfil (✅ v32)
- [x] Monitoreo de errores — Sentry integrado, pendiente solo DSN en Vercel (✅ v32)
- [x] Tests E2E — Playwright con smoke tests de rutas públicas y auth (✅ v32)
- [x] Push notifications — código completo (tokens, FCM v1, chat + recordatorios), pendiente solo config Firebase (✅ v32)

---

## 13. Comandos de Desarrollo

```bash
npm run dev          # servidor local en localhost:3000
npm run build        # build de producción (verificar 0 errores antes de push)

git add -A && git commit -m "..." && git push origin main
# Vercel auto-deploya en ~2 min tras el push
```

---

## 14. Convenciones del Código

- **Íconos:** solo Lucide React, `strokeWidth={1.8}`, nunca emojis en JSX
- **Moneda:** `formatPrice(amount)` → `$60.00 USD` | `formatWithLocal()` → `$60.00 USD ≈ RD$3,510`
- **Nombres anónimos:** `getDisplayName(profile)` — devuelve iniciales si `is_anonymous=true`
- **Alias de imports:** `@/` → `src/`
- **Estado global:** Zustand (`authStore`)
- **Queries Supabase:** directas desde componentes, sin React Query
- **Commits:** en inglés o español, directamente a `main`
