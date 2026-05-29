
-- 1) Hide jobs.wa_phone from drivers (and any non-service caller)
REVOKE SELECT (wa_phone) ON public.jobs FROM anon, authenticated;
-- service_role retains full access for edge functions; admin helper get_job_wa_phone() already exists.

-- 2) Let users see their own whatsapp conversations
CREATE POLICY "Users view own whatsapp conversation"
ON public.whatsapp_conversations
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- 3) Let users see their own terms consents
CREATE POLICY "Users view own terms consents"
ON public.terms_consents
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

-- 4) Driver document lifecycle: allow drivers to update/delete their own files; admins can delete any
CREATE POLICY "Drivers can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'driver-documents' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'driver-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete driver documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'driver-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 5) Restrict avatars bucket LISTING to own folder (direct public URLs still load images)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list their own avatar folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can list all avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'::app_role));

-- 6) Lock down SECURITY DEFINER helpers that should not be callable directly by clients.
-- Keep has_role / get_user_role / is_user_blocked open — they're referenced in RLS expressions.
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, text, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_failed_attempt_count(text, inet) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_account_locked(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_message_rate_limit(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_driver_application() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_dispute() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_job_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_message_expiration() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_driver_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_verification_admin_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
-- get_job_wa_phone is intentionally callable by authenticated (admin check is internal)
