# PROJECT_STATE.md — Estado del Proyecto Psiconecta
*Última actualización: 2026-06-09 (v32 — Seguridad/infra: contenido clínico server-side, RGPD, contacto emergencia, Sentry, E2E, push)*

---

## ⚡ Sesión 2026-06-09 (v32) — Resumen de cambios

**Build verificado: 0 errores.**

**Estado de ejecución:**
- [x] SQL ✅ ejecutado 2026-06-09 — las 7 migraciones aplicadas (vía `EJECUTAR_2026-06-09_v32.sql` + `EJECUTAR_FALTANTES.sql`). Incidencias resueltas: vista huérfana `my_profile` eliminada (`DROP VIEW`, dependía de las columnas emergency_* y no se usaba en el código).
- [x] Edge Functions ✅ desplegadas 2026-06-09: `clinical-content`, `delete-user-data`, `notify-new-message`, `send-reminders` (esta última con `--no-verify-jwt` — se autentica con CRON_SECRET).
- [ ] Push del frontend a `main` + verificación en producción (landing/testimonios, DSM-CIE con Pro, "Eliminar mi cuenta", registro con contacto de emergencia)
- [ ] Verificar comisiones (query en `supabase/RUNBOOK_MIGRACIONES_PENDIENTES.md`, debe devolver 0 filas)
- [x] Sentry ✅ configurado 2026-06-09 — proyecto creado en sentry.io (org `psiconecta-ii`), `VITE_SENTRY_DSN` y `VITE_SENTRY_ENVIRONMENT` añadidas en Vercel (Production + Preview). Solo Error Monitoring + tracing 10%; Session Replay descartado por privacidad.
- [ ] Firebase/FCM para push nativas (ver `PUSH_SETUP.md`) — secret `FCM_SERVICE_ACCOUNT` + apps Android/iOS
- [ ] `npx playwright install chromium` y `npm run test:e2e` antes del próximo deploy
- [ ] Restaurar columnas `languages/years_experience/approaches/education` en `FindTherapist.jsx` y `TherapistMatchPage.jsx` (ya existen en BD)

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
│   └── utils.js                    # formatPrice, formatDateTime, cn, getDisplayName, isAnonymous
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
| `therapist_profiles` | Perfil extendido (specialty, price, **subscription_plan**, **commission_rate**, verified, **payment_method**, paypal_email, bank_*) |
| `payouts` | Liquidaciones a terapeutas (amount, status, payment_method, reference, paid_at) |
| `sessions` | Citas (status, price, **platform_commission**, **therapist_net**, video_room_url, is_urgent) |
| `messages` | Chat (sender_id, receiver_id, content, **read_at**) |
| `therapist_credentials` | Docs de verificación (**document_type**, status, **rejection_reason**) |
| `subscription_payments` | Historial pagos de suscripción $79.99 USD/mes |
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
| **Suscripción** | $79.99/mes USD | **10%** | Todo + tests, DSM, CIE, escalas, crisis, biblioteca, colegas, protocolos, estadísticas |

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
- [x] Escalas clínicas validadas (PHQ-9, GAD-7, AUDIT, PCL-5)
- [x] Escalas: botón "Aplicar a paciente" — crea test_assignment directo al paciente (PHQ9→phq9, GAD7→gad7, AUDIT→audit, PCL5→pcl5)
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
- [x] Liquidaciones a terapeutas (AdminPayouts)
- [x] Conversión USD → DOP en tiempo real
- [x] Landing pública de precios (/pricing)
- [x] Panel admin de suscripciones + MRR
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

## 11. Bugs Corregidos

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
- [x] DSM y CIE — movidos a Edge Function `clinical-content` (✅ v32). Pendiente: escalas, biblioteca y protocolos siguen en el bundle
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
