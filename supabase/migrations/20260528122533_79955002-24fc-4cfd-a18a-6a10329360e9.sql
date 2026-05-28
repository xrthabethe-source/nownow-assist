-- =====================================================================
-- Security hardening: fix critical findings from security scan
-- =====================================================================

-- 1) Stop broadcasting admin_notifications & applicant_communications
--    via Realtime to all authenticated users.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_notifications';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'applicant_communications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.applicant_communications';
  END IF;
END$$;

-- 2) Attach existing field-protection triggers (they exist as functions but
--    were never attached, so privilege escalation was possible).
DROP TRIGGER IF EXISTS protect_driver_admin_fields_trigger ON public.drivers;
CREATE TRIGGER protect_driver_admin_fields_trigger
BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.protect_driver_admin_fields();

DROP TRIGGER IF EXISTS protect_verification_admin_fields_trigger ON public.driver_verifications;
CREATE TRIGGER protect_verification_admin_fields_trigger
BEFORE UPDATE ON public.driver_verifications
FOR EACH ROW EXECUTE FUNCTION public.protect_verification_admin_fields();

-- 3) Lock down driver_otp_verifications — clients must never read OTP codes.
--    RLS is on but had no policies; make intent explicit and revoke API access.
REVOKE ALL ON public.driver_otp_verifications FROM anon, authenticated;
GRANT ALL ON public.driver_otp_verifications TO service_role;

DROP POLICY IF EXISTS "Deny client access to OTP rows" ON public.driver_otp_verifications;
CREATE POLICY "Deny client access to OTP rows"
ON public.driver_otp_verifications
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 4) Protect customer wa_phone from drivers browsing pending jobs.
--    Only edge functions (service role) and admins need raw column access.
REVOKE SELECT (wa_phone) ON public.jobs FROM anon, authenticated;
GRANT  SELECT (wa_phone) ON public.jobs TO service_role;

-- Allow admins to still see it via a normal query (column grant to a role works
-- because admins authenticate as 'authenticated' too — so we expose via RPC).
CREATE OR REPLACE FUNCTION public.get_job_wa_phone(p_job_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN NULL;
  END IF;
  SELECT wa_phone INTO v_phone FROM public.jobs WHERE id = p_job_id;
  RETURN v_phone;
END;
$$;

REVOKE ALL ON FUNCTION public.get_job_wa_phone(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_job_wa_phone(uuid) TO authenticated, service_role;
