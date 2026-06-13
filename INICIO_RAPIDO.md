# 🚀 Guía de inicio rápido — Psiconecta

## 1. Instalar dependencias

```bash
cd "Psiconecta App"
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Luego edita `.env` y rellena:
- `VITE_SUPABASE_URL` → tu proyecto en supabase.com
- `VITE_SUPABASE_ANON_KEY` → clave anon de tu proyecto
- `VITE_DAILY_API_KEY` → de dashboard.daily.co (gratis para empezar)

## 3. Crear la base de datos en Supabase

1. Ve a [supabase.com](https://supabase.com) → Crear proyecto
2. Ve a **SQL Editor** → **New query**
3. Pega el contenido de `supabase/schema.sql` y ejecútalo

## 4. Ejecutar en modo desarrollo

```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000)

## 5. Probar la app

- Regístrate como **paciente** → explora el dashboard, busca terapeutas, registra tu ánimo
- Regístrate como **terapeuta** → ve la agenda, crea disponibilidad, escribe notas clínicas

---

## 📱 Para empaquetar como app móvil (iOS/Android)

```bash
# 1. Build de producción
npm run build

# 2. Inicializar Capacitor (solo la primera vez)
npx cap init Psiconecta com.psiconecta.app --web-dir dist

# 3. Agregar plataformas
npx cap add ios
npx cap add android

# 4. Sincronizar build con las apps nativas
npx cap sync

# 5. Abrir en Xcode (iOS) o Android Studio
npx cap open ios
npx cap open android
```

**Requisitos para publicar:**
- iOS → Mac + Xcode + cuenta Apple Developer ($99/año)
- Android → Android Studio + cuenta Google Play ($25 única vez)

---

## 🗂️ Estructura del proyecto

```
src/
├── pages/
│   ├── auth/          Login, Register
│   ├── therapist/     Dashboard, Agenda, Pacientes, Historial, Perfil
│   ├── patient/       Dashboard, Buscar, Citas, Grupos, Perfil
│   └── shared/        Chat, Videollamada
├── components/
│   ├── ui/            Button, Input, Card, Modal, Avatar, Badge, etc.
│   ├── layout/        Layout, Navbar, ProtectedRoute
│   └── patient/       MoodTracker, AICheckin
├── data/
│   ├── therapeuticLibrary.js    56 ejercicios en 8 categorías (TCC, DBT, ACT, Mindfulness…)
│   └── therapeuticProtocols.js  28 protocolos en 6 modalidades (TCC, DBT, ACT, EMDR, MBCT, CFT)
├── store/             authStore (Zustand)
└── lib/               supabase.js, utils.js
supabase/
└── schema.sql         Todas las tablas + RLS + triggers
```

---

## 🔧 Módulos incluidos

| Módulo | Estado |
|--------|--------|
| ✅ Autenticación dual (terapeuta/paciente) | Completo |
| ✅ Dashboard terapeuta (agenda, historial, tareas) | Completo |
| ✅ Dashboard paciente (citas, mood, actividades) | Completo |
| ✅ Sistema de agenda con disponibilidad | Completo |
| ✅ Citas urgentes <24h con tarifa adicional (+30%) | Completo |
| ✅ Historial clínico compartido entre terapeutas | Completo |
| ✅ Cambio de terapeuta hasta 48h antes | Completo |
| ✅ Chat en tiempo real (Supabase Realtime) | Completo |
| ✅ Videollamadas individuales (Daily.co) | Completo |
| ✅ Terapia grupal (sesiones multi-usuario) | Completo |
| ✅ AI Check-in de bienestar con alertas de riesgo | Completo |
| ✅ Mood Tracker con gráfica semanal | Completo |
| ✅ Sistema de reseñas (1-5 estrellas) | Completo |
| ✅ Verificación de credenciales del terapeuta | Completo |
| ✅ Biblioteca terapéutica (56 ejercicios, 8 categorías) | Completo |
| ✅ Protocolos clínicos (28 protocolos, 6 modalidades) | Completo |
| ✅ Empaquetado móvil (Capacitor) | Listo para configurar |

---

## 📋 Changelog

### Junio 2025

#### Correcciones de bugs
- **Avatar paciente en header** — `Layout.jsx`: se pasaba `name` pero faltaba el prop `src={profile?.avatar_url}` en el componente Avatar del encabezado.
- **Tareas del paciente vacías** — `MyTasksPage.jsx`: el hint de FK `!patient_tasks_therapist_id_fkey` fallaba en producción; cambiado a `!therapist_id` (column-based) + fallback query sin join para evitar toast de error cuando no hay tareas.
- **Subida de credenciales del terapeuta** — `TherapistProfile.jsx`: ruta de Storage tenía prefijo redundante `credentials/` (el bucket ya se llama `credentials`); se eliminó y se añadió `contentType: file.type` al upload.
- **Lógica de citas urgentes** — `TherapistProfileView.jsx`:
  - Mínimo cambiado de 1 hora a **2 horas** desde el momento actual.
  - Al desactivar el modo urgente se resetea la fecha/hora seleccionada si era "hoy".
  - Mensajes de error y aviso actualizados a "2 horas desde ahora".

#### Contenido clínico nuevo

**Biblioteca terapéutica** (`src/data/therapeuticLibrary.js`) — de 38 a **56 ejercicios**:
- TCC +2: Decatastrofización · Programación de tareas graduales
- DBT +2: Mente sabia (Wise Mind) · GIVE — mantener relaciones
- ACT +2: Metáfora arenas movedizas · Defusión (voz ridícula, etiquetado, "gracias mente")
- Mindfulness +3: Meditación Metta · Mindfulness en un bocado · Meditación de la montaña
- Activación Conductual +3: Activación social gradual · Rutina matutina anti-depresión · "Actuar como si"
- Regulación Emocional +2: Técnica del semáforo · Surfeo de la ola (Urge Surfing)
- Relajación +2: Respiración alternada de fosas nasales · Relajación autógena de Schultz
- Escritura Reflexiva +2: Tres buenos momentos (Seligman) · Mi historia de resiliencia

**Protocolos terapéuticos** (`src/data/therapeuticProtocols.js`) — de 20 a **28 protocolos**, 2 modalidades nuevas:
- TCC +2: Protocolo Heimberg (ansiedad social) · Protocolo Dugas (TAG — intolerancia a la incertidumbre)
- DBT +1: Los 6 niveles de validación de Linehan
- ACT +1: La Matriz ACT (Polk & Schoendorff)
- **MBCT** (nueva modalidad): Programa de 8 semanas · Espacio de respiración de 3 minutos
- **CFT** (nueva modalidad): Modelo de los tres sistemas de regulación emocional · El yo compasivo

**EMDR** (`src/data/therapeuticProtocols.js`) — de 1 entrada (overview) a **9 entradas**:
- Protocolo completo de 8 fases + cada fase con su propia tarjeta clínica detallada.
