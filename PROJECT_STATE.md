# PROJECT_STATE.md — Estado del Proyecto Psiconecta
*Última actualización: 2026-06-04*

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
    └── public/     PricingPage
```

---

## 3. Base de Datos (Supabase PostgreSQL)

### Tablas clave
| Tabla | Descripción |
|-------|-------------|
| `profiles` | Todos los usuarios (role, full_name, avatar_url, **is_anonymous**) |
| `therapist_profiles` | Perfil extendido (specialty, price, **subscription_plan**, **commission_rate**, verified) |
| `sessions` | Citas (status, price, **platform_commission**, **therapist_net**, video_room_url, is_urgent) |
| `messages` | Chat (sender_id, receiver_id, content, **read_at**) |
| `therapist_credentials` | Docs de verificación (**document_type**, status, **rejection_reason**) |
| `subscription_payments` | Historial pagos de suscripción $50/mes |
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
| `migration_credentials.sql` | **Ejecutado** |

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
| `/video-call/:id` | VideoCall Daily.co (reconexión automática) |
| `/pricing` | Landing pública de planes |
| `/auth/callback` | Callback OAuth (Google/Apple/Facebook) |
| `/payment/success` / `/payment/cancel` | Resultado de pago |

---

## 5. Modelo de Negocio

### Planes del terapeuta
| Plan | Precio | Comisión | Herramientas |
|------|--------|----------|--------------|
| **Gratuito** | $0/mes | 10% | Perfil, agenda, chat, videollamadas |
| **Suscripción** | $50/mes USD | 10% | Todo + tests, DSM, CIE, escalas, crisis, biblioteca, colegas, protocolos, estadísticas |

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

### Secrets configurados en Supabase
```
DAILY_API_KEY          ✅ configurado
PAYPAL_CLIENT_ID       — pendiente configurar en producción
PAYPAL_CLIENT_SECRET   — pendiente
PAYPAL_BASE_URL        — pendiente (sandbox: https://api-m.sandbox.paypal.com)
RESEND_API_KEY         — pendiente
ANTHROPIC_API_KEY      — pendiente
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
- **Apple OAuth** — pendiente configurar en Apple Developer
- **Facebook OAuth** — pendiente configurar en Meta for Developers
- Callback: `/auth/callback` — detecta si es usuario nuevo → `/register`

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
- [x] Citas urgentes (<24h) con +30% precio
- [x] Cambio de terapeuta (hasta 48h antes)
- [x] Videollamadas Daily.co (sala server-side, sin API key expuesta)
- [x] Reconexión automática + banner calidad de red
- [x] Sesiones grupales multi-participante

### Chat
- [x] Mensajería realtime (Supabase Realtime)
- [x] Badge mensajes no leídos (read_at)
- [x] Presencia real (Supabase Presence — En línea / Desconectado)
- [x] Paginación scroll infinito inverso (40 msg/página)

### Herramientas Clínicas (plan Suscripción)
- [x] 45+ tests psicométricos con scoring automático
- [x] Asignación tests + resultados liberados al paciente
- [x] DSM-5-TR y CIE-11 en español
- [x] Escalas clínicas validadas (PHQ-9, GAD-7, AUDIT, PCL-5)
- [x] Plan de crisis (Safety Planning Intervention)
- [x] Biblioteca terapéutica (40+ ejercicios)
- [x] Protocolos terapéuticos
- [x] Consulta con colegas (interconsulta)
- [x] Tareas asignadas al paciente

### Bienestar del Paciente
- [x] Check-in diario IA (análisis riesgo, alerta terapeuta)
- [x] Widget estado de ánimo + gráfica semanal
- [x] Diario personal con prompts terapéuticos
- [x] Página de crisis con recursos por país
- [x] Modo anónimo (iniciales en lugar de nombre completo)

### Pagos y Negocio
- [x] Pago sesiones PayPal (flujo completo)
- [x] Comisión 10% automática sobre cada sesión
- [x] Plan Suscripción $50/mes (ProGate bloquea plan Gratuito)
- [x] Liquidaciones a terapeutas (AdminPayouts)
- [x] Conversión USD → DOP en tiempo real
- [x] Landing pública de precios (/pricing)
- [x] Panel admin de suscripciones + MRR

### Verificación de Terapeutas
- [x] 3 documentos obligatorios: Título / Exequátur / Colegio Psicológico
- [x] Admin revisa y aprueba/rechaza cada doc individualmente
- [x] Motivo de rechazo visible al terapeuta
- [x] Barra de progreso de verificación (X/3 aprobados)
- [x] Botón "Completar verificación" aparece solo cuando los 3 están aprobados
- [x] Al completar, terapeuta queda activo y visible para pacientes

### UX/UI y Performance
- [x] Design system: Plus Jakarta Sans + Lora, paleta azul
- [x] Logo oficial SVG: dos arcos + nodo central (PsiconectaLogo)
- [x] Favicon SVG con logo de Psiconecta
- [x] 100% sin emojis — Lucide React uniformes (strokeWidth=1.8)
- [x] Code splitting: lucide-react, datos clínicos, vendor libs
- [x] Build limpio — 0 errores (3349 módulos)

---

## 10. Pendiente / En Cola

### Configuración externa
- [ ] Apple OAuth — Apple Developer Console
- [ ] Facebook OAuth — Meta for Developers
- [ ] PayPal producción — Client ID/Secret en Supabase Secrets
- [ ] Resend API Key — emails transaccionales
- [ ] Anthropic API Key — Edge Function ai-checkin

### Mejoras técnicas
- [ ] `create-subscription-order` Edge Function — pago $50/mes suscripción terapeuta (no existe aún)
- [ ] Paginación chat: scroll infinito funcional, falta test con conversaciones largas reales
- [ ] VideoCall: botón de reconexión manual testeado, `network-connection` event pendiente de prueba real

---

## 11. Comandos de Desarrollo

```bash
npm run dev          # servidor local en localhost:3000
npm run build        # build de producción (verificar 0 errores antes de push)

git add -A && git commit -m "..." && git push origin main
# Vercel auto-deploya en ~2 min tras el push
```

---

## 12. Convenciones del Código

- **Íconos:** solo Lucide React, `strokeWidth={1.8}`, nunca emojis en JSX
- **Moneda:** `formatPrice(amount)` → `$60.00 USD` | `formatWithLocal()` → `$60.00 USD ≈ RD$3,510`
- **Nombres anónimos:** `getDisplayName(profile)` — devuelve iniciales si `is_anonymous=true`
- **Alias de imports:** `@/` → `src/`
- **Estado global:** Zustand (`authStore`)
- **Queries Supabase:** directas desde componentes, sin React Query
- **Commits:** en inglés o español, directamente a `main`
