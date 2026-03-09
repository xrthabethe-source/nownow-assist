
-- Create OTP verifications table for driver signup (no RLS policies = service role only)
CREATE TABLE IF NOT EXISTS public.driver_otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  phone text,
  otp_code text NOT NULL,
  otp_type text NOT NULL,
  verified boolean DEFAULT false,
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 5,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_otp_verifications ENABLE ROW LEVEL SECURITY;

-- Index for quick OTP lookups
CREATE INDEX IF NOT EXISTS idx_driver_otp_email_type ON public.driver_otp_verifications(email, otp_type, verified);

-- Add phone/email verification and whatsapp columns to drivers
ALTER TABLE public.drivers 
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_number text;
