-- Create services table for different service types
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  price_per_km numeric(10,2) DEFAULT 0,
  surge_multiplier numeric(3,2) DEFAULT 1.00,
  eta_minutes integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create drivers table with detailed info
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  license_number text,
  vehicle_type text,
  vehicle_plate text,
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  is_verified boolean DEFAULT false,
  is_online boolean DEFAULT false,
  rating numeric(2,1) DEFAULT 5.0,
  total_jobs integer DEFAULT 0,
  payout_percentage numeric(3,2) DEFAULT 0.80,
  current_location_lat numeric(10,7),
  current_location_lng numeric(10,7),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create jobs table for service requests
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'accepted', 'in_progress', 'completed', 'cancelled')),
  pickup_address text,
  pickup_lat numeric(10,7),
  pickup_lng numeric(10,7),
  notes text,
  estimated_price numeric(10,2),
  final_price numeric(10,2),
  eta_minutes integer,
  dispatched_at timestamptz,
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  driver_payout numeric(10,2),
  platform_fee numeric(10,2),
  payment_method text DEFAULT 'card',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  transaction_id text,
  failure_reason text,
  refund_amount numeric(10,2),
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create disputes table
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_type text CHECK (reporter_type IN ('customer', 'driver')),
  category text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution text,
  refund_issued boolean DEFAULT false,
  refund_amount numeric(10,2),
  assigned_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create app settings table for configuration
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Services policies (public read, admin write)
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Drivers policies
CREATE POLICY "Drivers can view their own profile" ON public.drivers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers can update their own profile" ON public.drivers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can create driver profile" ON public.drivers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all drivers" ON public.drivers FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Jobs policies
CREATE POLICY "Customers can view their own jobs" ON public.jobs FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Drivers can view assigned jobs" ON public.jobs FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Drivers can update assigned jobs" ON public.jobs FOR UPDATE USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all jobs" ON public.jobs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Payments policies
CREATE POLICY "Customers can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Drivers can view their payouts" ON public.payments FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Disputes policies
CREATE POLICY "Users can view their own disputes" ON public.disputes FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create disputes" ON public.disputes FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage disputes" ON public.disputes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- App settings policies (admin only)
CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create function to generate job number
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.job_number := 'JOB-' || LPAD(nextval('job_number_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create sequence for job numbers
CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1;

-- Create trigger for job numbers
CREATE TRIGGER set_job_number
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_job_number();

-- Create updated_at triggers
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.services (name, description, icon, base_price, price_per_km, eta_minutes) VALUES
('Tyre Change', 'Professional tyre replacement service', 'tire', 350.00, 15.00, 25),
('Jump Start', 'Battery jump start service', 'battery', 200.00, 10.00, 20),
('Fuel Delivery', 'Emergency fuel delivery', 'fuel', 150.00, 8.00, 30),
('Towing', 'Vehicle towing service', 'truck', 500.00, 25.00, 45),
('Locksmith', 'Vehicle lockout assistance', 'key', 300.00, 12.00, 35),
('Accident Assist', 'Post-accident support and towing', 'alert-triangle', 600.00, 30.00, 30);

-- Insert default app settings
INSERT INTO public.app_settings (key, value, description) VALUES
('general', '{"app_name": "Now-Now Assist", "support_email": "support@nownow.co.za", "support_phone": "+27 800 NOW NOW"}', 'General app settings'),
('pricing', '{"minimum_fare": 100, "surge_enabled": true, "max_surge_multiplier": 3.0}', 'Pricing configuration'),
('notifications', '{"push_enabled": true, "sms_enabled": true, "email_enabled": true}', 'Notification settings'),
('safety', '{"emergency_contact": "112", "safety_message": "Your safety is our priority. All drivers are verified and tracked."}', 'Safety configuration');