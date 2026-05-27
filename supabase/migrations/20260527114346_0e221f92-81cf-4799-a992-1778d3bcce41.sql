CREATE TABLE public.whatsapp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  service_id uuid,
  service_name text,
  pickup_address text,
  pickup_lat numeric,
  pickup_lng numeric,
  notes text,
  status text NOT NULL DEFAULT 'new',
  assigned_driver_id uuid,
  estimated_price numeric,
  eta_minutes integer,
  source text NOT NULL DEFAULT 'whatsapp',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_requests TO authenticated;
GRANT ALL ON public.whatsapp_requests TO service_role;

ALTER TABLE public.whatsapp_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp requests"
  ON public.whatsapp_requests
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_whatsapp_requests_updated_at
  BEFORE UPDATE ON public.whatsapp_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_whatsapp_requests_status ON public.whatsapp_requests(status);
CREATE INDEX idx_whatsapp_requests_created_at ON public.whatsapp_requests(created_at DESC);