-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Banderas de recordatorios enviados + cron cada 15 min
-- Ejecutar en Supabase SQL Editor (una sola vez)
--
-- Necesario para el recordatorio de 30 minutos: el cron pasa de cada
-- hora a cada 15 min, y sin estas banderas las ventanas de 24h/1h
-- enviarían duplicados en cada corrida.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Banderas por sesión ─────────────────────────────────────────
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_30m_sent_at TIMESTAMPTZ;

-- ── 2. Cron: de cada hora a cada 15 minutos ───────────────────────
-- (el job existente se llama 'send-reminders-hourly')
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'send-reminders-hourly'),
  schedule := '*/15 * * * *'
);

-- Verificación:
-- SELECT jobname, schedule FROM cron.job;
