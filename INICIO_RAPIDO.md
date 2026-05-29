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
| ✅ Citas urgentes <24h con tarifa adicional | Completo |
| ✅ Historial clínico compartido entre terapeutas | Completo |
| ✅ Cambio de terapeuta hasta 48h antes | Completo |
| ✅ Chat en tiempo real (Supabase Realtime) | Completo |
| ✅ Videollamadas individuales (Daily.co) | Completo |
| ✅ Terapia grupal (sesiones multi-usuario) | Completo |
| ✅ AI Check-in de bienestar con alertas de riesgo | Completo |
| ✅ Mood Tracker con gráfica semanal | Completo |
| ✅ Sistema de reseñas (1-5 estrellas) | Completo |
| ✅ Verificación de credenciales del terapeuta | Completo |
| ✅ Empaquetado móvil (Capacitor) | Listo para configurar |
