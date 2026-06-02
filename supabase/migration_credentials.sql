-- ─────────────────────────────────────────────────────────────────────────────
-- migration_credentials.sql
-- Actualiza therapist_credentials para requerir exactamente 3 documentos:
--   titulo_profesional   — Título profesional universitario
--   exequatur            — Exequátur emitido por el Estado
--   colegio_psicologico  — Acreditación del Colegio Dominicano de Psicólogos
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Agregar tipo de documento
ALTER TABLE therapist_credentials
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by   UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Índice para consultar por tipo y terapeuta
CREATE INDEX IF NOT EXISTS idx_credentials_therapist_type
  ON therapist_credentials (therapist_id, document_type);

-- 3. Comentarios
COMMENT ON COLUMN therapist_credentials.document_type IS
  'titulo_profesional | exequatur | colegio_psicologico';
COMMENT ON COLUMN therapist_credentials.rejection_reason IS
  'Motivo de rechazo del documento por parte del administrador';
