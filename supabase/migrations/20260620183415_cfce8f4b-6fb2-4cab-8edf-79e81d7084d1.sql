
-- ngo-docs (private to owner + admins)
CREATE POLICY "ngo-docs owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ngo-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "ngo-docs owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ngo-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ngo-docs owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ngo-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- event-banners
CREATE POLICY "banners read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'event-banners');
CREATE POLICY "banners owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "banners owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "banners owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatars
CREATE POLICY "avatars read" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- certificates - read by authenticated; written by service role (server fn)
CREATE POLICY "certs read auth" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificates');
