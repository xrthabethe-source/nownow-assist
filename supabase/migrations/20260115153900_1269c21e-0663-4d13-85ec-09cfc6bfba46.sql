-- Add document status tracking columns to drivers table
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS license_document_status TEXT DEFAULT 'pending' CHECK (license_document_status IN ('pending', 'approved', 'rejected', 'resubmit_required')),
ADD COLUMN IF NOT EXISTS license_document_note TEXT,
ADD COLUMN IF NOT EXISTS vehicle_registration_status TEXT DEFAULT 'pending' CHECK (vehicle_registration_status IN ('pending', 'approved', 'rejected', 'resubmit_required')),
ADD COLUMN IF NOT EXISTS vehicle_registration_note TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_status TEXT DEFAULT 'pending' CHECK (profile_photo_status IN ('pending', 'approved', 'rejected', 'resubmit_required')),
ADD COLUMN IF NOT EXISTS profile_photo_note TEXT,
ADD COLUMN IF NOT EXISTS id_document_status TEXT DEFAULT 'pending' CHECK (id_document_status IN ('pending', 'approved', 'rejected', 'resubmit_required')),
ADD COLUMN IF NOT EXISTS id_document_note TEXT;