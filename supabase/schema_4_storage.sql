INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('credentials', 'credentials', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "creds_select"   ON storage.objects FOR SELECT USING (bucket_id = 'credentials' AND auth.uid() IS NOT NULL);
CREATE POLICY "creds_insert"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'credentials' AND auth.uid() IS NOT NULL);
