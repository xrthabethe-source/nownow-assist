-- First delete job_request notifications that will violate the new constraint
DELETE FROM public.admin_notifications WHERE type = 'job_request';

-- Remove the job request notification trigger (not admin-critical)
DROP TRIGGER IF EXISTS on_new_job_notify_admin ON public.jobs;
DROP FUNCTION IF EXISTS public.notify_admin_new_job();

-- Update notification types to include driver_application and dispute
ALTER TABLE public.admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_type_check;
ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check 
  CHECK (type IN ('driver_application', 'payment', 'system_alert', 'dispute'));

-- Create trigger function for new driver applications
CREATE OR REPLACE FUNCTION public.notify_admin_driver_application()
RETURNS TRIGGER AS $$
DECLARE
  driver_name TEXT;
BEGIN
  -- Get driver's name from profiles
  SELECT full_name INTO driver_name 
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  INSERT INTO public.admin_notifications (type, title, message, severity, metadata)
  VALUES (
    'driver_application',
    'New Driver Application',
    'New driver application from ' || COALESCE(driver_name, 'Unknown') || ' requires review',
    'warning',
    jsonb_build_object('driver_id', NEW.id, 'user_id', NEW.user_id, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new driver registrations
CREATE TRIGGER on_new_driver_notify_admin
  AFTER INSERT ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_driver_application();

-- Create trigger function for disputes
CREATE OR REPLACE FUNCTION public.notify_admin_dispute()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, severity, metadata)
  VALUES (
    'dispute',
    'New Dispute Opened',
    'A new ' || NEW.category || ' dispute requires attention',
    'error',
    jsonb_build_object('dispute_id', NEW.id, 'category', NEW.category, 'job_id', NEW.job_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new disputes
CREATE TRIGGER on_new_dispute_notify_admin
  AFTER INSERT ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_dispute();