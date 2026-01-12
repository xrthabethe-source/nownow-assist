-- Fix overly permissive INSERT policies on audit/logging tables
-- These policies use WITH CHECK (true) which triggers linter warnings
-- However, they are designed for SERVICE ROLE access only from edge functions

-- Drop the permissive policies
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;

-- For audit_logs: No RLS INSERT policy needed - service role bypasses RLS
-- For login_attempts: No RLS INSERT policy needed - service role bypasses RLS
-- Edge functions using SUPABASE_SERVICE_ROLE_KEY automatically bypass RLS

-- Add explicit documentation comment
COMMENT ON TABLE public.audit_logs IS 'Security audit log - INSERT only via edge functions using service role (bypasses RLS). No direct client INSERT allowed.';
COMMENT ON TABLE public.login_attempts IS 'Login attempt tracking - INSERT only via edge functions using service role (bypasses RLS). No direct client INSERT allowed.';