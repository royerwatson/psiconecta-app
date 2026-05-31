-- ────────────────────────────────────────────────────────────────────────────
-- 014_messages_read_at.sql
-- Agrega campo read_at a messages para soportar indicador de no leídos.
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Columna read_at en messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Índice para filtrar mensajes no leídos por destinatario eficientemente
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (receiver_id, read_at)
  WHERE read_at IS NULL;

-- 3. Función RPC: marcar como leídos todos los mensajes de una conversación
CREATE OR REPLACE FUNCTION mark_messages_read(p_conversation_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND receiver_id = p_user_id
    AND read_at IS NULL;
END;
$$;

-- 4. Función RPC: contar mensajes no leídos para un usuario
CREATE OR REPLACE FUNCTION count_unread_messages(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM messages
  WHERE receiver_id = p_user_id
    AND read_at IS NULL;
  RETURN v_count;
END;
$$;

-- 5. Comentarios
COMMENT ON COLUMN messages.read_at IS 'NULL = no leído; timestamptz = momento en que el receptor lo leyó';
