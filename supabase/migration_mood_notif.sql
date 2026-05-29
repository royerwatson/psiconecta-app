-- ============================================================
-- Migración: contexto en mood_logs + preferencias de notificaciones
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columnas de contexto a mood_logs
ALTER TABLE mood_logs
  ADD COLUMN IF NOT EXISTS context_tags TEXT[]    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS note         TEXT;

-- 2. Tabla de preferencias de notificaciones por usuario
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id                     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_session_confirmation  BOOLEAN NOT NULL DEFAULT true,
  email_session_reminder      BOOLEAN NOT NULL DEFAULT true,
  email_new_message           BOOLEAN NOT NULL DEFAULT true,
  email_therapist_change      BOOLEAN NOT NULL DEFAULT true,
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User manages own notification prefs" ON notification_preferences;
CREATE POLICY "User manages own notification prefs"
ON notification_preferences
FOR ALL
USING  (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
