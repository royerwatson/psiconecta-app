# PROYECTO_STATE.md — Estado del Proyecto Psiconecta
*Última actualización: 2026-06-02*

---

## 1. Descripción General

**Psiconecta** es una plataforma de psicoterapia online (web + iOS + Android) con dos roles principales: **terapeuta** y **paciente/cliente**, más un panel de **administración**.

- **Stack:** React 18 + Vite 6, Tailwind CSS, Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions), Capacitor 7, Daily.co (videollamadas), PayPal (pagos)
- **Deploy:** Vercel (web), GitHub repo: `royerwatson/psiconecta-app`
- **URL producción:** `psiconecta-app.vercel.app`
- **Supabase project ID:** `kudldawuehduidhipvmn`

---

## 2. Arquitectura

```
src/
├── App.jsx                          # Router principal, todas las rutas
├── main.jsx                         # Entrada React, CurrencyProvider
├── store/authStore.js               # Zustand: user, profile, role, fetchProfile, updateProfile
├── lib/
│   ├── supabase.js                  # Cliente Supabase
│   └── utils.js                    # formatPrice (USD), formatDateTime, cn, etc.
├── context/
│   └── CurrencyContext.jsx          # Proveedor global de tipo de cambio USD→DOP
├── hooks/
│   └── useCurrency.js               # Obtiene tasa de open.er-api.com, cachea 6h en localStorage
├── components/
│   ├── layout/
│   │   ├── Layout.jsx               # Nav paciente/terapeuta, tab bar, drawer "Más"
│   │   ├── AdminLayout.jsx          # Sidebar admin
│   │   └── ProtectedRoute.jsx       # TherapistRoute, ClientRoute, AdminRoute
│   ├── ui/
│   │   ├── Spinner.jsx              # Spinner, LoadingScreen, PsiconectaLogo (SVG oficial)
│   │   ├── Button/Card/Modal/Input/Avatar/Badge/StarRating/AvatarUpload/NotificationBell
│   ├── patient/
│   │   ├── MoodTracker.jsx          # Widget estado de ánimo + gráfica semanal
│   │   └── AICheckin.jsx            # Check-in diario con IA (preguntas + análisis Claude)
│   ├── payment/
│   │   └── PayPalButton.jsx         # Botón PayPal SDK con createOrder/onApprove
│   ├── psychometrics/
│   │   ├── AssignTestModal.jsx      # Modal terapeuta para asignar tests
│   │   ├── PatientTestsTab.jsx      # Tab de tests en detalle del paciente
│   │   └── PendingTestsSection.jsx  # Sección tests pendientes en dashboard paciente
│   └── onboarding/
│       └── OnboardingSlides.jsx     # Slides de bienvenida (primera vez)
├── data/
│   ├── dsm5tr.js                    # DSM-5-TR completo en español
│   ├── cie11.js                     # CIE-11 completo en español
│   ├── clinicalScales.js            # PHQ-9, GAD-7, AUDIT, PCL-5 con scoring
│   ├── therapeuticLibrary.js        # 40+ ejercicios terapéuticos
│   └── therapeuticProtocols.js      # Protocolos TCC, DBT, ACT, EMDR
└── pages/
    ├── auth/                        # Login, Register, ForgotPassword, ResetPassword, AdminLogin
    ├── admin/                       # 11 páginas admin (ver §4)
    ├── patient/                     # 11 páginas paciente (ver §4)
    ├── therapist/                   # 12 páginas terapeuta (ver §4)
    ├── shared/                      # ChatPage, VideoCall
    ├── payment/                     # PaymentSuccess, PaymentCancel
    └── public/                      # PricingPage
```

---

## 3. Base de Datos (Supabase)

### Tablas principales
| Tabla | Descripción |
|-------|-------------|
| `profiles` | Todos los usuarios (role: 'therapist'/'client'/'admin') |
| `therapist_profiles` | Perfil extendido del terapeuta (specialty, price, plan, commission_rate) |
| `sessions` | Citas (status: payment_pending/scheduled/in_progress/completed/cancelled) |
| `messages` | Chat (sender_id, receiver_id, content, read_at) |
| `reviews` | Reseñas de sesiones (rating 1-5, comment) |
| `therapeutic_relationships` | Relación terapeuta-paciente activa |
| `clinical_history` | Notas clínicas del terapeuta por sesión |
| `patient_tasks` | Tareas/actividades asignadas al paciente |
| `patient_journal` | Diario personal del paciente |
| `mood_entries` | Registros de estado de ánimo diario |
| `ai_checkins` | Check-ins IA con risk_level (low/medium/high) |
| `notifications` | Notificaciones in-app |
| `notification_preferences` | Config de notificaciones por email |
| `tests` | Catálogo de 45+ instrumentos psicométricos |
| `test_assignments` | Asignaciones de tests a pacientes |
| `test_sessions` | Sesiones de aplicación de tests |
| `test_items` | Ítems/preguntas de cada test |
| `test_responses` | Respuestas del paciente |
| `test_results` | Resultados calculados con severity_label |
| `scoring_rules` | Reglas de puntuación por subescala |
| `group_sessions` | Sesiones grupales |
| `group_participants` | Participantes de sesiones grupales |
| `payouts` | Liquidaciones a terapeutas |
| `subscription_payments` | Historial de pagos de suscripción |

### Columnas importantes en therapist_profiles
- `subscription_plan` ENUM('basic','pro','premium') DEFAULT 'basic'
- `commission_rate` NUMERIC(5,4) DEFAULT 0.10 — sincronizado por trigger
- `plan_expires_at` TIMESTAMPTZ
- `verified` BOOLEAN

### Columnas importantes en sessions
- `platform_commission`, `therapist_net`, `commission_rate` — calculadas al crear la orden PayPal
- `video_room_url` — URL de sala Daily.co
- `is_urgent` — cita urgente (<24h, +30% precio)

### Migraciones SQL (en `/supabase/`)
- `schema_1_tables.sql` — Schema base
- `schema_2_triggers.sql`, `schema_3_rls.sql`, `schema_4_storage.sql`
- `migration_psychometrics_core.sql` — Tests psicométricos
- `migration_subscriptions.sql` — Planes y comisiones (**ejecutado**)
- `migration_messages_read_at.sql` — Campo read_at en messages (**ejecutado**)
- Múltiples seeds en `/supabase/seed_*.sql`

---

## 4. Páginas y Rutas

### Admin (`/admin/*`)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/dashboard` | AdminDashboard | Métricas globales, alertas IA |
| `/admin/therapists` | AdminTherapists | Verificación de credenciales |
| `/admin/patients` | AdminPatients | Lista con riesgo IA |
| `/admin/sessions` | AdminSessions | Todas las sesiones |
| `/admin/groups` | AdminGroupSessions | Sesiones grupales |
| `/admin/stats` | AdminStats | Estadísticas de engagement |
| `/admin/financial` | AdminFinancial | Reportes financieros |
| `/admin/payouts` | AdminPayouts | Liquidaciones a terapeutas |
| `/admin/subscriptions` | AdminSubscriptions | Planes + MRR |
| `/admin/activity` | AdminActivityLog | Log de actividad |
| `/admin/reviews` | AdminReviews | Moderación de reseñas |
| `/admin/ai-alerts` | AdminAIAlerts | Alertas de riesgo IA |

### Terapeuta (`/therapist/*`)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/therapist/dashboard` | TherapistDashboard | Sesiones próximas, alertas IA |
| `/therapist/schedule` | TherapistSchedule | Agenda y disponibilidad |
| `/therapist/patients` | PatientList | Lista de pacientes |
| `/therapist/patients/:id` | PatientDetail | Historial, tareas, tests, check-ins |
| `/therapist/profile` | TherapistProfile | Perfil, credenciales, pagos |
| `/therapist/subscription` | SubscriptionPage | Gestión de plan |
| `/therapist/stats` | StatsPage | Estadísticas avanzadas (Pro) |
| `/therapist/tests` | TherapistTestsPage | Catálogo de tests |
| `/therapist/test-result/:id` | TestResultPage | Resultado de test |
| `/therapist/dsm` | DSMReferencePage | DSM-5-TR |
| `/therapist/cie` | CIE11ReferencePage | CIE-11 |
| `/therapist/scales` | ClinicalScalesPage | Escalas con scoring |
| `/therapist/safety-plan` | SafetyPlanPage | Plan de crisis |
| `/therapist/library` | TherapeuticLibraryPage | Biblioteca terapéutica |
| `/therapist/peers` | PeerConsultationPage | Consulta con colegas |
| `/therapist/protocols` | TherapeuticProtocolsPage | Protocolos |
| `/therapist/chat` | ChatPage | Mensajería |

### Paciente (`/patient/*`)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/patient/dashboard` | PatientDashboard | Home con AICheckin, MoodTracker |
| `/patient/find` | FindTherapist | Búsqueda con filtros, PayPal |
| `/patient/therapist/:id` | TherapistProfileView | Perfil público + agendar |
| `/patient/appointments` | MyAppointments | Mis citas |
| `/patient/chat` | ChatPage | Mensajería |
| `/patient/tasks` | MyTasksPage | Tareas asignadas |
| `/patient/journal` | JournalPage | Diario personal |
| `/patient/sessions` | SessionHistoryPage | Historial de sesiones |
| `/patient/crisis` | CrisisPage | Recursos de crisis |
| `/patient/groups` | GroupSessions | Terapia grupal |
| `/patient/profile` | PatientProfile | Perfil |
| `/patient/tests/:id` | TakeTestPage | Tomar test |
| `/patient/results` | MyResultsPage | Mis resultados |
| `/patient/results/:id` | PatientResultDetailPage | Detalle de resultado |

### Compartidas / Públicas
| Ruta | Componente |
|------|-----------|
| `/video-call/:id` | VideoCall (Daily.co) |
| `/pricing` | PricingPage (pública) |
| `/payment/success` | PaymentSuccess |
| `/payment/cancel` | PaymentCancel |

---

## 5. Edge Functions (Supabase Deno)

| Función | Descripción |
|---------|-------------|
| `create-paypal-order` | Crea orden PayPal + sesión payment_pending. Aplica comisión según plan del terapeuta |
| `capture-paypal-order` | Captura pago, actualiza sesión a 'scheduled', envía emails |
| `create-daily-room` | Crea sala Daily.co server-side (DAILY_API_KEY en secrets) |
| `ai-checkin` | Analiza respuestas del check-in con Claude API, detecta riesgo |
| `process-payout` | Procesa liquidación al terapeuta vía PayPal |
| `notify-new-message` | Email al receptor de un mensaje nuevo |
| `notify-cancellation` | Email al cancelar cita |
| `notify-therapist-change` | Email al cambiar de terapeuta |
| `send-reminders` | Recordatorios de citas (cron) |
| `admin-toggle-user` | Admin activa/desactiva cuentas |
| `verify-payment` | Verifica pago completado |

### Secrets requeridos en Supabase
```
DAILY_API_KEY          — Daily.co (movido server-side, NO en .env frontend)
PAYPAL_CLIENT_ID       — PayPal
PAYPAL_CLIENT_SECRET   — PayPal
PAYPAL_BASE_URL        — https://api-m.sandbox.paypal.com (sandbox) o producción
RESEND_API_KEY         — Emails transaccionales
ANTHROPIC_API_KEY      — Claude API para ai-checkin
```

---

## 6. Variables de Entorno Frontend (`.env`)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_PAYPAL_CLIENT_ID=...
# VITE_DAILY_API_KEY ya NO se usa (movida a Supabase Secrets)
```

---

## 7. Modelo de Negocio (Estado Actual)

### Planes de suscripción para terapeutas
Modelo definitivo — 2 planes:

| Plan | Precio | Comisión | Acceso |
|------|--------|----------|--------|
| **Gratuito** | $0/mes | 10% | Perfil, agenda, chat, videollamadas |
| **Suscripción** | $50/mes USD | 10% | Todo lo anterior + herramientas clínicas |

**Herramientas clínicas (solo Suscripción):**
Tests psicométricos, DSM-5-TR, CIE-11, Escalas clínicas, Plan de crisis, Biblioteca terapéutica, Consulta con colegas, Protocolos terapéuticos, Dashboard de estadísticas avanzadas

### Moneda
- Todos los pagos se procesan en **USD** vía PayPal
- Se muestra conversión referencial a **DOP** (open.er-api.com, caché 6h)
- Disclaimer en modales de pago sobre diferencia de tasa PayPal

---

## 8. Funcionalidades Implementadas

### Core
- [x] Autenticación (email/password) con roles
- [x] Onboarding slides por rol
- [x] Perfil completo terapeuta (bio, especialidad, precio, credenciales, PayPal)
- [x] Perfil paciente con avatar
- [x] Notificaciones in-app + preferencias email

### Citas y Sesiones
- [x] Búsqueda de terapeutas con filtros (especialidad, precio, urgente)
- [x] Agendamiento con pago PayPal (flujo completo)
- [x] Citas urgentes (<24h) con +30% de precio
- [x] Cambio de terapeuta (hasta 48h antes)
- [x] Videollamadas con Daily.co (sala creada server-side)
- [x] Reconexión automática + banner de calidad de red
- [x] Sesiones grupales con sala multi-participante
- [x] Historial de sesiones para paciente

### Chat
- [x] Mensajería en tiempo real (Supabase Realtime)
- [x] Badge de mensajes no leídos (campo read_at)
- [x] Presencia real (Supabase Presence — "En línea / Desconectado")
- [x] Paginación scroll infinito inverso (40 mensajes/página)
- [x] Notificación email al recibir mensaje

### Herramientas Clínicas (terapeuta)
- [x] 45+ tests psicométricos con scoring automático
- [x] Asignación de tests a pacientes
- [x] Vista de resultados + liberación al paciente
- [x] Historial clínico por paciente (visible entre terapeutas)
- [x] DSM-5-TR completo en español
- [x] CIE-11 completo en español
- [x] Escalas clínicas con scoring (PHQ-9, GAD-7, AUDIT, PCL-5)
- [x] Plan de crisis (Safety Planning Intervention)
- [x] Biblioteca terapéutica (40+ ejercicios)
- [x] Protocolos terapéuticos (TCC, DBT, ACT, EMDR)
- [x] Consulta con colegas (interconsulta)
- [x] Tareas/actividades asignadas al paciente

### Bienestar del Paciente
- [x] Check-in diario con IA (análisis de riesgo, alerta al terapeuta)
- [x] Widget de estado de ánimo + gráfica semanal
- [x] Diario personal con prompts terapéuticos
- [x] Página de crisis con recursos por país
- [x] Resultados de tests liberados por terapeuta

### Pagos y Modelo de Negocio
- [x] Pago de sesiones con PayPal (create-paypal-order + capture)
- [x] Comisión automática según plan del terapeuta
- [x] Liquidaciones a terapeutas (AdminPayouts)
- [x] Dashboard de ganancias del terapeuta (TherapistEarnings)
- [x] Conversión USD → DOP en tiempo real
- [x] Página pública de precios (/pricing)
- [x] Panel admin de suscripciones (AdminSubscriptions)

### Admin
- [x] Dashboard con métricas globales
- [x] Verificación de credenciales (documentos)
- [x] Gestión de terapeutas, pacientes, sesiones
- [x] Sesiones grupales
- [x] Alertas IA de riesgo
- [x] Reportes financieros
- [x] Log de actividad
- [x] Gestión de reseñas

### UX/UI
- [x] Design system: Plus Jakarta Sans + Lora, paleta azul
- [x] Logo oficial: dos arcos + nodo central (SVG propio)
- [x] Favicon SVG con logo
- [x] Todos los emojis reemplazados por Lucide React (strokeWidth=1.8)
- [x] Tab bar animado (móvil) + sidebar (desktop)

---

## 9. Pendiente / En Proceso

### Modelo de negocio completado
- [x] 2 planes: Gratuito y Suscripción $50/mes
- [x] `ProGate` component bloquea herramientas clínicas para plan gratuito
- [x] `Layout.jsx` muestra candado en nav para plan gratuito
- [x] `migration_subscription_update.sql` — todos los planes = 10% comisión, premium→pro

### Edge Function pendiente
- [ ] `create-subscription-order` — Edge Function para procesar pago de suscripción $50/mes (aún no existe)

### Mejoras pendientes (PENDIENTES.md)
- [ ] Reconexión VideoCall: botón manual funciona, evento `network-connection` pendiente de prueba real
- [ ] Paginación chat: funcional, falta test con conversaciones largas
- [ ] Presencia: funciona, pero el indicador solo muestra si el usuario está en /chat (no toda la app)

---

## 10. Convenciones de Código

- **Íconos:** Solo Lucide React, `strokeWidth={1.8}`, sin emojis en JSX
- **Colores de marca:** primary-500 (#2d6a9f), paleta warm para neutros
- **Moneda:** `formatPrice(amount)` → `$60.00 USD`, `formatWithLocal()` → `$60.00 USD ≈ RD$3,510`
- **Imports de alias:** `@/` apunta a `src/`
- **Estado global:** Zustand (`authStore`)
- **Formularios:** estado local con useState
- **Queries Supabase:** directas desde componentes (sin React Query)
- **Git:** commits en inglés/español, push a `main` directamente

---

## 11. Cómo retomar el trabajo

```bash
cd "Psiconecta App"
npm install          # instala todas las dependencias incluido lucide-react
npm run dev          # http://localhost:3000

# Para deployar:
git add -A && git commit -m "..." && git push origin main
# Vercel detecta automáticamente y despliega

# SQL pendiente: ejecutar en Supabase Dashboard → SQL Editor
```

**Lo más urgente al retomar:**
1. Crear `ProGate` component para bloquear rutas clínicas a plan gratuito
2. Crear Edge Function `create-subscription-order` para el pago de $50/mes
3. Actualizar SQL trigger: comisión pro = 10% (ya no 7.5%)
