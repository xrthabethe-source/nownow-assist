-- =========================================
-- SECURE COMMUNICATION SYSTEM SCHEMA
-- Uber-style messaging & calling
-- =========================================

-- 1. Enhance job_messages with delivery status and encryption support
ALTER TABLE public.job_messages 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
ADD COLUMN IF NOT EXISTS read_at timestamptz,
ADD COLUMN IF NOT EXISTS is_system_message boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at timestamptz,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 2. Create call_logs table for VoIP audit trail
CREATE TABLE IF NOT EXISTS public.call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  caller_id uuid NOT NULL,
  caller_type text NOT NULL CHECK (caller_type IN ('customer', 'driver')),
  receiver_id uuid NOT NULL,
  receiver_type text NOT NULL CHECK (receiver_type IN ('customer', 'driver')),
  call_sid text, -- Twilio call SID for tracking
  status text DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'busy', 'no_answer', 'cancelled')),
  duration_seconds integer DEFAULT 0,
  initiated_at timestamptz DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz,
  end_reason text,
  is_recorded boolean DEFAULT false,
  recording_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 3. Create abuse_reports table for safety
CREATE TABLE IF NOT EXISTS public.abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL,
  reporter_type text NOT NULL CHECK (reporter_type IN ('customer', 'driver')),
  reported_id uuid NOT NULL,
  reported_type text NOT NULL CHECK (reported_type IN ('customer', 'driver')),
  report_type text NOT NULL CHECK (report_type IN ('harassment', 'inappropriate_content', 'spam', 'threatening', 'fraud', 'other')),
  description text,
  evidence_urls text[], -- Screenshots, recordings
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create message_blocks table for blocking users
CREATE TABLE IF NOT EXISTS public.message_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- 5. Create rate_limits table for abuse prevention
CREATE TABLE IF NOT EXISTS public.communication_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('message', 'call')),
  count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_logs
CREATE POLICY "Users can view their own call logs"
ON public.call_logs FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can create call logs"
ON public.call_logs FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Call participants can update call status"
ON public.call_logs FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- RLS Policies for abuse_reports
CREATE POLICY "Users can view their own abuse reports"
ON public.abuse_reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create abuse reports"
ON public.abuse_reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all abuse reports"
ON public.abuse_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update abuse reports"
ON public.abuse_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for message_blocks
CREATE POLICY "Users can view their own blocks"
ON public.message_blocks FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
ON public.message_blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
ON public.message_blocks FOR DELETE
USING (auth.uid() = blocker_id);

-- RLS Policies for rate_limits
CREATE POLICY "Users can view their own rate limits"
ON public.communication_rate_limits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
ON public.communication_rate_limits FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_job_id ON public.call_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON public.call_logs(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_receiver ON public.call_logs(receiver_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_job ON public.abuse_reports(job_id);
CREATE INDEX IF NOT EXISTS idx_abuse_reports_status ON public.abuse_reports(status);
CREATE INDEX IF NOT EXISTS idx_message_blocks_blocker ON public.message_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON public.communication_rate_limits(user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_job_messages_status ON public.job_messages(status);
CREATE INDEX IF NOT EXISTS idx_job_messages_expires ON public.job_messages(expires_at) WHERE expires_at IS NOT NULL;

-- Enable realtime for communication tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;

-- Function to auto-expire messages after job completion
CREATE OR REPLACE FUNCTION public.set_message_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Set messages to expire 72 hours after job completion (POPIA compliance)
    UPDATE public.job_messages 
    SET expires_at = NOW() + INTERVAL '72 hours'
    WHERE job_id = NEW.id AND expires_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-expiration
DROP TRIGGER IF EXISTS job_completion_expire_messages ON public.jobs;
CREATE TRIGGER job_completion_expire_messages
AFTER UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_message_expiration();

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(p_sender_id uuid, p_receiver_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.message_blocks 
    WHERE blocker_id = p_receiver_id AND blocked_id = p_sender_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check rate limit (max 30 messages per minute per job)
CREATE OR REPLACE FUNCTION public.check_message_rate_limit(p_user_id uuid, p_job_id uuid)
RETURNS boolean AS $$
DECLARE
  message_count integer;
BEGIN
  SELECT COUNT(*) INTO message_count
  FROM public.job_messages
  WHERE sender_id = p_user_id 
    AND job_id = p_job_id
    AND created_at > NOW() - INTERVAL '1 minute';
  
  RETURN message_count < 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;