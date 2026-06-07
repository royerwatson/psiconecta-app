-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Nuevos campos en profiles
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Sexo ───────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS gender text
  CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say'));

-- ── 2. Fecha de nacimiento ────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birth_date date;

-- ── 3. Idioma preferido ───────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'es'
  CHECK (preferred_language IN ('es', 'en', 'fr', 'pt', 'de', 'it', 'ar', 'other'));

-- ── 4. Índice para matching por idioma ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_language
  ON profiles (preferred_language);
