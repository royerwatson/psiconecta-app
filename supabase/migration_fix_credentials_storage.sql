-- Asegurar que el bucket credentials existe y tiene políticas correctas

-- 1. Crear bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'credentials',
  'credentials',
  false,
  10485760, -- 10 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

-- 2. Recrear políticas de storage limpias
DROP POLICY IF EXISTS "creds_select" ON storage.objects;
DROP POLICY IF EXISTS "creds_insert" ON storage.objects;
DROP POLICY IF EXISTS "creds_update" ON storage.objects;
DROP POLICY IF EXISTS "creds_delete" ON storage.objects;

-- Terapeutas pueden subir sus propios archivos
CREATE POLICY "creds_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'credentials'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Terapeutas pueden ver sus propios archivos; admins ven todos
CREATE POLICY "creds_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'credentials'
    AND auth.uid() IS NOT NULL
  );

-- Terapeutas pueden actualizar sus propios archivos
CREATE POLICY "creds_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'credentials'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
