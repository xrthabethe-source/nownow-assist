-- Add database constraints for defense-in-depth validation on profiles table
-- This ensures data integrity even if client-side validation is bypassed

-- Add length constraint on full_name (2-100 characters, allowing NULL)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_full_name_length 
  CHECK (full_name IS NULL OR (length(trim(full_name)) >= 2 AND length(full_name) <= 100));

-- Add email format constraint (basic format validation, allowing NULL)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_format 
  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add phone format constraint (9-15 digits with optional + prefix, allowing NULL)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_format 
  CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{9,15}$');

-- Update handle_new_user() trigger to sanitize and validate input
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  account_type text;
  user_role app_role;
  safe_full_name text;
BEGIN
  -- Get the account type from user metadata, default to 'customer'
  account_type := COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'customer');
  
  -- Map account type to role (validate input)
  IF account_type = 'driver' THEN
    user_role := 'driver';
  ELSE
    user_role := 'customer';
  END IF;
  
  -- Sanitize full_name: trim whitespace, limit length to 100 chars
  safe_full_name := SUBSTRING(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')), 1, 100);
  
  -- If full_name is empty after sanitization, use email
  IF safe_full_name = '' OR length(safe_full_name) < 2 THEN
    safe_full_name := NEW.email;
  END IF;
  
  -- Create profile with sanitized data
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    safe_full_name
  );
  
  -- Assign role based on account type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$function$;