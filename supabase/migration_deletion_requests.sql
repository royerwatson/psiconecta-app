-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Solicitudes de eliminación de datos (derecho de supresión)
-- Ley 172-13 RD / RGPD — Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS deletion_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_role    TEXT,
  user_email   TEXT,           -- snapshot: sobrevive a la anonimización
  user_name    TEXT,           -- snapshot
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_note   TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Una sola solicitud PENDIENTE por usuario (índice parcial: permite
-- múltiples completed/rejected históricas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_deletion_requests_one_pending
  ON deletion_requests (user_id) WHERE status = 'pending';

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

-- Usuario: crea y ve sus propias solicitudes
DROP POLICY IF EXISTS "deletion_requests_insert_own" ON deletion_requests;
CREATE POLICY "deletion_requests_insert_own" ON deletion_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "deletion_requests_select_own" ON deletion_requests;
CREATE POLICY "deletion_requests_select_own" ON deletion_requests
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

-- Admin: gestiona todas (UPDATE para aprobar/rechazar)
DROP POLICY IF EXISTS "deletion_requests_admin_update" ON deletion_requests;
CREATE POLICY "deletion_requests_admin_update" ON deletion_requests
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status
  ON deletion_requests (status);
