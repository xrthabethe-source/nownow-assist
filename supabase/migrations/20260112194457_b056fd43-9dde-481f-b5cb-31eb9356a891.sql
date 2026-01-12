-- ============================================================
-- SECURITY AUDIT LOG TABLE
-- Tracks all security-relevant events for incident response
-- ============================================================

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Who performed the action
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_role app_role,
  
  -- What happened
  event_type text NOT NULL,
  event_category text NOT NULL, -- 'auth', 'admin', 'data', 'security'
  
  -- Context
  resource_type text, -- 'user', 'role', 'profile', 'job', etc.
  resource_id text,
  
  -- Details
  details jsonb DEFAULT '{}',
  
  -- Request metadata
  ip_address inet,
  user_agent text,
  request_id text,
  
  -- Severity for alerting
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'error', 'critical'))
);

-- Index for common queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity) WHERE severity IN ('warn', 'error', 'critical');

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (CRITICAL: no user should see their own logs)
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert logs (via service role in edge functions)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true); -- Edge functions use service role

-- No one can update or delete audit logs (immutability)
-- Intentionally no UPDATE or DELETE policies

-- ============================================================
-- LOGIN ATTEMPTS TRACKING (for rate limiting / lockout)
-- ============================================================

CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  ip_address inet,
  success boolean NOT NULL DEFAULT false,
  user_agent text,
  failure_reason text
);

-- Index for rate limiting queries
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts(ip_address, created_at DESC);
CREATE INDEX idx_login_attempts_failed ON public.login_attempts(email, created_at DESC) WHERE success = false;

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Edge functions can insert (service role)
CREATE POLICY "System can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- ============================================================
-- SECURITY HELPER FUNCTIONS
-- ============================================================

-- Check if account is locked (5+ failed attempts in last 15 min)
CREATE OR REPLACE FUNCTION public.is_account_locked(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) >= 5
  FROM public.login_attempts
  WHERE email = lower(trim(check_email))
    AND success = false
    AND created_at > now() - interval '15 minutes'
$$;

-- Get failed attempt count for progressive delays
CREATE OR REPLACE FUNCTION public.get_failed_attempt_count(check_email text, check_ip inet)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.login_attempts
  WHERE (email = lower(trim(check_email)) OR ip_address = check_ip)
    AND success = false
    AND created_at > now() - interval '1 hour'
$$;

-- Log audit event helper
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id uuid,
  p_event_type text,
  p_event_category text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}',
  p_severity text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_user_role app_role;
  v_audit_id uuid;
BEGIN
  -- Get user info
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  SELECT role INTO v_user_role FROM public.user_roles WHERE user_id = p_user_id ORDER BY created_at LIMIT 1;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id, user_email, user_role,
    event_type, event_category,
    resource_type, resource_id,
    details, severity
  ) VALUES (
    p_user_id, v_user_email, v_user_role,
    p_event_type, p_event_category,
    p_resource_type, p_resource_id,
    p_details, p_severity
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- ============================================================
-- AUTO-LOG ROLE CHANGES (Critical security event)
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      NEW.user_id,
      'role_assigned',
      'admin',
      'user_role',
      NEW.id::text,
      jsonb_build_object('role', NEW.role),
      'warn'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_audit_event(
      NEW.user_id,
      'role_changed',
      'admin',
      'user_role',
      NEW.id::text,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role),
      'critical'
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      OLD.user_id,
      'role_removed',
      'admin',
      'user_role',
      OLD.id::text,
      jsonb_build_object('role', OLD.role),
      'critical'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_log_role_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_change();