
-- Create applicant_communications table for logging all messages sent to driver applicants
CREATE TABLE public.applicant_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'sms',
  message_content text NOT NULL,
  template_used text,
  delivery_status text NOT NULL DEFAULT 'pending',
  delivery_error text,
  phone_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applicant_communications ENABLE ROW LEVEL SECURITY;

-- Only admins can manage communications
CREATE POLICY "Admins can manage applicant communications"
  ON public.applicant_communications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_applicant_communications_updated_at
  BEFORE UPDATE ON public.applicant_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.applicant_communications;
