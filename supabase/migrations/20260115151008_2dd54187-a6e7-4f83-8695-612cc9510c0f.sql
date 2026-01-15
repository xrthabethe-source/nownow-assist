-- Create admin notifications table
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('job_request', 'payment', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view notifications
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can update (mark as read)
CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System can insert (for triggers)
CREATE POLICY "System can insert notifications"
  ON public.admin_notifications
  FOR INSERT
  WITH CHECK (true);

-- Create trigger function to notify on new jobs
CREATE OR REPLACE FUNCTION public.notify_admin_new_job()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, severity, metadata)
  VALUES (
    'job_request',
    'New Job Request',
    'A new ' || COALESCE(NEW.service_type, 'service') || ' request has been submitted',
    'info',
    jsonb_build_object('job_id', NEW.id, 'job_number', NEW.job_number, 'service_type', NEW.service_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new jobs
CREATE TRIGGER on_new_job_notify_admin
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_job();

-- Create trigger function to notify on payments
CREATE OR REPLACE FUNCTION public.notify_admin_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO public.admin_notifications (type, title, message, severity, metadata)
    VALUES (
      'payment',
      'Payment Received',
      'Payment of R' || NEW.amount || ' received',
      'success',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'job_id', NEW.job_id)
    );
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    INSERT INTO public.admin_notifications (type, title, message, severity, metadata)
    VALUES (
      'payment',
      'Payment Failed',
      'Payment of R' || NEW.amount || ' failed',
      'error',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'job_id', NEW.job_id)
    );
  ELSIF NEW.status = 'refunded' AND (OLD.status IS NULL OR OLD.status != 'refunded') THEN
    INSERT INTO public.admin_notifications (type, title, message, severity, metadata)
    VALUES (
      'payment',
      'Payment Refunded',
      'Refund of R' || NEW.amount || ' processed',
      'warning',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'job_id', NEW.job_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for payment updates
CREATE TRIGGER on_payment_update_notify_admin
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_payment();

-- Create index for faster queries
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;