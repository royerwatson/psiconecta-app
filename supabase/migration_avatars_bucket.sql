-- ============================================================
-- Bucket público "avatars" + políticas de storage
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Crear el bucket (público = las URLs no requieren autenticación)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,    -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public            = true,
      file_size_limit   = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Cualquiera puede leer los avatares (imágenes públicas)
DROP POLICY IF EXISTS "Public avatar read" ON storage.objects;
CREATE POLICY "Public avatar read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Solo el propio usuario puede subir su avatar
--    Ruta esperada dentro del bucket: "avatars/<user_id>.<ext>"
--    storage.filename() devuelve la parte final del path, p.ej. "abc123.jpg"
DROP POLICY IF EXISTS "User can upload own avatar" ON storage.objects;
CREATE POLICY "User can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND storage.filename(name) LIKE (auth.uid()::text || '.%')
);

-- 4. Solo el propio usuario puede reemplazar (upsert) su avatar
DROP POLICY IF EXISTS "User can update own avatar" ON storage.objects;
CREATE POLICY "User can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND storage.filename(name) LIKE (auth.uid()::text || '.%')
);

-- 5. Solo el propio usuario puede borrar su avatar
DROP POLICY IF EXISTS "User can delete own avatar" ON storage.objects;
CREATE POLICY "User can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND storage.filename(name) LIKE (auth.uid()::text || '.%')
);
