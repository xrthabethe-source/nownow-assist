
-- Create driver_verifications table
CREATE TABLE public.driver_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  reviewer_id UUID,
  reviewer_notes TEXT,
  
  -- Document URLs
  id_doc_type TEXT, -- 'id_card' or 'passport'
  id_doc_file_url TEXT,
  id_doc_status TEXT NOT NULL DEFAULT 'pending',
  id_doc_rejection_reason TEXT,
  id_doc_upload_count INTEGER NOT NULL DEFAULT 0,
  
  license_file_url TEXT,
  license_status TEXT NOT NULL DEFAULT 'pending',
  license_rejection_reason TEXT,
  license_upload_count INTEGER NOT NULL DEFAULT 0,
  
  profile_photo_url TEXT,
  profile_photo_status TEXT NOT NULL DEFAULT 'pending',
  profile_photo_rejection_reason TEXT,
  profile_photo_upload_count INTEGER NOT NULL DEFAULT 0,
  
  background_check_url TEXT,
  background_check_status TEXT NOT NULL DEFAULT 'pending',
  background_check_rejection_reason TEXT,
  background_check_upload_count INTEGER NOT NULL DEFAULT 0,
  bg_consent_given BOOLEAN DEFAULT false,
  bg_full_name TEXT,
  bg_id_number TEXT,
  bg_date_of_birth DATE,
  
  -- Fraud detection
  fraud_risk_score INTEGER NOT NULL DEFAULT 0,
  fraud_flags TEXT[] DEFAULT '{}',
  
  -- File hashes for duplicate detection
  id_doc_file_hash TEXT,
  license_file_hash TEXT,
  profile_photo_file_hash TEXT,
  background_check_file_hash TEXT,
  
  -- Verified badge
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_badge_active BOOLEAN NOT NULL DEFAULT false,
  
  -- Audit
  audit_log JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(driver_id)
);

-- Enable RLS
ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Drivers can view their own verification"
  ON public.driver_verifications FOR SELECT
  USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can insert their own verification"
  ON public.driver_verifications FOR INSERT
  WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update their own verification"
  ON public.driver_verifications FOR UPDATE
  USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all verifications"
  ON public.driver_verifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for admin queue queries
CREATE INDEX idx_driver_verifications_status ON public.driver_verifications(status);
CREATE INDEX idx_driver_verifications_fraud_score ON public.driver_verifications(fraud_risk_score DESC);
CREATE INDEX idx_driver_verifications_submitted_at ON public.driver_verifications(submitted_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_driver_verifications_updated_at
  BEFORE UPDATE ON public.driver_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
