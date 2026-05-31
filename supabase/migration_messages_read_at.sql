-- ────────────────────────────────────────────────────────────────────────────
-- migration_messages_read_at.sql
-- Agrega read_at a messages para el badge de mensajes no leídos en el chat.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Agregar columna read_at (reemplaza el booleano read con timestamp preciso)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Migrar datos existentes: si read = true, poner read_at = created_at
UPDATE messages
SET read_at = created_at
WHERE read = TRUE AND read_at IS NULL;

-- 3. Índice para consultas de no leídos (filtro por receptor y read_at nulo)
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (receiver_id, read_at)
  WHERE read_at IS NULL;

-- 4. RPC: marcar como leídos todos los mensajes de sender → receiver
--    (se llama al abrir una conversación)
CREATE OR REPLACE FUNCTION mark_messages_read(
  p_sender_id   UUID,
  p_receiver_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages
  SET    read_at = NOW(),
         read    = TRUE
  WHERE  sender_id   = p_sender_id
    AND  receiver_id = p_receiver_id
    AND  read_at IS NULL;
END;
$$;

-- 5. RPC: contar total de mensajes no leídos para un usuario
CREATE OR REPLACE FUNCTION count_unread_messages(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM   messages
  WHERE  receiver_id = p_user_id
    AND  read_at IS NULL;
  RETURN COALESCE(v_count, 0);
END;
$$;

COMMENT ON COLUMN messages.read_at IS 'NULL = no leído; timestamp = momento en que el receptor lo leyó';
