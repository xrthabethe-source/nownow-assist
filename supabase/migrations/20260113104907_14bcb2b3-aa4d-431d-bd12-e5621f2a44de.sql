-- Fix audit_logs security: Remove the overly permissive INSERT policy
-- Audit logs should only be inserted by the system (service role) or via database triggers

-- First, drop the existing permissive INSERT policy if it exists
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a restrictive policy that only allows service role to insert
-- (service role bypasses RLS, so this effectively means no client can insert)
-- The log_audit_event function already runs with SECURITY DEFINER, so it will work

-- Ensure the log_audit_event function has proper security settings
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_event_type text,
  p_event_category text,
  p_severity text DEFAULT 'info',
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_user_email text;
  v_user_role app_role;
BEGIN
  -- Get user details if user_id is provided
  IF p_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    SELECT role INTO v_user_role FROM user_roles WHERE user_id = p_user_id LIMIT 1;
  END IF;

  -- Insert the audit log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_role,
    event_type,
    event_category,
    severity,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_user_id,
    v_user_email,
    v_user_role,
    p_event_type,
    p_event_category,
    p_severity,
    p_resource_type,
    p_resource_id,
    p_details
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;