-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Tokens de dispositivo para push notifications (FCM/APNs)
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS device_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  platform   TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Cada usuario gestiona solo sus propios tokens (políticas por operación)
DROP POLICY IF EXISTS "dt_select_own" ON device_tokens;
CREATE POLICY "dt_select_own" ON device_tokens
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "dt_insert_own" ON device_tokens;
CREATE POLICY "dt_insert_own" ON device_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dt_update_own" ON device_tokens;
CREATE POLICY "dt_update_own" ON device_tokens
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "dt_delete_own" ON device_tokens;
CREATE POLICY "dt_delete_own" ON device_tokens
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens (user_id);
