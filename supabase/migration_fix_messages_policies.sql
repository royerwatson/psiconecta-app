-- ══════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Restaurar políticas RLS de messages
-- ✅ EJECUTADO en producción 2026-06-12
--
-- Causa raíz: la política INSERT de messages desapareció (probablemente
-- recreada a medias en el dashboard en alguna sesión anterior). Con RLS
-- activo y sin política INSERT, todo insert se rechaza por defecto →
-- error 42501 "new row violates row-level security policy" al enviar
-- mensajes en el chat (web y app nativa).
--
-- Lección: todo cambio de políticas ejecutado en el dashboard debe
-- guardarse también como archivo de migración en /supabase/.
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Receptor puede marcar como leído (read_at) — indicador Leído/Enviado
DROP POLICY IF EXISTS "messages_update_receiver" ON messages;
CREATE POLICY "messages_update_receiver" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- messages_delete ya existía: FOR DELETE USING (auth.uid() = sender_id)

-- Verificación (4 filas: DELETE, INSERT, SELECT, UPDATE):
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'messages';
